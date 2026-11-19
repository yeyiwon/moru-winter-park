import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createLocalDatabase} from '../scripts/local-database.mjs';
import {seedInvitation} from './helpers/world-invitation.mjs';
import {handleAPI} from '../server/api.js';
import {rideAPI,listRideSeats} from '../server/ride-api.js';
import {sharedSeatPose} from '../dist/ride-seats.js';
import * as T from '../dist/vendor/three.module.js';
import {materials} from '../dist/architecture-kit.js';
import {buildRyokanChef} from '../dist/ryokan-chef.js';
import {interiorDoors} from '../dist/district-layout.js';
import {interiorPositionValid} from '../dist/interior-layout.js';
import {publicRoom} from '../dist/space-links.js';
import {diningEntrance,diningSeats,diningServiceSlot,diningTasteEnd,diningSeatPose,diningPoseValid,diningServiceState,activeDiningService,smoothService} from '../dist/ryokan-service.js';

const migrationNames=()=>fs.readdirSync('drizzle').filter(name=>name.endsWith('.sql')).sort();
const base=1800000000000;

async function fixture(t,{beforeDiningMigration=false}={}){
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'winter-dining-'));
 const database=createLocalDatabase(path.join(folder,'test.sqlite'));
 t.after(()=>{database.close();fs.rmSync(folder,{recursive:true,force:true});});
 const names=migrationNames().filter(name=>!beforeDiningMigration||name<'0016_');
 await database.query({schema:names.map(name=>fs.readFileSync('drizzle/'+name,'utf8')).join('\n')});
 const DB={prepare(sql){return{bind(...args){return{run:()=>database.query({sql,args}),all:()=>database.query({sql,args}),first:async()=>(await database.query({sql,args})).results[0]||null};}};}};
 const env={DB};
 const visitor=(id,changes={})=>({id,room:'dining-room',region:'ryokan',x:diningEntrance.x,z:diningEntrance.z,...changes});
 async function claim(id,{now=base,seat=0,...changes}={}){
  const response=await rideAPI(new Request('https://winter.test/api/ride',{method:'POST',body:JSON.stringify({kind:'dining',seat})}),DB,visitor(id,changes),now);
  return{status:response.status,data:await response.json()};
 }
 async function release(id,now=base){
  const response=await rideAPI(new Request('https://winter.test/api/ride',{method:'DELETE'}),DB,visitor(id),now);
  return{status:response.status,data:await response.json()};
 }
 async function call(route,body,cookie='',method){
  const response=await handleAPI(new Request('https://winter.test/api/'+route,{method:method||(body===undefined?'GET':'POST'),headers:{Origin:'https://winter.test','Content-Type':'application/json',Cookie:cookie},body:body===undefined?undefined:JSON.stringify(body)}),env);
  return{status:response.status,data:await response.json(),headers:response.headers};
 }
 let invitation;
 async function join(name){
  invitation??=await seedInvitation(DB);
  const response=await call('join',{name,token:invitation});
  assert.equal(response.status,200,JSON.stringify(response.data));
  return{...response.data,cookie:response.headers.get('Set-Cookie').split(';')[0]};
 }
 async function enterRyokan(guest){
  // The fixture moves to the exterior door; admission still uses the production handler.
  await DB.prepare('UPDATE visitors SET x=?,z=? WHERE id=?').bind(interiorDoors.ryokan.x,interiorDoors.ryokan.z,guest.id).run();
  const entry=await call('region',{region:'ryokan'},guest.cookie);assert.equal(entry.status,200,JSON.stringify(entry.data));
  const position=await call('presence',{...diningEntrance,y:.95,yaw:Math.PI},guest.cookie);assert.equal(position.status,200,JSON.stringify(position.data));
 }
 return{DB,query:database.query,claim,release,call,join,enterRyokan};
}

