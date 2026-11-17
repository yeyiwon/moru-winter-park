import {spaShift} from '../dist/resort-layout.js';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';import os from 'node:os';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../dist');const noop=()=>{};const context=vm.createContext({console,Float32Array,Uint16Array,Uint32Array,Int32Array,Uint8Array,Math,Date,performance,document:{createElement:()=>({width:256,height:256,getContext:()=>({fillText:noop,strokeRect:noop,measureText:t=>({width:t.length*24}),fillRect:noop,createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop})})})}});const modules=new Map(),pending=new Map();
async function mod(file){if(pending.has(file))return pending.get(file);const promise=(async()=>{const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});modules.set(file,m);await m.link(s=>mod(path.resolve(path.dirname(file),s.split('?')[0])));return m;})();pending.set(file,promise);return promise;}
const w=await mod(path.join(root,'themepark-world.js'));await w.evaluate();const c=await mod(path.join(root,'companion.js'));await c.evaluate();const T=modules.get(path.join(root,'vendor/three.module.js')).namespace;const scene=new T.Scene();const start=performance.now(),world=w.namespace.buildWorld(scene),ms=performance.now()-start;scene.updateMatrixWorld(true);let count=0,triangles=0,materials=new Set();scene.traverse(o=>{if(o.isMesh){count++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;materials.add(o.material.uuid);}});
const character=c.namespace.createCompanion();
test('mountain trees survive geometry batching and keep their illuminated route edges',()=>{
 const mountain=scene.getObjectByName('alpine-mountain'),trees=[];mountain.traverse(o=>{if(o.name==='alpine-fir')trees.push(o);});
 assert.ok(trees.length>=150);assert.ok(trees.filter(o=>o.userData.forestTree.decorated).length>=16);
 const lights=mountain.getObjectByName('alpine-tree-illumination');assert.ok(lights);assert.ok(lights.getObjectByName('winter-tree-fairy-lights').geometry.drawRange.count>=16*222);
 const ribbons=lights.getObjectByName('winter-tree-flowing-light-ribbons');assert.ok(ribbons.geometry.attributes.position.count>0);world.winter.setQuality('low');assert.equal(ribbons.material.uniforms.quality.value,.35);world.winter.setQuality('high');
});
test('scene geometry and normals are finite and share a bounded material palette',()=>{scene.traverse(o=>{if(o.isMesh)for(const [name,a]of Object.entries(o.geometry.attributes))for(const v of a.array)assert.ok(Number.isFinite(v),name);});assert.ok(materials.size<225);assert.ok(count<1000,'48-unit batches permit culling; keep the total bounded');const geometrySet=new Set();scene.traverse(o=>{if(o.geometry)geometrySet.add(o.geometry);});const bytes=[...geometrySet].reduce((n,g)=>n+Object.values(g.attributes).reduce((k,a)=>k+a.array.byteLength,0)+(g.index?.array.byteLength||0),0);assert.ok(bytes<200*1024**2,'indexed landmark buffers stay within the geometry budget');assert.ok(triangles<4500000);assert.equal(world.markers.length,0);for(const r of world.markers)assert.ok(Math.hypot(r.root.position.x-r.door.x,r.root.position.z-r.door.z)>1,'arrival does not overlap a plaque');});
test('arched bridges leave headroom above the actual walking surface',()=>{const layout=modules.get(path.join(root,'world-layout.js')).namespace;for(let z=8;z>-35;z-=.4)for(const x of [-.6,0,.6]){const y=layout.surfaceHeight(x,z)+.8;const ray=new T.Raycaster(new T.Vector3(x,y,z),new T.Vector3(0,0,-1),0,.2);const hits=ray.intersectObjects(world.occluders,false);assert.equal(hits.length,0,`${x},${y},${z} ${hits[0]?.object.name} ${hits[0]?.object.material.color?.getHexString()} ${hits[0]?.point.toArray()}`);}});
test('the direct spa bridge has no leftover greenhouse, glazing or columns',()=>{
 const physical=[];scene.traverseVisible(o=>{if(o.isMesh&&o.material.opacity!==0&&!o.material.isShaderMaterial)physical.push(o);});
 for(let z=30;z<91+spaShift;z+=1)for(const x of [-.7,0,.7])for(const h of [.8,1.6]){const y=modules.get(path.join(root,'world-layout.js')).namespace.surfaceHeight(x,z)+h;const ray=new T.Raycaster(new T.Vector3(x,y,z),new T.Vector3(0,0,1),0,.9);const hits=ray.intersectObjects(physical,false);assert.equal(hits.length,0,hits[0]?.point?.toArray().join(','));}
});
test('plush character has finite geometry and grounded feet in neutral pose',()=>{character.pose({still:true});character.group.updateMatrixWorld(true);let meshes=0;character.group.traverse(o=>{if(o.isMesh){meshes++;for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));}});assert.ok(meshes<60);for(const foot of character.feet){const b=new T.Box3().setFromBufferAttribute(foot.geometry.attributes.position).applyMatrix4(foot.matrixWorld);assert.ok(Math.abs(b.min.y+.86)<.01);}character.group.position.y=.95;character.group.updateMatrixWorld(true);for(const foot of character.feet){const b=new T.Box3().setFromBufferAttribute(foot.geometry.attributes.position).applyMatrix4(foot.matrixWorld);assert.ok(Math.abs(b.min.y-.09)<.01,'world feet rest on the path');}for(const yaw of [0,Math.PI/2,Math.PI]){character.group.rotation.y=yaw;const b=new T.Box3().setFromObject(character.group);assert.ok(b.getSize(new T.Vector3()).y<3.2);}});
test('supporting feet remain grounded through walking, landing and customization',()=>{
 character.group.position.set(0,0,0);character.group.rotation.y=0;
 for(const roundness of [0,50,100])for(const landing of [0,.65,1])for(const phase of [0,.8,1.6,3.2,4.8]){
  character.customize({roundness});character.pose({walking:true,phase,landing});character.group.updateMatrixWorld(true);
  const point=new T.Vector3();let min=Infinity;
  for(const foot of character.feet){const p=foot.geometry.attributes.position;for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(foot.matrixWorld);min=Math.min(min,point.y);}}
  assert.ok(Math.abs(min+.86)<.002,`${roundness}/${landing}/${phase}: ${min}`);
 }
});
fs.mkdirSync(path.resolve(root,'../qa'),{recursive:true});fs.writeFileSync(path.resolve(root,'../qa/scene-metrics.json'),JSON.stringify({environment:`Node ${process.version} ${os.platform()} ${os.arch()}`,measurement:'CPU scene geometry construction; no browser, WebGL or GPU rendering',sceneConstructionMs:+ms.toFixed(2),meshObjects:count,materials:materials.size,triangles,renderFPS:null,largestMeshes:(()=>{const rows=[];scene.traverse(o=>{if(o.isMesh)rows.push({name:o.name,parent:o.parent?.name,triangles:(o.geometry.index?.count||o.geometry.attributes.position.count)/3});});return rows.sort((a,b)=>b.triangles-a.triangles).slice(0,12);})(),browserVisualVerification:'Separate browser checks are documented in docs/urgent-rendering-repair.md; these metrics are CPU-only'},null,2));

