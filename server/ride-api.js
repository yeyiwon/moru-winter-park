import {benches,benchAccess} from '../dist/bench-layout.js';
import {ferrisDimensions} from '../dist/ferris-layout.js';
import {ferrisCabinAtStation,sharedRideKinds,sharedSeatChoices,canReachSharedSeat} from '../dist/ride-seats.js';
import {upperLiftEntry,resortDestinations} from '../dist/resort-layout.js';
import {diningEntrance,diningServiceSlot} from '../dist/ryokan-service.js';
const json=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export async function listRideSeats(DB,room,now){return(await DB.prepare('SELECT visitor AS id,kind,cabin,seat,started_at AS startedAt FROM ride_seats WHERE room=? AND expires_at>?').bind(room,now).all()).results||[];}
export async function rideAPI(request,DB,self,now){
 if(new URL(request.url).pathname!=='/api/ride')return null;
 if(request.method==='DELETE'){await DB.prepare('DELETE FROM ride_seats WHERE visitor=?').bind(self.id).run();return json({ok:true});}
 if(request.method!=='POST')return json({error:'지원하지 않는 요청입니다.'},405);
 const raw=await request.text();if(raw.length>256)return json({error:'요청이 너무 큽니다.'},413);let body;try{body=JSON.parse(raw);}catch{return json({error:'올바른 좌석 요청을 보내 주세요.'},400);}if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'올바른 좌석 요청을 보내 주세요.'},400);
 const {kind,benchId,seat:requestedSeat}=body;if(!sharedRideKinds.includes(kind))return json({error:'운영 중인 시설을 선택하세요.'},400);
 const bench=kind==='bench'?benches.find(b=>b.id===benchId):null;if(kind==='bench'&&(!bench||(self.region||'outdoors')!==bench.region))return json({error:'이 공간의 벤치를 선택하세요.'},400);
 if(kind==='dining'&&self.region!=='ryokan')return json({error:'료칸의 오마카세 카운터에서 이용해 주세요.'},400);
 const exact=kind==='bench'||kind==='dining',expectedCabin=bench?bench.cabin:0;
 if(exact&&(!Number.isInteger(requestedSeat)||requestedSeat<0||requestedSeat>=(kind==='dining'?3:2)))return json({error:'앉고 싶은 자리를 먼저 선택해 주세요.',code:'seat_required'},400);
 await DB.prepare('DELETE FROM ride_seats WHERE expires_at<=?').bind(now).run();
 const readExisting=()=>DB.prepare('SELECT room,kind,cabin,seat,started_at AS startedAt FROM ride_seats WHERE visitor=?').bind(self.id).first();
 const respondExisting=existing=>existing.room===self.room&&existing.kind===kind&&(!exact||existing.cabin===expectedCabin&&existing.seat===requestedSeat)?json({reservation:{kind:existing.kind,cabin:existing.cabin,seat:existing.seat,startedAt:existing.startedAt},serverTime:now}):json({error:'먼저 이용 중인 자리에서 일어난 뒤 다른 자리를 선택해 주세요.',code:'already_seated'},409);
 const existing=await readExisting();if(existing)return respondExisting(existing);
 const entrance=kind==='dining'?diningEntrance:bench?benchAccess(bench):kind==='ferris'?ferrisDimensions.entrance:kind==='lift'?resortDestinations.find(p=>p.id==='ski'):upperLiftEntry;
 if(exact?!canReachSharedSeat(sharedSeatChoices(kind,benchId).find(s=>s.seat===requestedSeat),self):Math.hypot(self.x-entrance.x,self.z-entrance.z)>9)return json({error:exact?'선택한 자리 가까이에서 앉아 주세요.':'승강장 가까이에서 탑승해 주세요.'},400);
 if(kind==='dining'){
   // MAX is evaluated inside the same write as the seat claim. Simultaneous
   // requests therefore cannot make the single chef serve two people at once.
   const result=await DB.prepare("INSERT INTO ride_seats(room,kind,cabin,seat,visitor,started_at,expires_at) SELECT ?,'dining',0,?,?,MAX(?,COALESCE((SELECT MAX(started_at)+? FROM ride_seats WHERE room=? AND kind='dining'),?)),? ON CONFLICT DO NOTHING").bind(self.room,requestedSeat,self.id,now,diningServiceSlot,self.room,now,now+20000).run();
   if(result.meta?.changes){const reservation=await DB.prepare('SELECT kind,cabin,seat,started_at AS startedAt FROM ride_seats WHERE visitor=?').bind(self.id).first();return json({reservation,serverTime:now});}
   const claimed=await readExisting();if(claimed)return respondExisting(claimed);
   return json({error:'선택한 자리에 다른 손님이 앉아 있어요. 다른 자리를 선택해 주세요.',code:'seat_occupied'},409);
 }
 if(bench){
  const result=await DB.prepare('INSERT INTO ride_seats(room,kind,cabin,seat,visitor,started_at,expires_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').bind(self.room,kind,bench.cabin,requestedSeat,self.id,now,now+20000).run();
  if(result.meta?.changes)return json({reservation:{kind,cabin:bench.cabin,seat:requestedSeat,startedAt:now},serverTime:now});
  const claimed=await readExisting();if(claimed)return respondExisting(claimed);
  return json({error:'선택한 자리에 다른 손님이 앉아 있어요. 다른 자리를 선택해 주세요.',code:'seat_occupied'},409);
 }
 const seats=await listRideSeats(DB,self.room,now),pairs=seats.filter(s=>s.kind===kind&&(!bench||s.cabin===bench.cabin)&&(bench||s.startedAt>now-(kind==='ferris'?10000:1500)));
 const candidates=[...new Set(pairs.map(s=>s.cabin))];let empty=bench?bench.cabin:kind==='ferris'?ferrisCabinAtStation(now):now;if(!bench&&kind!=='ferris')while(seats.some(s=>s.kind===kind&&s.cabin===empty))empty++;if(!candidates.includes(empty))candidates.push(empty);
 for(const cabin of candidates){const startedAt=pairs.find(s=>s.cabin===cabin)?.startedAt??now;
  for(const seat of [0,1]){const result=await DB.prepare('INSERT INTO ride_seats(room,kind,cabin,seat,visitor,started_at,expires_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').bind(self.room,kind,cabin,seat,self.id,startedAt,now+20000).run();if(result.meta?.changes)return json({reservation:{kind,cabin,seat,startedAt},serverTime:now});}
 }
 return json({error:'좌석이 찼습니다. 다음 좌석을 이용해 주세요.'},409);
}