test('dining migration preserves every old seat and keeps seat and visitor uniqueness',async t=>{
 const {DB,query}=await fixture(t,{beforeDiningMigration:true});
 const legacy=[
  ['old-room','ferris',3,0,'old-ferris-a',base-1000,base+5000],
  ['old-room','ferris',3,1,'old-ferris-b',base-1000,base+5000],
  ['other-room','bench',8,1,'old-bench',base-60000,base-40000],
  ['old-room','lift',27,0,'old-lift',base-100,base+10000],
  ['old-room','upperlift',45,1,'old-upper-lift',base-500,base+15000]
 ];
 const insert=(values)=>DB.prepare('INSERT INTO ride_seats(room,kind,cabin,seat,visitor,started_at,expires_at) VALUES(?,?,?,?,?,?,?)').bind(...values).run();
 for(const values of legacy)await insert(values);
 const before=(await DB.prepare('SELECT * FROM ride_seats ORDER BY visitor').bind().all()).results;
 // Match the local migration runner: individual statements, no replacement fixture schema.
 const migration=fs.readFileSync('drizzle/0016_dining_seats.sql','utf8');
 for(const sql of migration.split('--> statement-breakpoint'))if(sql.trim())await query({sql,args:[]});
 assert.deepEqual((await DB.prepare('SELECT * FROM ride_seats ORDER BY visitor').bind().all()).results,before);
 await insert(['new-room','dining',0,2,'new-diner',base,base+20000]);
 for(const [kind,seat]of [['ferris',2],['bench',2],['lift',2],['upperlift',2],['dining',3],['dining',-1],['dining',.5]]){
  await assert.rejects(insert(['invalid',kind,0,seat,kind+'-'+seat,base,base+20000]),/CHECK constraint failed/);
 }
 await assert.rejects(insert(['another-room','dining',0,0,'new-diner',base,base+20000]),/UNIQUE constraint failed/);
 await assert.rejects(insert(['new-room','dining',0,2,'duplicate-seat',base,base+20000]),/UNIQUE constraint failed/);
 await insert(['another-room','dining',0,2,'another-diner',base,base+20000]);
 assert.equal((await DB.prepare('SELECT COUNT(*) AS count FROM ride_seats').bind().first()).count,legacy.length+2);
});

test('three simultaneous diners get distinct seats and consecutive service; the fourth is full and another room is independent',async t=>{
 const {DB,claim}=await fixture(t);
 const results=await Promise.all(['a','b','c','d'].map((id,index)=>claim(id,{seat:index%3})));
 assert.deepEqual(results.map(r=>r.status).sort(),[200,200,200,409]);
 const reservations=results.filter(r=>r.status===200).map(r=>r.data.reservation).sort((a,b)=>a.startedAt-b.startedAt);
 assert.deepEqual(reservations.map(r=>r.seat).sort(),[0,1,2]);
 assert.deepEqual(reservations.map(r=>r.startedAt),[base,base+diningServiceSlot,base+2*diningServiceSlot]);
 assert.ok(reservations.every(r=>r.kind==='dining'&&r.cabin===0));
 assert.equal((await listRideSeats(DB,'dining-room',base)).length,3);
 const other=await claim('other',{room:'another-room'});
 assert.equal(other.status,200);assert.equal(other.data.reservation.seat,0);assert.equal(other.data.reservation.startedAt,base);
 assert.equal((await listRideSeats(DB,'another-room',base)).length,1);
 assert.equal((await listRideSeats(DB,'dining-room',base)).length,3);
});

test('duplicate dining requests return one reservation; leaving and exact expiry free only the corresponding seats',async t=>{
 const {DB,claim,release}=await fixture(t);
 const repeats=await Promise.all([claim('same'),claim('same')]);
 assert.ok(repeats.every(r=>r.status===200));assert.deepEqual(repeats[0].data.reservation,repeats[1].data.reservation);
 assert.equal((await listRideSeats(DB,'dining-room',base)).length,1);
 await claim('second',{seat:1});await claim('third',{seat:2});
 const rows=await listRideSeats(DB,'dining-room',base),second=rows.find(r=>r.id==='second'),third=rows.find(r=>r.id==='third');
 assert.equal((await release('second')).status,200);assert.equal((await release('second')).status,200);
 assert.deepEqual((await listRideSeats(DB,'dining-room',base)).map(r=>r.id).sort(),['same','third']);
 const replacement=await claim('replacement',{now:base+500,seat:second.seat});
 assert.equal(replacement.status,200);assert.equal(replacement.data.reservation.seat,second.seat);
 assert.equal(replacement.data.reservation.startedAt,third.startedAt+diningServiceSlot,'a freed chair cannot jump ahead of an already scheduled service');
 assert.equal((await listRideSeats(DB,'dining-room',base+20500)).length,0);
 const afterExpiry=await claim('fresh',{now:base+20500});
 assert.equal(afterExpiry.status,200);assert.equal(afterExpiry.data.reservation.startedAt,base+20500);assert.equal(afterExpiry.data.reservation.seat,0);
 assert.deepEqual((await listRideSeats(DB,'dining-room',base+20500)).map(r=>r.id),['fresh']);
 assert.equal((await DB.prepare('SELECT COUNT(*) AS count FROM ride_seats').bind().first()).count,1);
});

