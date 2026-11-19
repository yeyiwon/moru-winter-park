import {fireworkConfig} from '../dist/firework-score.js';
import {rateLimit} from './community-api.js';
export async function readFireworkShow(DB,now){
 const row=await DB.prepare('SELECT payload FROM world_settings WHERE id=?').bind('fireworks').first();
 if(!row)return null;
 const show=JSON.parse(row.payload),endsAt=show.stoppedAt??show.startsAt+fireworkConfig.duration*1000;
 return {...show,endsAt,nextAvailableAt:endsAt+fireworkConfig.cooldownMs,state:show.state==='stopped'?'stopped':now<show.startsAt?'scheduled':now<endsAt?'playing':'finished'};
}
export async function fireworksAPI(request,DB,self,admin,now){
 if(new URL(request.url).pathname!=='/api/fireworks')return null;
 const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 const snapshot=async()=>({show:await readFireworkShow(DB,now),serverTime:now});
 if(request.method==='GET')return reply(await snapshot());
 if(request.method!=='POST')return reply({error:'지원하지 않는 요청입니다.'},405);
 const raw=await request.text();if(raw.length>128)return reply({error:'요청이 너무 큽니다.'},413);
 const {action}=JSON.parse(raw)||{};
 if(!['start','stop'].includes(action))return reply({error:'공연 동작을 확인해 주세요.'},400);
 if(action==='stop'&&!admin)return reply({error:'관리자만 공연을 종료할 수 있습니다.'},403);
 if(!await rateLimit(DB,'fireworks:'+self.id,now,admin?6:3))return reply({error:'잠시 뒤 다시 시도해 주세요.'},429);
 if(action==='stop'){
  // A stale stop cannot overwrite a newer start.
  await DB.prepare("UPDATE world_settings SET payload=json_set(payload,'$.state','stopped','$.stoppedAt',?),updated_at=? WHERE id=? AND json_extract(payload,'$.state')<>'stopped' AND json_extract(payload,'$.startsAt')+?>?").bind(now,now,'fireworks',fireworkConfig.duration*1000,now).run();
  return reply(await snapshot());
 }
 const show={id:crypto.randomUUID(),startsAt:now+fireworkConfig.leadMs,seed:crypto.getRandomValues(new Uint32Array(1))[0],state:'scheduled'};
 // One conditional write arbitrates requests across all Worker instances.
 // Owner bypasses cooldown, never a currently scheduled/playing show.
 const end="COALESCE(json_extract(payload,'$.stoppedAt'),json_extract(payload,'$.startsAt')+?)";
 const result=await DB.prepare(`INSERT INTO world_settings(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at WHERE ${end}<=? AND (?=1 OR ${end}+?<=?)`).bind('fireworks',JSON.stringify(show),now,fireworkConfig.duration*1000,now,admin?1:0,fireworkConfig.duration*1000,fireworkConfig.cooldownMs,now).run();
 if(!result.meta?.changes)return reply({...await snapshot(),error:'진행 중인 공연과 다음 이용 가능 시간을 확인해 주세요.'},409);
 return reply(await snapshot());
}
