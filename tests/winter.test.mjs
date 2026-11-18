import {treeLayout} from '../dist/tree-layout.js';
import {spaToWorld} from '../dist/spa-transform.js';
const canStandLocal=(x,z)=>{const p=spaToWorld({x,z});return canStandAt(p.x,p.z);};
import {alpineShift} from '../dist/resort-layout.js';
import {walkToStart,followCourse} from './ski-driver.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {skyAt,localHour} from '../dist/world-time.js';
import {createRideController,sampleRide} from '../dist/winter-rides.js';
import {canStandAt} from '../dist/movement.js';
import {alpine,alpineHeight,skiCenter,skiHalfWidth,summit,resortRides as routes,resortDestinations,restSeats,resortRidePosition} from '../dist/resort-layout.js';
import {surfaceHeight,terrainAt} from '../dist/world-layout.js';
test('lift reaches a stable summit before skiing, and each run lands safely',()=>{const r=createRideController(routes);assert.equal(r.start('ski'),false);assert.equal(r.start('lift'),true);assert.ok(r.update(routes.lift.duration/2).y>10);const top=r.update(routes.lift.duration/2);assert.equal(top.mode,'summit');assert.equal(top.y,routes.lift.exit[1]+.86);assert.deepEqual(r.update(60),top);walkToStart(r);assert.equal(r.start('ski'),true);let endSki=r.update(0);for(let i=0;i<2400;i++){const p=endSki||top;endSki=r.update(.05,followCourse(p,'main'));if(endSki.finished)break;}assert.equal(endSki.finished,true);assert.equal(r.mode,'');assert.equal(r.update(1),null);assert.equal(r.start('sled'),false);});
test('ride cancellation clears movement and all resort samples stay on actual terrain',()=>{const r=createRideController(routes);r.start('lift');r.update(2);r.stop();assert.equal(r.update(20),null);for(const [mode,route]of Object.entries(routes))for(let t=0;t<=1;t+=.01){const p=sampleRide(route,t);for(const v of Object.values(p))assert.ok(Number.isFinite(v));assert.ok(resortRidePosition(p.x,p.y,p.z,mode),mode+JSON.stringify(p));if(!['lift','upperlift'].includes(mode))assert.ok(Math.abs(p.y-alpineHeight(p.x,p.z)-(route.bodyOffset??.86))<.3);}});
test('all resort arrival positions are walkable and standing height is coherent',()=>{for(const {x,z}of resortDestinations){assert.ok(canStandAt(x,z),`${x},${z}`);assert.ok(Number.isFinite(surfaceHeight(x,z)));}assert.ok(canStandAt(0,30));assert.equal(canStandAt(treeLayout.x,treeLayout.z),false);assert.equal(canStandLocal(-10,124),false);assert.equal(canStandLocal(12,113.6),true);assert.equal(canStandLocal(0,118),false);for(const p of Object.values(restSeats))assert.ok(terrainAt(p.x,p.z));});
test('mountain has human-scale separation from the old observatory and no lift dismount warp',()=>{assert.ok(alpine.r>=140);assert.ok(Math.abs(routes.ski.points.at(-1)[2]-routes.ski.points[0][2])>=160);assert.ok(routes.ski.points[0][1]>60);const end=routes.lift.points.at(-1),exit=routes.lift.exit;assert.ok(Math.hypot(end[0]-exit[0],end[2]-exit[2])<=9);assert.ok(Math.abs(end[1]-exit[1])<1);});
test('Seoul real time and sky interpolation handle day boundaries',()=>{assert.equal(localHour(new Date('2026-01-01T03:00:00Z'),'Asia/Seoul'),12);for(let h=0;h<=24;h+=.25){const s=skyAt(h);assert.ok(s.a.sky&&s.b.sky);assert.ok(s.t>=0&&s.t<=1);}assert.notEqual(skyAt(12).a.sky,skyAt(0).a.sky);});

test('ski input changes the line and braking reduces speed without leaving the snow',()=>{
 const start=()=>{const r=createRideController(routes);r.start('lift');r.update(45);r.start('ski');return r;};
 const left=start(),right=start(),coast=start(),brake=start();let a,b,c,d;
 for(let i=0;i<60;i++){a=left.update(.05,{steer:-.35,push:true});b=right.update(.05,{steer:.35,push:true});c=coast.update(.05,{push:true});d=brake.update(.05,{brake:true,push:true});}
 assert.ok(a.x>b.x+2);assert.ok(d.speed<c.speed);for(const p of [a,b,c,d])assert.ok(Math.abs(p.y-alpineHeight(p.x,p.z)-.88/Math.cos(p.tilt))<1e-6);
});

test('ski waits for a deliberate push and does not follow the route center automatically',()=>{const r=createRideController(routes);r.start('lift');r.update(45);r.start('ski');const waiting=r.update(10);assert.equal(waiting.speed,0);assert.equal(waiting.z,routes.lift.exit[2]);let p;for(let i=0;i<40;i++)p=r.update(.05,{push:true});assert.ok(Math.abs(p.x-waiting.x-Math.tan(waiting.heading)*(p.z-waiting.z))<.01);assert.ok(p.z>waiting.z);assert.ok(Math.abs(p.x-skiCenter(p.z))>.01);});

test('the summit is a wide level launch area and can be explored before departure',()=>{for(const x of [-20,-8,4])for(const z of [(-352+alpineShift),(-347+alpineShift),(-342+alpineShift)])assert.ok(Math.abs(alpineHeight(x,z)-summit.height)<.1);const r=createRideController(routes);r.start('lift');const a=r.update(45);let p;for(let i=0;i<20;i++)p=r.update(.05,{x:1,z:0});assert.ok(p.x>a.x+2);r.start('ski');const launch=r.update(0);assert.equal(launch.x,p.x);assert.equal(launch.z,p.z);});

test('piste descends continuously to the base and chairlifts stay beyond its safety boundary',()=>{for(let z=(-334+alpineShift);z< (-172+alpineShift);z+=.5){const a=alpineHeight(skiCenter(z),z),b=alpineHeight(skiCenter(z+.5),z+.5);assert.ok(b<=a+.001);assert.ok((a-b)/.5<.75);}for(const p of routes.lift.points){if(p[2]>(-326+alpineShift)&&p[2]<(-180+alpineShift))assert.ok(skiCenter(p[2])-skiHalfWidth(p[2])-(p[0]+4)>6);}});
test('steering remains responsive at the piste edge and a skier can turn back in',()=>{const r=createRideController(routes);r.start('lift');r.update(45);r.start('ski');let p;for(let i=0;i<150;i++)p=r.update(.05,{push:true,steer:-1});const before=p.heading;for(let i=0;i<30;i++)p=r.update(.05,{push:true,steer:1});assert.ok(Math.abs(Math.atan2(Math.sin(p.heading-before),Math.cos(p.heading-before)))>.3);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.z));});
