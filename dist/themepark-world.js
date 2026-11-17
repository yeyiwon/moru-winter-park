import {createSnowfolk} from './winter-costumes.js';
import {buildCarousel} from './carousel-model.js';
import {postOffice,skateRental} from './retreat-layout.js';
import {festivalLamps} from './festival-layout.js';
import {buildWinterRetreat} from './winter-retreat.js';
import {buildFestivalRides} from './festival-rides.js';
import {carouselLayout,parkLamps,parkBenches} from './park-layout.js';
import {buildParkLamps} from './park-lamps.js';
import {buildParkDetails} from './park-details.js';
import * as THREE from './vendor/three.module.js';
import {buildArchipelago} from './world-art.js?v=winter23';
import {buildWinterWorld} from './winter-world.js?v=winter23';
import {exhibits,islands,surfaceHeight} from './world-layout.js';
export function buildWorld(scene){
const materials=new Map();const M=(color,roughness=.7,metalness=.05)=>{const key=[color,roughness,metalness].join();if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness}));return materials.get(key);};const stone=M('#e2e0d5'),gold=M('#d8bf8f',.28,.62),dark=M('#283b50'),roof=new THREE.MeshPhysicalMaterial({color:'#375871',roughness:.28,metalness:.28,iridescence:.8,clearcoat:.9}),cream=M('#f0eee4'),wood=M('#79664e'),blush=M('#c1ccd0'),roseRoof=new THREE.MeshPhysicalMaterial({color:'#25394d',roughness:.28,metalness:.28,iridescence:.8,clearcoat:.9});const glow=new THREE.MeshBasicMaterial({color:'#ffe0a1'}),pinkGlow=new THREE.MeshBasicMaterial({color:'#c6e9f1'}),blueGlow=new THREE.MeshBasicMaterial({color:'#b6dfff'});
function mesh(geo,mat,x=0,y=0,z=0,parent=scene){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=!mat.transparent&&!mat.isShaderMaterial;m.receiveShadow=true;parent.add(m);return m}
const sphere=new THREE.SphereGeometry(1,20,12),dotGeometry=new THREE.SphereGeometry(1,10,7);function ball(mat,x,y,z,s,parent=scene){const m=mesh(s<.18?dotGeometry:sphere,mat,x,y,z,parent);m.scale.setScalar(s);return m}
function cylinder(r1,r2,h,mat,x,y,z,parent=scene,n=32){return mesh(new THREE.CylinderGeometry(r1,r2,h,n),mat,x,y,z,parent)}
const blockGeometries=new Map();
function block(w,h,d){const key=[w,h,d].join();if(blockGeometries.has(key))return blockGeometries.get(key);if(Math.min(w,h,d)<.18){const g=new THREE.BoxGeometry(w,h,d);blockGeometries.set(key,g);return g;}const r=Math.min(.09,w/8,h/8,d/8),shape=new THREE.Shape(),x=-w/2,y=-h/2;shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);const g=new THREE.ExtrudeGeometry(shape,{depth:d-r*2,bevelEnabled:true,bevelThickness:r,bevelSize:r*.4,bevelSegments:3,curveSegments:8});g.translate(0,0,-d/2+r);blockGeometries.set(key,g);return g;}
function box(w,h,d,mat,x,y,z,parent=scene){return mesh(block(w,h,d),mat,x,y,z,parent)}
function rod(a,b,r,mat,parent=scene){let v=new THREE.Vector3(...a),w=new THREE.Vector3(...b),delta=w.clone().sub(v);let m=cylinder(r,r,delta.length(),mat,0,0,0,parent,8);m.position.copy(v.add(w).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m}
function torus(r,t,mat,x,y,z,parent=scene){return mesh(new THREE.TorusGeometry(r,t,8,96),mat,x,y,z,parent)}
function light(color,intensity,x,y,z,range=12){const l=new THREE.PointLight(color,intensity,range,2);l.position.set(x,y,z);scene.add(l);return l}
// Soft sprites are procedural light textures, not flat scenic imagery.
const texCanvas=document.createElement('canvas');texCanvas.width=64;texCanvas.height=64;const tc=texCanvas.getContext('2d'),grad=tc.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.15,'rgba(255,255,255,.4)');grad.addColorStop(1,'rgba(255,255,255,0)');tc.fillStyle=grad;tc.fillRect(0,0,64,64);const glowMap=new THREE.CanvasTexture(texCanvas);
function halo(x,y,z,color,size,parent=scene){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,color,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending}));s.position.set(x,y,z);s.scale.set(size,size,1);parent.add(s);return s}
// Open snow-covered island and an uninterrupted pedestrian plaza.

