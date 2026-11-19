import test from 'node:test';import assert from 'node:assert/strict';import * as T from '../dist/vendor/three.module.js';import {createCameraClearance} from '../dist/camera-clearance.js';
test('camera retracts before an actual wall in every facility and recovers smoothly',()=>{for(const mode of ['walk','ferris','carousel','lift','ski','ryokan']){const guard=createCameraClearance(),camera=new T.PerspectiveCamera(),focus=new T.Vector3(0,1,0),wall=new T.Mesh(new T.BoxGeometry(4,5,.3),new T.MeshStandardMaterial());wall.position.set(0,1,5);wall.updateMatrixWorld(true);camera.position.set(0,1,10);guard.update(camera,focus,[wall],1/60,{mode});assert.ok(camera.position.z<4.8,mode);wall.visible=false;for(let i=0;i<180;i++){camera.position.set(0,1,10);guard.update(camera,focus,[wall],1/60,{mode});}assert.ok(camera.position.z>9.8);}});
test('only occluding tagged cabin panels fade; shared materials and opacity restore',()=>{const guard=createCameraClearance(),camera=new T.PerspectiveCamera(),focus=new T.Vector3(),mat=new T.MeshStandardMaterial(),wall=new T.Mesh(new T.BoxGeometry(5,5,.1),mat),other=new T.Mesh(new T.BoxGeometry(1,1,1),mat);wall.position.z=1;wall.userData.ferrisCameraFade=true;wall.updateMatrixWorld(true);camera.position.set(0,0,6);guard.update(camera,focus,[wall],.05,{mode:'ferris',minDistance:4});assert.equal(guard.fadedCount,1);assert.notEqual(wall.material,mat);assert.equal(other.material.opacity,1);guard.reset();assert.equal(wall.material,mat);assert.equal(mat.transparent,false);assert.equal(guard.fadedCount,0);});

test('camera detects translated instanced obstacles outside the base geometry bounds',()=>{const object=new T.InstancedMesh(new T.BoxGeometry(3,4,.5),new T.MeshStandardMaterial(),1);object.setMatrixAt(0,new T.Matrix4().makeTranslation(40,1,5));object.updateMatrixWorld(true);const camera=new T.PerspectiveCamera(),guard=createCameraClearance();camera.position.set(40,1,10);guard.update(camera,new T.Vector3(40,1,0),[object],.05,{mode:'walk'});assert.ok(camera.position.z<5);});

test('lift supports dissolve only while blocking the rider view, without pumping camera distance',()=>{const guard=createCameraClearance(),camera=new T.PerspectiveCamera(),focus=new T.Vector3(0,2,0),material=new T.MeshStandardMaterial(),tower=new T.Mesh(new T.BoxGeometry(.5,6,1),material);tower.userData={rideCameraFade:true,cameraFadeMode:'lift'};tower.position.set(0,2,12);tower.updateMatrixWorld(true);camera.position.set(0,2,24);guard.update(camera,focus,[tower],1/60,{mode:'lift',minDistance:4.2});assert.equal(camera.position.z,24);assert.equal(guard.fadedCount,1);guard.reset();assert.equal(tower.material,material);camera.position.set(0,2,24);guard.update(camera,focus,[tower],1/60,{mode:'walk'});assert.ok(camera.position.z<12);assert.equal(guard.fadedCount,0);});

test('bath camera recovery has a speed limit after a rock stops occluding the view',()=>{
 const guard=createCameraClearance(),camera=new T.PerspectiveCamera(),focus=new T.Vector3(0,1,0),wall=new T.Mesh(new T.BoxGeometry(4,5,.3),new T.MeshStandardMaterial());wall.position.set(0,1,2);wall.updateMatrixWorld(true);camera.position.set(0,1,15);guard.update(camera,focus,[wall],1/60,{mode:'bath',maxRecoverySpeed:4});wall.visible=false;let previous=camera.position.distanceTo(focus);
 for(let i=0;i<90;i++){camera.position.set(0,1,15);guard.update(camera,focus,[wall],1/60,{mode:'bath',maxRecoverySpeed:4});const next=camera.position.distanceTo(focus);assert.ok(next-previous<=4/60+1e-9);previous=next;}
 assert.ok(previous>5);
});

test('activity changes do not bypass collision recovery and pre-constrained rays stay short',()=>{
 const guard=createCameraClearance(),camera=new T.PerspectiveCamera(),focus=new T.Vector3(0,1,0),wall=new T.Mesh(new T.BoxGeometry(4,5,.3),new T.MeshStandardMaterial());wall.position.set(0,1,2);wall.updateMatrixWorld(true);
 camera.position.set(0,1,16.5);guard.update(camera,focus,[wall],1/60,{mode:'walk',maxRecoverySpeed:3.5});const previous=camera.position.distanceTo(focus);wall.visible=false;
 camera.position.set(0,1,16.5);guard.update(camera,focus,[wall],1/60,{mode:'carousel',maxRecoverySpeed:3.5});assert.ok(camera.position.distanceTo(focus)-previous<=3.5/60+1e-9);
 for(const shortened of [.5,1,3]){camera.position.set(0,1,shortened);guard.update(camera,focus,[],1/60,{mode:'carousel',maxRecoverySpeed:3.5});assert.ok(camera.position.distanceTo(focus)<=shortened+1e-9,'room/terrain distance must never be expanded by clearance');}
});


test('main tree foliage never collapses walking camera while a solid wall still does',()=>{
 const guard=createCameraClearance(),camera=new T.PerspectiveCamera(),focus=new T.Vector3(0,1,0),material=new T.MeshStandardMaterial();
 const foliage=new T.Mesh(new T.BoxGeometry(3,5,2),material);foliage.userData.cameraFoliage=true;foliage.position.set(0,1,3);foliage.updateMatrixWorld(true);
 camera.position.set(0,1,16.5);guard.update(camera,focus,[foliage],1/60,{mode:'walk'});assert.equal(camera.position.z,16.5);assert.equal(guard.fadedCount,1);
 const wall=new T.Mesh(new T.BoxGeometry(4,6,.3),material);wall.position.set(0,1,10);wall.updateMatrixWorld(true);
 for(let i=0;i<4;i++){camera.position.set(0,1,16.5);guard.update(camera,focus,[foliage,wall],1/60,{mode:'walk'});}
 assert.ok(camera.position.z<10);assert.equal(wall.material,material);guard.reset();assert.equal(foliage.material,material);
});


test('carousel structures beyond the seat fade without collapsing the wider view',()=>{
 const guard=createCameraClearance(),camera=new T.PerspectiveCamera(),focus=new T.Vector3(0,3,0),material=new T.MeshStandardMaterial();
 const column=new T.Mesh(new T.BoxGeometry(.5,6,.5),material);column.position.set(0,3,9);column.userData={rideCameraFade:true,cameraFadeMode:'carousel'};column.updateMatrixWorld(true);
 camera.position.set(0,3,24);guard.update(camera,focus,[column],1/60,{mode:'carousel',minDistance:4.2});assert.equal(camera.position.z,24);assert.equal(guard.fadedCount,1);
 guard.reset();camera.position.set(0,3,24);guard.update(camera,focus,[column],1/60,{mode:'walk'});assert.ok(camera.position.z<9);assert.equal(guard.fadedCount,0);
});
