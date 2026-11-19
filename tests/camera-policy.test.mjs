import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {cameraDefaults,createCameraPolicy,smoothCameraAngle,followCameraHeight,cameraSubjectFocus,cameraOrbitPosition,cameraOrbitFocus,constrainCameraFocusToRoom,constrainCameraToRoom,constrainCameraToTerrain} from '../dist/camera-policy.js';
import {activityCameraView} from '../dist/activity-camera.js';
import {interiorRooms} from '../dist/interior-layout.js';
import {canStandAt} from '../dist/movement.js';
import {diningSeats} from '../dist/ryokan-service.js';

const near=(actual,expected,epsilon=1e-9)=>assert.ok(Math.abs(actual-expected)<=epsilon,`${actual} ≈ ${expected}`);
const viewFields=view=>({yaw:view.yaw,pitch:view.pitch,distance:view.distance,fov:view.fov});
const direction=(point,focus)=>new T.Vector3(point.x-focus.x,point.y-focus.y,point.z-focus.z).normalize();

test('walking, facilities and gestures retain manual view instead of supplying camera presets',()=>{
 const policy=createCameraPolicy();policy.orbit(35,44);policy.zoom(2);
 const before=viewFields(policy.view());
 for(const mode of ['', 'summit','carousel','ferris','lift','bath','tea','dining','view','sauna','ski',''])assert.deepEqual(viewFields(policy.view({mode,heading:2.1})),before,mode);
 for(const kind of ['eat','drink','bubble','wave','warm','roast','tea','dining','rest','skate']){
  const metadata=activityCameraView(kind,{yaw:3,mobile:true});assert.equal(metadata.keepUserView,true);
  for(const key of ['yaw','pitch','distance','fov'])assert.equal(metadata[key],undefined);
 }
});

test('jump height never changes the walking focus or orbital camera',()=>{
 const base={x:3,y:.86,z:5},expected=cameraSubjectFocus(base,{groundY:.86});
 const expectedCamera=cameraOrbitPosition(expected,cameraDefaults);
 for(const jump of [0,.25,.7,.8,.2,0]){
  const focus=cameraSubjectFocus({...base,y:base.y+jump},{groundY:.86});
  assert.deepEqual(focus,expected);assert.deepEqual(cameraOrbitPosition(focus,cameraDefaults),expectedCamera);
 }
 near(followCameraHeight(1.31,1.36,1/60),1.31);
 assert.ok(followCameraHeight(1.31,4,1/60)-1.31<=3/60+1e-9);
});

test('carousel bob is cancelled while lift and ferris retain their physical seat height',()=>{
 for(const y of [.4,.9,1.5,.8])near(cameraSubjectFocus({x:2,y,z:3},{mode:'carousel',view:{lookHeight:2.85-y-1.2}}).y,2.85);
 for(const mode of ['ferris','lift']){
  const focus=cameraSubjectFocus({x:20,y:18,z:22},{mode,view:{focus:{x:21,z:23}}});
  assert.deepEqual(focus,{x:21,z:23,y:18+cameraDefaults.focusHeight});
 }
});

test('tree framing is small and closing it preserves newer manual edits',()=>{
 const policy=createCameraPolicy(),before=policy.snapshot();policy.beginTree();
 const framed={...policy.view()};assert.ok(framed.distance-before.distance<=3);assert.ok(framed.distance<20);near(framed.yaw,before.yaw);near(framed.pitch,before.pitch);
 policy.orbit(19,20);policy.zoom(-1,framed.distance);const changed=viewFields(policy.view());policy.endTree();
 assert.deepEqual(viewFields(policy.view()),changed,'closing a tree must not restore an old view over user input');
 policy.reset();policy.beginTree();policy.endTree();near(policy.view().distance,cameraDefaults.distance);
});

