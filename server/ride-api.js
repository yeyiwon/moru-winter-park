import {diningFacility,diningSeats} from '../dist/dining-seats.js';
import {benches,benchAccess} from '../dist/bench-layout.js';
import {ferrisDimensions} from '../dist/ferris-layout.js';
import {ferrisCabinAtStation,sharedRideKinds} from '../dist/ride-seats.js';
import {upperLiftEntry,resortDestinations} from '../dist/resort-layout.js';
const json=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export async function listRideSeats(DB,room,now){return(await DB.prepare('SELECT visitor AS id,kind,cabin,seat,started_at AS startedAt,expires_at AS expiresAt FROM ride_seats WHERE room=? AND expires_at>?').bind(room,now).all()).results||[];}
export async function rideAPI(request,DB,self,now){
 if(new URL(request.url).pathname!=='/api/ride')return null;
 if(request.method==='DELETE'){await DB.prepare('DELETE FROM ride_seats WHERE visitor=?').bind(self.id).run();return json({ok:true});}
 if(request.method!=='POST')return json({error:'지원하지 않는 요청입니다.'},405);
 const raw=await request.text();if(raw.length>256)return json({error:'요청이 너무 큽니다.'},413);const {kind,benchId}=JSON.parse(raw);if(!sharedRideKinds.includes(kind))return json({error:'운영 중인 시설을 선택하세요.'},400);
 const bench=kind==='bench'?benches.find(b=>b.id===benchId):null;if(kind==='bench'&&(!bench||(self.region||'outdoors')!==bench.region))return json({error:'이 공간의 벤치를 선택하세요.'},400);
 const dining=kind==='dining';if(dining&&(benchId!==diningFacility.id||(self.region||'outdoors')!==diningFacility.region))return json({error:'이 공간의 좌석을 선택하세요.'},400);
 const entrance=dining?diningFacility:bench?benchAccess(bench):kind==='ferris'?ferrisDimensions.entrance:kind==='lift'?resortDestinations.find(p=>p.id==='ski'):upperLiftEntry;
 if(Math.hypot(self.x-entrance.x,self.z-entrance.z)>(bench||dining?4.5:9))return json({error:'승강장 가까이에서 탑승해 주세요.'},400);
 await DB.prepare('DELETE FROM ride_seats WHERE expires_at<=?').bind(now).run();
 const existing=await DB.prepare('SELECT kind,cabin,seat,started_at AS startedAt FROM ride_seats WHERE visitor=?').bind(self.id).first();if(existing)return existing.kind===kind&&(!bench||existing.cabin===bench.cabin)?json({reservation:existing,serverTime:now}):json({error:'먼저 이용 중인 시설에서 내려 주세요.'},409);
 const seats=await listRideSeats(DB,self.room,now);
 let options;
 if(bench||dining){
  options=(dining?diningSeats.map(p=>({cabin:p.cabin,seat:p.seat,startedAt:now})):[0,1].map(seat=>({cabin:bench.cabin,seat,startedAt:now})))
   .filter(p=>!seats.some(s=>s.kind===kind&&s.cabin===p.cabin&&s.seat===p.seat));
  for(let i=options.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[options[i],options[j]]=[options[j],options[i]];}
 }else{
  const pairs=seats.filter(s=>s.kind===kind&&s.startedAt>now-(kind==='ferris'?10000:1500)),candidates=[...new Set(pairs.map(s=>s.cabin))];
  let empty=kind==='ferris'?ferrisCabinAtStation(now):now;if(kind!=='ferris')while(seats.some(s=>s.kind===kind&&s.cabin===empty))empty++;
  if(!candidates.includes(empty))candidates.push(empty);
  options=candidates.flatMap(cabin=>[0,1].map(seat=>({cabin,seat,startedAt:pairs.find(s=>s.cabin===cabin)?.startedAt??now})));
 }
 // The unique database key decides the winner even when both clients saw an empty seat.
 for(const {cabin,seat,startedAt} of options){
  const result=await DB.prepare('INSERT INTO ride_seats(room,kind,cabin,seat,visitor,started_at,expires_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').bind(self.room,kind,cabin,seat,self.id,startedAt,now+20000).run();
  if(result.meta?.changes)return json({reservation:{kind,cabin,seat,startedAt},serverTime:now});
 }
 // An overlapping request from this same guest may have won the reservation.
 const claimed=await DB.prepare('SELECT kind,cabin,seat,started_at AS startedAt FROM ride_seats WHERE visitor=?').bind(self.id).first();
 if(claimed?.kind===kind&&(!bench||claimed.cabin===bench.cabin))return json({reservation:claimed,serverTime:now});
 return json({error:'좌석이 찼습니다. 다음 좌석을 이용해 주세요.'},409);
}
