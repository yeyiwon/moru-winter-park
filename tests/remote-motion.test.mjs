import test from 'node:test';
import assert from 'node:assert/strict';
import {createRemoteMotion} from '../dist/remote-motion.js';
import {glowCapabilities} from '../dist/glow-pass.js';
const pose=(at,x,speed=4,extra={})=>({updatedAt:at,x,y:.95,z:24,yaw:0,mode:'',region:'outdoors',speed,...extra});
test('remote interpolation is timestamp ordered and never navigates on stale speed',()=>{
 const m=createRemoteMotion({delay:1000,prediction:100});m.push(pose(1000,0),1000);m.push(pose(2000,4),2000);
 assert.equal(m.sample(2500).x,2);assert.equal(m.push(pose(1500,99),2100),false);assert.equal(m.push(pose(2000,99),2200),false);
 assert.equal(m.sample(3050).x,4.2);assert.equal(m.sample(9000).x,4.4);assert.equal(m.sample(9000).speed,0);assert.equal(m.sample(900000).x,4.4);
 m.push(pose(10000,4.4,0),10000);assert.equal(m.sample(12000).speed,0);assert.equal(m.sample(15000).x,4.4);
});
test('teleports and region transitions reset interpolation; yaw takes the shortest arc',()=>{
 const m=createRemoteMotion({delay:100});m.push(pose(1000,0,0,{yaw:Math.PI-.1}),1000);m.push(pose(2000,1,4,{yaw:-Math.PI+.1}),2000);assert.ok(Math.abs(m.sample(1600).yaw-Math.PI)<1e-8);
 m.push(pose(2100,100,0),2100);assert.equal(m.sample(2100).x,100);
 m.push(pose(2200,101,0,{region:'museum'}),2200);assert.equal(m.sample(2200).x,101);
});
test('HDR bloom uses format-specific samples and fails safely without float color targets',()=>{
 const mock=(hdr,samples)=>({extensions:{has:()=>hdr},getContext:()=>({RENDERBUFFER:1,RGBA16F:2,SAMPLES:3,getInternalformatParameter:()=>samples})});
 assert.deepEqual(glowCapabilities(mock(false,[8,4,2])),{hdr:false,samples:0});
 assert.deepEqual(glowCapabilities(mock(true,[8,4])),{hdr:true,samples:0});
 assert.deepEqual(glowCapabilities(mock(true,[4,2,1])),{hdr:true,samples:2});
});

test('WebSocket motion and stopping are visible within the short interpolation window; polling can recover',()=>{
 const m=createRemoteMotion();m.setDelay(180);m.push(pose(1000,0,0),1000);m.push(pose(1100,.4),1100);m.push(pose(1200,.8),1200);
 assert.ok(m.sample(1350).x>.6,'fresh movement must not sit behind the old one-second polling delay');
 m.push(pose(1300,.8,0),1300);assert.equal(m.sample(1480).speed,0);assert.equal(m.sample(1800).x,.8);
 m.setDelay(1100);m.push(pose(2300,1.8),2300);assert.ok(Number.isFinite(m.sample(2500).x));m.setDelay(NaN);assert.ok(Number.isFinite(m.sample(2600).x));
});
