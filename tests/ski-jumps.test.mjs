import test from 'node:test';import assert from 'node:assert/strict';
import{skiJumps,skiJumpCoordinates,alpineHeight,resortRides,skiRuns,skiRunCenter,skiRunHalfWidth}from'../dist/resort-layout.js';
import{createRideController}from'../dist/winter-rides.js';import{validPose}from'../server/pose-validation.js';
function drive(jump,gear,dt){const ride=createRideController(resortRides),origin={x:jump.x-Math.sin(jump.yaw)*65,z:jump.z-Math.cos(jump.yaw)*65};assert.ok(ride.start('ski',origin,gear));let p=ride.update(0),maximum=0,airTime=0,landings=0;
 for(let t=0;t<16;t+=dt){const delta=Math.atan2(Math.sin(p.heading-jump.yaw),Math.cos(p.heading-jump.yaw)),last=p;p=ride.update(dt,{push:true,steer:Math.max(-1,Math.min(1,delta*5))});assert.ok(validPose(p),'server accepts grounded and airborne '+jump.id);assert.ok(Math.hypot(p.x-last.x,p.z-last.z)<2);maximum=Math.max(maximum,p.air);if(p.air>0)airTime+=dt;if(last.air>0&&p.air===0){landings++;break;}}
 assert.equal(landings,1);assert.ok(maximum>3&&maximum<32);assert.ok(airTime>1&&airTime<5);assert.ok(p.speed>10);return{maximum,airTime};}
test('all seven optional kickers launch and land skis and boards without teleporting or breaking server poses',()=>{for(const jump of skiJumps)for(const gear of['ski','board'])drive(jump,gear,1/60);});
test('kicker flight is frame-rate independent and leaves the main racing line open',()=>{for(const jump of skiJumps){const a=drive(jump,'ski',1/30),b=drive(jump,'ski',1/120);assert.ok(Math.abs(a.maximum-b.maximum)<1);assert.ok(Math.abs(a.airTime-b.airTime)<.15);const center=skiRunCenter(jump.z),local=skiJumpCoordinates(jump,center,jump.z);assert.ok(Math.abs(local.side)>jump.width/2+3);assert.ok(Math.abs(jump.x-center)+jump.width/2<skiRunHalfWidth(jump.z)-3);}});
test('airborne pose allowance is bounded to slopes and rejects arbitrary flight',()=>{for(const jump of skiJumps){const p={x:jump.x,z:jump.z,y:alpineHeight(jump.x,jump.z)+40,yaw:jump.yaw,mode:'ski'};assert.equal(validPose(p),false);}});

import {clearSkiCameraTerrain,followCameraHeight,cameraSubjectFocus,cameraDefaults} from '../dist/camera-policy.js';
test('racing camera follows steep vertical travel and keeps airborne riders in its composition',()=>{
 let focus=1800,ground=1800;for(let i=0;i<600;i++){ground-=24/60;focus=followCameraHeight(focus,ground,1/60,'ski');}assert.ok(focus-ground<3.5);
 const airborne={x:1,y:ground+20,z:-1000},aim=cameraSubjectFocus(airborne,{mode:'ski',groundY:ground});assert.equal(aim.y,airborne.y+cameraDefaults.focusHeight);
});

test('a steep uphill bank cannot collapse the racing camera into the skier',()=>{
 const focus={x:0,y:1.3,z:0},camera={x:0,y:9,z:-15},height=(x,z)=>-z*.85;clearSkiCameraTerrain(focus,camera,height);assert.equal(camera.z,-15);assert.equal(camera.x,0);
 for(let i=1;i<=16;i++){const t=i/16;assert.ok(focus.y+(camera.y-focus.y)*t>=height(0,camera.z*t)+.69);}
});

test('full-speed approaches to every kicker stay inside the server flight envelope',()=>{
 for(const jump of skiJumps)for(const gear of ['ski','board']){
  const z=Math.max(skiRuns[0].startZ,jump.z-600),offset=jump.x-skiRunCenter(jump.z),ride=createRideController(resortRides);assert.ok(ride.start('ski',{x:skiRunCenter(z)+offset,z},gear));let p=ride.update(0),launched=false,landed=false;
  for(let t=0;t<50;t+=1/60){const look=8+p.speed*.6,near=p.z>jump.z-45&&p.z<jump.z+60,target=near?jump.x+Math.tan(jump.yaw)*(p.z+look-jump.z):skiRunCenter(p.z+look)+offset,aim=Math.atan2(target-p.x,look),delta=Math.atan2(Math.sin(p.heading-aim),Math.cos(p.heading-aim)),before=p;
   p=ride.update(1/60,{push:true,steer:Math.max(-1,Math.min(1,delta*4))});assert.ok(validPose(p),jump.id+' '+gear+' outside valid flight');if(p.air>0)launched=true;if(before.air>0&&p.air===0){landed=true;break;}
  }
  assert.ok(launched&&landed,jump.id+' '+gear+' full-speed landing');
 }
});
