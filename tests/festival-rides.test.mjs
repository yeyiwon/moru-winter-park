import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {buildFestivalRides,festivalLayout,festivalDestinations} from '../dist/festival-rides.js';

test('photo garden replaces deleted rides and keeps entrances clear',()=>{
 const scene=new THREE.Scene(),rides=buildFestivalRides(scene);let meshes=0,vertices=0;
 scene.traverse(o=>{if(!o.isMesh)return;meshes++;vertices+=o.geometry.attributes.position.count;for(const a of Object.values(o.geometry.attributes))for(const v of a.array)assert.ok(Number.isFinite(v));});
 assert.ok(meshes<=16);assert.ok(vertices<270000);for(const kind of ['teacups','bumper']){assert.equal(rides.seat(kind),null);assert.equal(festivalDestinations.some(p=>p.id===kind),false);}assert.ok(rides.root.getObjectByName('photo-garden-terrace'));
 for(const point of festivalDestinations){assert.ok(Math.hypot(point.x-festivalLayout.x,point.z-festivalLayout.z)<festivalLayout.r-1);for(const obstacle of rides.obstacles){const rx=obstacle.rx??obstacle.r??obstacle.w,rz=obstacle.rz??obstacle.r??obstacle.d;assert.ok(Math.hypot((point.x-obstacle.x)/(rx+.35),(point.z-obstacle.z)/(rz+.35))>=1,point.id+' entrance clear');}}
});

test('removed train leaves no hidden vehicle or ride destination',()=>{const rides=buildFestivalRides(new THREE.Scene());assert.equal(rides.root.getObjectByName('winter-train-engine'),undefined);assert.equal(rides.seat('train'),null);assert.equal(festivalDestinations.some(p=>p.id==='train'),false);});
