import {aquariumBounds as bounds} from '../dist/ryokan-aquarium-layout.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildSpaResort} from '../dist/spa-resort.js';
import {interiorDoors} from '../dist/district-layout.js';
import {createOnsenWater} from '../dist/onsen-water.js';
import {snowPine} from '../dist/ryokan-garden.js';
import {makeBuilder,materials} from '../dist/architecture-kit.js';
import {createFishSchool,fishBodyGeometry,buildRyokanAquarium} from '../dist/ryokan-aquarium.js';

test('ryokan portal hit target covers the actual doorway, not the whole building',()=>{
 const scene=new T.Scene(),asset=buildSpaResort({scene,M:(color,roughness,metalness)=>new T.MeshStandardMaterial({color,roughness,metalness})});
 scene.updateMatrixWorld(true);const target=asset.interactive.find(o=>o.userData.action==='sauna'),bounds=new T.Box3().setFromObject(target),door=interiorDoors.ryokan;
 assert.ok(bounds.containsPoint(new T.Vector3(door.x,1,door.z)));
 target.geometry.computeBoundingBox();const local=target.geometry.boundingBox.getSize(new T.Vector3());assert.ok(local.x<5);assert.ok(local.z<2);const center=target.getWorldPosition(new T.Vector3());assert.ok(Math.hypot(center.x-door.x,center.z-door.z)<.5);
 assert.equal(target.material.visible,false);assert.equal(target.material.depthWrite,false);
});
test('snow crowns face upward and their geometry stays finite',()=>{
 const root=new T.Group(),m=materials();snowPine(makeBuilder(root),{wood:m.cedar,green:m.green,sage:m.sage,snow:m.snow},0,0,7,.8);
 let normals=0,y=0;root.traverse(o=>{if(o.material!==m.snow)return;for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));const n=o.geometry.attributes.normal;for(let i=0;i<n.count;i++){normals++;y+=n.getY(i);}});
 assert.ok(y/normals>.25,'snow must not disappear due to inverted faces');
});
test('onsen motion freezes without losing its last frame or changing local light positions',()=>{
 const water=createOnsenWater({lights:[[1,3,2]]});water.update(12);assert.equal(water.material.uniforms.time.value,12);water.update(20,true);assert.equal(water.material.uniforms.time.value,12);water.update(NaN);assert.equal(water.material.uniforms.time.value,12);
 assert.deepEqual(water.material.uniforms.lights.value[0].toArray(),[1,3,2]);assert.equal(water.material.depthWrite,false);water.material.dispose();
});
test('fish silhouettes taper at both ends and keep per-vertex shading at both LODs',()=>{
 for(const [s,r]of [[16,20],[8,10]]){const g=fishBodyGeometry(s,r),p=g.attributes.position;for(const v of p.array)assert.ok(Number.isFinite(v));const width=i=>Math.max(...Array.from({length:s+1},(_,j)=>Math.abs(p.getY(i*(s+1)+j))));assert.ok(width(0)<width(r/2)*.2);assert.ok(width(r)<width(r/2)*.2);assert.equal(g.attributes.color.count,p.count);g.dispose();}
});

test('fish body and tail stay inside the viewing tank even when turning toward the glass',()=>{
 const school=createFishSchool();for(let i=0;i<600;i++){school.step(.08);for(const f of school.fish){assert.ok(Math.abs(f.x)+f.size*1.6<=bounds.x+.00001);assert.ok(Math.abs(f.z)+f.size*1.6<=bounds.z+.00001);assert.ok(Math.abs(f.y)+f.size*.62<=bounds.y+.00001);}}
});

test('loose fish shoals travel visibly and turn gradually while preserving deterministic bounded motion',()=>{
 const school=createFishSchool(),same=createFishSchool(),start=school.fish.map(f=>({...f}));
 for(let i=0;i<150;i++){
  const headings=school.fish.map(f=>f.heading);school.step(1/30);same.step(1/30);
  for(let j=0;j<school.fish.length;j++)assert.ok(Math.abs(school.fish[j].heading-headings[j])<=1.7/30+1e-9);
 }
 assert.deepEqual(school.fish,same.fish);
 const moved=school.fish.filter((f,i)=>Math.hypot(f.x-start[i].x,f.y-start[i].y,f.z-start[i].z)>.5);
 assert.ok(moved.length>=24,'most fish must visibly travel instead of hovering in place');
 const previous=school.fish.map(f=>({...f}));school.step(NaN);assert.deepEqual(school.fish,previous);
});

