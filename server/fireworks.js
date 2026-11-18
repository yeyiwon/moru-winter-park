import {fireworkConfig} from '../dist/firework-score.js';
import {rateLimit} from './community-api.js';
export async function readFireworkShow(DB,now){
 const row=await DB.prepare('SELECT payload FROM world_settings WHERE id=?').bind('fireworks').first();
 const show=row?JSON.parse(row.payload):null;
 if(show&&show.state!=='stopped'&&now<show.startsAt+fireworkConfig.duration*1000)return{...show,state:now<show.startsAt?'scheduled':'playing'};
 if(fireworkConfig.auto){const n=Math.floor(now/fireworkConfig.intervalMs),startsAt=n*fireworkConfig.intervalMs;return{id:'auto-'+n,startsAt,seed:n>>>0,state:now<startsAt+fireworkConfig.duration*1000?'playing':'finished'};}
 return show?{...show,state:show.state==='stopped'?'stopped':'finished'}:null;
}
export async function fireworksAPI(request,DB,self,admin,now){
 if(new URL(request.url).pathname!=='/api/fireworks')return null;
 const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 if(request.method==='GET')return reply({show:await readFireworkShow(DB,now),serverTime:now});
 if(request.method!=='POST')return reply({error:'지원하지 않는 요청입니다.'},405);
 if(!admin)return reply({error:'관리자만 공연을 시작하거나 종료할 수 있습니다.'},403);
 const raw=await request.text();if(raw.length>128)return reply({error:'요청이 너무 큽니다.'},413);const {action}=JSON.parse(raw);
 if(!['start','stop'].includes(action))return reply({error:'공연 동작을 확인해 주세요.'},400);
 if(!await rateLimit(DB,'fireworks:'+self.id,now,6))return reply({error:'잠시 뒤 다시 시도해 주세요.'},429);
 if(action==='stop'){
  const current=await readFireworkShow(DB,now);if(current){const show={...current,state:'stopped'};await DB.prepare('UPDATE world_settings SET payload=? WHERE id=?').bind(JSON.stringify(show),'fireworks').run();return reply({show,serverTime:now});}return reply({show:null,serverTime:now});
 }
 const show={id:crypto.randomUUID(),startsAt:now+fireworkConfig.leadMs,seed:crypto.getRandomValues(new Uint32Array(1))[0],state:'scheduled'};
 // Conditional upsert makes concurrent admin starts one atomic claim across Workers.
 const result=await DB.prepare('INSERT INTO world_settings(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at WHERE updated_at<?').bind('fireworks',JSON.stringify(show),now,now-fireworkConfig.duration*1000-fireworkConfig.leadMs-fireworkConfig.cooldownMs).run();
 if(!result.meta?.changes)return reply({error:'진행 중인 공연이 있거나 잠시 쉬는 중입니다.'},409);
 return reply({show,serverTime:now});
}
