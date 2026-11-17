import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {buildFestivalRides,festivalLayout,festivalDestinations} from '../dist/festival-rides.js';

test('festival annex keeps entrances outside ride footprints and geometry finite',()=>{
 const scene=new THREE.Scene(),rides=buildFestivalRides(scene);let meshes=0,vertices=0;
 scene.traverse(o=>{if(!o.isMesh)return;meshes++;vertices+=o.geometry.attributes.position.count;for(const a of Object.values(o.geometry.attributes))for(const v of a.array)assert.ok(Number.isFinite(v));});
 assert.ok(meshes<=16);assert.ok(vertices<270000);assert.equal(rides.sockets.teacups.length,4);assert.equal(rides.sockets.train,undefined);assert.equal(rides.sockets.bumper.length,4);
 for(const point of festivalDestinations){assert.ok(Math.hypot(point.x-festivalLayout.x,point.z-festivalLayout.z)<festivalLayout.r-1);for(const obstacle of rides.obstacles){const rx=obstacle.rx??obstacle.r??obstacle.w,rz=obstacle.rz??obstacle.r??obstacle.d;assert.ok(Math.hypot((point.x-obstacle.x)/(rx+.35),(point.z-obstacle.z)/(rz+.35))>=1,point.id+' entrance clear');}}
});

test('ride sockets follow the actual rotating seats and remain stationary with reduced motion',()=>{
 const rides=buildFestivalRides(new THREE.Scene()),before={};
 for(const kind of ['teacups','bumper'])before[kind]=rides.seat(kind);
 rides.update(8);
 for(const kind of ['teacups','bumper']){
  const now=rides.seat(kind),node=rides.sockets[kind][0],point=node.getWorldPosition(new THREE.Vector3());assert.ok(Math.hypot(now.x-before[kind].x,now.z-before[kind].z)>.3);assert.ok(Math.abs(now.y-point.y-.82)<1e-8);assert.ok(Math.abs(now.x-point.x)<1e-8);assert.ok(Number.isFinite(now.yaw));
  rides.update(20,true);assert.deepEqual(rides.seat(kind),now);
 }
 assert.equal(rides.seat('not-a-ride'),null);
});

test('bumper cars keep their distance and human steering stays inside the arena',()=>{
 const rides=buildFestivalRides(new THREE.Scene());
 for(let t=0;t<60;t+=.4){rides.update(t);const a=rides.seat('bumper',0),b=rides.seat('bumper',1);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>1.6);}
 for(let i=0;i<1500;i++){rides.driveBumper(.02,{throttle:1,steer:Math.sin(i*.015)});rides.update(60+i*.02);const car=rides.root.getObjectByName('bumper-car-0');assert.ok(Math.abs(car.position.x)<=8.851);assert.ok(Math.abs(car.position.z)<=5.851);}
 rides.releaseBumper();rides.update(0);assert.ok(Number.isFinite(rides.seat('bumper').x));
});

test('removed train leaves no hidden vehicle or ride destination',()=>{const rides=buildFestivalRides(new THREE.Scene());assert.equal(rides.root.getObjectByName('winter-train-engine'),undefined);assert.equal(rides.seat('train'),null);assert.equal(festivalDestinations.some(p=>p.id==='train'),false);});