test('aquarium keeps its draw objects and quality budgets while reusing instance storage',()=>{
 const aquarium=buildRyokanAquarium(new T.Group(),materials()),bodies=aquarium.root.getObjectByName('aquarium-instanced-fish'),bubbles=aquarium.root.getObjectByName('aquarium-floating-bubbles');
 let meshes=0,points=0,lights=0,vertices=0;aquarium.root.traverse(o=>{if(o.isMesh)meshes++;if(o.isPoints)points++;if(o.isLight)lights++;if(o.geometry)vertices+=o.geometry.attributes.position.count;});
 assert.ok(meshes<=18);assert.equal(points,1);assert.equal(lights,3);assert.ok(vertices<45000,vertices+' aquarium vertices');
 const matrices=bodies.instanceMatrix.array,phases=bodies.geometry.attributes.swimPhase.array,geometry=bodies.geometry;
 for(const [quality,fish,particleCount]of [['low',28,20],['medium',48,40],['high',72,64]]){
  aquarium.setQuality(quality);assert.equal(bodies.count,fish);assert.equal(bubbles.geometry.drawRange.count,particleCount);
  assert.equal(bodies.instanceMatrix.array,matrices);assert.equal(bodies.geometry.attributes.swimPhase.array,phases);
  assert.ok([...matrices].every(Number.isFinite));assert.equal(bodies.frustumCulled,true);
 }
 aquarium.setQuality('medium');assert.equal(bodies.geometry,geometry);aquarium.dispose();
});

test('aquarium water, fish and vegetation freeze together and resume without catching up hidden time',()=>{
 const parent=new T.Group(),aquarium=buildRyokanAquarium(parent,materials()),bodies=aquarium.root.getObjectByName('aquarium-instanced-fish');
 const backdrop=aquarium.root.getObjectByName('aquarium-moving-light-depth'),clock=backdrop.material.uniforms.time;
 const glass=aquarium.root.getObjectByName('aquarium-viewing-glass');
 const shader={uniforms:{},vertexShader:T.ShaderLib.physical.vertexShader,fragmentShader:T.ShaderLib.physical.fragmentShader};glass.material.onBeforeCompile(shader);
 assert.equal(shader.uniforms.aquariumTime,clock,'waterline uses the same frozen clock as the water depth');
 aquarium.update(10);aquarium.update(10.05);const frozenTime=clock.value,frozenFish=[...bodies.instanceMatrix.array];
 aquarium.update(40,true);assert.equal(clock.value,frozenTime);assert.deepEqual([...bodies.instanceMatrix.array],frozenFish);
 aquarium.update(40.05);assert.ok(clock.value>frozenTime&&clock.value<frozenTime+.051);
 const visibleTime=clock.value;parent.visible=false;aquarium.update(80);assert.equal(clock.value,visibleTime);
 parent.visible=true;aquarium.update(80.05);assert.ok(clock.value>visibleTime&&clock.value<visibleTime+.051);
 const validTime=clock.value;assert.equal(aquarium.update(NaN),false);assert.equal(clock.value,validTime);
 aquarium.dispose();assert.equal(aquarium.update(100),false);
});

test('fish matrices update less often when distant or not rendered while the water clock stays bounded',()=>{
 const measure=(kind)=>{
  const parent=new T.Group();parent.position.set(400,0,0);const aquarium=buildRyokanAquarium(parent,materials()),bodies=aquarium.root.getObjectByName('aquarium-instanced-fish');
  const player=kind==='far'?{x:480,z:80}:{x:400,z:-12};aquarium.update(0);bodies.onBeforeRender();
  // Warm past the visibility grace period before measuring the next second.
  for(let i=1;i<=60;i++){aquarium.update(i/60,false,player);if(kind!=='offscreen')bodies.onBeforeRender();}
  const before=bodies.instanceMatrix.version;
  for(let i=61;i<=120;i++){aquarium.update(i/60,false,player);if(kind!=='offscreen')bodies.onBeforeRender();}
  const writes=bodies.instanceMatrix.version-before;aquarium.dispose();return writes;
 };
 const near=measure('near'),far=measure('far'),offscreen=measure('offscreen');
 assert.ok(near>=18&&near<=31);assert.ok(far>=4&&far<=6);assert.ok(offscreen>=4&&offscreen<=6);
 assert.ok(near>far*2&&near>offscreen*2);
});

test('fish remain distributed across the panoramic volume after two minutes, without a collapsed common centroid',()=>{
 const school=createFishSchool();for(let i=0;i<1500;i++)school.step(.08);
 const fish=school.fish;for(const [axis,minSpread]of [['x',23],['y',4],['z',4]])assert.ok(Math.max(...fish.map(f=>f[axis]))-Math.min(...fish.map(f=>f[axis]))>minSpread,axis+' spread');
 let overlaps=0;for(let i=0;i<fish.length;i++)for(let j=i+1;j<fish.length;j++)if(Math.hypot(fish[i].x-fish[j].x,fish[i].y-fish[j].y,fish[i].z-fish[j].z)<.35)overlaps++;assert.equal(overlaps,0);
});
