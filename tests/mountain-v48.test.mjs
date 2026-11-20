import test from 'node:test';import assert from 'node:assert/strict';
import{skiNetwork,alpineHeight,resortRides,summitTransfer,middleTransfer,ridgeTransfers,ridgeLiftEntry,peakSummit}from'../dist/resort-layout.js';
import{createRideController,sampleCableRide}from'../dist/winter-rides.js';import{sharedSeatPose,gondolaSeat}from'../dist/ride-seats.js';
import{validPose}from'../server/pose-validation.js';import{courseStart,followCourse}from'./ski-driver.mjs';import{canStandAt}from'../dist/movement.js';
test('main trail is a compact 2.34km 3D arc with a 900m drop, and both gear types finish with the requested faster pace',()=>{
 const main=skiNetwork[0];assert.ok(main.length>2300&&main.length<2400);assert.ok(Math.abs(main.drop-900)<2);
 const times=[];for(const gear of['ski','board']){const ride=createRideController(resortRides);assert.ok(ride.start('ski',courseStart(),gear));let p=ride.update(0),travel=0,time=0,boundary=0;
 for(;time<700&&!p.finished;time+=1/30){const next=ride.update(1/30,followCourse(p,'main'));travel+=Math.hypot(next.x-p.x,next.y-p.y,next.z-p.z);if(next.recovery)boundary++;p=next;}
 assert.ok(p.finished,gear);assert.ok(time>=50&&time<=70,gear+' '+time);assert.ok(travel>2300&&travel<2450);assert.equal(boundary,0);assert.ok(canStandAt(p.x,p.z));times.push(time);}
 assert.ok(Math.abs(times[0]-times[1])>.5,'different edge/drag models are measurable');
});
test('all stations lead to their courses by walkable snow with no forced course teleport',()=>{
 for(const points of[summitTransfer,middleTransfer,...ridgeTransfers,[{x:resortRides.gondola.exit[0],z:resortRides.gondola.exit[2]},courseStart()]])for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];for(let t=0;t<=1;t+=.01)for(const dx of[-.6,0,.6])assert.ok(canStandAt(a.x+(b.x-a.x)*t+dx,a.z+(b.z-a.z)*t));}
});
test('jump lands, edge contact brakes without teleporting, and recovery requires an explicit request',()=>{
 const ride=createRideController(resortRides);ride.start('ski',courseStart());let p=ride.update(3,{push:true});const before={...p};p=ride.update(.1,{push:true,jump:true});assert.ok(p.air>0);for(let i=0;i<40;i++)p=ride.update(.05,{push:true});assert.equal(p.air,0);
 let previous=p;for(let i=0;i<300;i++){p=ride.update(.025,{push:true,steer:1});assert.ok(Math.hypot(p.x-previous.x,p.z-previous.z)<=p.speed*.025+.1);previous=p;}
 assert.ok(ride.recover());p=ride.update(0);assert.equal(p.speed,0);assert.equal(p.air,0);assert.ok(Number.isFinite(p.x+before.x));
});
test('gondola launch, doors, return loop and all six server seats remain continuous and above terrain',()=>{
 const route=resortRides.gondola,arrival=route.boardingSeconds+route.duration,cycle=sampleCableRide(route,0).cycle;let previous=sampleCableRide(route,0);for(let t=.1;t<cycle;t+=.1){const p=sampleCableRide(route,t);assert.ok(Math.hypot(p.x-previous.x,p.y-previous.y,p.z-previous.z)<4.8);assert.ok(p.y-.82-alpineHeight(p.x,p.z)>.04);previous=p;}
 assert.equal(sampleCableRide(route,0).doors,0);assert.equal(sampleCableRide(route,6).doors,1);assert.equal(sampleCableRide(route,arrival+3).arrived,true);assert.equal(sampleCableRide(route,arrival+3).doors,1);assert.equal(sampleCableRide(route,arrival+route.arrivalSeconds+8).arrived,false);
 for(let seat=0;seat<6;seat++)for(let t=0;t<cycle;t+=7){const r={kind:'gondola',seat,startedAt:0},p=sharedSeatPose(r,t*1000);assert.ok(validPose(p,r,t*1000));assert.equal(validPose({...p,x:p.x+8},r,t*1000),false);}
 const ride=createRideController(resortRides);ride.start('gondola');ride.syncElapsed(arrival+3);ride.update(0);const exit=ride.disembark();assert.equal(exit.mode,'summit');assert.ok(Math.hypot(exit.x-peakSummit.x,exit.z-peakSummit.z)<50);
});

test('six gondola seats leave room for rounded avatars without row overlap',()=>{for(let a=0;a<6;a++)for(let b=a+1;b<6;b++){const p=gondolaSeat(a),q=gondolaSeat(b);assert.ok(Math.hypot(p.x-q.x,p.z-q.z)>=1.8);}});

test('gondola and three lift corridors stay separated and the middle lift clears every piste',async()=>{
 const m=await import('../dist/mountain-layout.js');
 for(const point of [m.liftPoint,m.upperLiftPoint,m.ridgeLiftPoint])for(let i=0;i<=300;i++){
  const p=point(i/300);assert.ok(m.mountainDistance(p[0],p[2])<-12);
  for(const q of m.gondolaPoints)assert.ok(Math.hypot(p[0]-q[0],p[2]-q[2])>30,'gondola/lift overlap');
 }
 for(let i=0;i<=300;i++){const p=m.ridgeLiftPoint(i/300);for(const run of m.skiRuns){if(p[2]<run.startZ||p[2]>run.finish)continue;assert.ok(Math.abs(p[0]-m.skiRunCenter(p[2],run.id))-m.skiRunHalfWidth(p[2],run.id)>6);}}
 const ride=createRideController(resortRides);assert.ok(ride.start('ridgelift'));const exit=ride.update(resortRides.ridgelift.duration+1);assert.equal(exit.mode,'summit');assert.ok(canStandAt(exit.x,exit.z));assert.ok(exit.y>600);
});
