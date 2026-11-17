import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createSkiTrails} from '../dist/ski-trails.js';
import {alpineHeight,skiRuns,skiRunCenter} from '../dist/resort-layout.js';

const frame=(extra={})=>({x:skiRunCenter(-190),z:-190,yaw:0,speed:12,lean:0,gear:'ski',active:true,time:1,dt:.1,...extra});
function setup(){const scene=new T.Scene(),trails=createSkiTrails(scene);return {scene,trails,tracks:scene.getObjectByName('temporary-ski-tracks')};}

test('ski cuts form two lanes and sample the actual slope at both edges',()=>{
  const {trails,tracks}=setup();trails.update(frame());trails.update(frame({z:-189,time:1.1}));assert.equal(trails.state.trackCount,4);
  const a=new T.Matrix4(),b=new T.Matrix4();tracks.getMatrixAt(0,a);tracks.getMatrixAt(1,b);assert.ok(a.elements[12]<frame().x&&b.elements[12]>frame().x);
  const heights=tracks.geometry.attributes.trackHeights,left=new T.Vector3(-1,0,0).applyMatrix4(a),right=new T.Vector3(1,0,0).applyMatrix4(a);
  assert.ok(Math.abs(heights.getX(0)-alpineHeight(left.x,left.z))<.0001);
  assert.ok(Math.abs(heights.getY(0)-alpineHeight(right.x,right.z))<.0001);
  assert.ok(heights.getX(0)>heights.getZ(0),'downhill cut follows descending ground');
  trails.update(frame({active:false,time:14}));assert.equal(trails.state.trackCount,0);assert.equal(tracks.visible,false);
});

test('board cuts are wider and teleport, equipment change and new rides never join old tracks',()=>{
  const {trails,tracks}=setup();trails.update(frame({gear:'board'}));trails.update(frame({gear:'board',z:-189,time:1.1}));assert.equal(trails.state.trackCount,2);
  const matrix=new T.Matrix4();tracks.getMatrixAt(0,matrix);assert.ok(Math.abs(matrix.elements[0]-.31)<.00001);
  trails.update(frame({gear:'board',z:-220,time:1.2}));assert.equal(trails.state.trackCount,2);
  trails.update(frame({gear:'ski',z:-219,time:1.3}));assert.equal(trails.state.trackCount,2);
  trails.update(frame({active:false,time:1.4}));trails.update(frame({z:-270,time:1.5}));assert.equal(trails.state.trackCount,2);
  trails.update(frame({z:-269,time:1.6,still:true}));assert.equal(trails.state.trackCount,2);
});

test('powder emits on carving or braking, stays pooled, and settles after leaving the slope',()=>{
  const {trails,scene}=setup();trails.update(frame());assert.equal(trails.state.powderCount,0);
  trails.update(frame({time:1.1,brake:true}));assert.ok(trails.state.powderCount>0);
  for(let i=0;i<120;i++)trails.update(frame({z:-189,time:1.2+i*.05,dt:.05,lean:.9}));
  assert.ok(trails.state.powderCount<=trails.state.powderCapacity);assert.equal(scene.getObjectByName('ski-turn-powder').count,144);
  for(let i=0;i<14;i++)trails.update(frame({active:false,time:8+i*.1}));
  assert.equal(trails.state.powderCount,0);assert.equal(scene.getObjectByName('ski-turn-powder').visible,false);
});

test('long runs reuse track slots and remain finite',()=>{
  const {trails,tracks}=setup();
  for(let i=0;i<1800;i++){const a=i*.023;trails.update(frame({x:25*Math.sin(a),z:-280+25*Math.cos(a),yaw:Math.PI/2-a,speed:18,time:i*.025,dt:.025}));}
  assert.ok(trails.state.trackCount>100);assert.ok(trails.state.trackCount<=trails.state.trackCapacity);assert.equal(tracks.count,1536);
  for(const value of tracks.instanceMatrix.array)assert.ok(Number.isFinite(value));
  for(const value of tracks.geometry.attributes.trackHeights.array)assert.ok(Number.isFinite(value));
});

test('every course leaves tracks from its actual summit to the relocated lower runout',()=>{
 for(const run of skiRuns){const {trails}=setup();let time=0;for(let z=run.startZ;z<run.finish+5;z+=.6){const x=skiRunCenter(z,run.id);trails.update(frame({x,z,time:time+=.05,dt:.05}));if(z>run.startZ+2)assert.ok(trails.state.trackCount>0,run.id+' missing at '+z);}}
});
