import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';import {JSDOM} from 'jsdom';
const root=path.resolve('dist'),tick=()=>new Promise(r=>setTimeout(r,10)),token='a'.repeat(64);
async function fixture(t,{url='https://winter.test/',fetch}={}){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url,runScripts:'outside-only',pretendToBeVisual:true});t.after(()=>dom.window.close());const w=dom.window,d=w.document;w.matchMedia=()=>({matches:true});w.labPlayerState={x:0,y:.95,z:30,yaw:0};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.openWinterSettings=()=>{d.querySelector('#studio').open=true;};
 w.fetch=async(url,init={})=>{let reply=await fetch(url,init);if(url==='/api/join'&&!reply.status&&!reply.id)reply={id:'guest',name:'손님',room:'winter-plaza'};return{ok:(reply.status||200)<400,status:reply.status||200,json:async()=>reply.data||reply};};
 const modules=new Map(),context=dom.getInternalVMContext();
 function source(file){if(!modules.has(file))modules.set(file,new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file}));return modules.get(file);}
 async function mod(file){const m=source(file);if(m.status==='unlinked')await m.link((specifier,reference)=>source(path.resolve(path.dirname(reference.identifier),specifier)));return m;}
 await(await mod(path.join(root,'social.js'))).evaluate();await tick();return{w,d,mod};
}
test('public, old invite and old room URLs autojoin the same world without token or forced profile',async t=>{
 for(const suffix of ['', '#invite=bad','?room=legacy-private']){
 let joins=0;const {w,d}=await fixture(t,{url:'https://winter.test/'+suffix,fetch:async(url,init)=>{if(url==='/api/access')return{admin:false,session:null};if(url==='/api/join'){joins++;const b=JSON.parse(init.body);assert.equal(b.token,undefined);assert.ok(b.name);return{id:'guest',name:b.name,room:'winter-plaza'};}return{people:[],count:1};}});
 assert.equal(joins,1);assert.equal(w.labSocialJoined,true);assert.ok(!d.body.classList.contains('invite-gate'));assert.equal(d.querySelector('#join-form').hidden,true);assert.equal(d.querySelector('#profile-form').hidden,true);assert.equal(d.querySelector('#owner-signin').hidden,false);assert.equal(w.location.hash,'');assert.equal(w.location.search,'');
 }
});
test('admin path requires server owner identity and never joins an unauthenticated owner route',async t=>{
 let joins=0;const {w,d}=await fixture(t,{url:'https://winter.test/admin',fetch:async url=>{if(url==='/api/join')joins++;return{admin:false,signedIn:false,session:null};}});
 assert.equal(joins,0);assert.equal(w.labAdmin,false);assert.equal(d.querySelector('#owner-signin').hidden,false);assert.ok(d.querySelector('#owner-signin').href.endsWith('return_to=%2Fadmin'));assert.ok(d.body.classList.contains('invite-gate'));
});
test('public chat and explicit nickname editing preserve one session; owner leaving does not gate guests',async t=>{
 let joins=0,name='눈꽃';const {w,d}=await fixture(t,{fetch:async(url,init)=>{const b=init.body?JSON.parse(init.body):{};if(url==='/api/access')return{admin:false,session:{id:'guest',name,room:'winter-plaza'}};if(url==='/api/join'){joins++;return{id:'guest',name,room:'winter-plaza'};}if(url==='/api/name'){name=b.name;return{name};}if(url==='/api/chat')return{name,message:b.message,at:Date.now()};return{people:[],count:1};}});
 assert.equal(joins,1);assert.equal(w.labSocialJoined,true);d.querySelector('#profile-name').value='모루';d.querySelector('#profile-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(d.querySelector('#self-name').textContent,'모루');assert.equal(d.querySelector('#profile-form').hidden,true);
 d.querySelector('#chat-toggle').click();assert.equal(d.querySelector('#chat-form').hidden,false);assert.equal(d.activeElement,d.querySelector('#chat-input'));assert.ok(d.body.classList.contains('chat-typing'));d.querySelector('#chat-input').value='함께 겨울';d.querySelector('#chat-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.match(d.querySelector('#chat-log').textContent,/함께 겨울/);assert.equal(d.body.classList.contains('chat-typing'),false);assert.equal(w.labSocialJoined,true);
});
test('failed public bootstrap exposes retry and a blocked session never silently rejoins',async t=>{
 let deny=false;const {w,d}=await fixture(t,{fetch:async url=>{if(url==='/api/access')return{admin:false};if(url==='/api/join')return{id:'guest',name:'눈꽃',room:'winter-plaza'};return deny?{status:403,data:{error:'이용 제한'}}:{people:[],count:1};}});
 deny=true;d.dispatchEvent(new w.Event('visibilitychange'));await tick();assert.equal(w.labSocialJoined,false);assert.ok(d.body.classList.contains('invite-gate'));assert.equal(d.querySelector('#join-form').hidden,true);
});

test('personal chat hiding does not remove the other player from the world',async t=>{
 const {w,d}=await fixture(t,{fetch:async url=>url==='/api/access'?{admin:false}:url==='/api/join'?{id:'guest',name:'눈꽃',room:'winter-plaza'}:{people:[],count:1}});
 w.dispatchEvent(new w.CustomEvent('lab:visitors',{detail:[{id:'peer',name:'모루',chat:'안녕',chatAt:Date.now()}]}));d.querySelector('#chat-toggle').click();assert.equal(d.querySelectorAll('.chat-hide').length,1);d.querySelector('.chat-hide').click();assert.equal(d.querySelector('#chat-log').textContent,'');assert.equal(w.isVisitorBlocked('peer'),false);assert.equal(w.isChatHidden('peer'),true);
});

async function eventually(check){for(let i=0;i<100;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,5));}assert.ok(check(),'expected asynchronous recovery');}

