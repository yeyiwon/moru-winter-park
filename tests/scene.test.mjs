import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';import os from 'node:os';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../dist');const noop=()=>{};const context=vm.createContext({console,Float32Array,Uint16Array,Uint32Array,Int32Array,Uint8Array,Math,Date,performance,document:{createElement:()=>({width:256,height:256,getContext:()=>({fillRect:noop,createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop})})})}});const modules=new Map();
async function mod(file){if(modules.has(file))return modules.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});modules.set(file,m);await m.link(s=>mod(path.resolve(path.dirname(file),s)));return m;}
const w=await mod(path.join(root,'themepark-world.js'));await w.evaluate();const c=await mod(path.join(root,'companion.js'));await c.evaluate();const T=modules.get(path.join(root,'vendor/three.module.js')).namespace;const scene=new T.Scene();const start=performance.now(),world=w.namespace.buildWorld(scene),ms=performance.now()-start;scene.updateMatrixWorld(true);let count=0,triangles=0,materials=new Set();scene.traverse(o=>{if(o.isMesh){count++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;materials.add(o.material.uuid);}});
const character=c.namespace.createCompanion();
test('scene geometry and normals are finite and share a bounded material palette',()=>{scene.traverse(o=>{if(o.isMesh)for(const [name,a]of Object.entries(o.geometry.attributes))for(const v of a.array)assert.ok(Number.isFinite(v),name);});assert.ok(materials.size<140);assert.ok(count<400);assert.equal(world.markers.length,10);for(const r of world.markers)assert.ok(Math.hypot(r.root.position.x-r.door.x,r.root.position.z-r.door.z)>1,'arrival does not overlap a plaque');});
test('the visible gate and bridge geometry leave the central walking corridor open',()=>{for(const x of [-.6,0,.6]){const ray=new T.Raycaster(new T.Vector3(x,.8,8),new T.Vector3(0,0,-1),0,43);const hits=ray.intersectObjects(world.occluders,false);assert.equal(hits.length,0,hits[0]?.point?.toArray().join(','));}});
test('conservatory front and rear openings are clear through actual glazing and frame geometry',()=>{
 const physical=[];scene.traverseVisible(o=>{if(o.isMesh&&o.material.opacity!==0&&!o.material.isShaderMaterial)physical.push(o);});
 for(const sign of [-1,1])for(const x of [-.6,0,.6])for(const y of [.8,1.6]){
  const ray=new T.Raycaster(new T.Vector3(x,y,53+sign*5.5),new T.Vector3(0,0,-sign),0,2.1);
  const hits=ray.intersectObjects(physical,false);assert.equal(hits.length,0,hits[0]?.point?.toArray().join(','));
 }
});
test('velvet character has continuous surface, no fibres, and grounded feet in neutral pose',()=>{character.pose({still:true});character.group.updateMatrixWorld(true);let meshes=0;character.group.traverse(o=>{assert.ok(!o.isInstancedMesh);if(o.isMesh){meshes++;for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));}});assert.ok(meshes<15);for(const foot of character.feet){const b=new T.Box3().setFromObject(foot);assert.ok(Math.abs(b.min.y+.86)<.01);}character.group.position.y=.95;character.group.updateMatrixWorld(true);for(const foot of character.feet){const b=new T.Box3().setFromObject(foot);assert.ok(Math.abs(b.min.y-.09)<.01,'world feet rest on the path');}for(const yaw of [0,Math.PI/2,Math.PI]){character.group.rotation.y=yaw;const b=new T.Box3().setFromObject(character.group);assert.ok(b.getSize(new T.Vector3()).y<1.8);}});
test('supporting feet remain grounded through walking, landing and customization',()=>{
 character.group.position.set(0,0,0);character.group.rotation.y=0;
 for(const roundness of [0,50,100])for(const landing of [0,.65,1])for(const phase of [0,.8,1.6,3.2,4.8]){
  character.customize({roundness});character.pose({walking:true,phase,landing});character.group.updateMatrixWorld(true);
  const point=new T.Vector3();let min=Infinity;
  for(const foot of character.feet){const p=foot.geometry.attributes.position;for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(foot.matrixWorld);min=Math.min(min,point.y);}}
  assert.ok(Math.abs(min+.86)<.002,`${roundness}/${landing}/${phase}: ${min}`);
 }
});
fs.mkdirSync(path.resolve(root,'../qa'),{recursive:true});fs.writeFileSync(path.resolve(root,'../qa/scene-metrics.json'),JSON.stringify({environment:`Node ${process.version} ${os.platform()} ${os.arch()}`,measurement:'CPU scene geometry construction; no browser, WebGL or GPU rendering',sceneConstructionMs:+ms.toFixed(2),meshObjects:count,materials:materials.size,triangles,renderFPS:null,browserVisualVerification:'not available; separate CPU mesh renders are documented in qa-report.md'},null,2));
