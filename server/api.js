import {interestSnapshot} from '../dist/presence-policy.js';
import {rideAPI,listRideSeats} from './ride-api.js';
import {decorationKinds,validDecorationColor} from '../dist/decorations.js';
import {interiorPositionValid} from '../dist/interior-layout.js';
import {assistAPI} from './assist-api.js';
import {amusementPositionValid} from '../dist/festival-layout.js';
import {withinRink} from '../dist/retreat-layout.js';
import {communityAPI,messageText,rateLimit} from './community-api.js';
import {activityGestures} from '../dist/activity-state.js';
import {isOwner,passwordHash,constantEqual,hex} from './invitations.js';
import {normalizeWardrobe} from '../dist/wardrobe.js';
import {resortRidePosition,restSeats,spaPositionValid} from '../dist/resort-layout.js';
import {surfaceHeight} from '../dist/world-layout.js';
import {canStandAt} from '../dist/movement.js';
import {spaceURL} from '../dist/space-links.js';
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}});
const age=20000;
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(v=>v.toString(16).padStart(2,'0')).join('');
function token(request){return /(?:^|;\s*)winter_session=([a-f0-9]{64})(?:;|$)/.exec(request.headers.get('cookie')||'')?.[1];}
export async function handleAPI(request,env){
 const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/api/'))return null;
 if(path==='/api/health')return json({ok:true,multiplayer:!!env.DB});
 if(!env.DB)return json({error:'공간 연결을 준비하고 있어요.'},503);
 if(request.method!=='GET'&&(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site'))return json({error:'다른 사이트에서는 변경할 수 없습니다.'},403);
 const now=Date.now();
 try{
 if(path==='/api/access'&&request.method==='GET'){
  const admin=await isOwner(request,env),secret=token(request),self=secret?await env.DB.prepare('SELECT id,name,room FROM visitors WHERE id=?').bind(await digest(secret)).first():null;
  return json({admin,signedIn:!!request.headers.get('oai-authenticated-user-id'),session:self||null});
 }
 if(path==='/api/invite'&&request.method==='POST'){
  if(!await isOwner(request,env))return json({error:'관리자만 초대 링크를 만들 수 있습니다.'},403);
  const raw=await request.text();if(raw.length>1024)return json({error:'요청이 너무 큽니다.'},413);const b=JSON.parse(raw);
  if(typeof b.password!=='string'||b.password.length<4||b.password.length>128)return json({error:'비밀번호는 4~128자로 정해 주세요.'},400);
  const room=crypto.randomUUID().replaceAll('-',''),salt=hex(crypto.getRandomValues(new Uint8Array(16))),hash=await passwordHash(b.password,salt);
  await env.DB.prepare('INSERT INTO invite_rooms(id,salt,password_hash,created_at) VALUES(?,?,?,?)').bind(room,salt,hash,now).run();
  return json({room,url:spaceURL(room)});
 }
 if(path==='/api/join'&&request.method==='POST'){
  const raw=await request.text();if(raw.length>2048)return json({error:'요청이 너무 큽니다.'},413);const body=JSON.parse(raw),room=String(body.room||'winter-plaza');if(!/^[a-zA-Z0-9_-]{8,48}$/.test(room))return json({error:'초대 주소를 확인해 주세요.'},400);
  const admin=await isOwner(request,env),invitation=await env.DB.prepare('SELECT salt,password_hash FROM invite_rooms WHERE id=?').bind(room).first();
  const previous=token(request),previousId=previous?await digest(previous):null;
  if(previousId&&await env.DB.prepare('SELECT id FROM visitor_blocks WHERE id=?').bind(previousId).first())return json({error:'이 기기의 입장이 제한되었습니다.'},403);
  if(previousId){const restored=await env.DB.prepare('SELECT id,room,name,x,y,z FROM visitors WHERE id=? AND room=?').bind(previousId,room).first();if(restored){await env.DB.prepare('UPDATE visitors SET seen=? WHERE id=?').bind(now,previousId).run();return json(restored);}}
  if(!admin&&room!=='winter-plaza'){
   if(!invitation)return json({error:'유효한 초대 링크로 입장해 주세요.'},403);
   const address=request.headers.get('cf-connecting-ip')||request.headers.get('x-real-ip')||'anonymous',attemptId=await digest(room+':'+address);
   await env.DB.prepare('DELETE FROM invite_attempts WHERE reset_at<?').bind(now).run();
   await env.DB.prepare('INSERT INTO invite_attempts(id,attempts,reset_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=attempts+1').bind(attemptId,now+60000).run();
   const attempt=await env.DB.prepare('SELECT attempts FROM invite_attempts WHERE id=?').bind(attemptId).first();
   if(attempt.attempts>6)return json({error:'입력 횟수를 초과했어요. 1분 뒤 다시 시도해 주세요.'},429);
   if(typeof body.password!=='string'||body.password.length>128||!constantEqual(await passwordHash(body.password,invitation.salt),invitation.password_hash))return json({error:'비밀번호를 확인해 주세요.'},403);
  }else if(room!=='winter-plaza'&&!invitation)return json({error:'초대 공간을 찾을 수 없습니다.'},404);
  if(room==='winter-plaza'&&!await rateLimit(env.DB,'join:'+await digest(request.headers.get('cf-connecting-ip')||'shared'),now,40))return json({error:'잠시 뒤 다시 입장해 주세요.'},429);
  const name=String(body.name||'크림토끼').normalize().replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,16)||'크림토끼';
  await env.DB.prepare('DELETE FROM visitors WHERE seen < ?').bind(now-2592000000).run();
  const secret=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(v=>v.toString(16).padStart(2,'0')).join(''),id=await digest(secret);
  // Conditional insert caps each room atomically, including concurrent joins.
  const result=await env.DB.prepare('INSERT INTO visitors(id,room,name,color,accessory,x,z,yaw,seen,gesture,gesture_at) SELECT ?,?,?,?,?,0,30,0,?,\'\',0 WHERE (SELECT COUNT(*) FROM visitors WHERE room=? AND seen>?) < 12').bind(id,room,name,'#f4eee5','none',now,room,now-age).run();
  if(!result.meta?.changes)return json({error:'이 공간에는 12명이 있어요. 새 초대 공간을 만들어 주세요.'},409);
  // A successful room switch must not leave an active copy of the host in the old room.
  if(previousId){await env.DB.prepare('UPDATE visitors SET seen=? WHERE id=?').bind(now-age,previousId).run();await env.DB.prepare('DELETE FROM ride_seats WHERE visitor=?').bind(previousId).run();}
  const secure=url.protocol==='https:'?'; Secure':'';return json({id,room,name},200,{'Set-Cookie':`winter_session=${secret}; Path=/api; HttpOnly; SameSite=Lax${secure}; Max-Age=2592000`});
 }
 const secret=token(request);if(!secret)return json({error:'초대 링크로 입장해 주세요.'},401);const id=await digest(secret),self=await env.DB.prepare('SELECT id,room,name,x,y,z FROM visitors WHERE id=?').bind(id).first();if(!self)return json({error:'연결이 만료됐어요. 다시 입장해 주세요.'},401);
 if(await env.DB.prepare('SELECT id FROM visitor_blocks WHERE id=?').bind(id).first())return json({error:'이 기기의 이용이 제한되었습니다.'},403);
 const rideResponse=await rideAPI(request,env.DB,self,now);if(rideResponse)return rideResponse;
 const assisted=await assistAPI(request,env,self);if(assisted)return assisted;
 const community=await communityAPI(request,env,self,path==='/api/admin'?await isOwner(request,env):false);if(community)return community;
 if(path==='/api/tree'&&request.method==='GET'){const rows=await env.DB.prepare('SELECT id,kind,color,angle,height,origin_x AS originX,origin_y AS originY,origin_z AS originZ,created_at AS createdAt,CASE WHEN author=? THEN 1 ELSE 0 END AS mine FROM tree_decorations WHERE room=? ORDER BY created_at LIMIT 160').bind(self.id,self.room).all();const decorations=rows.results||[],revision=(await digest(JSON.stringify(decorations))).slice(0,24);return json(url.searchParams.get('revision')===revision?{unchanged:true,revision}:{decorations,revision});}
 if(path==='/api/name'&&request.method==='POST'){const raw=await request.text();if(raw.length>256)return json({error:'닉네임은 16자까지 입력하세요.'},413);const name=String(JSON.parse(raw).name||'').normalize().replace(/[<>\u0000-\u001f]/g,'').trim();if(!name||name.length>16)return json({error:'닉네임은 1~16자로 입력하세요.'},400);await env.DB.prepare('UPDATE visitors SET name=? WHERE id=?').bind(name,id).run();return json({name});}
 if(path==='/api/leave'&&request.method==='POST'){await env.DB.prepare('DELETE FROM ride_seats WHERE visitor=?').bind(id).run();await env.DB.prepare('DELETE FROM visitors WHERE id=?').bind(id).run();return json({ok:true});}
 if(path==='/api/tree'&&request.method==='POST'){
  const raw=await request.text();if(raw.length>1024)return json({error:'요청이 너무 큽니다.'},413);const b=JSON.parse(raw);
  if(!decorationKinds.includes(b.kind)||!validDecorationColor(b.color)||!Number.isFinite(b.angle)||!Number.isFinite(b.height)||b.height<3||b.height>27||Math.abs(b.angle)>Math.PI*2)return json({error:'장식 위치를 확인해 주세요.'},400);
  let wishMessage='';try{if(b.message)wishMessage=messageText(b.message);}catch(e){return json({error:e.message},400);}
  if(b.visibility&&!['public','private'].includes(b.visibility))return json({error:'공개 범위를 확인해 주세요.'},400);
  const ornament=crypto.randomUUID(),result=await env.DB.prepare('INSERT INTO tree_decorations(id,room,author,kind,color,angle,height,created_at,origin_x,origin_y,origin_z) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM tree_decorations WHERE room=?)<160 AND NOT EXISTS (SELECT 1 FROM tree_decorations WHERE author=? AND created_at>?)').bind(ornament,self.room,id,b.kind,b.color,b.angle,b.height,now,self.x+Math.sin(self.yaw||0)*.9,self.y+.4,self.z+Math.cos(self.yaw||0)*.9,self.room,id,now-1000).run();if(!result.meta?.changes)return json({error:'잠시 후 다시 시도해 주세요. 트리는 160개까지 꾸밀 수 있어요.'},429);if(wishMessage){try{await env.DB.prepare('INSERT INTO wishes(id,room,author,author_name,message,visibility,created_at) VALUES(?,?,?,?,?,?,?)').bind(ornament,self.room,id,'게스트 '+self.id.slice(0,4).toUpperCase(),wishMessage,b.visibility==='public'?'public':'private',now).run();}catch(e){await env.DB.prepare('DELETE FROM tree_decorations WHERE id=?').bind(ornament).run();throw e;}}return json({id:ornament});
 }
 if(path==='/api/tree'&&request.method==='PATCH'){
  const raw=await request.text();if(raw.length>256)return json({error:'요청이 너무 큽니다.'},413);const b=JSON.parse(raw);if(typeof b.id!=='string'||b.id.length>80||!validDecorationColor(b.color))return json({error:'색상을 확인해 주세요.'},400);
  const result=await env.DB.prepare('UPDATE tree_decorations SET color=? WHERE id=? AND room=? AND author=?').bind(b.color,b.id,self.room,self.id).run();if(!result.meta?.changes)return json({error:'자신이 단 장식만 바꿀 수 있습니다.'},403);return json({ok:true});
 }
 if(path==='/api/tree'&&request.method==='DELETE'){const raw=await request.text();if(raw.length>256)return json({error:'요청이 너무 큽니다.'},413);const b=JSON.parse(raw);const target=String(b.id||'');await env.DB.prepare('DELETE FROM wish_reactions WHERE wish_id IN (SELECT id FROM wishes WHERE id=? AND room=? AND author=?)').bind(target,self.room,id).run();await env.DB.prepare('DELETE FROM wishes WHERE id=? AND room=? AND author=?').bind(target,self.room,id).run();await env.DB.prepare('DELETE FROM tree_decorations WHERE id=? AND room=? AND author=?').bind(target,self.room,id).run();return json({ok:true});}
 if(path==='/api/chat'&&request.method==='POST'){
  const raw=await request.text();if(raw.length>1024)return json({error:'말풍선은 160자까지 쓸 수 있어요.'},413);const b=JSON.parse(raw);let message;try{message=messageText(b.message);}catch(e){return json({error:e.message},400);}
  const result=await env.DB.prepare('UPDATE visitors SET chat=?,chat_at=?,seen=? WHERE id=? AND chat_at<?').bind(message,now,now,id,now-1500).run();if(!result.meta?.changes)return json({error:'잠깐 숨을 고르고 보내 주세요.'},429);return json({message,at:now,name:self.name});
 }
 if(path==='/api/presence'&&request.method==='POST'){
  const raw=await request.text();if(raw.length>2048)return json({error:'요청이 너무 큽니다.'},413);const b=JSON.parse(raw);
  const restOK=b.mode==='rest'&&Object.values(restSeats).some(p=>Math.hypot(b.x-p.x,b.z-p.z)<.15&&Math.abs(b.y-p.y)<.15);
  const groundOK=canStandAt(b.x,b.z)&&b.y>=surfaceHeight(b.x,b.z)+.5&&b.y<=surfaceHeight(b.x,b.z)+3;
  if(!Number.isFinite(b.x)||!Number.isFinite(b.z)||!Number.isFinite(b.yaw)||!Number.isFinite(b.y)||!(interiorPositionValid(b.x,b.y,b.z)||groundOK||restOK||(b.mode==='skate'&&withinRink(b.x,b.z,.5)&&Math.abs(b.y-1.04)<.1)||amusementPositionValid(b.x,b.y,b.z,b.mode)||spaPositionValid(b.x,b.y,b.z,b.mode)||resortRidePosition(b.x,b.y,b.z,b.mode)))return json({error:'이동 위치를 확인해 주세요.'},400);
  const color=/^#[0-9a-f]{6}$/i.test(b.color)?b.color:'#f4eee5',accessory=normalizeWardrobe(b.accessory),gesture=activityGestures.includes(b.gesture)?b.gesture:'';
  await env.DB.prepare('UPDATE visitors SET x=?,z=?,yaw=?,y=?,mode=?,color=?,accessory=?,seen=?,gesture=?,gesture_at=? WHERE id=? AND seen<=?').bind(b.x,b.z,b.yaw,b.y,['lift','summit','ski','sled','rest','bath','sauna','lie','tea','dining','carousel','ferris','skate'].includes(b.mode)?b.mode:'',color,accessory,now,gesture,gesture?now:0,id,now-500).run();
  await env.DB.prepare("UPDATE visitors SET chat='',chat_at=0 WHERE room=? AND chat_at>0 AND chat_at<?").bind(self.room,now-600000).run();
  if(['ferris','lift'].includes(b.mode))await env.DB.prepare('UPDATE ride_seats SET expires_at=? WHERE visitor=? AND expires_at>?').bind(now+20000,id,now).run();
  else await env.DB.prepare('DELETE FROM ride_seats WHERE visitor=? AND started_at<?').bind(id,now-6000).run();
  const rideSeats=await listRideSeats(env.DB,self.room,now);
  const people=await env.DB.prepare('SELECT id,name,color,accessory,x,z,yaw,y,mode,gesture,gesture_at AS gestureAt,chat,chat_at AS chatAt FROM visitors WHERE room=? AND seen>? AND id<>? ORDER BY seen DESC LIMIT 11').bind(self.room,now-age,id).all();return json({...interestSnapshot(people.results||[],b,b,now,rideSeats),rideSeats,serverTime:now,count:(people.results?.length||0)+1});
 }
 return json({error:'지원하지 않는 요청입니다.'},404);
 }catch(e){if(e instanceof SyntaxError)return json({error:'잘못된 요청입니다.'},400);return json({error:'공유 공간에 연결할 수 없어요. 잠시 뒤 다시 시도해 주세요.'},503);}
}
