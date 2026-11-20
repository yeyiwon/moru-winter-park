import {benches,benchAccess} from '../dist/bench-layout.js';
import fs from 'node:fs';import path from 'node:path';import WebSocket from 'ws';import {setTimeout as sleep} from 'node:timers/promises';
import {realtimeFixture} from '../tests/helpers/realtime-service.mjs';
import {realtimeRPC} from '../server/realtime.js';
const output=process.env.LOAD_OUTPUT||'qa/operations-v45/load.json',duration=Number(process.env.LOAD_SECONDS||20),levels=(process.env.LOAD_LEVELS||'10,25,50,100').split(',').map(Number);
if(levels.some(n=>n<2||n>100)||duration<5||duration>300)throw Error('Use 2–100 local clients and 5–300 seconds');
const quantile=(values,q)=>{if(!values.length)return null;const a=[...values].sort((a,b)=>a-b);return Math.round(a[Math.floor((a.length-1)*q)]*100)/100;};
const mean=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length*100)/100:null;
const results=[];
for(const count of levels){
 const f=await realtimeFixture(),clients=[],latency=[],apiLatency=[],movementLatency=[],chatLatency=[],chatStarted=new Map(),errors=[];let received=0,sent=0,rejected=0,bytesIn=0,showIds=new Set(),pendingActions=[];
 const action=async(c,route,body)=>{const began=performance.now(),result=await f.call(c,route,body);apiLatency.push(performance.now()-began);return result;};
 async function attach(c){const token=await action(c,'realtime',{});if(token.status!==200)throw Error('ticket '+token.status);return new Promise((resolve,reject)=>{const ws=new WebSocket(token.data.url,['winter-v1','auth.'+token.data.ticket],{origin:'http://127.0.0.1'});c.ws=ws;c.pending=new Map();c.peers=new Map();c.chatSeen=new Set();ws.on('error',reject);ws.on('message',raw=>{bytesIn+=raw.length;const d=JSON.parse(raw);if(d.type==='ready'){resolve();return;}if(d.type==='rejected'){rejected++;c.pending.clear();return;}if(d.type==='snapshot'){received++;const start=c.pending.get(d.ack);if(start){latency.push(performance.now()-start);c.pending.delete(d.ack);}const next=new Map();for(const delta of d.people||[]){const old=c.peers.get(delta.id),peer={...old,...delta};next.set(peer.id,peer);if(Number.isFinite(delta.updatedAt)&&delta.updatedAt!==old?.updatedAt&&Date.now()-delta.updatedAt<2000)movementLatency.push(Date.now()-delta.updatedAt);const start=chatStarted.get(peer.chat),key=peer.id+':'+peer.chat;if(start&&!c.chatSeen.has(key)){c.chatSeen.add(key);chatLatency.push(performance.now()-start);}}c.peers=next;if(d.fireworks)showIds.add(d.fireworks.id);}});});}
 try{
  for(let i=0;i<count;i++){const c=i===0?f.owner:f.guest();c.index=i;c.seq=0;const r=await action(c,'join',{name:'검증'+i});if(r.status!==200)throw Error('join '+r.status);c.id=r.data.id;clients.push(c);}
  const bench=benches.find(b=>b.region==='outdoors'),spot=benchAccess(bench);
  for(const c of clients.slice(0,3)){const r=await action(c,'presence',{x:spot.x,z:spot.z,y:.95,yaw:0,mode:''});if(r.status!==200)throw Error('bench approach '+r.status);}
  const seats=await Promise.all(clients.slice(0,3).map(c=>action(c,'ride',{kind:'bench',benchId:bench.id,seat:0})));
  if(seats.filter(r=>r.status===200).length!==1||seats.filter(r=>r.status===409).length!==2)throw Error('Seat conflict');
  for(const c of clients.slice(0,3)){await f.call(c,'ride',undefined,'DELETE');await f.DB.prepare("UPDATE visitors SET x=0,z=30,y=.95,mode='',region='outdoors',pose_at=? WHERE id=?").bind(Date.now(),c.id).run();}
  await Promise.all(clients.map(attach));const statsBefore={...f.stats},start=performance.now(),cpu=process.cpuUsage(),rssBefore=process.memoryUsage().rss;let ticks=0,reconnected=false,showRequested=false,lastCheckpoint=0,lastRenewal=0,leaseRenewals=0;
  while(performance.now()-start<duration*1000){
   const t=(performance.now()-start)/1000;
   for(const c of clients){if(c.ws.readyState!==WebSocket.OPEN||c.ws.bufferedAmount>32768||c.pending.size>=2)continue;const pose={x:Math.sin(t*.6+c.index)*2,z:30+Math.cos(t*.6+c.index)*2,y:.95+Math.max(0,Math.sin(t*2))*.8,yaw:t*.6,speed:1.2,mode:''};c.pose=pose;c.pending.set(++c.seq,performance.now());c.ws.send(JSON.stringify({type:'pose',seq:c.seq,at:Date.now(),pose}));sent++;}
   if(!showRequested&&t>2){showRequested=true;pendingActions.push(Promise.all(clients.slice(1,Math.min(count,11)).map(c=>action(c,'fireworks',{action:'request'}))).then(r=>{const won=r.filter(x=>x.status===200&&x.data.created).length;if(won!==1)errors.push('show winners '+won);if(r.some(x=>![200,409].includes(x.status)))errors.push('show status');}));
    for(const c of clients.slice(0,5)){chatStarted.set('함께 검증 '+c.index,performance.now());pendingActions.push(action(c,'chat',{message:'함께 검증 '+c.index}).then(r=>{if(r.status!==200)errors.push('chat '+r.status);}));pendingActions.push(action(c,'tree',{kind:'star',color:'#e5bb6b',height:12,angle:c.index,message:'보존 검증',visibility:'public'}).then(r=>{if(r.status!==200)errors.push('tree '+r.status);}));pendingActions.push(action(c,'quiz').then(r=>{if(r.status!==200)errors.push('quiz '+r.status);}));}
   }
   if(t-lastCheckpoint>10){lastCheckpoint=t;pendingActions.push(Promise.all(clients.map(c=>action(c,'presence',{...c.pose,color:'#f4eee5',accessory:'none',fluff:100,roundness:50}))).then(r=>{if(r.some(x=>x.status!==200))errors.push('checkpoint');}));}
   if(t-lastRenewal>40){lastRenewal=t;leaseRenewals++;pendingActions.push(Promise.all(clients.map(c=>action(c,'realtime',{}))).then(r=>{if(r.some(x=>x.status!==200))errors.push('lease renewal');}));}
   if(!reconnected&&t>duration*.7){reconnected=true;const c=clients.at(-1);c.ws.close();await attach(c);}
   ticks++;await sleep(Math.max(1,100-(performance.now()-start-t*1000)));
  }
  await Promise.all(pendingActions);await sleep(400);const metric=await realtimeRPC(f.env,{action:'metrics'}),usage=process.cpuUsage(cpu),wishes=await action(clients[1],'wishes');
  results.push({clients:count,durationSeconds:duration,sent,received,rejected,successRatio:received/sent,roundTripMs:{mean:mean(latency),p50:quantile(latency,.5),p95:quantile(latency,.95),p99:quantile(latency,.99),max:latency.reduce((maximum,value)=>Math.max(maximum,value),0)},movementServerToObserverMs:{mean:mean(movementLatency),p95:quantile(movementLatency,.95),samples:movementLatency.length},chatSubmissionToObserverMs:{mean:mean(chatLatency),p95:quantile(chatLatency,.95),samples:chatLatency.length},apiInProcessMs:{mean:mean(apiLatency),p95:quantile(apiLatency,.95)},serverHandlerP95Ms:metric.handlerP95Ms,connections:metric.connections,showIds:showIds.size,seatClaims:seats.map(r=>r.status),reconnected,leaseRenewals,storedWishes:wishes.data.wishes?.length,db:{queries:f.stats.queries-statsBefore.queries,writes:f.stats.writes-statsBefore.writes,poseWrites:f.stats.poseWrites-statsBefore.poseWrites},bytesOut:metric.bytesOut,bytesIn,reconnections:metric.reconnected,rejectionReasons:metric.rejections,nodeRssBefore:rssBefore,nodeRssAfter:process.memoryUsage().rss,nodeCpuMs:(usage.user+usage.system)/1000,workerCpu:'UNKNOWN',errors});
  console.log(JSON.stringify(results.at(-1)));
 }finally{for(const c of clients)c.ws?.close();await f.close();}
}
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({environment:'local macOS Cloudflare workerd + isolated SQLite; actual WebSocket network; HTTP handlers in-process',createdAt:new Date().toISOString(),results},null,2)+'\n');
if(results.some(r=>r.errors.length||r.rejected||r.successRatio<.98||r.showIds!==1||r.connections!==r.clients||!r.chatSubmissionToObserverMs.samples||r.reconnections!==1))process.exitCode=1;
