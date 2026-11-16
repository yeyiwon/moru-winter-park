import test from 'node:test';
import assert from 'node:assert/strict';
import {alpineHeight,liftPoint,liftLayout,resortRides,resortRidePosition,skiCenter,skiHalfWidth} from '../dist/resort-layout.js';
import {sampleRide} from '../dist/winter-rides.js';
import {canStandAt} from '../dist/movement.js';

test('ascending chairs never dip and flatten into the upper station',()=>{
 let previous=liftPoint(0);
 for(let i=1;i<=2000;i++){
  const p=liftPoint(i/2000);
  assert.ok(p[1]>=previous[1]-1e-8,`unexpected descent at ${i/2000}`);
  assert.ok((p[1]-previous[1])/Math.hypot(p[0]-previous[0],p[2]-previous[2])<.8);
  previous=p;
 }
 assert.deepEqual(liftPoint(0).filter((_,i)=>i!==1),[-36,-188]);
 assert.deepEqual(liftPoint(1).filter((_,i)=>i!==1),[-30,-348]);
 assert.equal(liftPoint(.95)[1],liftPoint(1)[1]);
});

test('both parallel chair lanes clear the mountain and remain separate from the piste',()=>{
 for(let i=0;i<=1000;i++){
  const p=liftPoint(i/1000);
  for(const offset of [0,liftLayout.spacing])assert.ok(p[1]-alpineHeight(p[0]+offset,p[2])>=.59999,`seat intersects ground at ${i/1000}`);
  if(p[2]>-326&&p[2]<-180)assert.ok(p[0]+liftLayout.spacing+6<skiCenter(p[2])-skiHalfWidth(p[2]));
 }
});

test('lift presence validates the cable instead of allowing arbitrary heights over the hillside',()=>{
 for(let i=0;i<=100;i++){
  const p=sampleRide(resortRides.lift,i/100);
  assert.equal(resortRidePosition(p.x,p.y,p.z,'lift'),true);
  assert.equal(resortRidePosition(p.x+3,p.y,p.z,'lift'),false);
  assert.equal(resortRidePosition(p.x,p.y+2,p.z,'lift'),false);
 }
 assert.equal(resortRidePosition(-36,1,-180,'lift'),false);
 assert.equal(resortRidePosition(NaN,1,-188,'lift'),false);
});


test('the full approach to the loading chair is clear across a human-scale lane',()=>{
 for(let z=-170;z>=-188;z-=.25)for(const x of [-37.4,-36,-34.6])assert.equal(canStandAt(x,z),true,`blocked loading approach: ${x}, ${z}`);
 assert.equal(canStandAt(-55,-176),false,'relocated lodge keeps its physical footprint');
 assert.equal(canStandAt(-44,-185),false,'ticket booth stays outside the queue');
});
