import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {createWinterExperience} from '../dist/winter-experience.js';
import {resortRides,resortDestinations,skiStarts,skiRunCenter,alpineShift,liftLayout} from '../dist/resort-layout.js';
import {walkToStart} from './ski-driver.mjs';
import * as T from '../dist/vendor/three.module.js';
import {ferrisDimensions} from '../dist/ferris-layout.js';
import {benches,benchInteractions} from '../dist/bench-layout.js';
import {treeLayout} from '../dist/tree-layout.js';
import {sharedSeatChoices,pickSharedSeat} from '../dist/ride-seats.js';
function setup(t){const dom=new JSDOM(fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),{url:'https://winter.test'}),w=dom.window;t.after(()=>w.close());Object.assign(globalThis,{window:w,document:w.document,Event:w.Event,CustomEvent:w.CustomEvent,localStorage:w.localStorage});let trips=0;const winter={rides:resortRides,destinations:resortDestinations,rideChair:{visible:false,position:{set(){}},rotation:{set(){}}}},companion={gear:'ski',winterReady:true,equip(){}};return{e:createWinterExperience(winter,companion,()=>trips++),get trips(){return trips;},click(){document.querySelector('#place-actions button').click();}};}
test('tree decoration is available around the entire plaza, with its prompt near the visitor',t=>{
 setup(t);let opened=0;window.addEventListener('lab:tree-open',()=>opened++);
 const winter={rides:resortRides,destinations:[{id:'tree',name:'소원 트리',...treeLayout.arrival}],rideChair:{visible:false}},e=createWinterExperience(winter,{equip(){}},()=>{});
 for(let i=0;i<12;i++){const angle=i*Math.PI/6,x=treeLayout.x+Math.cos(angle)*20,z=treeLayout.z+Math.sin(angle)*20;e.proximity(x,z);assert.equal(document.querySelector('#place-card').hidden,false);const nearBench=benchInteractions.some(b=>!b.room&&Math.hypot(b.x-x,b.z-z)<b.r);assert.equal(document.querySelector('#place-actions button').getAttribute('aria-label'),nearBench?'왼쪽 자리 앉기':'트리 꾸미기');assert.ok(Math.hypot(e.anchor.x-x,e.anchor.z-z)<3);if(!nearBench)document.querySelector('#place-actions button').click();}
 assert.ok(opened>0&&opened<=12);e.proximity(treeLayout.x+40,treeLayout.z);assert.equal(document.querySelector('#place-card').hidden,true);
});
test('marshmallow stays in hand, toasts at the fire, survives walking and can be eaten',t=>{
 const {e,click}=setup(t);e.rides.start('lift');e.update(45);e.proximity(-68,-160+alpineShift);click();assert.equal(e.heldItem,'marshmallow');e.update(.1,{x:1});assert.equal(e.heldItem,'marshmallow');assert.equal(e.roast,0);
 e.proximity(-39,-151+alpineShift);click();e.update(2,{});assert.equal(e.gesture,'roast');assert.ok(e.roast>.3);e.update(.1,{x:1});assert.equal(e.gesture,'');const saved=e.roast;assert.equal(e.heldItem,'marshmallow');
 e.proximity(-3,-340+alpineShift);e.proximity(-39,-151+alpineShift);click();e.update(4,{});assert.ok(e.roast>saved);assert.equal(e.roast,1);assert.equal(e.gesture,'');e.proximity(-3,-340+alpineShift);e.proximity(-39,-151+alpineShift);assert.match(document.querySelector('#place-actions button').textContent,/먹기/);click();assert.equal(e.gesture,'eat');e.update(3,{});assert.equal(e.heldItem,'');
 e.proximity(-53,-163+alpineShift);click();assert.equal(e.heldItem,'odeng');assert.equal(e.gesture,'');e.useHeldItem();assert.equal(e.gesture,'eat');e.update(3,{});assert.equal(e.heldItem,'');
});
test('physical gates show one contextual action and stopping skis never teleports down',t=>{
 const app=setup(t),{e}=app;e.rides.start('lift');e.update(45);for(const gate of skiStarts){e.proximity(gate.x,gate.z);assert.equal(document.querySelector('#place-name').textContent,gate.name);assert.equal(document.querySelectorAll('#place-actions button').length,1);}
 const before=walkToStart(e.rides,'advanced');e.proximity(before.x,before.z);app.click();const waiting=e.update(2,{});assert.equal(waiting.runId,'advanced');assert.equal(waiting.x,before.x);assert.equal(waiting.z,before.z);assert.equal(waiting.speed,0);document.querySelector('#stop-ride').click();assert.equal(app.trips,0);assert.equal(e.rides.mode,'');
});
test('resting has no countdown and movement stands up',t=>{
 const {e}=setup(t);e.show('interior-tea');document.querySelector('#place-actions button').click();e.update(30,{});assert.equal(document.querySelector('#ride-label').textContent,'');assert.equal(document.querySelector('#stop-ride').textContent,'일어나기');assert.equal(e.update(.05,{x:1}),null);assert.equal(e.active,false);
});