test('indoor view is remembered separately and map departure consumes the outdoor snapshot',()=>{
 const policy=createCameraPolicy();policy.orbit(45,30);policy.zoom(4);const outside=viewFields(policy.view());
 policy.setContext('ryokan');const insideStart=viewFields(policy.view());near(insideStart.yaw,cameraDefaults.interiorYaw);near(insideStart.pitch,cameraDefaults.interiorPitch);near(insideStart.fov,outside.fov);near(insideStart.distance,15);
 policy.orbit(-20,13);policy.zoom(-2);const inside=viewFields(policy.view());policy.setContext(null);assert.deepEqual(viewFields(policy.view()),outside);
 policy.setContext('ryokan');assert.deepEqual(viewFields(policy.view()),inside);policy.setContext(null);
 policy.orbit(5,-2);policy.zoom(1);const afterMap=viewFields(policy.view());policy.setContext(null);assert.deepEqual(viewFields(policy.view()),afterMap);
 policy.setContext('museum');policy.setContext(null);assert.deepEqual(viewFields(policy.view()),afterMap,'another room must not restore a stale exterior view');
});

test('higher interior preset fits real entry bounds and all three dining seats without collapsing to a close view',()=>{
 for(const room of Object.values(interiorRooms)){
  assert.ok(canStandAt(room.entry.x,room.entry.z));const policy=createCameraPolicy();policy.setContext(room.id);
  const view={...policy.view()},focus=cameraSubjectFocus({...room.entry,y:room.floor+.86},{groundY:room.floor+.86}),point=cameraOrbitPosition(focus,view);
  constrainCameraToRoom(focus,point,room);near(Math.hypot(point.x-focus.x,point.y-focus.y,point.z-focus.z),15,1e-6);near(Math.atan2(point.y-focus.y,Math.hypot(point.x-focus.x,point.z-focus.z)),.65);
 }
 for(const seat of diningSeats){const policy=createCameraPolicy();policy.setContext('ryokan');const focus=cameraSubjectFocus(seat,{mode:'dining'}),point=cameraOrbitPosition(focus,policy.view());constrainCameraToRoom(focus,point,interiorRooms.ryokan);assert.ok(Math.hypot(point.x-focus.x,point.y-focus.y,point.z-focus.z)>=14.8);near(direction(point,focus).y,Math.sin(.65));}
});

test('ski may follow heading slowly but never changes pitch, zoom or FOV with speed',()=>{
 const policy=createCameraPolicy();policy.orbit(0,25);policy.zoom(3);
 const before=policy.snapshot();for(const heading of [-2,-.4,0,1.1,3]){
  const view=policy.view({mode:'ski',heading});assert.equal(view.automaticYaw,true);near(view.yaw,heading+Math.PI);near(view.pitch,before.pitch);near(view.distance,before.distance);near(view.fov,cameraDefaults.fov);
 }
 const renderedYaw=2;policy.orbit(12,0,renderedYaw);const manual=viewFields(policy.view({mode:'ski',heading:1}));
 assert.equal(policy.view().automaticYaw,false);assert.deepEqual(viewFields(policy.view({mode:'ski',heading:-1})),manual);
 assert.deepEqual(viewFields(policy.view({mode:'',renderedYaw})),manual);
 const automatic=createCameraPolicy();automatic.view({mode:'ski',heading:0});automatic.view({mode:'',renderedYaw:2.7});near(automatic.snapshot().yaw,2.7);
 const delta=smoothCameraAngle(0,Math.PI,1/60,{automatic:true});assert.ok(Math.abs(delta)<=1.6/60+1e-9);
 const skier={x:2,y:4,z:5},focus=cameraSubjectFocus(skier,{mode:'ski',groundY:3.9,heading:1});near(focus.x,skier.x);near(focus.z,skier.z);
});

test('room-edge focus and observatory roof never produce a zero ray or change the viewing angle',()=>{
 for(const room of Object.values(interiorRooms))for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
  const focus={x:room.x+(room.rx-.6)*Math.sin(yaw),y:1.4,z:room.z+(room.rz-.6)*Math.cos(yaw)};
  constrainCameraFocusToRoom(focus,room);const point=cameraOrbitPosition(focus,{yaw,pitch:.8,distance:24}),original=direction(point,focus);
  constrainCameraToRoom(focus,point,room);assert.ok(Math.hypot(point.x-focus.x,point.y-focus.y,point.z-focus.z)>.3);assert.ok(direction(point,focus).distanceTo(original)<1e-9);
  if(room.id==='museum'){const radius=Math.hypot(point.x-room.x,point.z-room.z);assert.ok(point.y<=5.5+Math.sqrt(Math.max(0,21.6**2-radius**2))+1e-9);}
 }
});