test('leaving a ride drains the seated pose before deleting the seat and resumes standing updates',async t=>{
 let finishPose,releases=0;const modes=[],reservation={kind:'ferris',cabin:0,seat:0,startedAt:Date.now()};
 const {w,d}=await fixture(t,{fetch:async(url,init)=>{
  if(url==='/api/access')return{admin:false};
  if(url==='/api/ride'&&init.method==='DELETE'){releases++;return{ok:true};}
  if(url==='/api/presence'){
   const mode=JSON.parse(init.body).mode||'';modes.push(mode);
   if(mode==='ferris')return new Promise(resolve=>{finishPose=resolve;});
  }
  return{people:[],count:1,rideSeats:[],serverTime:Date.now()};
 }});
 w.labRideReservation=reservation;w.labPlayerState={x:0,y:20,z:0,yaw:0,mode:'ferris'};
 d.dispatchEvent(new w.Event('visibilitychange'));await eventually(()=>finishPose);
 const release=w.releaseRide();w.labPlayerState={x:0,y:.95,z:30,yaw:0,mode:''};
 d.dispatchEvent(new w.Event('visibilitychange'));await tick();assert.equal(releases,0,'in-flight seated pose must retain its reservation');
 assert.equal(w.releaseRide(),release,'repeated exit shares one release');
 finishPose({people:[],count:1,rideSeats:[{...reservation,id:'guest'}],serverTime:Date.now()});
 await release;assert.equal(releases,1);d.dispatchEvent(new w.Event('visibilitychange'));await eventually(()=>modes.at(-1)==='');
 assert.equal(w.labRideReservation,null);assert.equal(w.labSocialJoined,true);
});

test('a dining lease expired during mobile sleep wakes once and resumes presence while a panel pauses rendering',async t=>{
 let expired=false,releases=0,expirationEvents=0;const modes=[],reservation={kind:'dining',cabin:0,seat:1,startedAt:Date.now()-25000};
 const {w,d,mod}=await fixture(t,{fetch:async(url,init)=>{
  if(url==='/api/access')return{admin:false,session:{id:'guest',room:'winter-plaza',name:'손님'}};
  if(url==='/api/ride'){if(init.method==='DELETE'){releases++;return{ok:true};}assert.equal(JSON.parse(init.body).seat,undefined);return{reservation,serverTime:Date.now()};}
  if(url==='/api/presence'){
   const mode=JSON.parse(init.body).mode||'';modes.push(mode);
   if(expired&&mode==='dining')return{status:409,data:{code:'RIDE_RESERVATION_EXPIRED',error:'좌석이 만료됐어요.'}};
   return{people:[],count:1,rideSeats:expired?[]:[{...reservation,id:'guest'}],serverTime:Date.now()};
  }
  return{};
 }});
 const module=await mod(path.join(root,'winter-experience.js'));await module.evaluate();
 const experience=module.namespace.createWinterExperience({rides:{},destinations:[],rideChair:{visible:false}},{equip(){}},()=>{});
 w.labPlayerState={x:412,y:.95,z:3.7,yaw:Math.PI};experience.show('interior-dining');d.querySelector('#place-actions button').click();
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
