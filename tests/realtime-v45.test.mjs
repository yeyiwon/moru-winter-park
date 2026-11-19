import test from 'node:test';import assert from 'node:assert/strict';import WebSocket from 'ws';
import {realtimeFixture} from './helpers/realtime-service.mjs';
import {RealtimeWorld} from '../realtime/world.js';
import {signTicket,verifyTicket} from '../realtime/auth.js';
import {realtimeRPC} from '../server/realtime.js';
const pose={x:0,y:.95,z:30,yaw:0,speed:0,mode:''};
function connect(url,ticket){return new Promise((resolve,reject)=>{const ws=new WebSocket(url,['winter-v1','auth.'+ticket],{origin:'http://127.0.0.1'});ws.once('error',reject);ws.once('close',()=>reject(Error('closed before welcome')));ws.once('message',raw=>resolve({ws,ready:JSON.parse(raw)}));});}
function send(ws,b){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('snapshot timeout')),4000);ws.once('message',raw=>{clearTimeout(timer);resolve(JSON.parse(raw));});ws.send(JSON.stringify(b));});}
test('real Cloudflare runtime: authenticated sockets, sequence validation, persistence-free motion, shared show and revoke',async t=>{
 const f=await realtimeFixture(t),a=f.guest(),b=f.guest();
 const health=await f.mf.dispatchFetch(new URL('/health',f.url));assert.equal(health.status,200);assert.equal((await health.json()).service,'winterlight-realtime');
 assert.equal((await f.mf.dispatchFetch(new URL('/connect',f.url),{headers:{Upgrade:'websocket',Origin:'https://untrusted.invalid'}})).status,403);
 assert.equal((await f.mf.dispatchFetch(new URL('/connect',f.url),{headers:{Upgrade:'websocket',Origin:'http://127.0.0.1','Sec-WebSocket-Protocol':'winter-v1,auth.forged'}})).status,401);const sa=await f.call(a,'join',{});await f.call(b,'join',{});
 const ta=await f.call(a,'realtime',{}),tb=await f.call(b,'realtime',{});assert.equal(ta.status,200,JSON.stringify(ta.data));
 const ca=await connect(ta.data.url,ta.data.ticket),cb=await connect(tb.data.url,tb.data.ticket);t.after(()=>{ca.ws.close();cb.ws.close();});assert.equal(cb.ready.count,2);
 const before=f.stats.poseWrites;assert.equal((await send(ca.ws,{type:'pose',seq:1,at:Date.now(),pose:{...pose,x:1,speed:1}})).type,'snapshot');
 const snap=await send(cb.ws,{type:'ping',seq:1,at:Date.now()});assert.equal(snap.people[0].x,1);assert.equal(f.stats.poseWrites,before);
 assert.equal((await send(ca.ws,{type:'pose',seq:1,at:Date.now(),pose})).code,'stale');
 assert.equal((await send(ca.ws,{type:'pose',seq:2,at:Date.now(),pose:{...pose,x:999999}})).code,'pose');
 assert.equal((await send(ca.ws,{type:'pose',seq:3,at:Date.now(),pose:{...pose,mode:'ferris'}})).code,'pose');
 const show=await f.call(a,'fireworks',{action:'request'});assert.equal(show.status,200);const live=await send(cb.ws,{type:'ping',seq:2,at:Date.now()});assert.equal(live.fireworks.id,show.data.show.id);
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

test('a greeting persists across movement packets and expires without replay',()=>{
 let now=1000;const ws={send(){},close(){},serializeAttachment(){}};const world=new RealtimeWorld({now:()=>now});world.accept(ws,{id:'a',exp:100000,profile:{...pose,id:'a',region:'outdoors'}});
 const update=(seq,gesture)=>world.message(ws,JSON.stringify({type:'pose',seq,at:now,pose:{...pose,gesture}}));
 update(1,'wave');now+=100;update(2,'');assert.equal(world.clients.get(ws).profile.gesture,'wave');
 now+=2100;update(3,'');assert.equal(world.clients.get(ws).profile.gesture,'');
});

test('capacity, oversized messages and rapid senders are bounded per connection',()=>{
 const world=new RealtimeWorld({now:()=>1000}),sockets=[];
 for(let i=0;i<101;i++){const ws={code:null,send(){},close(code){this.code=code;},serializeAttachment(){}};world.accept(ws,{id:String(i),exp:100000,profile:{...pose,id:String(i),region:'outdoors'}});sockets.push(ws);}
 assert.equal(world.clients.size,100);assert.equal(sockets[100].code,4008);
 world.message(sockets[0],'x'.repeat(2049));assert.equal(sockets[0].code,1009);
 for(let seq=0;seq<31;seq++)world.message(sockets[1],JSON.stringify({type:'ping',seq,at:1000}));assert.equal(sockets[1].code,1008);assert.equal(world.clients.size,98);
});