test('portable items replace each other, bubbles keep blowing while walking, and map travel retains them',t=>{
 const {e}=setup(t);const click=(name)=>[...document.querySelectorAll('#place-actions button')].find(b=>b.getAttribute('aria-label')===name).click();e.show('bubbles');click('비눗방울');assert.equal(e.heldItem,'bubble-wand');e.update(.1,{x:1});assert.equal(e.gesture,'');window.dispatchEvent(new window.KeyboardEvent('keydown',{code:'KeyE'}));e.update(.1,{x:1});assert.equal(e.gesture,'bubble');assert.equal(e.focusGesture,'');window.dispatchEvent(new window.KeyboardEvent('keyup',{code:'KeyE'}));assert.equal(e.gesture,'');e.cancel();assert.equal(e.heldItem,'bubble-wand');e.show('bubbles');click('풍선 받기');assert.equal(e.heldItem,'balloon');assert.equal(e.gesture,'');e.show('coffee');click('커피');assert.equal(e.heldItem,'coffee');e.proximity(0,30);assert.equal(document.querySelector('#place-card').hidden,true);assert.equal(e.useHeldItem(),true);assert.equal(e.gesture,'drink');e.update(3,{});assert.equal(e.heldItem,'coffee');e.show('icecream');click('아이스크림');assert.equal(e.heldItem,'icecream');
});

test('expired shared lift seats return the rider safely and release their reservation',async t=>{
 const app=setup(t);let releases=0;window.reserveRide=async()=>({kind:'lift',cabin:1,seat:0,startedAt:Date.now()});window.releaseRide=()=>releases++;
 app.e.show('ski');app.click();await new Promise(r=>setTimeout(r,0));assert.equal(app.e.rides.mode,'lift');
 window.dispatchEvent(new CustomEvent('lab:ride-expired',{detail:'lift'}));assert.equal(app.e.active,false);assert.equal(app.trips,1);assert.equal(releases,1);
 window.dispatchEvent(new CustomEvent('lab:ride-expired',{detail:'lift'}));assert.equal(app.trips,1);
});

test('popcorn is picked up at its existing counter, carried while moving and replaced by another item',t=>{
 const {e,click}=setup(t);e.proximity(-32,18.5);assert.equal(document.querySelector('#place-actions button').getAttribute('aria-label'),'팝콘');click();assert.equal(e.heldItem,'popcorn');e.update(.1,{x:1});assert.equal(e.heldItem,'popcorn');e.cancel();assert.equal(e.heldItem,'popcorn');assert.equal(e.useHeldItem(),true);assert.equal(e.gesture,'eat');e.update(.1,{x:1});assert.equal(e.heldItem,'popcorn');assert.equal(e.gesture,'');e.show('coffee');click();assert.equal(e.heldItem,'coffee');
 e.show('popcorn');click();e.useHeldItem();e.update(3,{});assert.equal(e.heldItem,'');assert.equal(e.gesture,'');assert.equal(document.querySelector('#ride-hud').hidden,true);
});