// Castle silhouettes with detailed spires, lit arched windows, bridge-like facade.
const castle=new THREE.Group();castle.position.set(0,0,-14);scene.add(castle);
function lancet(x,y,z,w,h,parent=castle,turn=0){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=turn;parent.add(g);const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(-w/2,h*.62);shape.quadraticCurveTo(-w/2,h*.83,0,h);shape.quadraticCurveTo(w/2,h*.83,w/2,h*.62);shape.lineTo(w/2,0);shape.closePath();mesh(new THREE.ShapeGeometry(shape,12),glow,0,0,0,g);const pts=shape.getPoints(18).map(p=>new THREE.Vector3(p.x,p.y,.025));mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true),36,.035,6,true),gold,0,0,0,g);rod([0,.06,.04],[0,h*.9,.04],.017,gold,g);rod([-w*.43,h*.43,.04],[w*.43,h*.43,.04],.015,gold,g);box(w+.2,.1,.2,cream,0,-.04,.03,g);}
function tower(x,z,h,r,base=0,rose=false){
 cylinder(r,r*1.07,h,rose?blush:stone,x,base+h/2,z,castle,40);
 for(const y of [base+.25,base+h*.45,base+h-.3]){cylinder(r*1.1,r*1.1,.15,cream,x,y,z,castle,40);cylinder(r*1.115,r*1.115,.035,gold,x,y+.09,z,castle,40);}
 const roofH=r*3.2,roofProfile=Array.from({length:25},(_,i)=>{const t=i/24;return new THREE.Vector2(Math.max(.012,r*1.4*Math.pow(1-t,1.35)),t*roofH)});
 mesh(new THREE.LatheGeometry(roofProfile,40),rose?roseRoof:roof,x,base+h-.06,z,castle);cylinder(r*1.42,r*1.42,.11,gold,x,base+h-.07,z,castle,40);
 for(let j=0;j<8;j++){const a=j*Math.PI/4,pts=Array.from({length:18},(_,i)=>{const t=i/17,rad=r*1.4*Math.pow(1-t,1.35)+.018;return new THREE.Vector3(x+Math.cos(a)*rad,base+h-.05+t*roofH,z+Math.sin(a)*rad)});mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),22,.02,5,false),gold,0,0,0,castle);}
 for(let k=1;k<5;k++){const t=k/5,rad=r*1.4*Math.pow(1-t,1.35);const ring=torus(rad,.018,cream,x,base+h+t*roofH,z,castle);ring.rotation.x=Math.PI/2;}
 for(let level=base+1.7;level<base+h-1;level+=2.3)for(let j=0;j<4;j++){const a=j*Math.PI/2;lancet(x+Math.sin(a)*(r+.025),level,z+Math.cos(a)*(r+.025),r*.38,1.15,castle,a);}
 for(let j=0;j<10;j++){const a=j/10*Math.PI*2;ball(glow,x+Math.cos(a)*r*1.4,base+h-.14,z+Math.sin(a)*r*1.4,.06,castle);}
 rod([x,base+h+roofH-.1,z],[x,base+h+roofH+.6,z],.03,gold,castle);ball(glow,x,base+h+roofH+.56,z,.075,castle);
 const flag=new THREE.Shape();flag.moveTo(0,0);flag.lineTo(.7,.12);flag.quadraticCurveTo(.58,-.12,.7,-.3);flag.lineTo(0,-.25);flag.closePath();mesh(new THREE.ShapeGeometry(flag),rose?roof:roseRoof,x,base+h+roofH+.45,z,castle);
}
// The centre is an open, full-height passage to the north bridge.
for(const side of [-1,1]){box(3.7,4.8,2.5,stone,side*3.55,2.4,0,castle);for(let j=0;j<4;j++)box(.55,.65,2.7,stone,side*(2.2+j*.9),5,0,castle);}
const portalShape=new THREE.Shape();portalShape.moveTo(-1.7,2.1);portalShape.quadraticCurveTo(-1.7,4.35,0,4.35);portalShape.quadraticCurveTo(1.7,4.35,1.7,2.1);portalShape.lineTo(1.7,5.15);portalShape.lineTo(-1.7,5.15);portalShape.closePath();
mesh(new THREE.ExtrudeGeometry(portalShape,{depth:2.5,bevelEnabled:true,bevelSize:.05,bevelThickness:.06,bevelSegments:3}),stone,0,0,-1.25,castle);
tower(-5.4,0,9.2,1.05);tower(5.4,0,10,1.1,0,true);tower(-3.4,-2,13.2,.95,0,true);tower(3.4,-2.5,14.4,1.05);
// The elevated keep and clustered turrets frame the sky while leaving the ground passage open.
box(5.8,5.8,3.8,stone,0,8.3,-2.3,castle);box(6.1,.22,4.1,cream,0,5.5,-2.3,castle);box(6.1,.22,4.1,gold,0,11.23,-2.3,castle);
tower(0,-2.8,6.5,1.6,11.2);tower(-2.5,-1.2,3.8,.62,10.7,true);tower(2.5,-1.2,4.5,.62,10.7);tower(-6.6,-3,6.1,.68,0,true);tower(6.6,-3,7,.68);
for(const side of [-1,1]){box(.4,5.7,.6,cream,side*2.7,8.3,-.28,castle);for(let i=0;i<3;i++)lancet(side*(.62+i*.75),6.35,-.36,.42,2.4);}
for(let i=0;i<7;i++){const x=-2.65+i*.88;box(.42,.65,.44,cream,x,11.66,-.2,castle);ball(gold,x,12.03,-.2,.09,castle);}
for(const side of [-1,1]){const gable=new THREE.Shape();gable.moveTo(-1.6,0);gable.lineTo(0,2.1);gable.lineTo(1.6,0);gable.closePath();mesh(new THREE.ExtrudeGeometry(gable,{depth:2.1,bevelEnabled:false}),roseRoof,side*3.6,5.1,-1.1,castle);for(let i=0;i<6;i++)box(.2,.18,.16,cream,side*3.6-1.3+i*.52,5.25+Math.min(i,5-i)*.5,1.05,castle);}

