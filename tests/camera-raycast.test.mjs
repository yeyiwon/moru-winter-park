import test from 'node:test';import assert from 'node:assert/strict';import * as T from '../dist/vendor/three.module.js';import {nearestCameraSurface} from '../dist/camera-raycast.js';
test('accelerated camera sweeps match exact triangles under transforms and material sides',()=>{
 const mesh=new T.Mesh(new T.TorusGeometry(5,2,64,128),new T.MeshStandardMaterial());mesh.position.set(11,2,-9);mesh.rotation.set(.2,.7,.1);mesh.scale.set(1.4,.8,1.2);mesh.updateMatrixWorld(true);
 for(const side of [T.FrontSide,T.BackSide,T.DoubleSide]){mesh.material.side=side;for(let i=0;i<100;i++){const origin=new T.Vector3(11+Math.sin(i*2.39)*12,2+Math.cos(i*.3)*9,-9+Math.cos(i*2.39)*12),direction=mesh.position.clone().sub(origin).normalize(),ray=new T.Raycaster(origin,direction,.22,30),expected=ray.intersectObject(mesh,false)[0],actual=nearestCameraSurface(mesh,ray);assert.equal(!!actual,!!expected);if(expected)assert.ok(Math.abs(expected.distance-actual.distance)<1e-7);}}
});
