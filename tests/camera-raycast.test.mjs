import test from 'node:test';import assert from 'node:assert/strict';import * as T from '../dist/vendor/three.module.js';import {nearestCameraSurface} from '../dist/camera-raycast.js';
test('accelerated camera sweeps match exact triangles under transforms and material sides',()=>{
 const mesh=new T.Mesh(new T.TorusGeometry(5,2,64,128),new T.MeshStandardMaterial());mesh.position.set(11,2,-9);mesh.rotation.set(.2,.7,.1);mesh.scale.set(1.4,.8,1.2);mesh.updateMatrixWorld(true);
 for(const side of [T.FrontSide,T.BackSide,T.DoubleSide]){mesh.material.side=side;for(let i=0;i<100;i++){const origin=new T.Vector3(11+Math.sin(i*2.39)*12,2+Math.cos(i*.3)*9,-9+Math.cos(i*2.39)*12),direction=mesh.position.clone().sub(origin).normalize(),ray=new T.Raycaster(origin,direction,.22,30),expected=ray.intersectObject(mesh,false)[0],actual=nearestCameraSurface(mesh,ray);assert.equal(!!actual,!!expected);if(expected)assert.ok(Math.abs(expected.distance-actual.distance)<1e-7);}}
});
test('cached camera bounds rebuild after position/index edits and obey draw ranges',()=>{
 const geometry=new T.TorusGeometry(5,2,32,64),mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({side:T.DoubleSide}));mesh.updateMatrixWorld(true);const ray=new T.Raycaster(new T.Vector3(5,0,10),new T.Vector3(0,0,-1),.1,20);
 for(const edit of [()=>{},()=>{geometry.translate(1,0,0);geometry.computeBoundingBox();geometry.computeBoundingSphere();},()=>geometry.setDrawRange(0,geometry.index.count/2)]){
  edit();const actual=nearestCameraSurface(mesh,ray),expected=ray.intersectObject(mesh,false)[0];assert.equal(!!actual,!!expected);if(actual)assert.ok(Math.abs(actual.distance-expected.distance)<1e-7);
 }
 const index=geometry.index;for(let i=0;i<index.count;i++)index.setX(i,0);index.needsUpdate=true;assert.equal(nearestCameraSurface(mesh,ray),null);
});