for(const x of [-4,-2.5,2.5,4]){box(.43,1.1,.05,glow,x,2.8,1.28,castle);for(const side of [-1,1])box(.055,1.25,.11,gold,x+side*.27,2.8,1.31,castle);box(.65,.08,.15,cream,x,2.2,1.33,castle);}

for(const side of [-1,1]){const pts=[new THREE.Vector3(side*1.7,.15,1.35),new THREE.Vector3(side*1.7,2.2,1.35),new THREE.Vector3(side*1.2,3.8,1.35),new THREE.Vector3(0,4.3,1.35)];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),36,.055,8,false),gold,0,0,0,castle);}
// Ferris wheel: twin brass rims, spokes, upright hanging gondolas.
const wheelRoot=new THREE.Group();wheelRoot.position.set(-18,14,-5);wheelRoot.scale.setScalar(2.35);wheelRoot.rotation.y=.12;scene.add(wheelRoot);const wheel=new THREE.Group();wheelRoot.add(wheel);const R=4.5;
for(let z of [-.23,.23]){torus(R,.065,gold,0,0,z,wheel);torus(R-.22,.022,glow,0,0,z,wheel);}
const gondolas=[];for(let i=0;i<12;i++){const a=i/12*Math.PI*2,x=Math.cos(a)*R,y=Math.sin(a)*R;rod([0,0,0],[x,y,0],.03,gold,wheel);const g=new THREE.Group();g.position.set(x,y,0);wheel.add(g);mesh(new THREE.CylinderGeometry(.46,.37,.65,24,1,true),i%2?blush:roof,0,-.53,0,g);box(.68,.09,.58,cream,0,-.34,0,g);for(let dx of [-.3,.3])rod([dx,-.25,0],[dx,1.04,0],.023,gold,g);ball(glow,0,-.2,.4,.07,g);gondolas.push(g);}
for(let i=0;i<64;i++){const a=i/64*Math.PI*2;ball(i%3?glow:pinkGlow,Math.cos(a)*R,Math.sin(a)*R,.28,.045,wheel)}
for(let z of [-.7,.7]){rod([-2.4,-5.7,z],[0,0,z],.13,gold,wheelRoot);rod([2.4,-5.7,z],[0,0,z],.13,gold,wheelRoot)}ball(gold,0,0,.4,.3,wheelRoot);light('#ffca85',18,-18,3,-5,13);
const carouselModel=buildCarousel(),carousel=carouselModel.root;carousel.position.set(carouselLayout.x,0,carouselLayout.z);scene.add(carousel);const spinning=carouselModel.rotor,seats=carouselModel.seats;light('#ffd59f',25,carouselLayout.x,3,carouselLayout.z,12);
// Small stalls with striped awnings, arched portal, trees and vegetation.
for(let side of [-1,1]){let x=side*2.8,z=-9;cylinder(.32,.42,3.2,stone,x,1.6,z);ball(gold,x,3.2,z,.45)}const arch=mesh(new THREE.TorusGeometry(2.8,.13,10,48,Math.PI),gold,0,3.2,-9);for(let i=0;i<=20;i++){let a=i/20*Math.PI;ball(glow,Math.cos(a)*2.8,3.2+Math.sin(a)*2.8,-8.98,.06)}
let seed=238;function random(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}const leafM=[M('#659e92'),M('#92bdaf'),M('#b4d8bd')];
// Lamp posts with warm pools and floating paper lanterns.
buildParkLamps({scene,mesh,ball,cylinder,box,rod,torus,halo,M},[...parkLamps,...festivalLamps]);
for(const p of parkLamps.filter((_,i)=>i%3===0))light('#ffdbb6',11,p.x,3.4,p.z,9);
buildParkDetails({scene,mesh,ball,cylinder,box,rod,torus,halo,M});
const lanterns=[];for(let i=0;i<12;i++){const g=new THREE.Group();g.position.set((random()-.5)*30,7+random()*9,(random()-.5)*20-4);scene.add(g);cylinder(.17,.2,.4,glow,0,0,0,g,8);cylinder(.19,.19,.025,gold,0,-.2,0,g,8);halo(0,0,0,'#ffcf93',1.6,g);lanterns.push({g,y:g.position.y,phase:random()*6})}
// Tiny drifting particles and a distant moon.
const pos=[];for(let i=0;i<300;i++)pos.push((random()-.5)*250,12+random()*75,(random()-.5)*230);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));const stars=new THREE.Points(geo,new THREE.PointsMaterial({size:.045,color:'#dfd5ff',map:glowMap,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(stars);const celestial=ball(new THREE.MeshBasicMaterial({color:'#ddd8cb',toneMapped:false}),-90,95,-260,1.65);celestial.name='quiet-sun-moon';celestial.castShadow=false;
// Heraldic details sit above the open arch, away from the walking corridor.
function starShape(radius=.3){const shape=new THREE.Shape();for(let i=0;i<10;i++){let a=i*Math.PI/5+Math.PI/2,r=i%2?radius*.42:radius;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?shape.lineTo(x,y):shape.moveTo(x,y)}shape.closePath();return shape}
const starGeo=new THREE.ExtrudeGeometry(starShape(.27),{depth:.06,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2});
mesh(starGeo,glow,0,4.8,1.4,castle);const crest=torus(.65,.035,gold,0,4.8,1.35,castle);
for(let x of [-3.6,3.6]){box(.72,1.8,.05,M('#743c48'),x,3.7,1.32,castle);mesh(starGeo,gold,x,3.9,1.38,castle).scale.setScalar(.6)}
// Fairy lights arc above the path. Every strand has a physical catenary-like curve.
for(let zi of [-7,0,7]){const points=[];for(let i=0;i<=30;i++){let x=-4+i*8/30,y=4.3+.055*x*x;points.push(new THREE.Vector3(x,y,zi));if(i%2===0)ball(i%4?glow:pinkGlow,x,y-.07,zi,.045)}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),30,.012,4,false),gold);for(let x of [-4,4])rod([x,0,zi],[x,5.2,zi],.035,gold);}
const flowerPink=M('#e4ddd0'),flowerLilac=M('#bdcfdd');
// Carriage cabins have ribbed domes, entrance steps and upholstered benches.
for(const [i,g] of gondolas.entries()){
 const profile=[new THREE.Vector2(.59,0),new THREE.Vector2(.55,.13),new THREE.Vector2(.42,.3),new THREE.Vector2(.2,.41),new THREE.Vector2(.035,.48)];mesh(new THREE.LatheGeometry(profile,24),i%2?roseRoof:roof,0,1.04,0,g);
 const ring=torus(.55,.025,gold,0,1.05,0,g);ring.rotation.x=Math.PI/2;
 for(let j=0;j<6;j++){const a=j*Math.PI/3,points=profile.map(p=>new THREE.Vector3(Math.cos(a)*p.x,p.y+1.04,Math.sin(a)*p.x));mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,.018,5,false),gold,0,0,0,g);rod([Math.cos(a)*.43,-.35,Math.sin(a)*.43],[Math.cos(a)*.52,1.07,Math.sin(a)*.52],.018,cream,g);}
 for(const side of [-1,1])box(.55,.12,.18,cream,0,-.35,side*.26,g);box(.38,.055,.18,gold,0,-.77,.43,g);ball(glow,0,1.57,0,.055,g);const crest=torus(.1,.017,gold,0,-.5,.45,g);crest.scale.y=1.25;
}
// Low parterres sit outside the walking routes: curved stone rims, foliage and layered winter flowers.
for(const [cx,cz,rx,rz] of [[23,16,2.7,1.35],[-8,18,2.1,1.1],[7.5,-21,2.1,1.2],[-7.5,-21,2.1,1.2]]){
 const bed=cylinder(1,1,.18,cream,cx,.15,cz,scene,48);bed.scale.set(rx,1,rz);const soil=cylinder(1,1,.035,leafM[0],cx,.26,cz,scene,48);soil.scale.set(rx*.94,1,rz*.9);
 const rim=torus(1,.025,gold,cx,.28,cz);rim.rotation.x=Math.PI/2;rim.scale.set(rx,rz,1);
 for(let j=0;j<35;j++){const a=j*2.399,r=Math.sqrt((j+.5)/35)*.85,x=cx+Math.cos(a)*rx*r,z=cz+Math.sin(a)*rz*r;const leaf=ball(leafM[j%3],x,.3,z,.22);leaf.scale.set(1.4,.45,.9);const h=.34+(j%3)*.065;for(let k=0;k<5;k++){const b=k*Math.PI*2/5,petal=ball(j%2?flowerPink:flowerLilac,x+Math.cos(b)*.085,h,z+Math.sin(b)*.085,.105);petal.scale.set(1,.55,1);}ball(cream,x,h+.045,z,.048);}
}
// Courtyard lantern balustrades follow the facade instead of crossing the central route.
for(const side of [-1,1]){for(let j=0;j<8;j++){const x=side*(2.3+j*.53);cylinder(.038,.06,.85,gold,x,.52,-11.9,scene,8);ball(cream,x,.97,-11.9,.085);}rod([side*2.3,.97,-11.9],[side*6.01,.97,-11.9],.035,gold);}
// Fireflies respond to the companion; particles are one draw call.
const fireCount=28,fireData=new Float32Array(fireCount*3),fireSeeds=[];for(let i=0;i<fireCount;i++)fireSeeds.push({x:(random()-.5)*28,y:.6+random()*4,z:(random()-.5)*25,p:random()*6});const fireGeo=new THREE.BufferGeometry();fireGeo.setAttribute('position',new THREE.BufferAttribute(fireData,3));const fireflies=new THREE.Points(fireGeo,new THREE.PointsMaterial({color:'#f7d5a4',size:.14,map:glowMap,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(fireflies);
// Faint moving nebula in the actual sky dome, not a flat backdrop image.
const skyUniforms={uTime:{value:0},uTint:{value:new THREE.Color('#b9b7ff')},uTop:{value:new THREE.Color('#080f20')},uBottom:{value:new THREE.Color('#18283d')}};const sky=mesh(new THREE.SphereGeometry(600,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:skyUniforms,vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`precision mediump float;varying vec3 vP;uniform float uTime;uniform vec3 uTint;uniform vec3 uTop;uniform vec3 uBottom;void main(){vec3 p=normalize(vP);float h=smoothstep(-.1,.6,p.y);vec3 col=mix(uBottom,uTop,h);float band=exp(-pow((p.y-.32-sin(p.x*4.+uTime*.025)*.09)*11.,2.));float folds=.5+.5*sin(p.x*14.+p.z*6.+uTime*.03);col+=vec3(.045,.04,.09)*band*folds;col+=uTint*band*folds*.085;gl_FragColor=vec4(col,1.);}`}));sky.castShadow=false;sky.receiveShadow=false;
// Six themed islands and their bridges surround the original park.
const archipelago=buildArchipelago({scene,mesh,ball,cylinder,box,rod,torus,halo,M,glowMap});

for(const [x,z,h] of [[-26,9,4],[-27,-5,4.5],[-18,-21,4.8],[26,6,4.1],[24,-10,4.5],[14,-23,4.3]])archipelago.tree(scene,x,z,h,'#647387');

stone.bumpScale=0;gold.roughness=.32;

function batchStatic(root){root.updateMatrixWorld(true);const moving=new Set([celestial,wheel,carousel,sky,...lanterns.map(l=>l.g),...archipelago.dynamic,...archipelago.strings]),groups=new Map(),palette=new Map();function visit(parent){if(moving.has(parent))return;for(const child of [...parent.children]){if(moving.has(child))continue;if(child.isGroup){visit(child);continue;}const m=child.material;if(!child.isMesh||child.isInstancedMesh||!m||Array.isArray(m)||m.transparent||m.isShaderMaterial||!child.geometry.attributes.normal||!child.geometry.attributes.uv)continue;const signature=[m.type,m.color?.getHex(),m.roughness,m.metalness,m.emissive?.getHex(),m.emissiveIntensity,m.map?.uuid||''].join('/');if(!palette.has(signature))palette.set(signature,m);const location=child.getWorldPosition(new THREE.Vector3()),zone=islands.reduce((best,i)=>Math.hypot(location.x-i.x,location.z-i.z)<Math.hypot(location.x-best.x,location.z-best.z)?i:best,islands[0]);const key=zone.id+signature;if(!groups.has(key))groups.set(key,{material:palette.get(signature),items:[]});groups.get(key).items.push(child);}}visit(root);
for(const {material,items} of groups.values()){const arrays={position:[],normal:[],uv:[]};let count=0;for(const item of items){let geo=item.geometry.clone().applyMatrix4(item.matrixWorld);if(geo.index)geo=geo.toNonIndexed();for(const key in arrays)arrays[key].push(geo.attributes[key].array);count+=geo.attributes.position.count;item.parent.remove(item);geo.dispose();}const geo=new THREE.BufferGeometry();for(const key in arrays){const size=key==='uv'?2:3,buffer=new Float32Array(count*size);let n=0;for(const chunk of arrays[key]){buffer.set(chunk,n);n+=chunk.length;}geo.setAttribute(key,new THREE.BufferAttribute(buffer,size));}geo.computeBoundingSphere();mesh(geo,material);}}
batchStatic(scene);
function batchMoving(parent){for(const child of parent.children)if(child.isGroup)batchMoving(child);const groups=new Map();for(const child of [...parent.children]){if(!child.isMesh||child.material.transparent||!child.geometry.attributes.uv||!child.geometry.attributes.normal)continue;const key=child.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(child);}for(const list of groups.values()){if(list.length<2)continue;const chunks={position:[],normal:[],uv:[]};let vertices=0;for(const child of list){child.updateMatrix();let g=child.geometry.clone().applyMatrix4(child.matrix);if(g.index)g=g.toNonIndexed();vertices+=g.attributes.position.count;for(const key in chunks)chunks[key].push(g.attributes[key].array);parent.remove(child);g.dispose();}const g=new THREE.BufferGeometry();for(const key in chunks){const size=key==='uv'?2:3,buffer=new Float32Array(vertices*size);let offset=0;for(const values of chunks[key]){buffer.set(values,offset);offset+=values.length;}g.setAttribute(key,new THREE.BufferAttribute(buffer,size));}mesh(g,list[0].material,0,0,0,parent);}}
for(const moving of [wheel,...archipelago.dynamic])batchMoving(moving);



const markers=[].map(spec=>{const root=new THREE.Group();root.position.set(spec.x+.95,0,spec.z-.7);scene.add(root);cylinder(.42,.55,.55,stone,0,.28,0,root,32);const book=new THREE.Group();book.position.y=.88;book.rotation.x=-.25;root.add(book);for(const side of [-1,1]){const page=new THREE.Group();page.rotation.z=side*-.17;book.add(page);box(.47,.045,.64,M(spec.color,.9,0),side*.24,0,0,page);box(.42,.06,.58,cream,side*.24,.045,0,page);for(let line=0;line<3;line++)box(.27,.005,.012,gold,side*.24,.08,-.15+line*.12,page);}batchMoving(root);return{...spec,door:{x:spec.x,z:spec.z},root,book};});
const gateArms=[];
const targets=[];
const festival=buildFestivalRides(scene),retreat=buildWinterRetreat(scene);
const winter=buildWinterWorld({scene,mesh,ball,cylinder,box,rod,torus,halo,M,glowMap});
winter.destinations.push({id:'greenhouse',name:'오로라 온실',x:0,z:40.8,kind:'garden'},{id:'post-office',name:'소원 우체국',x:postOffice.entry.x,z:postOffice.entry.z,kind:'wish'},{id:'skating',name:'아이스링크',x:skateRental.entry.x,z:skateRental.entry.z,kind:'skating'}, {id:'carousel',name:'회전목마',x:16,z:12.2,kind:'ride'},{id:'ski-gear',name:'스키 장비',x:-44,z:-181.8,kind:'gear'}, {id:'ferris',name:'관람차',x:-13,z:2,kind:'ride'},...festival.destinations.filter(d=>d.kind==='ride'||d.kind==='photo'));
const snowfolk=[];for(const p of [{x:86,z:45.8},{x:-47.3,z:-181.5}]){const g=createSnowfolk();g.position.set(p.x,surfaceHeight(p.x,p.z),p.z);scene.add(g);snowfolk.push(g);}
const festivalWarm=new THREE.Color('#ffe0a1'),festivalRose=new THREE.Color('#c6e8ee');const ridePoint=new THREE.Vector3();winter.parkRides={...festival,seat(kind,index=0){if(kind==='carousel'){const seat=seats[index%seats.length];seat.updateWorldMatrix(true,false);ridePoint.set(0,0,0).applyMatrix4(seat.matrixWorld);return{x:ridePoint.x,y:ridePoint.y+.82,z:ridePoint.z,yaw:spinning.rotation.y+Math.atan2(seat.getWorldDirection(new THREE.Vector3()).x,seat.getWorldDirection(new THREE.Vector3()).z)-spinning.rotation.y};}if(kind==='ferris'){const g=gondolas[index%gondolas.length];g.updateWorldMatrix(true,false);ridePoint.set(0,-.29,0).applyMatrix4(g.matrixWorld);return{x:ridePoint.x,y:ridePoint.y+.82,z:ridePoint.z,yaw:.12};}return festival.seat(kind,index);}};
let coinPulse=0;const occluders=[];scene.traverse(o=>{if(o.isMesh&&!o.material.transparent&&!o.material.isShaderMaterial&&o!==sky)occluders.push(o);});
return{winter,gardenLighting:archipelago.gardenLighting,setSky(top,bottom,hour){celestial.material.color.set(hour>=6&&hour<19?'#e8ddc4':'#b8c7d0');celestial.position.y=65+35*Math.sin((hour>=6&&hour<19?(hour-6)/13:(hour+6)%24/12)*Math.PI);stars.material.opacity=hour>=7&&hour<18?0:.4;skyUniforms.uTop.value.copy(top);skyUniforms.uBottom.value.copy(bottom);},markers,interactive:[...winter.interactive,...gateArms,...archipelago.strings,...targets],occluders,appearance(color){skyUniforms.uTint.value.copy(color);},experiment(detail){if(detail.kind==='bridge')gateArms.forEach((g,i)=>{const open=i===0?detail.key&&detail.lantern:i===1?detail.key||detail.lantern:!detail.key&&!detail.lantern;g.rotation.z=open?Math.PI/2:0;g.material=open?cream:gold;});if(detail.kind==='coin')coinPulse=1;},update(t,still){glow.color.copy(festivalWarm).lerp(festivalRose,globalThis.window?.labLiveEvent?.kind==='lights'&&!still?(.5+.5*Math.sin(t*.7))*.65:0);festival.update(t,still);for(const g of snowfolk)g.update(still?0:t);carouselModel.update(t,still);if(!still)retreat.update(t);winter.update(t,still);if(still)return;archipelago.update(t);wheel.rotation.z=t*.06;gondolas.forEach(g=>g.rotation.z=-wheel.rotation.z);lanterns.forEach(({g,y,phase})=>g.position.y=y+Math.sin(t*.4+phase)*.2);skyUniforms.uTime.value=t;for(let i=0;i<fireCount;i++){const f=fireSeeds[i];fireData[i*3]=f.x+Math.sin(t*.3+f.p)*.4;fireData[i*3+1]=f.y+Math.sin(t*.8+f.p)*.25;fireData[i*3+2]=f.z+Math.cos(t*.4+f.p)*.4;}fireGeo.attributes.position.needsUpdate=true;}};
}
