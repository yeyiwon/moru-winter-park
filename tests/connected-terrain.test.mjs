import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildConnectedTerrain} from '../dist/connected-terrain.js';
import {terrainAt,landforms,landRadius} from '../dist/world-layout.js';
test('floating caps support each walkable rink approach and expose real air between islands',()=>{
 const scene=new T.Scene(),land=buildConnectedTerrain(scene);scene.updateMatrixWorld(true);
 for(let x=-88;x<=-27;x+=3)for(let z=76;z<=116;z+=3){
  if(!terrainAt(x,z))continue;
  const ray=new T.Raycaster(new T.Vector3(x,20,z),new T.Vector3(0,-1,0),0,40);
  assert.ok(ray.intersectObject(land,true).length,`missing snow at ${x},${z}`);
 }
 assert.equal(terrainAt(20,81),false,'air separates greenhouse and spa');
 assert.equal(land.children.filter(o=>o.name.startsWith('layered-cliff')).length,landforms.length);
});
