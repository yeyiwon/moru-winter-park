import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {mountainBounds,mountainWayfinders,skiRuns,skiRunCenter,skiRunHalfWidth} from '../dist/mountain-layout.js';
import {gondolaApproach,liftApproach,gondolaEntry,liftLayout,upperLiftEntry,alpineShift,resortRides} from '../dist/resort-layout.js';
import {canStandAt} from '../dist/movement.js';
import {createMountainLights} from '../dist/mountain-lights.js';

test('compact resort groups all base boarding entrances and leaves the park/food approaches walkable',()=>{
 assert.ok(mountainBounds.maxZ-mountainBounds.minZ<2100);
 for(const p of [gondolaEntry,{x:liftLayout.x,z:liftLayout.z+6},upperLiftEntry])assert.ok(Math.hypot(p.x+12,p.z-(-160+alpineShift))<125);
 const paths=[
  gondolaApproach.map(p=>[p.x,p.z-alpineShift]),
  [[-26,-150],...liftApproach.map(p=>[p.x,p.z-alpineShift])],
  [[25,-150],[70,-160],[upperLiftEntry.x-8,-174],[upperLiftEntry.x,upperLiftEntry.z-alpineShift]]
 ];
 for(const path of paths)for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let d=0;d<=length;d+=.25)for(const side of [-.7,0,.7])assert.ok(canStandAt(a[0]+(b[0]-a[0])*d/length+side,a[1]+(b[1]-a[1])*d/length+alpineShift),'boarding path blocked');}
 assert.equal(resortRides.lift.duration,35);assert.equal(resortRides.upperlift.duration,68);assert.equal(resortRides.ridgelift.duration,62);assert.equal(resortRides.gondola.duration,95);
});
test('new chalet signs leave the full piste width and player clearance open',()=>{
 assert.equal(mountainWayfinders.length,8);
 for(const sign of mountainWayfinders)for(const run of skiRuns){if(sign.z<run.startZ||sign.z>run.finish)continue;assert.ok(Math.abs(sign.x-skiRunCenter(sign.z,run.id))-skiRunHalfWidth(sign.z,run.id)>2.4,sign.id+' blocks '+run.id);}
});
test('fir sparkles reuse one bounded GPU buffer, support reduced motion and release resources',()=>{
 const parent=new T.Group(),lights=createMountainLights(parent,[{x:3,z:-800,y:280,h:9,turn:.8}]),g=lights.points.geometry,m=lights.points.material,positions=g.attributes.position.array;
 assert.equal(positions.length,42*3);assert.ok([...positions].every(Number.isFinite));
 let gd=0,md=0;g.addEventListener('dispose',()=>gd++);m.addEventListener('dispose',()=>md++);
 for(let i=0;i<600;i++)lights.update(i/60,false);assert.strictEqual(g.attributes.position.array,positions);assert.ok(m.uniforms.time.value>9);
 lights.update(4,true);assert.equal(m.uniforms.time.value,0);lights.setQuality('low');assert.equal(m.uniforms.density.value,.35);assert.equal(m.fog,true);
 lights.dispose();assert.equal(gd,1);assert.equal(md,1);assert.equal(parent.children.length,0);
});

test('open summit has no enclosing peaks and every cable stays inside the snow boundary',async()=>{
 const m=await import('../dist/mountain-layout.js');
 for(let z=m.peakSummit.z-30;z<=m.peakSummit.z+35;z+=5)for(let x=-180;x<=180;x+=10)assert.ok(m.mountainGroundHeight(x,z)<=m.peakSummit.height+.01,'snow wall above summit');
 for(const point of [m.liftPoint,m.upperLiftPoint,m.ridgeLiftPoint,m.gondolaPoint])for(let i=0;i<=1000;i++){const p=point(i/1000);assert.ok(m.mountainDistance(p[0],p[2])< -45,'cable at cliff edge');}
 const line=m.ridgeLiftLayout;assert.ok(Math.hypot(line.x-m.middleSummit.x,line.z-m.middleSummit.z)<85,'shared intermediate hub');assert.ok(Math.hypot(line.x+line.dx-m.peakSummit.x,line.z+line.dz-m.peakSummit.z)<105,'chair reaches main summit');
});
test('map pins identify physical stations independently of safe arrival sockets',async()=>{
 const {skiMapDestinations,alpineHeight}=await import('../dist/resort-layout.js');
 for(const [id,kind,index] of [['ski','lift',0],['ski-middle','lift',-1],['ski-right-base','upperlift',0],['ski-forest','upperlift',-1],['ski-gondola-base','gondola',0],['ski-peak','gondola',-1],['ski-ridge-base','ridgelift',0],['ski-ridge-top','ridgelift',-1]]){const p=skiMapDestinations.find(p=>p.id===id),station=resortRides[kind].points.at(index);assert.equal(p.mapAnchor.x,station[0]);assert.equal(p.mapAnchor.z,station[2]);assert.equal(p.mapAnchor.y,alpineHeight(station[0],station[2]));assert.ok(canStandAt(p.x,p.z));}
});