test('bubble hold survives walking and releases on E up, touch cancel, blur, panels and item replacement',t=>{
 const {e}=setup(t);e.show('bubbles');[...document.querySelectorAll('#place-actions button')].find(b=>b.getAttribute('aria-label')==='비눗방울').click();assert.equal(e.gesture,'');
 const down=()=>window.dispatchEvent(new window.KeyboardEvent('keydown',{code:'KeyE'}));down();e.update(9,{x:1,z:1});assert.equal(e.gesture,'bubble');assert.equal(e.active,false);assert.equal(e.focusGesture,'');
 window.dispatchEvent(new window.KeyboardEvent('keyup',{code:'KeyE'}));assert.equal(e.gesture,'');
 const control=document.querySelector('#bubble-hold');control.onpointerdown({preventDefault(){},stopPropagation(){},pointerId:3});assert.equal(e.gesture,'bubble');control.dispatchEvent(new Event('pointercancel'));assert.equal(e.gesture,'');
 for(const event of ['blur','lab:pause']){down();assert.equal(e.gesture,'bubble');window.dispatchEvent(new Event(event));assert.equal(e.gesture,'');}
 down();e.show('coffee');document.querySelector('#place-actions button').click();assert.equal(e.gesture,'');assert.equal(e.heldItem,'coffee');assert.equal(control.hidden,true);
});

test('leaving during an outstanding boarding request never reboards the player',async t=>{
 const app=setup(t);let resolveClaim,releases=0;window.reserveRide=()=>new Promise(resolve=>resolveClaim=resolve);window.releaseRide=()=>releases++;
 app.e.show('ski');app.click();app.e.cancel();resolveClaim({kind:'lift',cabin:1,seat:0,startedAt:Date.now()});await new Promise(r=>setTimeout(r,0));
 assert.equal(app.e.active,false);assert.equal(releases,1);assert.equal(app.trips,0);
});

test('the facing Ferris pair shares a camera focus between the seats',async t=>{
 setup(t);window.innerWidth=390;const claim={kind:'ferris',cabin:2,seat:1,startedAt:Date.now()};window.reserveRide=async()=>claim;
 const winter={rides:resortRides,destinations:[{id:'ferris',name:'관람차',...ferrisDimensions.entrance}],rideChair:{visible:false}},pet={equip(){}};
 const e=createWinterExperience(winter,pet,()=>{});e.show('ferris');document.querySelector('#place-actions button').click();await new Promise(r=>setTimeout(r,0));
 const pose=e.update(0,{}),offset=ferrisDimensions.seatDepth*ferrisDimensions.scale;assert.ok(Math.abs(pose.view.focus.x-(pose.x-Math.sin(ferrisDimensions.yaw)*offset))<1e-9);assert.ok(Math.abs(pose.view.focus.z-(pose.z-Math.cos(ferrisDimensions.yaw)*offset))<1e-9);
 const aim=new T.Vector3(pose.view.focus.x,pose.y+.65,pose.view.focus.z),v=pose.view,camera=new T.PerspectiveCamera(v.fov,390/844,.1,100);camera.position.set(aim.x+Math.sin(v.yaw)*Math.cos(v.pitch)*v.distance,aim.y+Math.sin(v.pitch)*v.distance,aim.z+Math.cos(v.yaw)*Math.cos(v.pitch)*v.distance);camera.lookAt(aim);camera.updateMatrixWorld();
 for(const side of [-1,1]){const anchor=aim.clone();anchor.x+=Math.sin(ferrisDimensions.yaw)*offset*side;anchor.z+=Math.cos(ferrisDimensions.yaw)*offset*side;anchor.y=pose.y;for(const dx of [-.9,.9])for(const dz of [-.9,.9])for(const dy of [-.65,.95]){const screen=anchor.clone().add(new T.Vector3(dx,dy,dz)).project(camera);assert.ok(Math.abs(screen.x)<.96&&Math.abs(screen.y)<.96);}}
});

