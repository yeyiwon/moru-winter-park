import {serverNow} from './server-clock.js';
import {museumLayout} from './district-layout.js';
import {mergeMeshGeometry,spatialBatchKey} from './mesh-batch.js';
import {createFixtureGlow} from './fixture-glow.js';
import {alpineShift,liftLayout} from './resort-layout.js';
import {buildCastle} from './castle-model.js';
import {ferrisDimensions} from './ferris-layout.js';
import {buildFerrisWheel} from './ferris-model.js';
import {createSnowfolk} from './winter-costumes.js';
import {buildCarousel} from './carousel-model.js';
import {postOffice,postOfficeHost} from './retreat-layout.js';
import {festivalLamps} from './festival-layout.js';
import {buildWinterRetreat} from './winter-retreat.js';
import {buildFestivalRides} from './festival-rides.js';
import {carouselLayout,parkLamps,parkBenches,parkFountain} from './park-layout.js';
import {buildParkLamps} from './park-lamps.js';
import {buildParkDetails} from './park-details.js';
import * as THREE from './vendor/three.module.js';
import {buildArchipelago} from './world-art.js?v=winter27';
import {buildWinterWorld} from './winter-world.js?v=winter27';
import {exhibits,islands,surfaceHeight,promenadeTrees} from './world-layout.js';
export function buildWorld(scene){
const materials=new Map();const M=(color,roughness=.7,metalness=.05)=>{const key=[color,roughness,metalness].join();if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness}));return materials.get(key);};const stone=M('#e2e0d5'),gold=M('#d8bf8f',.28,.62),dark=M('#283b50'),roof=new THREE.MeshPhysicalMaterial({color:'#375871',roughness:.28,metalness:.28,iridescence:.8,clearcoat:.9}),cream=M('#f0eee4'),wood=M('#79664e'),blush=M('#c1ccd0'),roseRoof=new THREE.MeshPhysicalMaterial({color:'#25394d',roughness:.28,metalness:.28,iridescence:.8,clearcoat:.9});const glow=new THREE.MeshBasicMaterial({color:'#ffe0a1'}),pinkGlow=new THREE.MeshBasicMaterial({color:'#c6e9f1'}),blueGlow=new THREE.MeshBasicMaterial({color:'#b6dfff'});
function mesh(geo,mat,x=0,y=0,z=0,parent=scene){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=!mat.transparent&&!mat.isShaderMaterial;m.receiveShadow=true;parent.add(m);return m}
const sphere=new THREE.SphereGeometry(1,20,12),dotGeometry=new THREE.SphereGeometry(1,10,7);function ball(mat,x,y,z,s,parent=scene){const m=mesh(s<.18?dotGeometry:sphere,mat,x,y,z,parent);m.scale.setScalar(s);return m}
function cylinder(r1,r2,h,mat,x,y,z,parent=scene,n=32){return mesh(new THREE.CylinderGeometry(r1,r2,h,n),mat,x,y,z,parent)}
const blockGeometries=new Map();
function block(w,h,d){const key=[w,h,d].join();if(blockGeometries.has(key))return blockGeometries.get(key);if(Math.min(w,h,d)<.18){const g=new THREE.BoxGeometry(w,h,d);blockGeometries.set(key,g);return g;}const r=Math.min(.09,w/8,h/8,d/8),shape=new THREE.Shape(),x=-w/2,y=-h/2;shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);const g=new THREE.ExtrudeGeometry(shape,{depth:d-r*2,bevelEnabled:true,bevelThickness:r,bevelSize:r*.4,bevelSegments:3,curveSegments:8});g.translate(0,0,-d/2+r);blockGeometries.set(key,g);return g;}
function box(w,h,d,mat,x,y,z,parent=scene){return mesh(block(w,h,d),mat,x,y,z,parent)}
function rod(a,b,r,mat,parent=scene){let v=new THREE.Vector3(...a),w=new THREE.Vector3(...b),delta=w.clone().sub(v);let m=cylinder(r,r,delta.length(),mat,0,0,0,parent,8);m.position.copy(v.add(w).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m}
function torus(r,t,mat,x,y,z,parent=scene){return mesh(new THREE.TorusGeometry(r,t,r<.4?6:8,r<.4?32:96),mat,x,y,z,parent)}
function light(color,intensity,x,y,z,range=12){const l=new THREE.PointLight(color,intensity,range,2);l.position.set(x,y,z);scene.add(l);return l}
// Soft sprites are procedural light textures, not flat scenic imagery.
const texCanvas=document.createElement('canvas');texCanvas.width=64;texCanvas.height=64;const tc=texCanvas.getContext('2d'),grad=tc.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.15,'rgba(255,255,255,.4)');grad.addColorStop(1,'rgba(255,255,255,0)');tc.fillStyle=grad;tc.fillRect(0,0,64,64);const glowMap=new THREE.CanvasTexture(texCanvas);
function halo(x,y,z,color,size,parent=scene){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,color,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));s.position.set(x,y,z);s.scale.set(size,size,1);parent.add(s);return s}
// Open snow-covered island and an uninterrupted pedestrian plaza.

