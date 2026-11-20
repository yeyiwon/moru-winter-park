import test from 'node:test';
import assert from 'node:assert/strict';
import {gondolaAtStation,gondolaCabinsAt,gondolaSchedule} from '../dist/ride-seats.js';
import {resortRides,skiNetwork} from '../dist/resort-layout.js';
import {sampleCableRide} from '../dist/winter-rides.js';
import {gondolaPoints,gondolaSupports,gondolaBase,alpineHeight,skiRuns,skiRunCenter,skiRunHalfWidth} from '../dist/mountain-layout.js';

test('scheduled gondolas keep their identities through departure and return without overlapping cabins',()=>{
 const route=resortRides.gondola,cycle=sampleCableRide(route,0).cycle;
 assert.equal(gondolaSchedule.interval*gondolaSchedule.count,cycle*1000);
 for(let now=0;now<cycle*2000;now+=200){
  const cabins=gondolaCabinsAt(now);assert.equal(new Set(cabins.map(c=>c.id)).size,gondolaSchedule.count);
  const poses=cabins.map(c=>sampleCableRide(route,(now-c.startedAt)/1000));
  for(let a=0;a<poses.length;a++)for(let b=a+1;b<poses.length;b++)assert.ok(Math.hypot(poses[a].x-poses[b].x,poses[a].y-poses[b].y,poses[a].z-poses[b].z)>6.3,'overlapping cabins at '+now);
 }
 for(let now=0;now<cycle*2000;now+=gondolaSchedule.interval){
  const before=gondolaCabinsAt(now-1),after=gondolaCabinsAt(now+1);
  for(const cabin of before){const next=after.find(c=>c.id===cabin.id),a=sampleCableRide(route,(now-1-cabin.startedAt)/1000),b=sampleCableRide(route,(now+1-next.startedAt)/1000);assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<.12,'cabin popped at schedule boundary');}
 }
});
test('gondola has a straight alignment, real supports outside pistes and an unbroken level base concourse',()=>{
 const a=gondolaPoints[0],b=gondolaPoints.at(-1),dx=b[0]-a[0],dz=b[2]-a[2];
 for(const p of gondolaPoints)assert.ok(Math.abs((p[0]-a[0])*dz-(p[2]-a[2])*dx)<1e-6);
 const length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length;
 for(const p of gondolaSupports.slice(1,-1))for(const r of skiRuns){const z=p[2]+nz*6;if(z<r.startZ||z>r.finish)continue;assert.ok(Math.abs(p[0]+nx*6-skiRunCenter(z,r.id))-skiRunHalfWidth(z,r.id)>6);}
 for(let x=gondolaBase.x-20;x<gondolaBase.x+24;x+=2)for(let z=-238;z<=-172;z+=2)assert.ok(Math.abs(alpineHeight(x,z)-.09)<.001);
 assert.ok(skiNetwork[0].length<2400,'one-minute course is physically compact');
});


test('boarding wait is under six seconds through the full schedule, including unopened doors',()=>{
 let maximum=0;for(let ms=0;ms<gondolaSchedule.cycle;ms+=25){const station=gondolaAtStation(ms);maximum=Math.max(maximum,station.wait);assert.ok(station.wait>=0);if(!station.open)assert.ok(gondolaAtStation(ms+station.wait+.01).open);}
 assert.ok(maximum<6000);
});
test('rendered gondola support feet follow the shared clear-of-piste layout',async()=>{
 const T=await import('../dist/vendor/three.module.js'),{createGondola}=await import('../dist/alpine-gondola.js'),parent=new T.Group(),{root}=createGondola(parent),supports=[];
 root.traverse(o=>{if(o.name==='gondola-support')supports.push(o);});assert.equal(supports.length,gondolaSupports.length-2);
 for(const support of supports)for(const run of skiRuns){const {x,z}=support.position;if(z<run.startZ||z>run.finish)continue;assert.ok(Math.abs(x-skiRunCenter(z,run.id))-skiRunHalfWidth(z,run.id)>7,'rendered support blocks '+run.id);}
});