test('ski completion zeros motion, returns gear and leaves no repeat-ride UI',t=>{
 const {e,click}=setup(t);let returns=0;window.addEventListener('lab:return-winter',()=>returns++);
 e.show('ski');click();e.update(45);const gate=walkToStart(e.rides,'main');e.proximity(gate.x,gate.z);click();let p=e.update(0,{});
 for(let i=0;i<10000&&!p.finished;i++){const desired=Math.atan2(skiRunCenter(p.z+6,'main')-p.x,6),delta=Math.atan2(Math.sin(p.heading-desired),Math.cos(p.heading-desired));p=e.update(.025,{push:true,steer:Math.max(-1,Math.min(1,delta*2.5))});}
 assert.ok(p.finished);assert.equal(p.speed,0);assert.equal(p.mode,'');assert.equal(e.active,false);assert.equal(returns,1);assert.equal(e.lifecycle.state,'Idle');
 for(const selector of ['#place-card','#ride-hud','#ski-controls'])assert.equal(document.querySelector(selector).hidden,true);
 assert.equal(document.querySelector('#ride-label').textContent,'');e.proximity(p.x,p.z);assert.equal(document.querySelector('#place-card').hidden,true);
 e.proximity(liftLayout.x,-185+alpineShift);assert.equal(document.querySelector('#place-card').hidden,false);click();assert.equal(e.rides.mode,'lift');
});
test('dismissed facility prompts stay hidden until leaving, including after seated actions',async t=>{
 const {e,click}=setup(t);window.reserveRide=async(kind,id)=>({kind,cabin:benches.find(b=>b.id===id).cabin,seat:0,startedAt:Date.now()});e.proximity(392,9);click();await Promise.resolve();assert.equal(e.active,true);e.update(.1,{x:1});e.proximity(392,9);assert.equal(document.querySelector('#place-card').hidden,true);e.proximity(400,12);e.proximity(392,9);assert.equal(document.querySelector('#place-card').hidden,false);
 document.querySelector('#close-place').click();e.proximity(392,9);assert.equal(document.querySelector('#place-card').hidden,true);
});

test('walking up to a fire faces it without creating a ride and movement releases facing',t=>{
 const {e,click}=setup(t);e.proximity(-39,-151+alpineShift);click();assert.equal(e.update(.1,{}),null);assert.equal(e.focusGesture,'warm');assert.equal(e.facing,Math.PI);assert.equal(e.rides.mode,'');e.update(.1,{x:1});assert.equal(e.facing,null);assert.equal(e.focusGesture,'');
});


test('sparkler comes from the existing kiosk, stays carried while walking and is replaced by a drink',t=>{
 const {e,click}=setup(t);e.show('sparkler');click();assert.equal(e.heldItem,'sparkler');e.update(.1,{x:1,z:1});assert.equal(e.heldItem,'sparkler');assert.equal(e.active,false);assert.equal(document.querySelector('#place-card').hidden,true);e.show('coffee');click();assert.equal(e.heldItem,'coffee');
});

test('tree benches offer exact left and right seats without decoration actions',t=>{
 const {e}=setup(t);for(const b of benchInteractions.filter(b=>b.id.startsWith('tree-bench-'))){e.proximity(b.x,b.z);const actions=[...document.querySelectorAll('#place-actions button')];assert.equal(actions.length,2);assert.equal(actions[0].getAttribute('aria-label'),'왼쪽 자리 앉기');assert.equal(actions[1].getAttribute('aria-label'),'오른쪽 자리 앉기');assert.deepEqual(actions.map(button=>button.dataset.seat),['0','1']);}
});