const castleModel=buildCastle();scene.add(castleModel.root);
const ferrisModel=buildFerrisWheel(),wheelRoot=ferrisModel.root,wheel=ferrisModel.wheel,gondolas=ferrisModel.gondolas;scene.add(wheelRoot);light('#ffca85',18,ferrisDimensions.center.x,3,ferrisDimensions.center.z,13);
const carouselModel=buildCarousel(),carousel=carouselModel.root;carousel.position.set(carouselLayout.x,0,carouselLayout.z);scene.add(carousel);const spinning=carouselModel.rotor,seats=carouselModel.seats;light('#ffd59f',25,carouselLayout.x,3,carouselLayout.z,12);
let seed=238;function random(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}const leafM=[M('#659e92'),M('#92bdaf'),M('#b4d8bd')];
// Lamp posts with warm pools and floating paper lanterns.
buildParkLamps({scene,mesh,ball,cylinder,box,rod,torus,halo,M},[...parkLamps,...festivalLamps]);
for(const p of parkLamps.filter((_,i)=>i%3===0))light('#ffdbb6',11,p.x,3.4,p.z,9);
const parkDetails=buildParkDetails({scene,mesh,ball,cylinder,box,rod,torus,halo,M});
const lanterns=[];for(let i=0;i<12;i++){const g=new THREE.Group();g.position.set((random()-.5)*30,7+random()*9,(random()-.5)*20-4);scene.add(g);cylinder(.17,.2,.4,glow,0,0,0,g,8);cylinder(.19,.19,.025,gold,0,-.2,0,g,8);halo(0,0,0,'#ffcf93',1.6,g);lanterns.push({g,y:g.position.y,phase:random()*6})}
// Tiny drifting particles and a distant moon.
const pos=[];for(let i=0;i<300;i++)pos.push((random()-.5)*250,12+random()*75,(random()-.5)*230);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));const stars=new THREE.Points(geo,new THREE.PointsMaterial({size:.045,color:'#dfd5ff',map:glowMap,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(stars);const celestial=ball(new THREE.MeshBasicMaterial({color:'#ddd8cb',toneMapped:false}),-90,95,-260,1.65);celestial.name='quiet-sun-moon';celestial.castShadow=false;
// Fairy lights arc above the path. Every strand has a physical catenary-like curve.
for(let zi of [-7,0,7]){const points=[];for(let i=0;i<=30;i++){let x=-4+i*8/30,y=4.3+.055*x*x;points.push(new THREE.Vector3(x,y,zi));if(i%2===0)ball(i%4?glow:pinkGlow,x,y-.07,zi,.045)}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),30,.012,4,false),gold);for(let x of [-4,4])rod([x,0,zi],[x,5.2,zi],.035,gold);}
const flowerPink=M('#e4ddd0'),flowerLilac=M('#bdcfdd');
// Low parterres sit outside the walking routes: curved stone rims, foliage and layered winter flowers.
for(const [cx,cz,rx,rz] of [[parkFountain.x,parkFountain.z,2.1,1.1]]){
 const bed=cylinder(1,1,.18,cream,cx,.15,cz,scene,48);bed.scale.set(rx,1,rz);const soil=cylinder(1,1,.035,leafM[0],cx,.26,cz,scene,48);soil.scale.set(rx*.94,1,rz*.9);
 const rim=torus(1,.025,gold,cx,.28,cz);rim.rotation.x=Math.PI/2;rim.scale.set(rx,rz,1);
 for(let j=0;j<35;j++){const a=j*2.399,r=Math.sqrt((j+.5)/35)*.85,x=cx+Math.cos(a)*rx*r,z=cz+Math.sin(a)*rz*r;const leaf=ball(leafM[j%3],x,.3,z,.22);leaf.scale.set(1.4,.45,.9);const h=.34+(j%3)*.065;for(let k=0;k<5;k++){const b=k*Math.PI*2/5,petal=ball(j%2?flowerPink:flowerLilac,x+Math.cos(b)*.085,h,z+Math.sin(b)*.085,.105);petal.scale.set(1,.55,1);}ball(cream,x,h+.045,z,.048);}
}
// Fireflies respond to the companion; particles are one draw call.
const fireCount=28,fireData=new Float32Array(fireCount*3),fireSeeds=[];for(let i=0;i<fireCount;i++)fireSeeds.push({x:(random()-.5)*28,y:.6+random()*4,z:(random()-.5)*25,p:random()*6});const fireGeo=new THREE.BufferGeometry();fireGeo.setAttribute('position',new THREE.BufferAttribute(fireData,3));const fireflies=new THREE.Points(fireGeo,new THREE.PointsMaterial({color:'#f7d5a4',size:.14,map:glowMap,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(fireflies);
// Faint moving nebula in the actual sky dome, not a flat backdrop image.
const skyUniforms={uTime:{value:0},uTint:{value:new THREE.Color('#b9b7ff')},uTop:{value:new THREE.Color('#080f20')},uBottom:{value:new THREE.Color('#18283d')}};const sky=mesh(new THREE.SphereGeometry(600,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:skyUniforms,vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`precision mediump float;varying vec3 vP;uniform float uTime;uniform vec3 uTint;uniform vec3 uTop;uniform vec3 uBottom;void main(){vec3 p=normalize(vP);float h=smoothstep(-.1,.6,p.y);vec3 col=mix(uBottom,uTop,h);gl_FragColor=vec4(col,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`}));sky.castShadow=false;sky.receiveShadow=false;
// Six themed islands and their bridges surround the original park.
const archipelago=buildArchipelago({scene,mesh,ball,cylinder,box,rod,torus,halo,M,glowMap});

for(const [x,z,h] of [[-26,9,4],[-27,-5,4.5],[-26,-20,4.8],[26,6,4.1],[24,-10,4.5],[24,-20,4.3]])archipelago.tree(scene,x,z,h,'#647387');

for(const p of promenadeTrees)archipelago.tree(scene,p.x,p.z,p.h,'#647387');
stone.bumpScale=0;gold.roughness=.32;

function batchStatic(root){root.updateMatrixWorld(true);const moving=new Set([castleModel.root,celestial,wheelRoot,carousel,sky,...lanterns.map(l=>l.g),...archipelago.dynamic,...archipelago.strings]),groups=new Map(),palette=new Map();function visit(parent){if(moving.has(parent))return;for(const child of [...parent.children]){if(moving.has(child))continue;if(child.isGroup){visit(child);continue;}const m=child.material;if(!child.isMesh||child.isInstancedMesh||!m||Array.isArray(m)||m.transparent||m.isShaderMaterial||!child.geometry.attributes.normal||!child.geometry.attributes.uv)continue;const signature=[m.type,m.color?.getHex(),m.roughness,m.metalness,m.emissive?.getHex(),m.emissiveIntensity,m.vertexColors,m.userData.lightingTheme||'',m.map?.uuid||''].join('/');if(!palette.has(signature))palette.set(signature,m);const location=child.getWorldPosition(new THREE.Vector3()),zone=islands.reduce((best,i)=>Math.hypot(location.x-i.x,location.z-i.z)<Math.hypot(location.x-best.x,location.z-best.z)?i:best,islands[0]);const key=zone.id+spatialBatchKey(child)+signature;if(!groups.has(key))groups.set(key,{material:palette.get(signature),items:[]});groups.get(key).items.push(child);}}visit(root);
for(const {material,items} of groups.values()){const geo=mergeMeshGeometry(items);for(const item of items)item.removeFromParent();mesh(geo,material);}}
batchStatic(scene);
function batchMoving(parent){for(const child of parent.children)if(child.isGroup)batchMoving(child);const groups=new Map();for(const child of [...parent.children]){if(!child.isMesh||child.material.transparent||!child.geometry.attributes.uv||!child.geometry.attributes.normal)continue;const key=child.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(child);}for(const list of groups.values()){if(list.length<2)continue;const g=mergeMeshGeometry(list,{world:false});for(const child of list)parent.remove(child);mesh(g,list[0].material,0,0,0,parent);}}
for(const moving of [...archipelago.dynamic])batchMoving(moving);



const markers=[].map(spec=>{const root=new THREE.Group();root.position.set(spec.x+.95,0,spec.z-.7);scene.add(root);cylinder(.42,.55,.55,stone,0,.28,0,root,32);const book=new THREE.Group();book.position.y=.88;book.rotation.x=-.25;root.add(book);for(const side of [-1,1]){const page=new THREE.Group();page.rotation.z=side*-.17;book.add(page);box(.47,.045,.64,M(spec.color,.9,0),side*.24,0,0,page);box(.42,.06,.58,cream,side*.24,.045,0,page);for(let line=0;line<3;line++)box(.27,.005,.012,gold,side*.24,.08,-.15+line*.12,page);}batchMoving(root);return{...spec,door:{x:spec.x,z:spec.z},root,book};});
const gateArms=[];
const targets=[];
const festival=buildFestivalRides(scene),retreat=buildWinterRetreat(scene);
const winter=buildWinterWorld({scene,mesh,ball,cylinder,box,rod,torus,halo,M,glowMap});
winter.destinations= winter.destinations.filter(p=>!['quiz','healing'].includes(p.id));winter.destinations.push({id:'castle',name:'겨울 성',x:0,z:-7,kind:'photo'}, {id:'quiz',name:'별빛 만물관',...museumLayout.door,kind:'museum',view:{distance:26,yaw:museumLayout.yaw,pitch:.34}},{id:'post-office',name:'소원 우체국',x:postOffice.entry.x,z:postOffice.entry.z,kind:'wish'}, {id:'carousel',name:'회전목마',x:16,z:12.2,kind:'ride'},{id:'ski-gear',name:'스키 장비',x:liftLayout.x-8,z:-181.8+alpineShift,kind:'gear'}, {id:'ferris',name:'관람차',...ferrisDimensions.entrance,kind:'ride'},...festival.destinations.filter(d=>d.kind==='ride'||d.kind==='photo'||d.kind==='snack'));
const snowfolk=[];for(const p of [postOfficeHost,{x:liftLayout.x-11.3,z:-181.5+alpineShift}]){const g=createSnowfolk();g.position.set(p.x,surfaceHeight(p.x,p.z),p.z);g.rotation.y=p.yaw||0;g.name=p===postOfficeHost?'post-office-snowman':'ski-vendor-snowman';scene.add(g);snowfolk.push(g);}
const festivalWarm=new THREE.Color('#ffe0a1'),festivalRose=new THREE.Color('#c6e8ee');const ridePoint=new THREE.Vector3();winter.parkRides={...festival,seat(kind,index=0){if(kind==='carousel'){const seat=seats[index%seats.length];seat.updateWorldMatrix(true,false);ridePoint.set(0,0,0).applyMatrix4(seat.matrixWorld);return{x:ridePoint.x,y:ridePoint.y+.82,z:ridePoint.z,yaw:spinning.rotation.y+Math.atan2(seat.getWorldDirection(new THREE.Vector3()).x,seat.getWorldDirection(new THREE.Vector3()).z)-spinning.rotation.y};}if(kind==='ferris')return ferrisModel.seat(index%12,0);return festival.seat(kind,index);}};
let coinPulse=0;const occluders=[];scene.traverse(o=>{if(o.isMesh&&!o.material.transparent&&!o.material.isShaderMaterial&&o!==sky)occluders.push(o);});
const fixtureGlow=createFixtureGlow(scene);
return{winter,setQuality(value){parkDetails.setQuality(value);fixtureGlow.setQuality(value);castleModel.setQuality(value);carouselModel.setQuality(value);archipelago.setQuality?.(value);},setSky(top,bottom,hour){celestial.material.color.set(hour>=6&&hour<19?'#e8ddc4':'#b8c7d0');celestial.position.y=65+35*Math.sin((hour>=6&&hour<19?(hour-6)/13:(hour+6)%24/12)*Math.PI);stars.material.opacity=hour>=7&&hour<18?0:.4;skyUniforms.uTop.value.copy(top);skyUniforms.uBottom.value.copy(bottom);},markers,interactive:[...winter.interactive,...gateArms,...archipelago.strings,...targets],occluders,appearance(color){skyUniforms.uTint.value.copy(color);},experiment(detail){if(detail.kind==='bridge')gateArms.forEach((g,i)=>{const open=i===0?detail.key&&detail.lantern:i===1?detail.key||detail.lantern:!detail.key&&!detail.lantern;g.rotation.z=open?Math.PI/2:0;g.material=open?cream:gold;});if(detail.kind==='coin')coinPulse=1;},update(t,still){parkDetails.update(t,still);fixtureGlow.update(t,still);castleModel.update(t,still,{player:globalThis.window?.labPlayerState});glow.color.copy(festivalWarm);festival.update(t,still);for(const g of snowfolk)g.update(still?0:t);carouselModel.update(t,still);ferrisModel.update(serverNow()/1000,false);if(!still)retreat.update(t);winter.update(t,still);if(still)return;archipelago.update(t);lanterns.forEach(({g,y,phase})=>g.position.y=y+Math.sin(t*.4+phase)*.2);skyUniforms.uTime.value=t;for(let i=0;i<fireCount;i++){const f=fireSeeds[i];fireData[i*3]=f.x+Math.sin(t*.3+f.p)*.4;fireData[i*3+1]=f.y+Math.sin(t*.8+f.p)*.25;fireData[i*3+2]=f.z+Math.cos(t*.4+f.p)*.4;}fireGeo.attributes.position.needsUpdate=true;}};
}
