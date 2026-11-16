import test from 'node:test';import assert from 'node:assert/strict';
import {skyAt,localHour} from '../dist/world-time.js';
import {createRideController,sampleRide} from '../dist/winter-rides.js';
import {canStandAt} from '../dist/movement.js';
import {alpine,alpineHeight,resortRides as routes,resortDestinations,restSeats,resortRidePosition} from '../dist/resort-layout.js';
import {surfaceHeight,terrainAt} from '../dist/world-layout.js';
test('lift reaches a stable summit before skiing, and each run lands safely',()=>{const r=createRideController(routes);assert.equal(r.start('ski'),false);assert.equal(r.start('lift'),true);assert.ok(r.update(routes.lift.duration/2).y>10);const top=r.update(routes.lift.duration/2);assert.equal(top.mode,'summit');assert.equal(top.y,routes.lift.exit[1]+.86);assert.deepEqual(r.update(60),top);assert.equal(r.start('ski'),true);assert.equal(r.update(routes.ski.duration).finished,true);assert.equal(r.mode,'');assert.equal(r.update(1),null);assert.equal(r.start('sled'),true);const end=r.update(routes.sled.duration);assert.ok(canStandAt(end.x,end.z));assert.equal(end.finished,true);});
test('ride cancellation clears movement and all resort samples stay on actual terrain',()=>{const r=createRideController(routes);r.start('lift');r.update(2);r.stop();assert.equal(r.update(20),null);for(const [mode,route]of Object.entries(routes))for(let t=0;t<=1;t+=.01){const p=sampleRide(route,t);for(const v of Object.values(p))assert.ok(Number.isFinite(v));assert.ok(resortRidePosition(p.x,p.y,p.z,mode),mode+JSON.stringify(p));if(mode!=='lift')assert.ok(Math.abs(p.y-alpineHeight(p.x,p.z)-(route.bodyOffset??.86))<.3);}});
test('all resort arrival positions are walkable and standing height is coherent',()=>{for(const {x,z}of resortDestinations){assert.ok(canStandAt(x,z),`${x},${z}`);assert.ok(Number.isFinite(surfaceHeight(x,z)));}assert.ok(canStandAt(0,30));assert.equal(canStandAt(108,35),false);assert.equal(canStandAt(-10,124),false);assert.equal(canStandAt(12,116.9),true);assert.equal(canStandAt(7,117),false);for(const p of Object.values(restSeats))assert.ok(terrainAt(p.x,p.z));});
test('mountain has human-scale separation from the old observatory and no lift dismount warp',()=>{assert.ok(alpine.r>=140);assert.ok(Math.abs(routes.ski.points.at(-1)[2]-routes.ski.points[0][2])>=160);assert.ok(routes.ski.points[0][1]>100);const end=routes.lift.points.at(-1),exit=routes.lift.exit;assert.ok(Math.hypot(end[0]-exit[0],end[2]-exit[2])<.1);assert.ok(Math.abs(end[1]-exit[1])<1);});
test('Seoul real time and sky interpolation handle day boundaries',()=>{assert.equal(localHour(new Date('2026-01-01T03:00:00Z'),'Asia/Seoul'),12);for(let h=0;h<=24;h+=.25){const s=skyAt(h);assert.ok(s.a.sky&&s.b.sky);assert.ok(s.t>=0&&s.t<=1);}assert.notEqual(skyAt(12).a.sky,skyAt(0).a.sky);});

test('ski input changes the line and braking reduces speed without leaving the snow',()=>{
 const start=()=>{const r=createRideController(routes);r.start('lift');r.update(45);r.start('ski');return r;};
 const left=start(),right=start(),coast=start(),brake=start();let a,b,c,d;
 for(let i=0;i<60;i++){a=left.update(.05,{steer:-.35});b=right.update(.05,{steer:.35});c=coast.update(.05);d=brake.update(.05,{brake:true});}
 assert.ok(a.x<b.x-2);assert.ok(d.speed<c.speed);for(const p of [a,b,c,d])assert.ok(Math.abs(p.y-alpineHeight(p.x,p.z)-.88/Math.cos(p.tilt))<1e-6);
});
