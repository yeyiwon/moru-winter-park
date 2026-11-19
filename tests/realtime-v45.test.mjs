import test from 'node:test';import assert from 'node:assert/strict';import WebSocket from 'ws';
import {realtimeFixture} from './helpers/realtime-service.mjs';
import {RealtimeWorld} from '../realtime/world.js';
import {signTicket,verifyTicket} from '../realtime/auth.js';
import {realtimeRPC} from '../server/realtime.js';
const pose={x:0,y:.95,z:30,yaw:0,speed:0,mode:''};
function connect(url,ticket){return new Promise((resolve,reject)=>{const ws=new WebSocket(url,['winter-v1','auth.'+ticket],{origin:'http://127.0.0.1'});ws.once('error',reject);ws.once('close',()=>reject(Error('closed before welcome')));ws.once('message',raw=>resolve({ws,ready:JSON.parse(raw)}));});}
function send(ws,b){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('snapshot timeout')),4000);ws.once('message',raw=>{clearTimeout(timer);resolve(JSON.parse(raw));});ws.send(JSON.stringify(b));});}
test('real Cloudflare runtime: authenticated sockets, sequence validation, persistence-free motion, shared show and revoke',async t=>{
 const f=await realtimeFixture(t),a=f.guest(),b=f.guest();const sa=await f.call(a,'join',{});await f.call(b,'join',{});
 const ta=await f.call(a,'realtime',{}),tb=await f.call(b,'realtime',{});assert.equal(ta.status,200,JSON.stringify(ta.data));
 const ca=await connect(ta.data.url,ta.data.ticket),cb=await connect(tb.data.url,tb.data.ticket);t.after(()=>{ca.ws.close();cb.ws.close();});assert.equal(cb.ready.count,2);
 const before=f.stats.poseWrites;assert.equal((await send(ca.ws,{type:'pose',seq:1,at:Date.now(),pose:{...pose,x:1,speed:1}})).type,'snapshot');
 const snap=await send(cb.ws,{type:'ping',seq:1,at:Date.now()});assert.equal(snap.people[0].x,1);assert.equal(f.stats.poseWrites,before);
 assert.equal((await send(ca.ws,{type:'pose',seq:1,at:Date.now(),pose})).code,'stale');
 assert.equal((await send(ca.ws,{type:'pose',seq:2,at:Date.now(),pose:{...pose,x:999999}})).code,'pose');
 const show=await f.call(a,'fireworks',{action:'start'});assert.equal(show.status,200);const live=await send(cb.ws,{type:'ping',seq:2,at:Date.now()});assert.equal(live.fireworks.id,show.data.show.id);
 const closed=new Promise(resolve=>ca.ws.once('close',code=>resolve(code)));await realtimeRPC(f.env,{action:'revoke',id:sa.data.id});assert.equal(await closed,4001);
 const replay=await connect(ta.data.url,ta.data.ticket).then(()=>false,()=>true); // revoked tickets close without a welcome
 assert.ok(replay);
});
test('tickets are signed, scoped and expire; forged tokens never authenticate',async()=>{const secret='a'.repeat(32),claims={id:'b'.repeat(64),aud:'winter-realtime',exp:2000};const token=await signTicket(claims,secret);assert.equal((await verifyTicket(token,secret,1000)).id,claims.id);assert.equal(await verifyTicket(token,secret,2000),null);assert.equal(await verifyTicket(token+'x',secret,1000),null);});
test('hibernation restores player attachments; peers are bounded and stationary motion settles',()=>{
 let now=1000;const fake=()=>({messages:[],send(v){this.messages.push(JSON.parse(v));},close(){},serializeAttachment(s){this.saved=structuredClone(s);},deserializeAttachment(){return this.saved;}}),world=new RealtimeWorld({now:()=>now}),sockets=[];
 for(let i=0;i<50;i++){const ws=fake();world.accept(ws,{id:String(i).padStart(64,'0'),exp:100000,profile:{...pose,x:i>1?10:0,id:String(i).padStart(64,'0'),region:'outdoors'}});sockets.push(ws);}
 assert.equal(world.snapshot(world.clients.get(sockets[0])).people.length,32);
 world.message(sockets[0],JSON.stringify({type:'pose',seq:1,at:now,pose:{...pose,x:1,speed:2}}));
 const restored=new RealtimeWorld({now:()=>now,restore:sockets});assert.equal(restored.clients.size,50);assert.equal(restored.clients.get(sockets[0]).seq,1);
 now+=2000;assert.equal(restored.snapshot(restored.clients.get(sockets[1])).people.find(p=>p.id==='0'.repeat(64)).speed,0);
 now+=20000;restored.prune();assert.equal(restored.clients.size,0);
});