test('dining choice uses the clicked physical seat, marks occupied places and never reserves from disabled keys',async t=>{
 const {e}=setup(t),calls=[];window.labGuestId='self';window.labRideSeats=[{id:'other',kind:'dining',cabin:0,seat:1}];
 window.reserveRide=async(kind,benchId,seat)=>{calls.push({kind,benchId,seat});return{kind,cabin:0,seat,startedAt:Date.now()};};
 e.show('interior-dining');const occupied=document.querySelector('#place-actions [data-seat="1"]');assert.equal(occupied.disabled,true);assert.match(occupied.textContent,/이용 중/);
 window.dispatchEvent(new window.KeyboardEvent('keydown',{code:'KeyF'}));assert.equal(calls.length,0);
 document.querySelector('#place-actions [data-seat="2"]').click();await new Promise(resolve=>setTimeout(resolve,0));
 assert.deepEqual(calls,[{kind:'dining',benchId:undefined,seat:2}]);assert.equal(e.active,true);const pose=e.update(0,{});assert.equal(pose.x,414);assert.equal(pose.z,2.1);
});

test('a raced seat reports another-place selection and never silently sits elsewhere',async t=>{
 const {e}=setup(t),calls=[];window.labGuestId='self';window.labRideSeats=[];
 window.reserveRide=async(kind,benchId,seat)=>{calls.push(seat);if(seat===0){const error=Error('선택한 자리에 다른 손님이 앉아 있어요. 다른 자리를 선택해 주세요.');error.code='seat_occupied';throw error;}return{kind,cabin:0,seat,startedAt:Date.now()};};
 e.show('interior-dining');document.querySelector('#place-actions [data-seat="0"]').click();await new Promise(resolve=>setTimeout(resolve,0));
 assert.deepEqual(calls,[0]);assert.equal(e.active,false);assert.equal(document.querySelector('#place-card').hidden,false);assert.match(document.querySelector('#place-description').textContent,/다른 자리/);assert.equal(document.querySelector('#place-actions [data-seat="0"]').disabled,true);
 document.querySelector('#place-actions [data-seat="2"]').click();await new Promise(resolve=>setTimeout(resolve,0));assert.deepEqual(calls,[0,2]);assert.equal(e.update(0,{}).x,414);
});

test('seat hit planes distinguish chairs and reject other rooms, distant visitors and parallel rays',()=>{
 for(const choices of [sharedSeatChoices('dining'),sharedSeatChoices('bench','ryokan-tea-bench'),sharedSeatChoices('bench','park-bench-0')])for(const seat of choices){
  const ray={origin:{x:seat.x,y:12,z:seat.z},direction:{x:0,y:-1,z:0}},hit=pickSharedSeat(ray,seat.access,seat.region);assert.equal(hit?.seat,seat.seat);assert.equal(hit?.placeId,seat.placeId);
  assert.equal(pickSharedSeat(ray,{x:1000,z:1000},seat.region),null);assert.equal(pickSharedSeat(ray,seat.access,'nonexistent-room'),null);
 }
 assert.equal(pickSharedSeat({origin:{x:412,y:1,z:3},direction:{x:1,y:0,z:0}},{x:412,z:3},'ryokan'),null);
});

test('leaving while a selected chair is pending never places the guest in that chair',async t=>{
 const {e}=setup(t);let resolveClaim,releases=0;window.reserveRide=()=>new Promise(resolve=>resolveClaim=resolve);window.releaseRide=()=>releases++;
 const selection=e.selectSeat('interior-dining',2);e.cancel();resolveClaim({kind:'dining',cabin:0,seat:2,startedAt:Date.now()});assert.equal(await selection,false);assert.equal(e.active,false);assert.equal(releases,1);
});