test('room boundaries shorten a viewing ray without changing direction or requested zoom',()=>{
 for(const room of Object.values(interiorRooms))for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
  const focus={x:room.x,y:1.4,z:room.z},policy=createCameraPolicy();policy.orbit(0,60);policy.zoom(20);
  const requested=policy.snapshot(),point=cameraOrbitPosition(focus,{...policy.view(),yaw}),original=direction(point,focus);
  constrainCameraToRoom(focus,point,room);assert.ok(direction(point,focus).distanceTo(original)<1e-9);
  assert.ok(point.x>=room.x-room.rx+1-1e-9&&point.x<=room.x+room.rx-1+1e-9);
  assert.ok(point.z>=room.z-room.rz+1-1e-9&&point.z<=room.z+room.rz-1+1e-9);
  assert.ok(point.y<=room.ceiling-.45+1e-9);assert.deepEqual(policy.snapshot(),requested);
 }
});

test('terrain retraction preserves the ray and low views never collapse on flat ground',()=>{
 for(const height of [.45,1.31])for(const distance of [8,10,16.5]){
  const focus={x:0,y:height,z:0},point=cameraOrbitPosition(focus,{yaw:.33,pitch:.08,distance}),before={...point};
  constrainCameraToTerrain(focus,point,()=>0);assert.deepEqual(point,before);
 }
 const focus={x:0,y:1.31,z:0},point=cameraOrbitPosition(focus,{yaw:0,pitch:.3,distance:20}),original=direction(point,focus),before=new T.Vector3(point.x,point.y,point.z).distanceTo(new T.Vector3(0,1.31,0));
 constrainCameraToTerrain(focus,point,(_x,z)=>z>5?8:0);
 assert.ok(direction(point,focus).distanceTo(original)<1e-9);assert.ok(new T.Vector3(point.x,point.y,point.z).distanceTo(new T.Vector3(0,1.31,0))<before);assert.ok(point.z<=5.01);
});

test('world-up orbit keeps horizon roll zero and explicit reset restores one fixed view',()=>{
 const policy=createCameraPolicy();policy.orbit(700,300);policy.zoom(200);const focus=new T.Vector3(3,2,1),camera=new T.PerspectiveCamera(cameraDefaults.fov);
 cameraOrbitPosition(focus,policy.view(),camera.position);camera.up.set(0,1,0);camera.lookAt(focus);camera.updateMatrixWorld();
 const right=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,0);near(right.y,0);
 policy.reset();assert.deepEqual(viewFields(policy.view()),viewFields(cameraDefaults));policy.setContext('ryokan');policy.zoom(7);policy.reset();near(policy.view().distance,15);near(policy.view().pitch,.65);near(policy.view().fov,50);
});

test('upward orbit keeps the eye above the ground and reaches the fireworks sky',()=>{
 const policy=createCameraPolicy();policy.orbit(0,-1000);const view=policy.view(),subject={x:0,y:1.31,z:0},aim=cameraOrbitFocus(subject,view),eye=cameraOrbitPosition(aim,view);
 near(view.pitch,-.95);near(eye.y,subject.y);assert.ok(aim.y>eye.y+10);const before={...eye};constrainCameraToTerrain(aim,eye,()=>0);assert.deepEqual(eye,before);
});
test('whole-canopy framing is temporary, with direct user control taking priority',()=>{
 const policy=createCameraPolicy(),before={...policy.view()};policy.beginTree({yaw:1,pitch:.1,distance:48});near(policy.view().distance,48);policy.endTree();assert.deepEqual({...policy.view()},before);
 policy.beginTree({yaw:1,pitch:.1,distance:48});policy.orbit(20,-30);const manual={...policy.view()};policy.endTree();assert.deepEqual({...policy.view()},manual);
});
