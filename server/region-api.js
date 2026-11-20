import {readWorldSettings} from './operations.js';
import {interiorRooms,interiorAt} from '../dist/interior-layout.js';
import {interiorDoors} from '../dist/district-layout.js';
export async function regionAPI(request,DB,self,now){
 if(new URL(request.url).pathname!=='/api/region')return null;
 const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 if(request.method!=='POST')return reply({error:'지원하지 않는 요청입니다.'},405);
 const raw=await request.text();if(raw.length>256)return reply({error:'요청이 너무 큽니다.'},413);
 const {region}=JSON.parse(raw),current=interiorAt(self.x,self.z)?.id||'outdoors';let position,yaw;
 if(region==='outdoors'){
  const room=interiorRooms[current];if(!room)return reply({error:'실내에서만 나갈 수 있습니다.'},409);
  // Exit controls are allowed anywhere inside the room, including after an interrupted activity.
  position=interiorDoors[current];yaw=position.yaw+Math.PI;
 }else{
  const door=interiorDoors[region],room=interiorRooms[region];
  if((await readWorldSettings(DB)).disabled.includes(region))return reply({error:'지금은 점검 중입니다.'},409);
  if(!door||!room)return reply({error:'공간을 찾을 수 없습니다.'},404);
  if(current!=='outdoors'||Math.hypot(self.x-door.x,self.z-door.z)>6)return reply({error:'입구에 가까이 와 주세요.'},409);
  position=room.entry;yaw=room.arrivalYaw;
 }
 await DB.prepare('DELETE FROM ride_seats WHERE visitor=?').bind(self.id).run();
 await DB.prepare("UPDATE visitors SET region=?,x=?,z=?,y=.95,yaw=?,mode='',speed=0,gesture='',gesture_at=0,seen=?,pose_at=? WHERE id=?").bind(region,position.x,position.z,yaw,now,now,self.id).run();
 return reply({region,position:{x:position.x,z:position.z},yaw});
}