test('fur responds to fluff and sunglasses are an optional wardrobe item',()=>{
 const fresh=c.namespace.createCompanion();assert.equal(fresh.group.getObjectByName('sunglasses').visible,false);
 const fur=character.group.getObjectByName('plush-fur'),glasses=character.group.getObjectByName('sunglasses');assert.ok(fur.isInstancedMesh);assert.ok(fur.count>=16000);
 character.customize({fluff:50,accessory:'none'});const short=Array.from(fur.instanceMatrix.array);assert.equal(glasses.visible,false);
 character.customize({fluff:100,accessory:'sunglasses'});assert.equal(glasses.visible,true);assert.ok(short.some((v,i)=>v!==fur.instanceMatrix.array[i]));for(const v of fur.instanceMatrix.array)assert.ok(Number.isFinite(v));
});

test('Santa hat and ski boots are independent optional equipment',()=>{const pet=c.namespace.createCompanion();pet.customize({accessory:'santa'});assert.equal(pet.group.getObjectByName('santa-hat').visible,true);assert.equal(pet.group.getObjectByName('sunglasses').visible,false);pet.equip('ski');assert.equal(pet.group.getObjectByName('ski-equipment').visible,true);pet.equip('sled');assert.equal(pet.group.getObjectByName('ski-equipment').visible,false);assert.equal(pet.group.getObjectByName('sled-equipment').visible,true);pet.equip();assert.equal(pet.group.getObjectByName('sled-equipment').visible,false);});

test('hat, goggles and board coexist and the lift pose rests the body above the seat',()=>{
 const pet=c.namespace.createCompanion();pet.customize({accessory:'santa,goggles,board'});assert.equal(pet.winterReady,true);for(const name of ['santa-hat','ski-goggles','snowboard-equipment'])assert.equal(pet.group.getObjectByName(name).visible,true);assert.equal(pet.group.getObjectByName('ski-equipment').visible,false);pet.pose({mode:'lift'});for(const foot of pet.feet){assert.ok(foot.position.z>.6);assert.ok(foot.position.y>-.6);}pet.customize({accessory:'none'});assert.equal(pet.winterReady,false);
});

const footprintModule=await mod(path.join(root,'footprints.js'));await footprintModule.evaluate();
test('snow footsteps alternate, expire and stay off bridges and interior floors',()=>{const snowScene=new T.Scene(),f=footprintModule.namespace.createFootprints(snowScene),marks=snowScene.getObjectByName('temporary-snow-footprints');f.walk(10,10,0,.8,1);f.walk(10,11,0,.8,2);f.update(2);assert.equal(marks.visible,true);const a=new T.Matrix4(),b=new T.Matrix4();marks.getMatrixAt(0,a);marks.getMatrixAt(1,b);assert.ok((a.elements[12]-10)*(b.elements[12]-10)<0);f.update(10);assert.equal(marks.visible,false);f.walk(12,124+spaShift,0,.8,11);f.update(11);assert.equal(marks.visible,false);});

