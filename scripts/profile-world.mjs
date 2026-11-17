import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import os from 'node:os';
const root=path.resolve('dist'),noop=()=>{},gradient={addColorStop:noop};
Date.now=()=>1794919044000;
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>new Proxy({measureText:t=>({width:t.length*24}),createRadialGradient:()=>gradient,createLinearGradient:()=>gradient},{get:(o,k)=>o[k]||noop})})};
async function module(name){return import(pathToFileURL(path.join(root,name+'.js')));}
const {buildWorld}=await module('themepark-world'),T=await module('vendor/three.module'),{createCameraClearance}=await module('camera-clearance'),{createCompanion}=await module('companion');
const optimized=fs.existsSync(path.join(root,'local-lights.js'));
const {createLocalLights}=optimized?await module('local-lights'):{}, {projectedCharacterHeight}=optimized?await module('render-budget'):{};
const scene=new T.Scene(),start=performance.now(),world=buildWorld(scene),constructionMs=performance.now()-start;scene.updateMatrixWorld(true);
console.log('World constructed:',Math.round(constructionMs),'ms');
const pet=createCompanion();pet.group.position.set(0,.95,24);scene.add(pet.group);
const localLights=optimized?createLocalLights(scene):null;
const cameras=[{name:'plaza',focus:[0,2,24],eye:[15,16,46]},{name:'castle',focus:[0,9,-26],eye:[30,25,12]},{name:'ski',focus:[-30,26,-160],eye:[-12,40,-133]}];
const summaries=[],measure=fn=>{const t=performance.now();fn();return performance.now()-t;};
for(const view of cameras){const camera=new T.PerspectiveCamera(50,16/9,.1,1200),eye=new T.Vector3(...view.eye),focus=new T.Vector3(...view.focus),clearance=createCameraClearance();camera.position.copy(eye);camera.lookAt(focus);camera.updateMatrixWorld();if(optimized){localLights.update(1,camera,focus);pet.setViewDetail(projectedCharacterHeight(camera,pet.group.position,900));}const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));let calls=0,triangles=0,pointLights=0,shadowTriangles=0;
 scene.traverseVisible(o=>{if(o.isPointLight&&o.layers.test(camera.layers)&&o.intensity>0)pointLights++;if(!o.isMesh||!(!o.frustumCulled||frustum.intersectsObject(o)))return;const count=Math.min(o.geometry.drawRange.count,o.geometry.index?.count||o.geometry.attributes.position.count)*(o.isInstancedMesh?o.count:1)/3;triangles+=count;if(o.castShadow)shadowTriangles+=count;calls+=o.geometry.groups.length||1;});
 const coldCameraMs=measure(()=>clearance.update(camera,focus,world.occluders,1/60));const frames=[];
 for(let i=0;i<60;i++)frames.push(measure(()=>{world.update(i/60,false);pet.pose({time:i/60,walking:true,phase:i/10});scene.updateMatrixWorld(true);camera.position.copy(eye);clearance.update(camera,focus,world.occluders,1/60);localLights?.update(1/60,camera,focus);scene.updateMatrixWorld();}));
 frames.sort((a,b)=>a-b);summaries.push({name:view.name,visibleMeshDraws:calls,visibleTriangles:Math.round(triangles),shadowTriangles:Math.round(shadowTriangles),pointLights,coldCameraMs,updateMeanMs:frames.reduce((a,b)=>a+b)/frames.length,updateP95Ms:frames[Math.floor(frames.length*.95)]});console.log(view.name,JSON.stringify(summaries.at(-1)));
}
const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
const unique=new Set(meshes.map(mesh=>mesh.geometry)),geometryBytes=[...unique].reduce((sum,g)=>sum+Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(g.index?.array.byteLength||0),0);
const result={geometryBytes,geometryVertices:[...unique].reduce((sum,g)=>sum+g.attributes.position.count,0),environment:`Node ${process.version} ${os.platform()} ${os.arch()}`,measurement:'CPU-only scene construction/update and frustum workload estimates. No browser/GPU FPS measurement.',constructionMs,meshObjects:meshes.length,occluders:world.occluders.length,sceneTriangles:Math.round(meshes.reduce((sum,o)=>sum+(o.geometry.index?.count||o.geometry.attributes.position.count)*(o.isInstancedMesh?o.count:1)/3,0)),views:summaries};
if(process.argv[2]){fs.mkdirSync(path.dirname(process.argv[2]),{recursive:true});fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2));}else console.log(JSON.stringify(result,null,2));
