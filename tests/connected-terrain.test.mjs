import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildConnectedTerrain} from '../dist/connected-terrain.js';

test('rink approaches and outside snow banks have continuous visible ground',()=>{
 const scene=new T.Scene(),land=buildConnectedTerrain(scene);scene.updateMatrixWorld(true);
 for(let x=-88;x<=-27;x+=3)for(let z=76;z<=116;z+=3){
  const ray=new T.Raycaster(new T.Vector3(x,20,z),new T.Vector3(0,-1,0),0,40);
  assert.ok(ray.intersectObject(land).length,`exposed ground at ${x},${z}`);
 }
 land.geometry.dispose();land.material.dispose();
});
