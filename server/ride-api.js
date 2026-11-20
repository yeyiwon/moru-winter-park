import {benches,benchAccess} from '../dist/bench-layout.js';
import {ferrisDimensions} from '../dist/ferris-layout.js';
import {ferrisCabinAtStation,sharedRideKinds,sharedSeatChoices,canReachSharedSeat,gondolaAtStation,canExitGondola,gondolaExiting} from '../dist/ride-seats.js';
import {ridgeLiftEntry,upperLiftEntry,gondolaEntry,resortDestinations} from '../dist/resort-layout.js';
import {diningEntrance,diningServiceSlot} from '../dist/ryokan-service.js';
const json=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export async function listRideSeats(DB,room,now){return(await DB.prepare('SELECT visitor AS id,kind,cabin,seat,started_at AS startedAt,expires_at AS expiresAt FROM ride_seats WHERE room=? AND expires_at>?').bind(room,now).all()).results||[];}
export async function rideAPI(request,DB,self,now){
 if(new URL(request.url).pathname!=='/api/ride')return null;
 if(request.method==='DELETE'){await DB.prepare('DELETE FROM ride_seats WHERE visitor=?').bind(self.id).run();return json({ok:true});}
 if(request.method!=='POST')return json({error:'지원하지 않는 요청입니다.'},405);
 const raw=await request.text();if(raw.length>256)return json({error:'요청이 너무 큽니다.'},413);let body;try{body=JSON.parse(raw);}catch{return json({error:'올바른 좌석 요청을 보내 주세요.'},400);}if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'올바른 좌석 요청을 보내 주세요.'},400);
 const {kind,benchId,seat:requestedSeat}=body;if(!sharedRideKinds.includes(kind))return json({error:'운영 중인 시설을 선택하세요.'},400);
 const bench=kind==='bench'?benches.find(b=>b.id===benchId):null;if(kind==='bench'&&(!bench||(self.region||'outdoors')!==bench.region))return json({error:'이 공간의 벤치를 선택하세요.'},400);
 if(kind==='dining'&&self.region!=='ryokan')return json({error:'료칸의 오마카세 카운터에서 이용해 주세요.'},400);
 const exact=kind==='bench'||kind==='dining',expectedCabin=bench?bench.cabin:0;
 if(exact&&requestedSeat!==undefined&&(!Number.isInteger(requestedSeat)||requestedSeat<0||requestedSeat>=(kind==='dining'?3:2)))return json({error:'앉고 싶은 자리를 먼저 선택해 주세요.',code:'invalid_seat'},400);
 await DB.prepare('DELETE FROM ride_seats WHERE expires_at<=?').bind(now).run();
 const readExisting=()=>DB.prepare('SELECT room,kind,cabin,seat,started_at AS startedAt FROM ride_seats WHERE visitor=?').bind(self.id).first();
 const respondExisting=existing=>existing.room===self.room&&existing.kind===kind&&(!exact||existing.cabin===expectedCabin&&(requestedSeat===undefined||existing.seat===requestedSeat))?json({reservation:{kind:existing.kind,cabin:existing.cabin,seat:existing.seat,startedAt:existing.startedAt},serverTime:now}):json({error:'먼저 이용 중인 자리에서 일어난 뒤 다른 자리를 선택해 주세요.',code:'already_seated'},409);
 const existing=await readExisting();
 if(body.action==='exit'){
  if(kind!=='gondola'||!existing||existing.room!==self.room||existing.kind!==kind)return json({error:'이용 중인 곤돌라가 없어요.'},409);
  if(gondolaExiting(existing))return respondExisting(existing);
  if(!canExitGondola(existing,now))return json({error:'승강장에 도착해 문이 완전히 열리면 내릴 수 있어요.',code:'station_closed'},409);
  await DB.prepare('UPDATE ride_seats SET started_at=? WHERE visitor=?').bind(now,self.id).run();return respondExisting({...existing,startedAt:now});
 }
 if(existing)return respondExisting(existing);
 const entrance=kind==='dining'?diningEntrance:bench?benchAccess(bench):kind==='ferris'?ferrisDimensions.entrance:kind==='lift'?resortDestinations.find(p=>p.id==='ski'):kind==='gondola'?gondolaEntry:kind==='ridgelift'?ridgeLiftEntry:upperLiftEntry;
 const choices=exact?sharedSeatChoices(kind,benchId):[];
 if(exact?!choices.some(choice=>(requestedSeat===undefined||choice.seat===requestedSeat)&&canReachSharedSeat(choice,self)):Math.hypot(self.x-entrance.x,self.z-entrance.z)>9)return json({error:exact?'선택한 자리 가까이에서 앉아 주세요.':'승강장 가까이에서 탑승해 주세요.'},400);
 if(exact){
  // The database unique key decides the winner. Retry other seats if another
  // visitor claims a candidate between reading availability and writing it.
  const order=requestedSeat===undefined?choices.map(c=>c.seat):[requestedSeat];
  for(let i=order.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[order[i],order[j]]=[order[j],order[i]];}
  for(const seat of order){
   const result=kind==='dining'
    ?await DB.prepare("INSERT INTO ride_seats(room,kind,cabin,seat,visitor,started_at,expires_at) SELECT ?,'dining',0,?,?,MAX(?,COALESCE((SELECT MAX(started_at)+? FROM ride_seats WHERE room=? AND kind='dining'),?)),? ON CONFLICT DO NOTHING").bind(self.room,seat,self.id,now,diningServiceSlot,self.room,now,now+20000).run()
    :await DB.prepare('INSERT INTO ride_seats(room,kind,cabin,seat,visitor,started_at,expires_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').bind(self.room,kind,bench.cabin,seat,self.id,now,now+20000).run();
   if(result.meta?.changes){const reservation=await DB.prepare('SELECT kind,cabin,seat,started_at AS startedAt FROM ride_seats WHERE visitor=?').bind(self.id).first();return json({reservation,serverTime:now});}
   const claimed=await readExisting();if(claimed)return respondExisting(claimed);
  }
  return json({error:'지금은 빈자리가 없어요. 잠시 후 다시 이용해 주세요.',code:'seat_occupied'},409);
 }
 if(kind==='gondola'){
  const station=gondolaAtStation(now);if(!station.open)return json({error:`다음 곤돌라가 ${Math.ceil(station.wait/1000)}초 후 도착해요.`,code:'station_closed'},409);
  for(let seat=0;seat<6;seat++){const result=await DB.prepare('INSERT INTO ride_seats(room,kind,cabin,seat,visitor,started_at,expires_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').bind(self.room,kind,station.cabin,seat,self.id,now,now+20000).run();if(result.meta?.changes)return json({reservation:{kind,cabin:station.cabin,seat,startedAt:now},serverTime:now});const claimed=await readExisting();if(claimed)return respondExisting(claimed);}
  return json({error:'이번 곤돌라가 찼어요. 다음 캐빈을 이용해 주세요.',code:'seat_occupied'},409);
 }
 const seats=await listRideSeats(DB,self.room,now),pairs=seats.filter(s=>s.kind===kind&&(!bench||s.cabin===bench.cabin)&&(bench||s.startedAt>now-(kind==='ferris'?10000:1500)));
 const candidates=[...new Set(pairs.map(s=>s.cabin))];let empty=bench?bench.cabin:kind==='ferris'?ferrisCabinAtStation(now):now;if(!bench&&kind!=='ferris')while(seats.some(s=>s.kind===kind&&s.cabin===empty))empty++;if(!candidates.includes(empty))candidates.push(empty);
 for(const cabin of candidates){const startedAt=pairs.find(s=>s.cabin===cabin)?.startedAt??now;
  for(const seat of [0,1]){const result=await DB.prepare('INSERT INTO ride_seats(room,kind,cabin,seat,visitor,started_at,expires_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').bind(self.room,kind,cabin,seat,self.id,startedAt,now+20000).run();if(result.meta?.changes)return json({reservation:{kind,cabin,seat,startedAt},serverTime:now});}
 }
 return json({error:'좌석이 찼습니다. 다음 좌석을 이용해 주세요.'},409);
}
