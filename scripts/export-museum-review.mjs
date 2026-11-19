// Geometry-only inspection data. This is not a WebGL or GPU performance capture.
import fs from 'node:fs';
import path from 'node:path';
import * as T from '../dist/vendor/three.module.js';
import {buildMuseumInterior} from '../dist/museum-world.js';
import {materials} from '../dist/architecture-kit.js';
import {disposeOwnedScene} from '../dist/scene-resources.js';

const output=path.resolve(process.argv[2]||'.winter-build/museum-review');
const root=new T.Group(),asset=buildMuseumInterior(root,materials()),records=[];
const metric={renderableObjects:0,meshes:0,meshTriangles:0,transparentObjects:0,lights:0};
root.updateMatrixWorld(true);
root.traverse(object=>{
 if(object.geometry)metric.renderableObjects++;
 if(object.isMesh){metric.meshes++;metric.meshTriangles+=(object.geometry.index?.count||object.geometry.attributes.position.count)/3;}
 if(object.material?.transparent)metric.transparentObjects++;
 if(object.isLight)metric.lights++;
 if(!object.geometry||Array.isArray(object.material)||object.material.isShaderMaterial)return;
 const geometry=object.geometry,material=object.material;
 records.push({name:object.name||'museum-part',type:object.isMesh?'mesh':object.isLineSegments?'lines':'points',positions:[...geometry.attributes.position.array],indices:geometry.index?[...geometry.index.array]:null,matrix:object.matrixWorld.toArray(),material:{color:material.color?.toArray()||[.3,.4,.5],emissive:material.emissive?.toArray()||[0,0,0],strength:material.emissiveIntensity||0,roughness:material.roughness??.5,metalness:material.metalness||0,opacity:material.transparent?material.opacity:1}});
});
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'museum.json'),JSON.stringify({records}));
fs.writeFileSync(path.join(output,'scene-metrics.json'),JSON.stringify({kind:'constructed-scene-counts',baseline:{renderableObjects:63,meshes:61,meshTriangles:143355,transparentObjects:5,lights:2},current:metric,rendererDrawCalls:null,gpuMs:null,deviceFps:null,note:'Counts from Three.js scene construction; not renderer.info.render.calls. Baseline was measured before this museum interior change. CPU image omits procedural shader layers and uses inspection lights.'},null,2)+'\n');
asset.dispose();asset.atmosphere.dispose();disposeOwnedScene(root);
console.log(JSON.stringify({output,...metric}));
