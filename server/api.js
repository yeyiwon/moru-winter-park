import {quizGenerationAPI} from './quiz-generation.js';
import {fireworksAPI,readFireworkShow} from './fireworks.js';
import {sharedRestPoseValid} from '../dist/ride-seats.js';
import {validateNickname} from '../dist/nickname.js';
import {regionAPI} from './region-api.js';
import {operationsAPI,maintainSessions,recordServerError,readWorldSettings} from './operations.js';
import {interestSnapshot} from '../dist/presence-policy.js';
import {rideAPI,listRideSeats} from './ride-api.js';
import {decorationKinds,validDecorationColor} from '../dist/decorations.js';
import {interiorPositionValid,interiorAt} from '../dist/interior-layout.js';
import {assistAPI} from './assist-api.js';
import {experienceAPI} from './experience-api.js';
import {amusementPositionValid} from '../dist/festival-layout.js';
import {communityAPI,messageText,rateLimit} from './community-api.js';
import {activityGestures} from '../dist/activity-state.js';
import {isOwner,sessionInfo,publicSession,invitationAPI,joinWorld,digest} from './invitations.js';
import {normalizeWardrobe,validateAppearance} from '../dist/wardrobe.js';
import {resortRidePosition,restSeats,spaPositionValid} from '../dist/resort-layout.js';
import {surfaceHeight} from '../dist/world-layout.js';
import {canStandAt} from '../dist/movement.js';
import {publicRoom} from '../dist/space-links.js';
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}});
const age=20000;
export async function handleAPI(request,env){
 const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/api/'))return null;
 if(path==='/api/health'){try{if(!env.DB)throw Error();await env.DB.prepare('SELECT 1 AS ready').bind().first();return json({ok:true,multiplayer:true});}catch{return json({ok:false,multiplayer:false},503);}}
 if(!env.DB)return json({error:'공간 연결을 준비하고 있어요.'},503);
 if(request.method!=='GET'&&(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site'))return json({error:'다른 사이트에서는 변경할 수 없습니다.'},403);
 const now=Date.now();
 try{
 if(path==='/api/access'&&request.method==='GET'){
  const admin=await isOwner(request,env),session=await sessionInfo(request,env,now,admin);
  return json({admin,signedIn:!!request.headers.get('oai-authenticated-user-id'),worldId:publicRoom,inviteRequired:false,blocked:session.blocked,session:session.valid?publicSession(session.self):null});
 }
 const generated=await quizGenerationAPI(request,env);if(generated)return generated;
 const invitation=await invitationAPI(request,env,now);if(invitation)return invitation;
 if(path==='/api/join'&&request.method==='POST')return await joinWorld(request,env,now);
 const session=await sessionInfo(request,env,now);
 if(!session.valid)return json({error:session.blocked?'이 게스트의 이용이 제한되었습니다.':'세션이 종료되었습니다. 다시 입장해 주세요.'},session.blocked?403:401);
 const self=session.self,id=self.id;
 const operation=await operationsAPI(request,env.DB,self,path==='/api/operations'?await isOwner(request,env):false,now);if(operation)return operation;
 const fireworksResponse=await fireworksAPI(request,env.DB,self,path==='/api/fireworks'&&request.method==='POST'?await isOwner(request,env):false,now);if(fireworksResponse)return fireworksResponse;
 const regionResponse=await regionAPI(request,env.DB,self,now);if(regionResponse)return regionResponse;
 const rideResponse=await rideAPI(request,env.DB,self,now);if(rideResponse)return rideResponse;
 const assisted=await assistAPI(request,env,self);if(assisted)return assisted;
 const personalized=await experienceAPI(request,env,self);if(personalized)return personalized;
 const community=await communityAPI(request,env,self,path==='/api/admin'?await isOwner(request,env):false);if(community)return community;
 if(path==='/api/tree'&&request.method==='GET'){const rows=await env.DB.prepare('SELECT id,kind,color,angle,height,origin_x AS originX,origin_y AS originY,origin_z AS originZ,created_at AS createdAt,CASE WHEN author=? THEN 1 ELSE 0 END AS mine FROM tree_decorations WHERE room=? ORDER BY created_at LIMIT 160').bind(self.id,self.room).all();const decorations=rows.results||[],revision=(await digest(JSON.stringify(decorations))).slice(0,24);return json(url.searchParams.get('revision')===revision?{unchanged:true,revision}:{decorations,revision});}
 if(path==='/api/appearance'&&request.method==='POST'){
  const raw=await request.text();if(raw.length>1024)return json({error:'요청이 너무 큽니다.'},413);
  let look;try{look=validateAppearance(JSON.parse(raw));}catch(e){return json({error:e.message},400);}
  await env.DB.prepare('UPDATE visitors SET color=?,color_top=?,accessory=?,fluff=?,roundness=? WHERE id=?').bind(look.fur,look.furTop,look.accessory,look.fluff,look.roundness,id).run();return json(look);
 }
 if(path==='/api/name'&&request.method==='POST'){const raw=await request.text();if(raw.length>1024)return json({error:'닉네임은 10자까지 입력하세요.'},413);let name;try{name=validateNickname(JSON.parse(raw).name);}catch(e){return json({error:e.message},400);}await env.DB.prepare('UPDATE visitors SET name=? WHERE id=?').bind(name,id).run();return json({name});}
 if(path==='/api/leave'&&request.method==='POST'){await env.DB.prepare('DELETE FROM ride_seats WHERE visitor=?').bind(id).run();await env.DB.prepare('DELETE FROM visitors WHERE id=?').bind(id).run();return json({ok:true});}
 if(path==='/api/tree'&&request.method==='POST'){
  if((await readWorldSettings(env.DB)).disabled.includes('tree'))return json({error:'트리 꾸미기는 점검 중입니다.'},409);
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
  const benchReservation=['rest','tea','sauna','dining'].includes(b.mode)?await env.DB.prepare('SELECT kind,cabin,seat FROM ride_seats WHERE visitor=? AND expires_at>?').bind(id,now).first():null;
  const benchOK=sharedRestPoseValid(benchReservation,b);
  if(b.mode==='dining'&&!benchOK)return json({error:'좌석 예약을 확인해 주세요.'},409);
  const restOK=b.mode==='rest'&&Object.values(restSeats).some(p=>Math.hypot(b.x-p.x,b.z-p.z)<.15&&Math.abs(b.y-p.y)<.15);
  const groundOK=canStandAt(b.x,b.z)&&b.y>=surfaceHeight(b.x,b.z)+.5&&b.y<=surfaceHeight(b.x,b.z)+3;
  if(!Number.isFinite(b.x)||!Number.isFinite(b.z)||!Number.isFinite(b.yaw)||!Number.isFinite(b.y)||!(interiorPositionValid(b.x,b.y,b.z)||groundOK||restOK||benchOK||amusementPositionValid(b.x,b.y,b.z,b.mode)||spaPositionValid(b.x,b.y,b.z,b.mode)||resortRidePosition(b.x,b.y,b.z,b.mode)))return json({error:'이동 위치를 확인해 주세요.'},400);
  const speed=Number.isFinite(b.speed)?Math.max(0,Math.min(b.mode==='ski'?40:8,b.speed)):0;
  const fluff=Number.isFinite(b.fluff)?Math.max(50,Math.min(100,b.fluff)):100,roundness=Number.isFinite(b.roundness)?Math.max(0,Math.min(100,b.roundness)):50;
  const color=/^#[0-9a-f]{6}$/i.test(b.color)?b.color:'#f4eee5',accessory=normalizeWardrobe(b.accessory),gesture=activityGestures.includes(b.gesture)?b.gesture:'';
  // Stationary polls still receive peers, but do not rewrite an identical pose.
  // Keep a bounded heartbeat well inside the shared 20-second presence expiry.
  const poseChanged=self.x!==b.x||self.y!==b.y||self.z!==b.z||self.yaw!==b.yaw||self.speed!==speed||self.mode!==(b.mode||'')||self.color!==color||self.color_top!==(b.colorTop||null)||self.accessory!==accessory||self.fluff!==fluff||self.roundness!==roundness||self.gesture!==gesture;
  if(poseChanged||gesture||now-self.seen>=8000)
  await env.DB.prepare('UPDATE visitors SET x=?,z=?,yaw=?,y=?,mode=?,color=?,color_top=?,accessory=?,fluff=?,roundness=?,seen=?,gesture=?,gesture_at=?,region=?,pose_at=?,speed=? WHERE id=? AND pose_at<=?').bind(b.x,b.z,b.yaw,b.y,['lift','summit','ski','rest','bath','sauna','lie','tea','dining','carousel','ferris','view','footbath'].includes(b.mode)?b.mode:'',color,/^#[0-9a-f]{6}$/i.test(b.colorTop)?b.colorTop:null,accessory,fluff,roundness,now,gesture,gesture?now:0,interiorAt(b.x,b.z)?.id||'outdoors',now,speed,id,now-500).run();
  await env.DB.prepare("UPDATE visitors SET chat='',chat_at=0 WHERE room=? AND chat_at>0 AND chat_at<?").bind(self.room,now-600000).run();
  if(benchOK||['ferris','lift'].includes(b.mode))await env.DB.prepare('UPDATE ride_seats SET expires_at=? WHERE visitor=? AND expires_at>?').bind(now+20000,id,now).run();
  else await env.DB.prepare('DELETE FROM ride_seats WHERE visitor=? AND started_at<?').bind(id,now-6000).run();
  await maintainSessions(env.DB,now);
  const rideSeats=await listRideSeats(env.DB,self.room,now);
  const people=await env.DB.prepare('SELECT id,name,color,color_top AS colorTop,accessory,fluff,roundness,x,z,yaw,y,mode,region,CASE WHEN pose_at>0 THEN pose_at ELSE seen END AS updatedAt,speed,gesture,gesture_at AS gestureAt,chat,chat_at AS chatAt FROM visitors WHERE room=? AND seen>? AND id<>? ORDER BY seen DESC LIMIT 11').bind(self.room,now-age,id).all();return json({...interestSnapshot(people.results||[],b,b,now,rideSeats),rideSeats,fireworks:await readFireworkShow(env.DB,now),serverTime:now,count:(people.results?.length||0)+1});
 }
 return json({error:'지원하지 않는 요청입니다.'},404);
 }catch(e){if(e instanceof SyntaxError)return json({error:'잘못된 요청입니다.'},400);await recordServerError(env.DB,path,e,now);return json({error:'공유 공간에 연결할 수 없어요. 잠시 뒤 다시 시도해 주세요.'},503);}
}
