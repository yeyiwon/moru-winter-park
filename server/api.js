import {normalizeWardrobe} from '../dist/wardrobe.js';
import {resortRidePosition,restSeats,spaPositionValid} from '../dist/resort-layout.js';
import {surfaceHeight} from '../dist/world-layout.js';
import {canStandAt} from '../dist/movement.js';
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}});
const age=20000;
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(v=>v.toString(16).padStart(2,'0')).join('');
function token(request){return /(?:^|;\s*)winter_session=([a-f0-9]{64})(?:;|$)/.exec(request.headers.get('cookie')||'')?.[1];}
export async function handleAPI(request,env){
 const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/api/'))return null;
 if(path==='/api/health')return json({ok:true,multiplayer:!!env.DB});
 if(!env.DB)return json({error:'함께 걷기 연결을 준비하고 있어요.'},503);
 if(request.method!=='GET'&&(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site'))return json({error:'다른 사이트에서는 변경할 수 없습니다.'},403);
 const now=Date.now();
 try{
 if(path==='/api/join'&&request.method==='POST'){
  const raw=await request.text();if(raw.length>2048)return json({error:'요청이 너무 큽니다.'},413);const body=JSON.parse(raw),room=String(body.room||'winter-plaza');if(!/^[a-zA-Z0-9_-]{8,48}$/.test(room))return json({error:'초대 주소를 확인해 주세요.'},400);
  const name=String(body.name||'겨울 손님').normalize().replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,16)||'겨울 손님';
  await env.DB.prepare('DELETE FROM visitors WHERE seen < ?').bind(now-60000).run();
  const secret=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(v=>v.toString(16).padStart(2,'0')).join(''),id=await digest(secret);
  // Conditional insert caps each room atomically, including concurrent joins.
  const result=await env.DB.prepare('INSERT INTO visitors(id,room,name,color,accessory,x,z,yaw,seen,gesture,gesture_at) SELECT ?,?,?,?,?,0,30,0,?,\'\',0 WHERE (SELECT COUNT(*) FROM visitors WHERE room=? AND seen>?) < 12').bind(id,room,name,'#f4eee5','none',now,room,now-age).run();
  if(!result.meta?.changes)return json({error:'이 공간에는 12명이 있어요. 새 초대 공간을 만들어 주세요.'},409);
  const secure=url.protocol==='https:'?'; Secure':'';return json({id,room,name},200,{'Set-Cookie':`winter_session=${secret}; Path=/api; HttpOnly; SameSite=Lax${secure}; Max-Age=86400`});
 }
 const secret=token(request);if(!secret)return json({error:'먼저 함께 걷기에 입장해 주세요.'},401);const id=await digest(secret),self=await env.DB.prepare('SELECT id,room,name FROM visitors WHERE id=?').bind(id).first();if(!self)return json({error:'연결이 만료됐어요. 다시 입장해 주세요.'},401);
 if(path==='/api/leave'&&request.method==='POST'){await env.DB.prepare('DELETE FROM visitors WHERE id=?').bind(id).run();return json({ok:true});}
 if(path==='/api/presence'&&request.method==='POST'){
  const raw=await request.text();if(raw.length>2048)return json({error:'요청이 너무 큽니다.'},413);const b=JSON.parse(raw);
  const restOK=b.mode==='rest'&&Object.values(restSeats).some(p=>Math.hypot(b.x-p.x,b.z-p.z)<.15&&Math.abs(b.y-p.y)<.15);
  const groundOK=canStandAt(b.x,b.z)&&b.y>=surfaceHeight(b.x,b.z)+.5&&b.y<=surfaceHeight(b.x,b.z)+3;
  if(!Number.isFinite(b.x)||!Number.isFinite(b.z)||!Number.isFinite(b.yaw)||!Number.isFinite(b.y)||!(groundOK||restOK||spaPositionValid(b.x,b.y,b.z,b.mode)||resortRidePosition(b.x,b.y,b.z,b.mode)))return json({error:'이동 위치를 확인해 주세요.'},400);
  const color=/^#[0-9a-f]{6}$/i.test(b.color)?b.color:'#f4eee5',accessory=normalizeWardrobe(b.accessory),gesture=b.gesture==='wave'?'wave':'';
  await env.DB.prepare('UPDATE visitors SET x=?,z=?,yaw=?,y=?,mode=?,color=?,accessory=?,seen=?,gesture=?,gesture_at=? WHERE id=? AND seen<=?').bind(b.x,b.z,b.yaw,b.y,['lift','summit','ski','sled','rest','bath','sauna','lie','tea'].includes(b.mode)?b.mode:'',color,accessory,now,gesture,gesture?now:0,id,now-500).run();
  const people=await env.DB.prepare('SELECT id,name,color,accessory,x,z,yaw,y,mode,gesture,gesture_at AS gestureAt FROM visitors WHERE room=? AND seen>? AND id<>? ORDER BY seen DESC LIMIT 11').bind(self.room,now-age,id).all();return json({people:people.results||[],count:(people.results?.length||0)+1});
 }
 return json({error:'지원하지 않는 요청입니다.'},404);
 }catch(e){if(e instanceof SyntaxError)return json({error:'잘못된 요청입니다.'},400);return json({error:'공유 공간에 연결할 수 없어요. 잠시 뒤 다시 시도해 주세요.'},503);}
}
