import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {mergeFinish} from '../dist/architecture-kit.js';
import {createServerClock} from '../dist/server-clock.js';
import {benches,treeBenches,benchSeatPose} from '../dist/bench-layout.js';
import {alpineHeight,resortRides,liftLayout,liftPoint} from '../dist/resort-layout.js';
import {createFireworkScore} from '../dist/firework-score.js';
test('network latency corrections do not snap or reverse the ride clock',()=>{let tick=0;const clock=createServerClock(1000,()=>tick);clock.observe(1110,1000,1020);assert.equal(clock.now(),1100);tick=500;const before=clock.now();clock.observe(2200,1500,1520);tick+=16;const after=clock.now();assert.ok(after-before>=15.68&&after-before<=16.32);clock.observe(1,0,3000);tick+=16;assert.ok(clock.now()>after);});
test('architectural batching preserves all instanced paving transforms',()=>{const root=new T.Group(),mat=new T.MeshStandardMaterial(),geo=new T.BoxGeometry(),tiles=new T.InstancedMesh(geo,mat,4);for(let i=0;i<4;i++)tiles.setMatrixAt(i,new T.Matrix4().makeTranslation(i*3,0,0));root.add(tiles,new T.Mesh(geo,mat),new T.Mesh(geo,mat));mergeFinish(root);assert.equal(tiles.parent,root);assert.equal(tiles.count,4);const m=new T.Matrix4();tiles.getMatrixAt(3,m);assert.equal(m.elements[12],9);});
test('only the post-office bench is retired without shifting other seat identities',()=>{assert.equal(treeBenches.length,7);assert.ok(!benches.some(b=>b.id==='tree-bench-5'));assert.equal(benchSeatPose(benches.find(b=>b.id==='tree-bench-4').cabin+1),null);for(const b of benches)assert.ok(benchSeatPose(b.cabin,1));});
test('both lift exits are graded level with the landing chair and fireworks launch above snow',()=>{for(const r of[resortRides.lift,resortRides.upperlift])assert.ok(Math.abs(r.points.at(-1)[1]-r.exit[1])<1);for(const shell of createFireworkScore(52))assert.ok(shell.y>alpineHeight(shell.x,shell.z)+1);});

test('beginner lift arrival blends into the snow apron without the old deep clearance trench',()=>{for(let t=.999;t<=1.00001;t+=.0001){const p=liftPoint(Math.min(1,t)),ground=alpineHeight(p[0],p[2]),shoulder=alpineHeight(p[0]+8,p[2]);assert.ok(p[1]-ground>=.599);assert.ok(p[1]-ground<1.6);assert.ok(Math.abs(ground-shoulder)<.8);}});
