import {ferrisCabinAtStation,sharedRideKinds} from '../dist/ride-seats.js';
import {upperLiftEntry} from '../dist/resort-layout.js';
const json=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export async function listRideSeats(DB,room,now){return(await DB.prepare('SELECT visitor AS id,kind,cabin,seat,started_at AS startedAt FROM ride_seats WHERE room=? AND expires_at>?').bind(room,now).all()).results||[];}
export async function rideAPI(request,DB,self,now){
 if(new URL(request.url).pathname!=='/api/ride')return null;
 if(request.method==='DELETE'){await DB.prepare('DELETE FROM ride_seats WHERE visitor=?').bind(self.id).run();return json({ok:true});}
 if(request.method!=='POST')return json({error:'지원하지 않는 요청입니다.'},405);
 const raw=await request.text();if(raw.length>256)return json({error:'요청이 너무 큽니다.'},413);const {kind}=JSON.parse(raw);if(!sharedRideKinds.includes(kind))return json({error:'운영 중인 시설을 선택하세요.'},400);
 const entrance=kind==='ferris'?{x:-13,z:2}:kind==='lift'?{x:-36,z:-185}:upperLiftEntry;
 if(Math.hypot(self.x-entrance.x,self.z-entrance.z)>9)return json({error:'승강장 가까이에서 탑승해 주세요.'},400);
 await DB.prepare('DELETE FROM ride_seats WHERE expires_at<=?').bind(now).run();
 const existing=await DB.prepare('SELECT kind,cabin,seat,started_at AS startedAt FROM ride_seats WHERE visitor=?').bind(self.id).first();if(existing)return existing.kind===kind?json({reservation:existing,serverTime:now}):json({error:'먼저 이용 중인 시설에서 내려 주세요.'},409);
 const seats=await listRideSeats(DB,self.room,now),pairs=seats.filter(s=>s.kind===kind&&s.startedAt>now-(kind==='ferris'?10000:0));
 const candidates=[...new Set(pairs.map(s=>s.cabin))];const empty=kind==='ferris'?ferrisCabinAtStation(now):Math.floor(now/5000);if(!candidates.includes(empty))candidates.push(empty);
 for(const cabin of candidates){const startedAt=pairs.find(s=>s.cabin===cabin)?.startedAt??(kind==='ferris'?now:now+4000);
  for(const seat of [0,1]){const result=await DB.prepare('INSERT INTO ride_seats(room,kind,cabin,seat,visitor,started_at,expires_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').bind(self.room,kind,cabin,seat,self.id,startedAt,now+20000).run();if(result.meta?.changes)return json({reservation:{kind,cabin,seat,startedAt},serverTime:now});}
 }
 return json({error:'좌석이 찼습니다. 다음 좌석을 이용해 주세요.'},409);
}
