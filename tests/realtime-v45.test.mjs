import test from 'node:test';import assert from 'node:assert/strict';import WebSocket from 'ws';
import {realtimeFixture} from './helpers/realtime-service.mjs';
import {RealtimeWorld} from '../realtime/world.js';
import {signTicket,verifyTicket} from '../realtime/auth.js';
import {realtimeRPC} from '../server/realtime.js';
const pose={x:0,y:.95,z:30,yaw:0,speed:0,mode:''};
test('far movement is sampled while nearby motion, stops and chat remain immediate',()=>{
 let now=10000;const world=new RealtimeWorld({now:()=>now}),socket=()=>({send(){},close(){},serializeAttachment(){}}),a=socket(),b=socket();
 world.accept(a,{id:'a',exp:100000,profile:{...pose,id:'a',region:'outdoors'}});world.accept(b,{id:'b',exp:100000,profile:{...pose,id:'b',x:100,speed:1,region:'outdoors'}});
 const snapshot=()=>world.wireSnapshot(a,world.clients.get(a)).people[0];assert.equal(snapshot().x,100);
 now+=100;world.rpc({action:'patch',id:'b',profile:{x:101,chat:'hello',chatAt:now,updatedAt:now}});let delta=snapshot();assert.equal(delta.x,undefined);assert.equal(delta.chat,'hello');
 now+=1000;assert.equal(snapshot().x,101);
 now+=100;world.rpc({action:'patch',id:'b',profile:{x:102,speed:0}});delta=snapshot();assert.equal(delta.x,102);assert.equal(delta.speed,0);
 now+=100;world.rpc({action:'patch',id:'b',profile:{x:5,speed:1}});assert.equal(snapshot().x,5);
 world.close(b);world.accept(socket(),{id:'b',exp:100000,profile:{...pose,id:'b',region:'outdoors'}});assert.equal(world.rpc({action:'metrics'}).reconnected,1);
});
function connect(url,ticket){return new Promise((resolve,reject)=>{const ws=new WebSocket(url,['winter-v1','auth.'+ticket],{origin:'http://127.0.0.1'});ws.once('error',reject);ws.once('close',()=>reject(Error('closed before welcome')));ws.once('message',raw=>resolve({ws,ready:JSON.parse(raw)}));});}
function send(ws,b){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('snapshot timeout')),4000);ws.once('message',raw=>{clearTimeout(timer);resolve(JSON.parse(raw));});ws.send(JSON.stringify(b));});}
test('real Cloudflare runtime: authenticated sockets, sequence validation, persistence-free motion, shared show and revoke',async t=>{
 const f=await realtimeFixture(t),a=f.guest(),b=f.guest();
 const health=await f.mf.dispatchFetch(new URL('/health',f.url));assert.equal(health.status,200);assert.equal((await health.json()).service,'winterlight-realtime');
 assert.equal((await f.mf.dispatchFetch(new URL('/connect',f.url),{headers:{Upgrade:'websocket',Origin:'https://untrusted.invalid'}})).status,403);
 assert.equal((await f.mf.dispatchFetch(new URL('/connect',f.url),{headers:{Upgrade:'websocket',Origin:'http://127.0.0.1','Sec-WebSocket-Protocol':'winter-v1,auth.forged'}})).status,401);const sa=await f.call(a,'join',{});await f.call(b,'join',{});
 const ta=await f.call(a,'realtime',{}),tb=await f.call(b,'realtime',{});assert.equal(ta.status,200,JSON.stringify(ta.data));
 const ca=await connect(ta.data.url,ta.data.ticket),cb=await connect(tb.data.url,tb.data.ticket);t.after(()=>{ca.ws.close();cb.ws.close();});assert.equal(cb.ready.count,2);
 const pushed=[ca,cb].map(({ws})=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('chat push timeout')),3000);ws.once('message',raw=>{clearTimeout(timer);resolve(JSON.parse(raw));});}));
 const chat=await f.call(a,'chat',{message:'즉시 전달'});assert.equal(chat.status,200);for(const event of await Promise.all(pushed)){assert.equal(event.type,'chat');assert.equal(event.message,'즉시 전달');assert.equal(event.at,chat.data.at);}
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

test('validated region relocation wins over newer old-region poses without accepting stale movement',()=>{
 let now=1000;const ws={messages:[],send(raw){this.messages.push(JSON.parse(raw));},close(){},serializeAttachment(){}};
 const world=new RealtimeWorld({now:()=>now});world.accept(ws,{id:'region-guest',exp:100000,profile:{...pose,id:'region-guest',region:'outdoors'}});
 now=1100;world.message(ws,JSON.stringify({type:'pose',seq:1,at:now,pose}));
 const arrival={x:590,y:.95,z:0,yaw:1.57,mode:'',speed:0,region:'museum',updatedAt:1050};
 world.rpc({action:'checkpoint',id:'region-guest',profile:arrival});assert.equal(world.clients.get(ws).profile.region,'outdoors','normal stale checkpoints remain ignored');
 now=1150;world.message(ws,JSON.stringify({type:'relocate',seq:2,at:now,pose:arrival}));assert.equal(ws.messages.at(-1).code,'type','clients cannot authorize relocations');
 now=1200;world.rpc({action:'relocate',id:'region-guest',profile:arrival});assert.equal(world.clients.get(ws).profile.region,'museum');
 now=1250;world.message(ws,JSON.stringify({type:'pose',seq:2,at:now,pose}));assert.equal(ws.messages.at(-1).code,'movement','late outdoor packet cannot undo admission');
 now=1300;world.message(ws,JSON.stringify({type:'pose',seq:3,at:now,pose:arrival}));assert.equal(ws.messages.at(-1).type,'snapshot');assert.equal(world.clients.get(ws).profile.x,590);
});

