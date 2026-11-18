import {spaToLocal} from '../dist/spa-transform.js';
import test from 'node:test';import assert from 'node:assert/strict';import * as T from '../dist/vendor/three.module.js';
import {buildConnectedTerrain} from '../dist/connected-terrain.js';import {landforms,landDistance} from '../dist/world-layout.js';
test('every island snow cap is closed except intentional bath openings; bridge air remains air',()=>{
 const scene=new T.Scene(),land=buildConnectedTerrain(scene);scene.updateMatrixWorld(true);
 for(const form of landforms.filter(f=>f.id!=='alpine')){const cap=land.getObjectByName('snow-cap-'+form.id);
  for(let x=form.x-form.rx;x<form.x+form.rx;x+=2.5)for(let z=form.z-form.rz;z<form.z+form.rz;z+=2.5){
   if(landDistance(x,z,form)>-1)continue;
   const local=spaToLocal({x,z});if(form.id==='spa'&&[{x:-10,z:124,rx:8.1,rz:7.2},{x:-19,z:132,rx:4.4,rz:3.9}].some(p=>((local.x-p.x)/p.rx)**2+((local.z-p.z)/p.rz)**2<1))continue;
   const ray=new T.Raycaster(new T.Vector3(x,20,z),new T.Vector3(0,-1,0),0,40);assert.ok(ray.intersectObject(cap).length,`missing snow at ${x},${z}`);
  }
 }
 assert.equal(land.children.filter(o=>o.name.startsWith('layered-cliff')).length,5);
 const air=new T.Raycaster(new T.Vector3(0,20,43),new T.Vector3(0,-1,0),0,100);assert.equal(air.intersectObject(land,true).length,0,'the tree bridge spans real air');
 for(const cliff of land.children.filter(o=>o.name.startsWith('layered-cliff'))){const geometry=cliff.geometry;for(const v of geometry.attributes.position.array)assert.ok(Number.isFinite(v));geometry.computeBoundingBox();assert.ok(geometry.boundingBox.min.y< -20);}
});
