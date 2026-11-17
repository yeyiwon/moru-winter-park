import test from 'node:test';
import assert from 'node:assert/strict';
import {alpineTrees} from '../dist/alpine-forest-layout.js';
import {landforms,landDistance,segmentDistance} from '../dist/world-layout.js';
import {alpineHeight,skiRuns,skiRunCenter,skiRunHalfWidth,liftPoint,upperLiftPoint,summitTransfer,skiRunouts} from '../dist/resort-layout.js';
import {canStandAt} from '../dist/movement.js';

test('alpine forest actually populates the rendered island at ground level',()=>{
 const form=landforms.find(f=>f.id==='alpine');assert.ok(alpineTrees.length>=150,'mountain must not silently lose its trees');
 const lit=alpineTrees.filter(t=>t.decorated);assert.ok(lit.length>=16&&lit.length<=24);
 assert.ok(new Set(alpineTrees.map(t=>Math.floor(t.z/30))).size>=6,'forest spans the mountainside');
 for(const tree of alpineTrees){assert.ok(landDistance(tree.x,tree.z,form)<-3);assert.equal(tree.y,alpineHeight(tree.x,tree.z));assert.equal(canStandAt(tree.x,tree.z),false,'trunks block walking');}
});
test('restored trees leave all runs, lift lines, runouts and summit transfer open',()=>{
 for(const tree of alpineTrees){const {x,z,h}=tree,canopy=h*.42;
  for(const run of skiRuns)if(z>=run.startZ&&z<=run.finish)assert.ok(Math.abs(x-skiRunCenter(z,run.id))>skiRunHalfWidth(z,run.id)+canopy+2);
  for(const runout of skiRunouts)assert.ok(Math.hypot((x-runout.x)/(runout.rx+canopy),(z-runout.z)/(runout.rz+canopy))>=1);
  for(let i=1;i<summitTransfer.length;i++)assert.ok(segmentDistance(x,z,summitTransfer[i-1],summitTransfer[i])>canopy+3);
  for(const point of [liftPoint,upperLiftPoint])for(let i=0;i<=100;i++){const p=point(i/100);assert.ok(Math.hypot(x-(p[0]+2),z-p[2])>canopy+3);}
 }
});