test('competing requests claim only the selected dining chair and never spill into an empty neighbour',async t=>{
 const {DB,claim}=await fixture(t),results=await Promise.all(Array.from({length:6},(_,i)=>claim('same-chair-'+i,{seat:2})));
 assert.equal(results.filter(r=>r.status===200).length,1);assert.equal(results.filter(r=>r.status===409&&r.data.code==='seat_occupied').length,5);
 const seats=await listRideSeats(DB,'dining-room',base);assert.equal(seats.length,1);assert.equal(seats[0].seat,2);
 const retry=await claim(seats[0].id,{seat:2});assert.equal(retry.status,200);assert.equal(retry.data.reservation.seat,2);
 const different=await claim(seats[0].id,{seat:0});assert.equal(different.status,409);assert.equal(different.data.code,'already_seated');
 const other=await claim('chooses-left',{seat:0});assert.equal(other.status,200);assert.equal(other.data.reservation.seat,0);
 for(const seat of [-1,3,1.5,'1',null])assert.equal((await claim('invalid-'+seat,{seat})).status,400);
 const missing=await rideAPI(new Request('https://winter.test/api/ride',{method:'POST',body:JSON.stringify({kind:'dining'})}),DB,{id:'missing',room:'dining-room',region:'ryokan',...diningEntrance},base);assert.equal(missing.status,200);assert.equal((await missing.json()).reservation.seat,1);
 assert.deepEqual((await listRideSeats(DB,'dining-room',base)).map(r=>r.seat).sort(),[0,1,2]);
});

test('dining requires the ryokan counter and cannot replace an existing facility reservation',async t=>{
 const {DB,claim}=await fixture(t);
 for(const region of ['outdoors','museum',undefined])assert.equal((await claim('wrong-'+region,{region})).status,400);
 assert.equal((await claim('far',{x:diningEntrance.x+10})).status,400);
 assert.equal((await claim('near-but-not-counter',{x:diningEntrance.x+4.6})).status,400);
 assert.equal((await listRideSeats(DB,'dining-room',base)).length,0);
 await DB.prepare("INSERT INTO ride_seats(room,kind,cabin,seat,visitor,started_at,expires_at) VALUES(?,'bench',5,0,?,?,?)").bind('dining-room','occupied',base,base+20000).run();
 assert.equal((await claim('occupied')).status,409);
 assert.equal((await DB.prepare('SELECT kind FROM ride_seats WHERE visitor=?').bind('occupied').first()).kind,'bench');
 assert.equal((await claim('at-counter',{x:diningEntrance.x+4.4})).status,200);
});

test('server seat poses fit all three chairs and one shared clock preserves the complete serving order',()=>{
 const reservations=diningSeats.map(({seat})=>({kind:'dining',cabin:0,seat,startedAt:base+seat*diningServiceSlot}));
 for(const reservation of reservations){
  const pose=sharedSeatPose(reservation,base);
  assert.deepEqual(pose,diningSeatPose(reservation));assert.equal(pose.diningStartedAt,reservation.startedAt);
  assert.ok(diningPoseValid(reservation,pose));assert.ok(interiorPositionValid(pose.x,pose.y,pose.z));
  assert.equal(diningPoseValid(reservation,{...pose,x:pose.x+.3}),false);
  assert.equal(diningPoseValid(reservation,{...pose,y:pose.y+.3}),false);
  assert.equal(diningPoseValid(reservation,{...pose,x:Infinity}),false);
  assert.equal(diningPoseValid(reservation,{...pose,mode:'rest'}),false);
 }
 assert.equal(diningSeatPose({kind:'dining',cabin:1,seat:0}),null);
 assert.equal(diningSeatPose({kind:'dining',cabin:0,seat:3}),null);
 assert.equal(diningSeatPose({kind:'bench',cabin:0,seat:0}),null);
 const stages=[[-1,'waiting'],[0,'greeting'],[999,'greeting'],[1000,'preparing'],[3999,'preparing'],[4000,'serving'],[6999,'serving'],[7000,'handoff'],[8999,'handoff'],[9000,'tasting'],[diningTasteEnd-1,'tasting'],[diningTasteEnd,'finished']];
 for(const [elapsed,stage]of stages){
  const state=diningServiceState(base,base+elapsed);
  assert.equal(state.stage,stage);assert.equal(state.holding,elapsed>=diningServiceSlot);assert.equal(state.finished,elapsed>=diningTasteEnd);
  assert.ok(Number.isFinite(state.progress)&&state.progress>=0&&state.progress<=1);
 }
 assert.equal(smoothService(-1),0);assert.equal(smoothService(2),1);assert.equal(smoothService(.5),.5);
 assert.equal(diningServiceState(NaN,base).stage,'waiting');
 assert.equal(activeDiningService(reservations,base-1),null);
 for(let slot=0;slot<3;slot++)for(const offset of [0,1000,4000,7000,diningServiceSlot-1]){
  const now=base+slot*diningServiceSlot+offset;
  assert.equal(activeDiningService([...reservations].reverse(),now).seat,slot);
  assert.equal(reservations.filter(r=>now>=r.startedAt&&now<r.startedAt+diningServiceSlot).length,1);
 }
 assert.equal(activeDiningService(reservations,base+3*diningServiceSlot),null);
});

