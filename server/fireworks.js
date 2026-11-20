import {fireworkConfig} from '../dist/firework-score.js';
import {selectShowTrack,showTimelineVersion} from '../dist/show-tracks.js';
import {publicRoom} from '../dist/space-links.js';
import {rateLimit} from './community-api.js';

const showKey='fireworks';
const showLength=fireworkConfig.duration*1000;
const active=show=>show&&['scheduled','playing'].includes(show.state);

function describeShow(show,now){
 if(!show)return null;
 const endsAt=Number.isFinite(show.endsAt)?show.endsAt:show.startsAt+showLength;
 const nextRequestAt=Number.isFinite(show.nextRequestAt)?Math.min(show.nextRequestAt,endsAt+fireworkConfig.cooldownMs):endsAt+fireworkConfig.cooldownMs;
 return {...show,endsAt,nextRequestAt,revision:show.revision||1,
  state:show.state==='stopped'?'stopped':now<show.startsAt?'scheduled':now<endsAt?'playing':'finished'};
}

function snapshot(show,now){
 const nextRequestAt=show?.nextRequestAt||0;
 return {show,serverTime:now,nextRequestAt,canRequest:!active(show)&&now>=nextRequestAt,
  phase:active(show)?show.state:now<nextRequestAt?'cooldown':'idle',
  retryAfterMs:Math.max(0,nextRequestAt-now)};
}

export async function readFireworkShow(DB,now){
 const row=await DB.prepare('SELECT payload FROM world_settings WHERE id=?').bind(showKey).first();
 return describeShow(row?JSON.parse(row.payload):null,now);
}

export async function fireworksAPI(request,DB,self,admin,now){
 if(new URL(request.url).pathname!=='/api/fireworks')return null;
 const reply=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
 // handleAPI validates admission first; keep the single-world boundary here too.
 if(!self?.id||self.room!==publicRoom)return reply({error:'공간에 입장한 뒤 신청해 주세요.'},403);
 if(request.method==='GET')return reply(snapshot(await readFireworkShow(DB,now),now));
 if(request.method!=='POST')return reply({error:'지원하지 않는 요청입니다.'},405);
 const raw=await request.text();
 if(raw.length>128)return reply({error:'요청이 너무 큽니다.'},413);
 let body;
 try{body=JSON.parse(raw);}catch{return reply({error:'입력 형식을 확인해 주세요.'},400);}
 const action=body?.action;
 if(!['request','start','stop'].includes(action))return reply({error:'공연 동작을 확인해 주세요.'},400);
 if(action!=='request'&&!admin)return reply({error:'관리자만 공연을 직접 시작하거나 종료할 수 있습니다.'},403);
 const limitKey=(action==='request'?'fireworks-request:':'fireworks-control:')+self.id;
 if(!await rateLimit(DB,limitKey,now,action==='request'?6:12)){
  return reply({...snapshot(await readFireworkShow(DB,now),now),error:'신청이 너무 빨라요. 잠시 뒤 다시 시도해 주세요.',retryAfterMs:60000},429,{'Retry-After':'60'});
 }
 if(action==='stop'){
  const row=await DB.prepare('SELECT payload FROM world_settings WHERE id=?').bind(showKey).first();
  const current=describeShow(row?JSON.parse(row.payload):null,now);
  if(!active(current))return reply(snapshot(current,now));
  // Cancellation never releases the reserved cooldown. A repeated stop is a no-op.
  const stopped={...current,state:'stopped',stoppedAt:now,revision:current.revision+1};
  await DB.prepare('UPDATE world_settings SET payload=?,updated_at=? WHERE id=? AND payload=?')
   .bind(JSON.stringify(stopped),now,showKey,row.payload).run();
  return reply(snapshot(await readFireworkShow(DB,now),now));
 }

 const existing=await readFireworkShow(DB,now);
 const existingResponse=show=>{
  if(action==='request'&&active(show))return reply({...snapshot(show,now),created:false,merged:true});
  const wait=Math.max(1,Math.ceil(((show?.nextRequestAt||now)-now)/1000));
  return reply({...snapshot(show,now),created:false,merged:false,
   error:active(show)?'이미 준비 중이거나 진행 중인 공연이 있어요.':'불꽃놀이가 잠시 쉬고 있어요. 표시된 시간이 지나면 다시 신청할 수 있어요.'},
   action==='start'?409:429,{'Retry-After':String(wait)});
 };
 if(active(existing)||!admin&&existing&&now<existing.nextRequestAt)return existingResponse(existing);

 const track=selectShowTrack(crypto.getRandomValues(new Uint8Array(1))[0]);
 const startsAt=now+(action==='start'?0:fireworkConfig.leadMs),endsAt=startsAt+track.duration*1000;
 const show={id:crypto.randomUUID(),musicId:track.id,duration:track.duration,timelineVersion:showTimelineVersion,startsAt,endsAt,nextRequestAt:endsAt+fireworkConfig.cooldownMs,
  seed:crypto.getRandomValues(new Uint32Array(1))[0],state:startsAt<=now?'playing':'scheduled',revision:1};
 // One atomic claim across Workers. JSON timestamps also preserve the reservation
 // after stop; older records without these fields retain a conservative cooldown.
 const cooldownEnd="COALESCE(json_extract(world_settings.payload,'$.endsAt'),json_extract(world_settings.payload,'$.startsAt')+?) + ?";
 const ends="COALESCE(json_extract(world_settings.payload,'$.stoppedAt'),json_extract(world_settings.payload,'$.endsAt'),json_extract(world_settings.payload,'$.startsAt')+?)";
 const result=await DB.prepare(`INSERT INTO world_settings(id,payload,updated_at) VALUES(?,?,?)
  ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at
  WHERE ${ends}<=? AND (?=1 OR MIN(COALESCE(json_extract(world_settings.payload,'$.nextRequestAt'),${cooldownEnd}),${cooldownEnd})<=?)`)
  .bind(showKey,JSON.stringify(show),now,showLength,now,admin?1:0,showLength,fireworkConfig.cooldownMs,showLength,fireworkConfig.cooldownMs,now).run();
 if(!result.meta?.changes)return existingResponse(await readFireworkShow(DB,now));
 return reply({...snapshot(show,now),created:true,merged:false});
}
