import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';import {createFantasyVFX} from '../dist/fantasy-vfx.js';
const actor=(x=0,extra={})=>({id:'self',x,y:.86,z:0,yaw:Math.PI/2,speed:5,mode:'walk',accessory:'crown,star,ribbon',jump:0,...extra});

test('reduced flashing hides pulse flashes while preserving movement trails',()=>{
 const v=createFantasyVFX(new T.Scene());for(let i=0;i<40;i++)v.update({time:i/60,dt:1/60,reduceFlash:true,player:actor(i/12)});
 v.burst({kind:'jump'});assert.equal(v.root.getObjectByName('jump-and-landing-light-rings').visible,false);assert.ok(v.stats.trailVertices>0);
 const opacity=v.root.getObjectByName('pooled-fantasy-sparkles').geometry.attributes.aTiming.array;for(let i=3;i<opacity.length;i+=4)assert.ok(opacity[i]<=.55);
 v.update({time:1,reduceFlash:false});assert.equal(v.root.getObjectByName('jump-and-landing-light-rings').visible,true);v.dispose();
});

test('movement leaves a short tapered filament and stardust, jump and landing remain bounded, and reduced motion clears them',()=>{
 const v=createFantasyVFX(new T.Scene());for(let i=0;i<90;i++)v.update({time:i/60,dt:1/60,player:actor(i/12)});assert.ok(v.stats.activeParticles>0);assert.ok(v.stats.trailVertices>0);
 v.update({time:1.51,dt:.01,player:actor(7.5,{jump:.4,y:1.26})});v.update({time:1.7,dt:.03,player:actor(7.5,{jump:0})});assert.ok(v.stats.activeParticles<=960);
 v.update({time:4,dt:.016});assert.equal(v.stats.activeParticles,0);assert.equal(v.stats.trailVertices,0);
 v.burst({x:0,y:.1,z:0,kind:'heart'});v.update({time:4.1,still:true,player:actor()});assert.equal(v.stats.activeParticles,0);assert.equal(v.stats.trailVertices,0);assert.equal(v.burst({kind:'joy'}),false);v.dispose();
});

test('nearby peers and all quality pool sizes are capped',()=>{
 const v=createFantasyVFX(new T.Scene()),peers=Array.from({length:12},(_,i)=>actor(i+1,{id:'peer-'+i}));peers.push(actor(100,{id:'far'}));
 v.update({time:0,player:actor(),peers});assert.equal(v.stats.activePeers,4);
 for(const [quality,cap,count]of [['medium',480,2],['low',160,1],['high',960,4]]){v.setQuality(quality);for(let i=0;i<70;i++)v.burst({kind:'joy',strength:2});v.update({time:1,player:actor(),peers});assert.equal(v.stats.particleCapacity,cap);assert.equal(v.stats.activePeers,count);assert.ok(v.stats.activeParticles<=cap);}
 const cloud=v.root.getObjectByName('pooled-fantasy-sparkles');assert.equal(cloud.geometry.attributes.position.count,960);v.dispose();
});

test('wish animation carries the supplied ornament, follows a rising curved route and completes once',()=>{
 const scene=new T.Scene(),v=createFantasyVFX(scene),geometry=new T.TorusGeometry(.25,.06,8,24),frameGeometry=new T.SphereGeometry(.1,8,6);let completed=0,sourceDisposed=0;geometry.addEventListener('dispose',()=>sourceDisposed++);v.update({time:10});
 assert.equal(v.animateWish({id:'one',from:{x:0,y:1,z:0},to:{x:6,y:4,z:-3},kind:'wreath',geometry,frameGeometry,onComplete:()=>completed++}),true);
 const mesh=v.root.getObjectByName('actual-wish-ornament');assert.notEqual(mesh.geometry,geometry);assert.deepEqual(mesh.geometry.attributes.position.array,geometry.attributes.position.array);
 v.update({time:10.6,dt:.016});assert.ok(mesh.parent.position.y>1.5);assert.ok(Math.abs(mesh.parent.position.x)<.01);
 v.update({time:11,dt:.016});assert.ok(mesh.parent.position.x>0&&mesh.parent.position.x<6);assert.ok(v.stats.trailVertices>=0);assert.equal(completed,0);
 v.update({time:12.81,dt:.016});assert.equal(completed,1);assert.equal(mesh.parent.visible,false);v.update({time:13});assert.equal(completed,1);assert.equal(sourceDisposed,0);v.dispose();assert.equal(sourceDisposed,0);geometry.dispose();frameGeometry.dispose();
});

test('wish overflow, quality reduction, reduced motion and disposal reveal every hidden target exactly once',()=>{
 const v=createFantasyVFX(new T.Scene()),g=new T.OctahedronGeometry(.2),done=new Uint8Array(12);v.update({time:0});for(let i=0;i<9;i++)v.animateWish({id:'w'+i,from:{x:0,y:1,z:0},to:{x:4,y:3,z:0},geometry:g,onComplete:()=>done[i]++});assert.equal(done.reduce((a,b)=>a+b,0),3);
 v.setQuality('low');v.update({time:.1});assert.ok(v.stats.activeFlights<=2);v.update({time:.2,still:true});for(let i=0;i<9;i++)assert.equal(done[i],1);v.dispose();for(let i=0;i<9;i++)assert.equal(done[i],1);g.dispose();
});

test('all pooled attributes stay finite with teleports, absent peers, zero dt and malformed optional state',()=>{
 const v=createFantasyVFX(new T.Scene());for(let i=0;i<20;i++)v.update({time:i/60,dt:i%3?1/60:0,player:actor(i%2?500:0,{y:.86,jump:0,speed:NaN}),peers:new Map([['a',actor(1,{id:'guest'})]])});
 v.root.traverse(o=>{if(!o.geometry)return;for(const attribute of Object.values(o.geometry.attributes))for(const value of attribute.array)assert.ok(Number.isFinite(value),o.name);});v.dispose();assert.equal(v.root.parent,null);
});
