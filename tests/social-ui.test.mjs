import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';import {JSDOM} from 'jsdom';
const root=path.resolve('dist'),tick=()=>new Promise(r=>setTimeout(r,10)),token='a'.repeat(64);
async function fixture(t,{url='https://winter.test/',fetch}={}){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url,runScripts:'outside-only',pretendToBeVisual:true});t.after(()=>dom.window.close());const w=dom.window,d=w.document;w.matchMedia=()=>({matches:true});w.labPlayerState={x:0,y:.95,z:30,yaw:0};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.openWinterSettings=()=>{d.querySelector('#studio').open=true;};
 w.fetch=async(url,init={})=>{const reply=await fetch(url,init);return{ok:(reply.status||200)<400,status:reply.status||200,json:async()=>reply.data||reply};};
 const modules=new Map(),context=dom.getInternalVMContext();
 function source(file){if(!modules.has(file))modules.set(file,new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file}));return modules.get(file);}
 async function mod(file){const m=source(file);if(m.status==='unlinked')await m.link((specifier,reference)=>source(path.resolve(path.dirname(reference.identifier),specifier)));return m;}
 await(await mod(path.join(root,'social.js'))).evaluate();await tick();return{w,d,mod};
}
test('missing or invalid invite stays gated, hides owner sign-in and never autojoins',async t=>{
 for(const suffix of ['', '#invite=bad','?room=legacy-private']){
 let joins=0;const {w,d}=await fixture(t,{url:'https://winter.test/'+suffix,fetch:async url=>{if(url==='/api/join')joins++;return{admin:false,session:null};}});
 assert.equal(joins,0);assert.ok(d.body.classList.contains('invite-gate'));assert.equal(d.querySelector('#join-form').hidden,true);assert.equal(d.querySelector('#owner-signin').hidden,true);assert.equal(w.location.hash,'');assert.equal(w.location.search,'');assert.equal(d.querySelector('#room-password'),null);
 }
});
test('invitation is checked once, saved/default appearance enters automatically and token disappears from subsequent gameplay',async t=>{
 let joins=0,leaves=0;const calls=[];const {w,d}=await fixture(t,{url:'https://winter.test/#invite='+token,fetch:async(url,init)=>{const body=init.body?JSON.parse(init.body):null;calls.push({url,body});if(url==='/api/access')return{admin:false,session:null};if(url==='/api/invite-check')return{valid:true};if(url==='/api/join'){joins++;assert.equal(body.token,token);assert.equal(body.color,'#f4eee5');return{id:'guest',name:body.name,room:'winter-plaza'};}if(url==='/api/presence')return{people:[],count:1};if(url==='/api/chat')return{name:'손님',message:body.message,at:Date.now()};if(url==='/api/leave')leaves++;return{};}});
 assert.equal(w.location.hash,'');await tick();assert.equal(joins,1);assert.ok(!d.body.classList.contains('invite-gate'));assert.equal(w.sharedRoom(),'winter-plaza');
 d.querySelector('#chat-toggle').click();const input=d.querySelector('#chat-input');input.value='함께 겨울';input.blur();assert.ok(d.body.classList.contains('chat-typing'));d.querySelector('#chat-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(input.value,'');assert.match(d.querySelector('#chat-log').textContent,/함께 겨울/);
 assert.ok(calls.filter(c=>['/api/chat','/api/presence'].includes(c.url)).every(c=>!('token'in c.body)));w.dispatchEvent(new w.Event('pagehide'));assert.equal(leaves,0);
});
test('owner creates a same-world invitation without switching rooms and can revoke it',async t=>{
 let joins=0,revoked=false;const {w,d}=await fixture(t,{fetch:async(url,init)=>{if(url==='/api/access')return{admin:true,session:{id:'owner',room:'winter-plaza',name:'관리자'}};if(url==='/api/join')joins++;if(url==='/api/invite'){if(init.method==='POST')return{id:'link',url:'https://moru-winter-park.vercel.app/#invite='+token};if(init.method==='DELETE'){revoked=true;return{ok:true};}return{invites:revoked?[]:[{id:'link',createdAt:Date.now(),expiresAt:Date.now()+86400000}]};}return{people:[],count:1};}});
 d.querySelector('#invite-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(joins,0);assert.equal(w.labGuestId,'owner');assert.equal(w.sharedRoom(),'winter-plaza');assert.equal(d.querySelector('#invite-created-url').value,'https://moru-winter-park.vercel.app/#invite='+token);d.querySelector('#invite-list button').click();await tick();assert.ok(revoked);assert.equal(d.querySelector('#room-share').hidden,true);
});
test('session-only reconnect needs no token; revoked presence gates the world and cannot auto-rejoin',async t=>{
 let joins=0;const {w,d}=await fixture(t,{fetch:async url=>{if(url==='/api/access')return{admin:false,session:{id:'guest',room:'winter-plaza',name:'손님'}};if(url==='/api/presence')return{status:401,data:{error:'초대가 취소되었습니다.'}};if(url==='/api/join')joins++;return{};}});
 assert.equal(w.labSocialJoined,true);d.dispatchEvent(new w.Event('visibilitychange'));await tick();assert.equal(w.labSocialJoined,false);assert.ok(d.body.classList.contains('invite-gate'));assert.equal(joins,0);
});
test('opening an invitation in the same tab rechecks its fragment and automatically joins',async t=>{
 let checked=0,joins=0;const {w,d}=await fixture(t,{fetch:async(url,init)=>{if(url==='/api/access')return{admin:false,session:null};if(url==='/api/invite-check'){checked++;assert.equal(JSON.parse(init.body).token,token);return{valid:true};}if(url==='/api/join'){joins++;return{id:'guest',name:'손님',room:'winter-plaza'};}return{people:[],count:1};}});
 assert.equal(d.querySelector('#join-form').hidden,true);w.location.hash='invite='+token;await tick();await tick();
 assert.equal(checked,1);assert.equal(joins,1);assert.equal(w.location.hash,'');assert.equal(d.querySelector('#join-form').hidden,true);assert.equal(d.querySelector('#tab-social').hidden,true);
});

async function eventually(check){for(let i=0;i<100;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,5));}assert.ok(check(),'expected asynchronous recovery');}

