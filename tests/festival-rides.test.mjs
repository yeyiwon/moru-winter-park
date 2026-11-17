import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {buildFestivalRides,festivalLayout,festivalDestinations} from '../dist/festival-rides.js';

test('festival annex keeps entrances outside ride footprints and geometry finite',()=>{
 const scene=new THREE.Scene(),rides=buildFestivalRides(scene);let meshes=0,vertices=0;
 scene.traverse(o=>{if(!o.isMesh)return;meshes++;vertices+=o.geometry.attributes.position.count;for(const a of Object.values(o.geometry.attributes))for(const v of a.array)assert.ok(Number.isFinite(v));});
 assert.ok(meshes<=16);assert.ok(vertices<270000);assert.equal(rides.sockets.teacups.length,4);assert.equal(rides.sockets.train.length,2);assert.equal(rides.sockets.bumper.length,2);
 for(const point of festivalDestinations){assert.ok(Math.hypot(point.x-festivalLayout.x,point.z-festivalLayout.z)<festivalLayout.r-1);for(const obstacle of rides.obstacles){const rx=obstacle.rx??obstacle.r,rz=obstacle.rz??obstacle.r;assert.ok(Math.hypot((point.x-obstacle.x)/(rx+.35),(point.z-obstacle.z)/(rz+.35))>=1,point.id+' entrance clear');}}
});

test('ride sockets follow the actual rotating seats and remain stationary with reduced motion',()=>{
 const rides=buildFestivalRides(new THREE.Scene()),before={};
 for(const kind of ['teacups','bumper','train'])before[kind]=rides.seat(kind);
 rides.update(8);
 for(const kind of ['teacups','bumper','train']){
  const now=rides.seat(kind),node=rides.sockets[kind][0],point=node.getWorldPosition(new THREE.Vector3());assert.ok(Math.hypot(now.x-before[kind].x,now.z-before[kind].z)>.3);assert.ok(Math.abs(now.y-point.y-.82)<1e-8);assert.ok(Math.abs(now.x-point.x)<1e-8);assert.ok(Number.isFinite(now.yaw));
  rides.update(20,true);assert.deepEqual(rides.seat(kind),now);
 }
 assert.equal(rides.seat('not-a-ride'),null);
});

test('bumper cars keep their distance and human steering stays inside the arena',()=>{
 const rides=buildFestivalRides(new THREE.Scene());
 for(let t=0;t<60;t+=.4){rides.update(t);const a=rides.seat('bumper',0),b=rides.seat('bumper',1);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>1.6);}
 for(let i=0;i<1500;i++){rides.driveBumper(.02,{throttle:1,steer:Math.sin(i*.015)});rides.update(60+i*.02);const car=rides.root.getObjectByName('bumper-car-0');assert.ok(Math.abs(car.position.x)<=2.5);assert.ok(Math.abs(car.position.z)<=1.36);}
 rides.releaseBumper();rides.update(0);assert.ok(Math.abs(rides.root.getObjectByName('bumper-car-0').position.x-1.9)<1e-8);
});

test('train coaches are separated and tall enough for the largest headband',()=>{
 const rides=buildFestivalRides(new THREE.Scene());
 for(let t=0;t<40;t+=.5){rides.update(t);const a=rides.root.getObjectByName('winter-train-engine'),b=rides.root.getObjectByName('winter-train-coach-1');assert.ok(a.position.distanceTo(b.position)>2.6);}
 const coach=rides.root.getObjectByName('winter-train-detail-1');assert.ok(coach.geometry.boundingBox.max.y>3.4);
});
