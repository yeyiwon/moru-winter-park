import {realtimeConfigured,realtimeRPC,worldCapacity} from './realtime.js';
import {messageText,rateLimit} from './community-api.js';
export const contentKeys=['museum','tree'];
const defaults={notice:'',disabled:[]};
export async function readWorldSettings(DB){const row=await DB.prepare('SELECT payload,updated_at AS updatedAt FROM world_settings WHERE id=?').bind('world').first();return row?{...JSON.parse(row.payload),updatedAt:row.updatedAt}:{...defaults,updatedAt:0};}
export async function operationsAPI(request,DB,self,admin,now,env={}){
 const path=new URL(request.url).pathname,reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 if(path==='/api/world-state'&&request.method==='GET')return reply(await readWorldSettings(DB));
 if(path!=='/api/operations')return null;
 if(!admin)return reply({error:'관리자만 사용할 수 있습니다.'},403);
 if(request.method==='GET'){
  const [settings,counts,errors]=await Promise.all([readWorldSettings(DB),DB.prepare('SELECT room,region,COUNT(*) AS count FROM visitors WHERE seen>? GROUP BY room,region LIMIT 80').bind(now-20000).all(),DB.prepare('SELECT route,code,revision,created_at AS createdAt FROM operational_errors ORDER BY created_at DESC LIMIT 30').bind().all()]);
  let realtime=null,service=realtimeConfigured(env)?'degraded':'polling';const began=performance.now();
  if(realtimeConfigured(env))try{realtime=await realtimeRPC(env,{action:'metrics'});service='healthy';}catch{}
  const backups=await DB.prepare('SELECT COUNT(*) AS count,MAX(created_at) AS latestAt FROM decoration_backups').bind().first();
  const trend=await DB.prepare('SELECT CAST(created_at/300000 AS INTEGER)*300000 AS bucket,COUNT(*) AS count FROM operational_errors WHERE created_at>? GROUP BY bucket ORDER BY bucket LIMIT 12').bind(now-3600000).all();
  return reply({database:'healthy',protocol:'winter-v1',settings,counts:counts.results,errors:errors.results,errorTrend:trend.results,realtime,service,latencyMs:Math.round(performance.now()-began),revision:typeof __WINTER_REVISION__==='string'?__WINTER_REVISION__:'local',transport:realtimeConfigured(env)?'WebSocket':'HTTP polling',roomCapacity:worldCapacity(env),backup:{decorations:backups,fullDatabase:'UNKNOWN'}});
 }
 if(request.method!=='POST')return reply({error:'지원하지 않는 요청입니다.'},405);
 if(!await rateLimit(DB,'operations:'+self.id,now,12))return reply({error:'잠시 후 다시 시도해 주세요.'},429);
 const raw=await request.text();if(raw.length>2048)return reply({error:'요청이 너무 큽니다.'},413);
 const body=JSON.parse(raw),notice=body.notice?messageText(body.notice,160):'';
 if(!Array.isArray(body.disabled)||body.disabled.some(id=>!contentKeys.includes(id)))return reply({error:'콘텐츠 설정을 확인해 주세요.'},400);
 const settings={notice,disabled:[...new Set(body.disabled)]};await DB.prepare('INSERT INTO world_settings(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').bind('world',JSON.stringify(settings),now).run();return reply({...settings,updatedAt:now});
}
// Database claim, rather than a per-request timer, bounds cleanup across worker instances.
export async function maintainSessions(DB,now){
 const claim=await DB.prepare('INSERT INTO world_settings(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET updated_at=excluded.updated_at WHERE updated_at<?').bind('cleanup','{}',now,now-60000).run();
 if(!claim.meta?.changes)return;
 await Promise.all([
  DB.prepare('DELETE FROM moderation_audit WHERE created_at<?').bind(now-30*86400000),
  DB.prepare('DELETE FROM owner_login_codes WHERE expires_at<=?').bind(now),
  DB.prepare('DELETE FROM owner_sessions WHERE expires_at<=?').bind(now),
  DB.prepare('DELETE FROM ride_seats WHERE expires_at<=?').bind(now),
  DB.prepare('DELETE FROM visitors WHERE seen<?').bind(now-2592000000),
  DB.prepare("UPDATE visitors SET chat='',chat_at=0 WHERE chat_at>0 AND chat_at<?").bind(now-600000),
  DB.prepare('DELETE FROM invite_attempts WHERE reset_at<?').bind(now),
  DB.prepare('DELETE FROM operational_errors WHERE created_at<? OR id NOT IN (SELECT id FROM operational_errors ORDER BY created_at DESC LIMIT 100)').bind(now-604800000)
 ].map(statement=>statement.run()));
}
export async function recordServerError(DB,path,error,now){
 // No message, body, IP, identity or stack: these can contain personal data or secrets.
 try{const code=['TypeError','RangeError','AbortError'].includes(error?.name)?error.name:'ServiceError';await DB.prepare('INSERT INTO operational_errors(id,route,code,created_at,revision) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),/^\/api\/[a-z-]{1,30}$/.test(path)?path:'/api/unknown',code,now,typeof __WINTER_REVISION__==='string'?__WINTER_REVISION__:'local').run();}catch{}
}