test('real transport keeps repeated HTTP room admission and immediate exit synchronized',async t=>{
 const {interiorDoors}=await import('../dist/district-layout.js'),f=await realtimeFixture(t),guest=f.guest(),join=await f.call(guest,'join',{}),door=interiorDoors.museum;
 await f.call(guest,'presence',{...pose,x:door.x,z:door.z});const ticket=await f.call(guest,'realtime',{}),socket=await connect(ticket.data.url,ticket.data.ticket);t.after(()=>socket.ws.close());
 for(let i=0;i<3;i++){
  const enter=await f.call(guest,'region',{region:'museum'});assert.equal(enter.status,200,JSON.stringify(enter.data));
  const profile=await realtimeRPC(f.env,{action:'profile',id:join.data.id});assert.equal(profile.profile.region,'museum');assert.equal(profile.profile.x,enter.data.position.x);
  const leave=await f.call(guest,'region',{region:'outdoors'});assert.equal(leave.status,200,JSON.stringify(leave.data));
  const outside=await realtimeRPC(f.env,{action:'profile',id:join.data.id});assert.equal(outside.profile.region,'outdoors');assert.equal(outside.profile.x,door.x);
 }
});

test('an accepted map arrival reaches the live world even while persistent pose writes are throttled',async t=>{
 const {resortDestinations}=await import('../dist/resort-layout.js'),{surfaceHeight}=await import('../dist/world-layout.js');
 const f=await realtimeFixture(t),guest=f.guest(),join=await f.call(guest,'join',{}),ticket=await f.call(guest,'realtime',{}),socket=await connect(ticket.data.url,ticket.data.ticket);t.after(()=>socket.ws.close());
 // Hold the persistence gate closed independently of the machine's test speed.
 await f.DB.prepare('UPDATE visitors SET pose_at=? WHERE id=?').bind(Date.now()+5000,join.data.id).run();
 const entrance=resortDestinations.find(p=>p.id==='ski'),arrival={...pose,x:entrance.x,z:entrance.z,y:surfaceHeight(entrance.x,entrance.z)+.95};
 const checkpoint=await f.call(guest,'presence',arrival);assert.equal(checkpoint.status,200);
 const profile=await realtimeRPC(f.env,{action:'profile',id:join.data.id});assert.equal(profile.profile.x,arrival.x);assert.equal(profile.profile.z,arrival.z);
 assert.equal((await f.call(guest,'ride',{kind:'lift'})).status,200);
 const invalid=await f.call(guest,'presence',{...arrival,x:999999});assert.equal(invalid.status,400);
});

test('committed chat pushes to sender and all region peers without waiting for their pose packets',()=>{
 const world=new RealtimeWorld({now:()=>10000}),sockets=[];
 for(let i=0;i<40;i++){const ws={messages:[],send(raw){this.messages.push(JSON.parse(raw));},close(){},serializeAttachment(){}};world.accept(ws,{id:String(i),exp:100000,profile:{...pose,id:String(i),name:'사람'+i,region:i===39?'museum':'outdoors'}});ws.messages=[];sockets.push(ws);}
 world.rpc({action:'chat',id:'0',profile:{name:'사람0',region:'outdoors',chat:'안녕하세요',chatAt:10000}});
 for(const ws of sockets.slice(0,39)){assert.equal(ws.messages.length,1);assert.deepEqual(ws.messages[0],{type:'chat',id:'0',name:'사람0',message:'안녕하세요',at:10000,serverTime:10000});}
 assert.equal(sockets[39].messages.length,0);assert.equal(world.clients.get(sockets[0]).profile.chat,'안녕하세요');
});

test('delayed chat respects the latest room and nickname without undoing relocation',()=>{
 const world=new RealtimeWorld({now:()=>10000}),sockets=[];
 for(const [id,region]of [['sender','outdoors'],['outside','outdoors'],['inside','museum']]){const ws={messages:[],send(raw){this.messages.push(JSON.parse(raw));},close(){},serializeAttachment(){}};world.accept(ws,{id,exp:100000,profile:{...pose,id,name:id,region}});ws.messages=[];sockets.push(ws);}
 world.rpc({action:'relocate',id:'sender',profile:{x:590,region:'museum',name:'새이름'}});
 world.rpc({action:'chat',id:'sender',profile:{region:'outdoors',name:'이전이름',chat:'도착했어요',chatAt:9500}});
 assert.equal(world.clients.get(sockets[0]).profile.region,'museum');assert.equal(world.clients.get(sockets[0]).profile.x,590);assert.equal(sockets[1].messages.length,0);assert.equal(sockets[2].messages.at(-1).name,'새이름');assert.equal(sockets[2].messages.at(-1).message,'도착했어요');
 world.rpc({action:'chat',id:'sender',profile:{region:'outdoors',name:'이전이름',chat:'낡은 요청',chatAt:9000}});assert.equal(sockets[2].messages.length,1);assert.equal(world.clients.get(sockets[0]).profile.chat,'도착했어요');
});