test('the chef reveals one plate during preparation and handoff, clears it on finish or cancellation, and moves finitely between seats',t=>{
 const parent=new T.Group();parent.position.x=400;
 const m=materials(),chef=buildRyokanChef(parent,m),plate=chef.root.getObjectByName('chef-serving'),rig=chef.root.getObjectByName('omakase-chef');
 assert.ok(plate);assert.ok(rig);assert.equal(plate.visible,false);
 t.after(()=>{
  const geometry=new Set(),material=new Set(Object.values(m));
  parent.traverse(object=>{if(object.geometry&&!object.geometry.userData.shared)geometry.add(object.geometry);for(const item of [].concat(object.material||[]))if(!item.userData.shared)material.add(item);});
  for(const item of geometry)item.dispose();for(const item of material)item.dispose();parent.clear();
 });
 const left={kind:'dining',cabin:0,seat:0,startedAt:base},right={kind:'dining',cabin:0,seat:2,startedAt:base+diningServiceSlot};
 const update=(elapsed,seats=[left,right],still=false)=>{
  chef.update(elapsed/1000,still,diningEntrance,seats,base+elapsed);parent.updateMatrixWorld(true);
  parent.traverse(object=>assert.ok([...object.position.toArray(),...object.quaternion.toArray(),...object.scale.toArray(),...object.matrixWorld.elements].every(Number.isFinite),object.name||object.type));
 };
 update(-1);assert.equal(plate.visible,false);
 update(2699);assert.equal(plate.visible,false);
 update(2700);assert.equal(plate.visible,true);assert.equal(chef.root.userData.serviceStage,'preparing');
 update(8000);assert.equal(plate.visible,true);assert.equal(chef.root.userData.serviceStage,'handoff');assert.equal(chef.root.userData.servingSeat,0);assert.ok(rig.position.x<0);
 update(9000);assert.equal(plate.visible,false);assert.equal(chef.root.userData.servingSeat,2);
 for(let elapsed=13000;elapsed<=17000;elapsed+=100)update(elapsed);
 assert.equal(plate.visible,true);assert.equal(chef.root.userData.serviceStage,'handoff');assert.ok(rig.position.x>0);
 update(18000);assert.equal(plate.visible,false);assert.equal(chef.root.userData.serviceStage,'idle');
 const late={kind:'dining',cabin:0,seat:1,startedAt:base+20000};
 update(24000,[late]);assert.equal(plate.visible,true);
 update(24001,[]);assert.equal(plate.visible,false);assert.equal(chef.root.userData.servingSeat,null);
 update(28000,[late],true);assert.equal(plate.visible,true);assert.equal(rig.position.y,0);
 update(29000,[late],true);assert.equal(plate.visible,false);
});