test('a dining lease expired during mobile sleep wakes once and resumes presence while a panel pauses rendering',async t=>{
 let expired=false,releases=0,expirationEvents=0;const modes=[],reservation={kind:'dining',cabin:0,seat:1,startedAt:Date.now()-25000};
 const {w,d,mod}=await fixture(t,{fetch:async(url,init)=>{
  if(url==='/api/access')return{admin:false,session:{id:'guest',room:'winter-plaza',name:'손님'}};
  if(url==='/api/ride'){if(init.method==='DELETE'){releases++;return{ok:true};}assert.equal(JSON.parse(init.body).seat,1);return{reservation,serverTime:Date.now()};}
  if(url==='/api/presence'){
   const mode=JSON.parse(init.body).mode||'';modes.push(mode);
   if(expired&&mode==='dining')return{status:409,data:{code:'RIDE_RESERVATION_EXPIRED',error:'좌석이 만료됐어요.'}};
   return{people:[],count:1,rideSeats:expired?[]:[{...reservation,id:'guest'}],serverTime:Date.now()};
  }
  return{};
 }});
 const module=await mod(path.join(root,'winter-experience.js'));await module.evaluate();
 const experience=module.namespace.createWinterExperience({rides:{},destinations:[],rideChair:{visible:false}},{equip(){}},()=>{});
 w.labPlayerState={x:412,y:.95,z:3.7,yaw:Math.PI};experience.show('interior-dining');d.querySelector('#place-actions button[data-seat="1"]').click();
 await eventually(()=>experience.active&&w.labRideReservation);
 w.labPlayerState=experience.update(0,{x:0,z:0});assert.equal(w.labPlayerState.mode,'dining');
 // No render frames run while this panel owns input. The production wake event
 // still fires and the social fallback must not keep sending the seated mode.
 d.body.classList.add('studio-open');w.addEventListener('lab:ride-expired',()=>expirationEvents++);
 expired=true;d.dispatchEvent(new w.Event('visibilitychange'));
 await eventually(()=>expirationEvents===1&&modes.at(-1)===''&&modes.includes('dining'));
 assert.equal(experience.active,false);assert.equal(w.labRideReservation,null);assert.equal(w.labPlayerState.mode,'');assert.equal(releases,1);
 assert.equal(w.labSocialJoined,true);assert.equal(d.body.classList.contains('invite-gate'),false);
 assert.equal(d.querySelector('#social-status').textContent,'접속 중 · 1명');
 d.dispatchEvent(new w.Event('visibilitychange'));await tick();assert.equal(expirationEvents,1);assert.equal(releases,1);
});

test('a delayed dining-expiry response cannot clear a newer reservation or a different guest session',async t=>{
 for(const changed of ['reservation','guest']){
  let finish,releases=0,expirations=0;const {w,d}=await fixture(t,{fetch:async(url,init)=>{
   if(url==='/api/access')return{admin:false,session:{id:'guest',room:'winter-plaza',name:'손님'}};
   if(url==='/api/ride'&&init.method==='DELETE'){releases++;return{};}
   if(url==='/api/presence'&&JSON.parse(init.body).mode==='dining')return new Promise(resolve=>{finish=resolve;});
   return{people:[],count:1};
  }});
  const old={kind:'dining',cabin:0,seat:1,startedAt:Date.now()-25000};w.labRideReservation=old;w.labPlayerState={x:412,y:1.57,z:2.1,yaw:Math.PI,mode:'dining'};
  w.addEventListener('lab:ride-expired',()=>expirations++);d.dispatchEvent(new w.Event('visibilitychange'));await eventually(()=>finish);
  const latest=changed==='reservation'?{...old,startedAt:Date.now()}:old;
  w.labRideReservation=latest;if(changed==='guest')w.labGuestId='new-guest';
  finish({status:409,data:{code:'RIDE_RESERVATION_EXPIRED',error:'오래된 응답'}});await tick();
  assert.equal(w.labRideReservation,latest);assert.equal(w.labPlayerState.mode,'dining');assert.equal(expirations,0);assert.equal(releases,0);assert.equal(w.labSocialJoined,true);
 }
});

test('an invalid dining pose is not mistaken for expired admission or an expired chair',async t=>{
 let releases=0,expired=0;const {w,d}=await fixture(t,{fetch:async(url,init)=>{
  if(url==='/api/access')return{admin:false,session:{id:'guest',room:'winter-plaza',name:'손님'}};
  if(url==='/api/ride'&&init.method==='DELETE')releases++;
  if(url==='/api/presence')return{status:409,data:{code:'RIDE_POSE_INVALID',error:'좌석 위치를 확인해 주세요.'}};
  return{};
 }});
 const reservation={kind:'dining',cabin:0,seat:0,startedAt:Date.now()};w.labRideReservation=reservation;w.labPlayerState={x:414,y:1.57,z:2.1,yaw:Math.PI,mode:'dining'};
 w.addEventListener('lab:ride-expired',()=>expired++);d.dispatchEvent(new w.Event('visibilitychange'));await tick();
 assert.equal(w.labRideReservation,reservation);assert.equal(expired,0);assert.equal(releases,0);assert.equal(w.labSocialJoined,true);assert.equal(d.body.classList.contains('invite-gate'),false);
});
