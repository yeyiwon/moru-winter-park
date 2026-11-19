import {validPose,currentReservedPose} from '../server/pose-validation.js';
import {interiorAt} from '../dist/interior-layout.js';
import {activityGestures} from '../dist/activity-state.js';
export const realtimeLimits=Object.freeze({capacity:100,peers:32,maxMessage:2048,rate:15,idleMs:15000});
const modes=new Set(['','lift','summit','ski','rest','bath','sauna','lie','tea','dining','carousel','ferris','view','footbath']);
export class RealtimeWorld{
 constructor({now=Date.now,restore=[]}={}){this.now=now;this.clients=new Map();this.known=new WeakMap();this.revoked=new Map();this.fireworks=null;this.rideSeats=[];this.metrics={since:now(),accepted:0,closed:0,received:0,rejected:0,bytesOut:0,samples:[]};for(const ws of restore){const state=ws.deserializeAttachment();if(state&&state.exp>now())this.clients.set(ws,state);else ws.close(4001,'Session expired');}}
 save(ws,state){ws.serializeAttachment?.(state);}
 accept(ws,claims){
  this.prune();if(this.revoked.get(claims.id)>this.now()){ws.close(4001,'Session revoked');return false;}
  const previous=[...this.clients].find(([,s])=>s.id===claims.id);
  if(!previous&&this.clients.size>=realtimeLimits.capacity){ws.close(4008,'World full');return false;}
  if(previous){this.clients.delete(previous[0]);previous[0].close(4009,'Connected in another tab');}
  const state={id:claims.id,exp:claims.exp,profile:previous?.[1].profile||claims.profile,seq:-1,seen:this.now(),poseAt:this.now(),windowAt:this.now(),messages:0};
  this.clients.set(ws,state);this.save(ws,state);this.metrics.accepted++;this.send(ws,{type:'ready',...this.wireSnapshot(ws,state)});return true;
 }
 send(ws,data){const body=JSON.stringify(data);try{ws.send(body);this.metrics.bytesOut+=body.length;}catch{this.close(ws);}}
 close(ws){if(this.clients.delete(ws))this.metrics.closed++;}
 prune(){const now=this.now();for(const [ws,s] of this.clients)if(s.exp<=now||now-s.seen>realtimeLimits.idleMs){this.clients.delete(ws);ws.close(4001,'Session expired');this.metrics.closed++;}for(const [id,expires]of this.revoked)if(expires<=now)this.revoked.delete(id);}
 message(ws,raw){
  const start=performance.now(),now=this.now();this.prune();const s=this.clients.get(ws);if(!s)return;
  this.metrics.received++;
  const reject=code=>{this.metrics.rejected++;this.send(ws,{type:'rejected',code,serverTime:now});};
  if(typeof raw!=='string'||raw.length>realtimeLimits.maxMessage){ws.close(1009,'Message too large');this.close(ws);return;}
  if(now-s.windowAt>=1000){s.windowAt=now;s.messages=0;}if(++s.messages>realtimeLimits.rate){reject('rate');if(s.messages>30){ws.close(1008,'Message rate exceeded');this.close(ws);}return;}
  let b;try{b=JSON.parse(raw);}catch{return reject('format');}
  if(!b||!['pose','ping'].includes(b.type))return reject('type');
  if(!Number.isSafeInteger(b.seq)||b.seq<=s.seq||!Number.isFinite(b.at)||Math.abs(now-b.at)>30000)return reject('stale');
  if(b.type==='pose'){
   const p=b.pose,reservation=this.rideSeats.find(r=>r.id===s.id&&r.expiresAt>now);
   if(!validPose(p,reservation,now)||!modes.has(p.mode||''))return reject('pose');
   const currentSeat=currentReservedPose(p,reservation,now);if(currentSeat)for(const key of ['x','y','z','yaw'])p[key]=currentSeat[key];
   const elapsed=Math.max(.1,(now-s.poseAt)/1000),distance=Math.hypot(p.x-s.profile.x,p.z-s.profile.z);
   // Teleports and interior transitions arrive through validated HTTP actions first.
   if(distance>12+Math.min(elapsed,5)*(p.mode==='ski'?48:['lift','summit','ferris'].includes(p.mode)?24:12))return reject('movement');
   // A one-shot greeting must survive the following movement packet.
   const gesture=activityGestures.includes(p.gesture)&&p.gesture?p.gesture:s.profile.gesture==='wave'&&now-s.profile.gestureAt<2000?'wave':'';
   s.profile={...s.profile,x:p.x,y:p.y,z:p.z,yaw:p.yaw,mode:p.mode||'',lean:p.mode==='ski'&&Number.isFinite(p.lean)?Math.max(-1,Math.min(1,p.lean)):0,tilt:p.mode==='ski'&&Number.isFinite(p.tilt)?Math.max(-.55,Math.min(.55,p.tilt)):0,brake:p.mode==='ski'&&p.brake===true,air:p.mode==='ski'&&Number.isFinite(p.air)?Math.max(0,Math.min(1.2,p.air)):0,speed:Math.max(0,Math.min(p.mode==='ski'?56:8,Number.isFinite(p.speed)?p.speed:0)),region:interiorAt(p.x,p.z)?.id||'outdoors',updatedAt:now,gesture,gestureAt:gesture===s.profile.gesture?s.profile.gestureAt:now};s.poseAt=now;
  }
  s.seq=b.seq;s.seen=now;this.save(ws,s);this.send(ws,{type:'snapshot',ack:b.seq,...this.wireSnapshot(ws,s)});
  const samples=this.metrics.samples;samples.push(performance.now()-start);if(samples.length>300)samples.shift();
 }
 wireSnapshot(ws,self){
  const snapshot=this.snapshot(self),previous=this.known.get(ws)||new Map(),next=new Map();
  snapshot.people=snapshot.people.map(profile=>{
   const full={...profile};for(const key of ['x','y','z','yaw','speed','lean','tilt','air'])if(Number.isFinite(full[key]))full[key]=Math.round(full[key]*1000)/1000;
   next.set(full.id,full);const old=previous.get(full.id);if(!old)return full;
   const delta={id:full.id};for(const key of Object.keys(full))if(full[key]!==old[key])delta[key]=full[key];return delta;
  });this.known.set(ws,next);return snapshot;
 }
 snapshot(self){
  const now=this.now(),people=[...this.clients.values()].filter(s=>s.id!==self.id&&s.profile.region===self.profile.region).sort((a,b)=>Math.hypot(a.profile.x-self.profile.x,a.profile.z-self.profile.z)-Math.hypot(b.profile.x-self.profile.x,b.profile.z-self.profile.z)).slice(0,realtimeLimits.peers).map(s=>({...s.profile,speed:now-s.poseAt>1500?0:s.profile.speed,chat:now-s.profile.chatAt<10000?s.profile.chat:'',gesture:now-s.profile.gestureAt<6000?s.profile.gesture:''}));
  return{people,count:this.clients.size,rideSeats:this.rideSeats.filter(s=>s.expiresAt>now),fireworks:this.fireworks,serverTime:now};
 }
 rpc(b){
  this.prune();const now=this.now();
  if(b.action==='authorize')for(const [ws,s]of this.clients)if(s.id===b.id){s.exp=b.exp;for(const k of ['name','color','colorTop','accessory','fluff','roundness'])s.profile[k]=b.profile[k];this.save(ws,s);}
  if(b.action==='checkpoint')for(const [ws,s]of this.clients)if(s.id===b.id){if((b.profile.updatedAt||0)>=s.poseAt){s.profile={...s.profile,...b.profile};s.poseAt=b.profile.updatedAt;}s.seen=now;this.save(ws,s);}
  if(b.action==='revoke'){this.revoked.set(b.id,now+125000);for(const [ws,s]of this.clients)if(s.id===b.id){this.clients.delete(ws);ws.close(4001,'Session revoked');}}
  if(b.action==='patch')for(const [ws,s]of this.clients)if(s.id===b.id){s.profile={...s.profile,...b.profile};this.save(ws,s);}
  if('fireworks'in b)this.fireworks=b.fireworks;
  if(b.rideSeats)this.rideSeats=b.rideSeats;
  if(b.action==='profile')return{profile:[...this.clients.values()].find(s=>s.id===b.id)?.profile||null};
  if(b.action==='metrics'){
   const samples=[...this.metrics.samples].sort((a,b)=>a-b),regions={};for(const s of this.clients.values())regions[s.profile.region]=(regions[s.profile.region]||0)+1;
   const {samples:_,...metrics}=this.metrics;return{connections:this.clients.size,regions,...metrics,handlerP95Ms:samples.length?samples[Math.floor((samples.length-1)*.95)]:null,capacity:realtimeLimits.capacity};
  }
  return{ok:true};
 }
}