test('authenticated API dining synchronizes each guest, renews waiting seats and rejects another guest pose',async t=>{
 const {DB,call,join,enterRyokan}=await fixture(t);
 const guests=[];
 for(const name of ['첫 손님','둘째 손님','셋째 손님','다음 손님']){const guest=await join(name);await enterRyokan(guest);guests.push(guest);}
 assert.equal((await call('ride',{kind:'dining',seat:0})).status,401);
 const claims=await Promise.all(guests.slice(0,3).map((guest,seat)=>call('ride',{kind:'dining',seat},guest.cookie)));
 assert.ok(claims.every(result=>result.status===200),JSON.stringify(claims));
 const reservations=claims.map(result=>result.data.reservation);
 assert.equal((await call('ride',{kind:'dining',seat:0},guests[3].cookie)).status,409);
 const duplicate=await call('ride',{kind:'dining',seat:0},guests[0].cookie);assert.deepEqual(duplicate.data.reservation,reservations[0]);
 const waitingIndex=reservations.findIndex(r=>r.startedAt>claims[0].data.serverTime),waiting=guests[waitingIndex],waitingReservation=reservations[waitingIndex];
 const before=Date.now();
 await DB.prepare('UPDATE ride_seats SET expires_at=? WHERE visitor=?').bind(before+1000,waiting.id).run();
 await DB.prepare('UPDATE visitors SET pose_at=0 WHERE id=?').bind(waiting.id).run();
 const pose=sharedSeatPose(waitingReservation,before);
 const heartbeat=await call('presence',pose,waiting.cookie);
 assert.equal(heartbeat.status,200,JSON.stringify(heartbeat.data));
 const renewed=await DB.prepare('SELECT started_at,expires_at FROM ride_seats WHERE visitor=?').bind(waiting.id).first();
 assert.equal(renewed.started_at,waitingReservation.startedAt);assert.ok(renewed.expires_at>=before+20000);
 assert.equal((await DB.prepare('SELECT mode,region FROM visitors WHERE id=?').bind(waiting.id).first()).mode,'dining');
 assert.equal(heartbeat.data.rideSeats.filter(r=>r.kind==='dining').length,3);
 const otherIndex=waitingIndex===0?1:0,otherPose=sharedSeatPose(reservations[otherIndex],before);
 const wrongPose=await call('presence',otherPose,waiting.cookie);assert.equal(wrongPose.status,409);assert.equal(wrongPose.data.code,'RIDE_POSE_INVALID');
 const withoutSeat=await call('presence',pose,guests[3].cookie);assert.equal(withoutSeat.status,409);assert.equal(withoutSeat.data.code,'RIDE_RESERVATION_EXPIRED');
 const view=await call('presence',{...diningEntrance,y:.95,yaw:0},guests[3].cookie);
 assert.equal(view.status,200);assert.equal(view.data.people.find(person=>person.id===waiting.id).mode,'dining');
 assert.equal(view.data.rideSeats.find(seat=>seat.id===waiting.id).startedAt,waitingReservation.startedAt);
 assert.equal((await call('ride',undefined,waiting.cookie,'DELETE')).status,200);
 assert.equal((await call('presence',pose,waiting.cookie)).status,409);
 assert.equal((await call('ride',{kind:'dining',seat:waitingReservation.seat},guests[3].cookie)).status,200);
 assert.equal((await call('region',{region:'outdoors'},guests[3].cookie)).status,200);
 assert.equal(await DB.prepare('SELECT visitor FROM ride_seats WHERE visitor=?').bind(guests[3].id).first(),null);
 assert.equal((await call('ride',{kind:'dining',seat:0},guests[3].cookie)).status,400);
 const remaining=await listRideSeats(DB,publicRoom,Date.now());assert.equal(remaining.length,2);
});

test('expired or left guest sessions cannot retain dining seats through presence',async t=>{
 const {DB,call,join,enterRyokan}=await fixture(t),guest=await join('만료 손님');await enterRyokan(guest);
 const claim=await call('ride',{kind:'dining',seat:0},guest.cookie);assert.equal(claim.status,200);
 const pose=sharedSeatPose(claim.data.reservation,Date.now());
 await DB.prepare('UPDATE ride_seats SET expires_at=? WHERE visitor=?').bind(Date.now()-1,guest.id).run();
 const expired=await call('presence',pose,guest.cookie);assert.equal(expired.status,409);assert.equal(expired.data.code,'RIDE_RESERVATION_EXPIRED');
 const fresh=await call('ride',{kind:'dining',seat:0},guest.cookie);assert.equal(fresh.status,200);
 assert.equal((await call('leave',{},guest.cookie)).status,200);
 assert.equal(await DB.prepare('SELECT visitor FROM ride_seats WHERE visitor=?').bind(guest.id).first(),null);
 assert.equal((await call('ride',{kind:'dining',seat:0},guest.cookie)).status,401);
 assert.equal((await call('presence',pose,guest.cookie)).status,401);
});