test('every moving amusement seat stays inside authoritative server bounds',async()=>{const {amusementPositionValid}=await import('../dist/festival-layout.js');for(let t=0;t<110;t+=.9){world.update(t,false);for(const kind of ['carousel','ferris'])for(let i=0;i<(kind==='ferris'?12:kind==='carousel'?6:2);i++){const p=world.winter.parkRides.seat(kind,i);assert.ok(amusementPositionValid(p.x,p.y,p.z,kind),kind+JSON.stringify(p));}}});

test('summit transfer has shoulder and head clearance through the rendered terminal geometry',()=>{
 const layout=modules.get(path.join(root,'resort-layout.js')).namespace,points=layout.summitTransfer.map(p=>new T.Vector3(p.x,0,p.z)),curve=new T.CatmullRomCurve3(points),objects=[];
 scene.traverseVisible(o=>{if(o.isMesh&&!o.material.transparent&&!o.material.isShaderMaterial)objects.push(o);});
 for(let i=0;i<32;i++){
  const p=curve.getPoint(i/32),q=curve.getPoint((i+1)/32),direction=q.clone().sub(p).normalize(),normal=new T.Vector3(-direction.z,0,direction.x);
  for(const side of [-.65,0,.65])for(const h of [.7,1.5]){const origin=p.clone().addScaledVector(normal,side);origin.y=layout.alpineHeight(origin.x,origin.z)+h;const ray=new T.Raycaster(origin,direction,0,p.distanceTo(q));const hit=ray.intersectObjects(objects,false)[0];assert.equal(hit,undefined,`transfer blocked at ${origin.toArray()} by ${hit?.object.name} (${hit?.point.toArray()})`);}
 }
});

test('upper dismount camera has an unobstructed line to the character above the terminal',()=>{
 const layout=modules.get(path.join(root,'resort-layout.js')).namespace,[x,y,z]=layout.resortRides.upperlift.exit,aim=new T.Vector3(x,y+2.06,z-1.8),camera=aim.clone().add(new T.Vector3(Math.sin(.75)*Math.cos(.42)*26,Math.sin(.42)*26,Math.cos(.75)*Math.cos(.42)*26)),body=new T.Vector3(x,y+1.01,z),dir=body.clone().sub(camera),objects=[];
 scene.traverseVisible(o=>{if(o.isMesh&&!o.material.transparent&&!o.material.isShaderMaterial)objects.push(o);});
 const ray=new T.Raycaster(camera,dir.clone().normalize(),0,dir.length()-.8);assert.equal(ray.intersectObjects(objects,false).length,0);
});

test('the rendered summit snow follows the walking height instead of burying the avatar',()=>{
 const layout=modules.get(path.join(root,'resort-layout.js')).namespace,terrain=scene.getObjectByName('alpine-heightfield'),ray=new T.Raycaster();
 for(const point of layout.summitTransfer)for(const dx of [-.6,0,.6]){const x=point.x+dx,z=point.z;ray.set(new T.Vector3(x,150,z),new T.Vector3(0,-1,0));ray.far=200;const hit=ray.intersectObject(terrain,false)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-layout.alpineHeight(x,z))<.3,`${x},${z}: ${hit.point.y} vs ${layout.alpineHeight(x,z)}`);}
});

test('food truck tyres sit on the rendered graded apron, including the rear marshmallow wheels',()=>{
 const layout=modules.get(path.join(root,'resort-layout.js')).namespace,terrain=scene.getObjectByName('alpine-heightfield'),ray=new T.Raycaster();
 for(const stop of layout.summitFacilities.filter(p=>['odeng','marshmallow'].includes(p.id))){const base=layout.alpineHeight(stop.model.x,stop.model.z);for(const dx of [-2.5,2.6])for(const dz of [-1.48,1.48]){ray.set(new T.Vector3(stop.model.x+dx,150,stop.model.z+dz),new T.Vector3(0,-1,0));const ground=ray.intersectObject(terrain,false)[0];assert.ok(ground);assert.ok(Math.abs(ground.point.y-base)<.15,stop.id+JSON.stringify(ground.point));}}
});


test('interaction targets are pickable without writing visible trigger rectangles',()=>{
 assert.ok(world.winter.interactive.length>0);
 for(const target of world.winter.interactive){
  assert.equal(target.material.visible,false);assert.equal(target.material.colorWrite,false);assert.equal(target.material.depthWrite,false);
  const geometry=target.geometry,a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),normal=new T.Vector3();
  for(let i=0;i<(geometry.index?.count||geometry.attributes.position.count);i+=3){[a,b,c].forEach((p,k)=>p.fromBufferAttribute(geometry.attributes.position,geometry.index?geometry.index.getX(i+k):i+k).applyMatrix4(target.matrixWorld));normal.crossVectors(b.clone().sub(a),c.clone().sub(a));if(normal.lengthSq()>1e-8)break;}
  normal.normalize();const center=a.add(b).add(c).multiplyScalar(1/3),ray=new T.Raycaster(center.clone().addScaledVector(normal,10),normal.clone().negate(),0,20);
  assert.ok(ray.intersectObject(target,false).length>0,'hidden material preserves click detection');
 }
});
