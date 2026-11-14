import * as THREE from './vendor/three.module.js';
import {moveVector,moveOnGround} from './movement.js?v=islands1';
import {findPath} from './navigation.js?v=islands1';
import {islands,islandAt} from './world-layout.js?v=islands1';
import {createCompanion} from './companion.js?v=islands1';
import {buildArchipelago} from './world-art.js?v=islands1';
import {createDiscoveryGate} from './discovery.js';
const canvas=document.getElementById('park-canvas');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch(e){document.body.classList.add('no-webgl');document.getElementById('park-status').textContent='이 기기에서는 3D 화면을 사용할 수 없어요. 퀴즈는 계속 풀 수 있어요.';}
if(renderer){
renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<650?1.35:1.7));renderer.setSize(innerWidth,innerHeight,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#11152d');scene.fog=new THREE.FogExp2('#252b43',.0055);
const camera=new THREE.PerspectiveCamera(44,innerWidth/innerHeight,.1,300);let yaw=.12,pitch=.32,distance=29,targetYaw=yaw,targetPitch=pitch,targetDistance=distance;const target=new THREE.Vector3(0,3,0);
const hemi=new THREE.HemisphereLight('#c7caff','#374d46',1.3);scene.add(hemi);const moonlight=new THREE.DirectionalLight('#b5c4ff',3.1);moonlight.position.set(-12,30,6);moonlight.castShadow=true;moonlight.shadow.mapSize.set(innerWidth<650?1024:2048,innerWidth<650?1024:2048);moonlight.shadow.camera.left=-28;moonlight.shadow.camera.right=28;moonlight.shadow.camera.top=28;moonlight.shadow.camera.bottom=-28;moonlight.shadow.normalBias=.05;scene.add(moonlight);const fill=new THREE.DirectionalLight('#efc8b0',1.0);fill.position.set(12,9,15);scene.add(fill);
const M=(color,roughness=.7,metalness=.05)=>new THREE.MeshStandardMaterial({color,roughness,metalness});const stone=M('#59596d'),gold=M('#a5804d',.35,.65),dark=M('#39394f'),roof=M('#656080',.5,.2),cream=M('#d6bd9a'),wood=M('#604750');const glow=new THREE.MeshBasicMaterial({color:'#ffe0a1'}),pinkGlow=new THREE.MeshBasicMaterial({color:'#ffc1da'}),blueGlow=new THREE.MeshBasicMaterial({color:'#b6dfff'});
function mesh(geo,mat,x=0,y=0,z=0,parent=scene){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
const sphere=new THREE.SphereGeometry(1,24,16);function ball(mat,x,y,z,s,parent=scene){const m=mesh(sphere,mat,x,y,z,parent);m.scale.setScalar(s);return m}
function cylinder(r1,r2,h,mat,x,y,z,parent=scene,n=32){return mesh(new THREE.CylinderGeometry(r1,r2,h,n),mat,x,y,z,parent)}
function box(w,h,d,mat,x,y,z,parent=scene){return mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z,parent)}
function rod(a,b,r,mat,parent=scene){let v=new THREE.Vector3(...a),w=new THREE.Vector3(...b),delta=w.clone().sub(v);let m=cylinder(r,r,delta.length(),mat,0,0,0,parent,8);m.position.copy(v.add(w).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m}
function torus(r,t,mat,x,y,z,parent=scene){return mesh(new THREE.TorusGeometry(r,t,8,96),mat,x,y,z,parent)}
function light(color,intensity,x,y,z,range=12){const l=new THREE.PointLight(color,intensity,range,2);l.position.set(x,y,z);scene.add(l);return l}
// Soft sprites are procedural light textures, not flat scenic imagery.
const texCanvas=document.createElement('canvas');texCanvas.width=64;texCanvas.height=64;const tc=texCanvas.getContext('2d'),grad=tc.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.15,'rgba(255,255,255,.4)');grad.addColorStop(1,'rgba(255,255,255,0)');tc.fillStyle=grad;tc.fillRect(0,0,64,64);const glowMap=new THREE.CanvasTexture(texCanvas);
function halo(x,y,z,color,size,parent=scene){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,color,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending}));s.position.set(x,y,z);s.scale.set(size,size,1);parent.add(s);return s}
// Stone island, curved flagstone walkway, luminous lake.
cylinder(20,22,1.2,M('#2f3c48'),0,-.7,0,scene,96);cylinder(19.9,19.9,.12,M('#354b49'),0,-.06,0,scene,96);
const lake=mesh(new THREE.CircleGeometry(8,80),new THREE.MeshStandardMaterial({color:'#273951',roughness:.16,metalness:.6}),-10,.025,-3);lake.rotation.x=-Math.PI/2;lake.scale.set(.9,1.45,1);
const pavingShape=new THREE.Shape();pavingShape.moveTo(-.36,-.4);pavingShape.lineTo(.36,-.4);pavingShape.quadraticCurveTo(.425,-.4,.425,-.335);pavingShape.lineTo(.425,.335);pavingShape.quadraticCurveTo(.425,.4,.36,.4);pavingShape.lineTo(-.36,.4);pavingShape.quadraticCurveTo(-.425,.4,-.425,.335);pavingShape.lineTo(-.425,-.335);pavingShape.quadraticCurveTo(-.425,-.4,-.36,-.4);const pavingGeo=new THREE.ExtrudeGeometry(pavingShape,{depth:.045,bevelEnabled:true,bevelSize:.025,bevelThickness:.02,bevelSegments:2,steps:1});pavingGeo.rotateX(-Math.PI/2);
const paving=[M('#85818c'),M('#716e80'),M('#8a828b')];for(let row=0;row<30;row++){const z=15-row*.9,cx=Math.sin(z*.14)*1.5;for(let col=0;col<5;col++){let tile=mesh(pavingGeo,paving[(row+col)%3],cx+(col-2)*.89,.055,z);tile.rotation.y=Math.sin(row)*.02}}
for(let side of [-1,1]){for(let i=0;i<20;i++){let z=13-i*1.28,x=Math.sin(z*.14)*1.5+side*2.45;cylinder(.13,.18,.12,stone,x,.08,z,scene,12);ball(glow,x,.2,z,.06);}}
// Castle silhouettes with detailed spires, lit arched windows, bridge-like facade.
const castle=new THREE.Group();castle.position.set(1,0,-15);scene.add(castle);
function tower(x,z,h,r){cylinder(r,r*1.09,h,stone,x,h/2,z,castle,20);cylinder(r*1.2,r*1.2,.25,gold,x,h-.3,z,castle);cylinder(0,r*1.4,r*2.5,roof,x,h+r*1.2,z,castle,24);rod([x,h+r*2.45,z],[x,h+r*2.9,z],.035,gold,castle);ball(glow,x,h+r*2.9,z,.09,castle);for(let level=2;level<h-1;level+=1.6){box(.27,.65,.04,glow,x,level,z+r+.025,castle);mesh(new THREE.SphereGeometry(.135,12,8,0,Math.PI*2,0,Math.PI/2),glow,x,level+.32,z+r+.025,castle).scale.z=.15;}}
box(9,5,2.5,stone,0,2.5,0,castle);for(let x=-4;x<=4;x+=1)box(.6,.7,2.7,stone,x,5.2,0,castle);tower(-5,0,8,1);tower(5,0,7,1.1);tower(-2,-1.5,10,.9);tower(2,-2,12,1.15);tower(0,1,8.5,1);for(let x of [-3.5,-1.7,1.7,3.5])box(.45,1.1,.05,glow,x,3,1.28,castle);
// Ferris wheel: twin brass rims, spokes, upright hanging gondolas.
const wheelRoot=new THREE.Group();wheelRoot.position.set(-7.8,6,-5);wheelRoot.rotation.y=.12;scene.add(wheelRoot);const wheel=new THREE.Group();wheelRoot.add(wheel);const R=4.5;
for(let z of [-.23,.23]){torus(R,.065,gold,0,0,z,wheel);torus(R-.22,.022,glow,0,0,z,wheel);}
const gondolas=[];for(let i=0;i<12;i++){const a=i/12*Math.PI*2,x=Math.cos(a)*R,y=Math.sin(a)*R;rod([0,0,0],[x,y,0],.03,gold,wheel);const g=new THREE.Group();g.position.set(x,y,0);wheel.add(g);cylinder(.46,.37,.65,i%2?M('#745a83'):M('#557b84'),0,-.53,0,g,12);cylinder(0,.59,.38,gold,0,.2,0,g,12);for(let dx of [-.3,.3])rod([dx,-.25,0],[dx,.15,0],.023,gold,g);ball(glow,0,-.2,.4,.07,g);gondolas.push(g);}
for(let i=0;i<64;i++){const a=i/64*Math.PI*2;ball(i%3?glow:pinkGlow,Math.cos(a)*R,Math.sin(a)*R,.28,.045,wheel)}
for(let z of [-.7,.7]){rod([-2.4,-5.7,z],[0,0,z],.13,gold,wheelRoot);rod([2.4,-5.7,z],[0,0,z],.13,gold,wheelRoot)}ball(gold,0,0,.4,.3,wheelRoot);halo(-7.8,6,-4.5,'#ffd28b',8);light('#ffca85',40,-7,3,-3,13);
// Carousel with scalloped canopy, gilded columns and floating seats.
const carousel=new THREE.Group();carousel.position.set(7.1,0,-3.2);scene.add(carousel);cylinder(3.3,3.6,.45,cream,0,.24,0,carousel,64);cylinder(3.45,3.45,.09,gold,0,.49,0,carousel,64);const spinning=new THREE.Group();carousel.add(spinning);cylinder(.22,.3,4.4,gold,0,2.4,0,carousel);const canopy=new THREE.Group();canopy.position.y=4.35;carousel.add(canopy);
for(let i=0;i<16;i++){const geo=new THREE.ConeGeometry(3.6,1.7,6,1,false,i/16*Math.PI*2,Math.PI*2/16);mesh(geo,i%2?M('#80708f'):M('#c3a9a4'),0,.82,0,canopy);const a=i/16*Math.PI*2;ball(glow,Math.cos(a)*3.45,-.03,Math.sin(a)*3.45,.075,canopy);}
cylinder(3.5,3.5,.15,gold,0,4.3,0,carousel,64);cylinder(0,.35,.9,gold,0,6.4,0,carousel);ball(glow,0,6.9,0,.14,carousel);
const seats=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2,x=Math.cos(a)*2.45,z=Math.sin(a)*2.45;rod([x,.5,z],[x,4.3,z],.035,gold,spinning);const seat=new THREE.Group();seat.position.set(x,1.6,z);seat.rotation.y=-a;spinning.add(seat);const body=ball(i%2?M('#adc8be'):M('#d4b0ca'),0,0,0,.52,seat);body.scale.multiply(new THREE.Vector3(1.2,.5,.65));torus(.4,.035,gold,0,.12,0,seat).rotation.x=Math.PI/2;seats.push(seat)}light('#ffd59f',50,7,3,-3,12);halo(7,4,-3,'#ffd4a9',7);
// Small stalls with striped awnings, arched portal, trees and vegetation.
for(let i=0;i<3;i++){let x=8+i*3.2,z=-10-i*.7;box(2.5,2.3,2,wood,x,1.15,z);box(2,1.2,.05,glow,x,1.3,z+1.03);cylinder(0,1.9,1.4,roof,x,3,z,scene,4).rotation.y=Math.PI/4;box(2.8,.15,1.1,cream,x,2.3,z+1.25);}
for(let side of [-1,1]){let x=side*2.8,z=-9;cylinder(.32,.42,3.2,stone,x,1.6,z);ball(gold,x,3.2,z,.45)}const arch=mesh(new THREE.TorusGeometry(2.8,.13,10,48,Math.PI),gold,0,3.2,-9);for(let i=0;i<=20;i++){let a=i/20*Math.PI;ball(glow,Math.cos(a)*2.8,3.2+Math.sin(a)*2.8,-8.98,.06)}
let seed=238;function random(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}const leafM=[M('#4f5964'),M('#656b71'),M('#667c7c')];
const needleGeo=new THREE.IcosahedronGeometry(1,1);
for(let i=0;i<22;i++){let a=i/22*Math.PI*2,r=17+random(),x=Math.cos(a)*r,z=Math.sin(a)*r;if(z>10&&Math.abs(x)<7)continue;let h=2.8+random()*3;cylinder(.09,.21,h,wood,x,h*.5,z,scene,9);for(let level=0;level<7;level++)for(let j=0;j<5;j++){const angle=j/5*Math.PI*2+level*.8,len=(1-level/8)*1.4,xx=x+Math.cos(angle)*len*.5,zz=z+Math.sin(angle)*len*.5;const branch=mesh(needleGeo,leafM[i%3],xx,h*.28+level*h*.1,zz);branch.scale.set(len,.22,len*.38);branch.rotation.set(.12,angle,.15);}}
for(let i=0;i<100;i++){let x=(random()-.5)*33,z=(random()-.5)*30;if(Math.abs(x-Math.sin(z*.14)*1.5)<3.4||x<-5&&z<6||z<-11)continue;let m=ball(leafM[i%3],x,.12,z,.2+random()*.25);m.scale.y=.6;if(i%4===0)ball(i%8?pinkGlow:blueGlow,x,.35,z,.055)}
// Lamp posts with warm pools and floating paper lanterns.
for(let z of [9,3,-4])for(let side of [-1,1]){let x=Math.sin(z*.14)*1.5+side*3.5;cylinder(.07,.14,2.7,gold,x,1.35,z,scene,10);box(.4,.55,.4,glow,x,2.8,z);cylinder(0,.37,.3,gold,x,3.22,z,scene,4).rotation.y=Math.PI/4;halo(x,2.8,z,'#ffdca6',2.2);light('#ffcd97',8,x,2.7,z,5)}
const lanterns=[];for(let i=0;i<24;i++){const g=new THREE.Group();g.position.set((random()-.5)*30,7+random()*9,(random()-.5)*20-4);scene.add(g);cylinder(.17,.2,.4,glow,0,0,0,g,8);cylinder(.19,.19,.025,gold,0,-.2,0,g,8);halo(0,0,0,'#ffcf93',1.6,g);lanterns.push({g,y:g.position.y,phase:random()*6})}
// Dense curved fibres and independently animated feet/eyes.
const companion=createCompanion(),fluff=companion.group,eyes=companion.eyes,feet=companion.feet;fluff.position.set(2.6,1,8);fluff.rotation.y=-.15;scene.add(fluff);
const companionLight=light('#ffe1c7',10,2,3,10,7),companionHalo=halo(2.6,.1,8,'#c2b4ff',2);
// Tiny drifting particles and a distant moon.
const pos=[];for(let i=0;i<650;i++)pos.push((random()-.5)*250,12+random()*75,(random()-.5)*230);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));const stars=new THREE.Points(geo,new THREE.PointsMaterial({size:.07,color:'#dfd5ff',map:glowMap,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(stars);ball(new THREE.MeshBasicMaterial({color:'#e1d5dc'}),-45,46,-100,3);halo(-45,46,-99,'#b2b9ef',18);
// A vaulted gate, climbing gilded ribs and suspended star crests.
const gateShape=new THREE.Shape();gateShape.moveTo(-.75,0);gateShape.lineTo(.75,0);gateShape.lineTo(.75,1.9);gateShape.quadraticCurveTo(.75,2.65,0,2.9);gateShape.quadraticCurveTo(-.75,2.65,-.75,1.9);gateShape.closePath();
const gate=mesh(new THREE.ExtrudeGeometry(gateShape,{depth:.12,bevelEnabled:true,bevelThickness:.05,bevelSize:.04,bevelSegments:2,steps:1}),M('#39324c'),0,.2,2.08,castle);
for(let side of [-1,1])rod([side*.66,.3,2.24],[side*.66,2.1,2.24],.035,gold,castle);
for(let i=0;i<5;i++)box(.035,1.9,.025,gold,(i-2)*.22,1.2,2.24,castle);
function starShape(radius=.3){const shape=new THREE.Shape();for(let i=0;i<10;i++){let a=i*Math.PI/5+Math.PI/2,r=i%2?radius*.42:radius;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?shape.lineTo(x,y):shape.moveTo(x,y)}shape.closePath();return shape}
const starGeo=new THREE.ExtrudeGeometry(starShape(.27),{depth:.06,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2});
mesh(starGeo,glow,0,3.7,2.2,castle);const crest=torus(.65,.035,gold,0,3.7,2.15,castle);
for(let x of [-3.6,3.6]){box(.72,1.8,.05,M('#95799a'),x,3.7,1.32,castle);mesh(starGeo,gold,x,3.9,1.38,castle).scale.setScalar(.6)}
for(let spec of [[-5,0,8,1],[5,0,7,1.1],[-2,-1.5,10,.9],[2,-2,12,1.15],[0,1,8.5,1]]){const [x,z,h,r]=spec;for(let j=0;j<8;j++){const a=j/8*Math.PI*2;rod([x+Math.cos(a)*r*1.4,h-.05,z+Math.sin(a)*r*1.4],[x,h+r*2.45,z],.017,gold,castle)}for(let yy=1;yy<h-1;yy+=1.4)cylinder(r*1.015,r*1.015,.045,M('#727085'),x,yy,z,castle,20)}
// Fairy lights arc above the path. Every strand has a physical catenary-like curve.
for(let zi of [-7,0,7]){const points=[];for(let i=0;i<=30;i++){let x=-4+i*8/30,y=4.3+.055*x*x;points.push(new THREE.Vector3(x,y,zi));if(i%2===0)ball(i%4?glow:pinkGlow,x,y-.07,zi,.045)}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),30,.012,4,false),gold);for(let x of [-4,4])rod([x,0,zi],[x,5.2,zi],.035,gold);}
// Shore edging and warm dotted reflections on moving water.
for(let i=0;i<60;i++){let a=i/60*Math.PI*2;const rock=ball(stone,-10+Math.cos(a)*7.2,.1,-3+Math.sin(a)*11.6,.22);rock.scale.y*=.55;}
const waterUniforms={uTime:{value:0}};
lake.material=new THREE.ShaderMaterial({uniforms:waterUniforms,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`precision mediump float;varying vec2 vUv;uniform float uTime;void main(){vec2 p=vUv;float w=sin(p.y*95.+sin(p.x*31.+uTime)*1.5+uTime*.7)*.5+.5;float shimmer=pow(w,12.)*.18;vec3 color=mix(vec3(.047,.085,.16),vec3(.11,.17,.24),p.y);float moon=exp(-pow((p.x-.59)*8.+sin(p.y*47.+uTime)*.2,2.))*smoothstep(.8,.2,p.y);float glints=pow(max(0.,sin(p.y*180.+uTime*.9)),28.)*moon;gl_FragColor=vec4(color+vec3(.24,.26,.36)*shimmer+vec3(.62,.43,.22)*glints*.32,1.);}`});
// Water lilies, lit mushroom clusters and soft flowering trees.
const lilypad=M('#618e8e'),petalM=M('#c4a9d5'),flowerPink=M('#b890b5'),flowerLilac=M('#9694bc');
for(let i=0;i<12;i++){let x=-13+random()*7,z=-7+random()*10;let pad=mesh(new THREE.CircleGeometry(.25+random()*.2,14),lilypad,x,.07,z);pad.rotation.x=-Math.PI/2;for(let j=0;j<5;j++){let a=j/5*Math.PI*2;let petal=ball(petalM,x+Math.cos(a)*.08,.13,z+Math.sin(a)*.08,.09);petal.scale.y*=.5;}ball(pinkGlow,x,.16,z,.035)}
for(let i=0;i<24;i++){let x=(random()-.5)*26,z=(random()-.5)*24;if(Math.abs(x)<4||x<-5&&z<8)continue;let h=.25+random()*.3;cylinder(.035,.05,h,cream,x,h/2,z,scene,6);const cap=mesh(new THREE.SphereGeometry(.22,12,8,0,Math.PI*2,0,Math.PI/2),i%3?petalM:glow,x,h,z);cap.scale.y=.55;}
for(let [x,z,h] of [[-6,10,3],[8,9,3.7],[13,-7,3.5],[-15,-10,4]]){rod([x,0,z],[x+.15,h,z],.13,wood);for(let j=0;j<5;j++){let a=j/5*Math.PI*2;rod([x,h*.6,z],[x+Math.cos(a)*.75,h-.4,z+Math.sin(a)*.75],.06,wood);const crown=ball(j%2?flowerPink:flowerLilac,x+Math.cos(a)*.7,h+random()*.4,z+Math.sin(a)*.65,.75);crown.scale.y*=.72;for(let k=0;k<3;k++)ball(pinkGlow,x+Math.cos(a)*.7+(random()-.5)*.7,h+(random()-.5)*.7,z+Math.sin(a)*.65+(random()-.5)*.7,.025)}}
// Enchanted swan seats on the carousel rather than flat disks.
seats.forEach((seat,i)=>{const swanM=i%2?M('#dac0d5'):M('#d8dbd3');const neckPoints=[new THREE.Vector3(.3,0,0),new THREE.Vector3(.5,.25,0),new THREE.Vector3(.4,.55,0),new THREE.Vector3(.5,.68,0)];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(neckPoints),12,.07,7,false),swanM,0,0,0,seat);ball(swanM,.52,.67,0,.12,seat);let beak=cylinder(0,.045,.16,gold,.67,.65,0,seat,6);beak.rotation.z=-Math.PI/2;for(let side of [-1,1]){const wing=ball(swanM,-.06,.12,side*.2,.29,seat);wing.scale.multiply(new THREE.Vector3(1.35,.45,.5));wing.rotation.z=-.25;}ball(dark,.55,.71,.095,.018,seat)});
// Crescent crest and scalloped gold canopy trim.
for(let j=0;j<24;j++){let a=j/24*Math.PI*2;const swag=mesh(new THREE.TorusGeometry(.43,.025,5,16,Math.PI),gold,Math.cos(a)*3.45,4.2,Math.sin(a)*3.45,carousel);swag.rotation.set(0,-a+Math.PI/2,Math.PI);}
const moonShape=new THREE.Shape();moonShape.absarc(0,0,.55,.6,Math.PI*2-.6,false);moonShape.quadraticCurveTo(-.15,0,.55*Math.cos(.6),.55*Math.sin(.6));const crescent=mesh(new THREE.ExtrudeGeometry(moonShape,{depth:.07,bevelEnabled:false}),glow,0,7.1,0,carousel);crescent.rotation.z=-.25;
// Fireflies respond to the companion; particles are one draw call.
const fireCount=90,fireData=new Float32Array(fireCount*3),fireSeeds=[];for(let i=0;i<fireCount;i++)fireSeeds.push({x:(random()-.5)*28,y:.6+random()*4,z:(random()-.5)*25,p:random()*6});const fireGeo=new THREE.BufferGeometry();fireGeo.setAttribute('position',new THREE.BufferAttribute(fireData,3));const fireflies=new THREE.Points(fireGeo,new THREE.PointsMaterial({color:'#f7d5a4',size:.14,map:glowMap,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(fireflies);
// Faint moving nebula in the actual sky dome, not a flat backdrop image.
const skyUniforms={uTime:{value:0},uTint:{value:new THREE.Color('#b9b7ff')}};const sky=mesh(new THREE.SphereGeometry(230,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:skyUniforms,vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`precision mediump float;varying vec3 vP;uniform float uTime;uniform vec3 uTint;void main(){vec3 p=normalize(vP);float h=smoothstep(-.1,.6,p.y);vec3 col=mix(vec3(.105,.09,.18),vec3(.027,.043,.10),h);float band=exp(-pow((p.y-.32-sin(p.x*4.+uTime*.025)*.09)*11.,2.));float folds=.5+.5*sin(p.x*14.+p.z*6.+uTime*.03);col+=vec3(.045,.04,.09)*band*folds;col+=uTint*band*folds*.085;gl_FragColor=vec4(col,1.);}`}));sky.castShadow=false;sky.receiveShadow=false;
// Six themed islands and their bridges surround the original park.
const archipelago=buildArchipelago({scene,mesh,ball,cylinder,box,rod,torus,halo,M,glowMap});
stone.bumpMap=archipelago.grain;stone.bumpScale=.045;roof.metalness=.35;roof.roughness=.38;gold.roughness=.25;
const targetLight=new THREE.Color('#b9b7ff');let targetBrightness=1;
function applyAppearance(detail){companion.customize(detail);targetLight.set(detail.light);targetBrightness=detail.brightness/100;skyUniforms.uTint.value.copy(targetLight);}
applyAppearance(window.labAppearance||{light:'#b9b7ff',brightness:100,fur:'#eee3ed',fluff:100,roundness:50,accessory:'none'});window.addEventListener('lab:appearance',e=>applyAppearance(e.detail));
// The customizer shows the very same model/materials at a closer distance.
let portraitRenderer=null,portraitScene=null,portraitCamera=null,portraitModel=null,portraitFrame=0;
window.addEventListener('lab:preview',()=>{if(!window.labPreviewVisible||portraitRenderer)return;try{const c=document.getElementById('fluff-preview');portraitRenderer=new THREE.WebGLRenderer({canvas:c,alpha:true,antialias:true,powerPreference:'low-power'});portraitRenderer.setPixelRatio(Math.min(devicePixelRatio,1.7));portraitRenderer.setSize(c.clientWidth,c.clientHeight,false);portraitRenderer.outputColorSpace=THREE.SRGBColorSpace;portraitRenderer.toneMapping=THREE.ACESFilmicToneMapping;portraitScene=new THREE.Scene();portraitScene.environment=scene.environment;portraitScene.add(new THREE.HemisphereLight('#e4e4ff','#705f78',2));const key=new THREE.DirectionalLight('#fff2df',3);key.position.set(-3,5,5);portraitScene.add(key);portraitCamera=new THREE.PerspectiveCamera(35,c.clientWidth/c.clientHeight,.1,20);portraitCamera.position.set(0,.45,4.5);portraitCamera.lookAt(0,0,0);portraitModel=fluff.clone(true);portraitModel.children[0].children.find(o=>o.isInstancedMesh).instanceMatrix=fluff.children[0].children.find(o=>o.isInstancedMesh).instanceMatrix;portraitModel.position.set(0,0,0);portraitModel.rotation.set(0,-.1,0);portraitScene.add(portraitModel);}catch{document.getElementById('fluff-preview').setAttribute('aria-label','공원 속 플러프에 꾸미기가 적용됩니다.');}});
// Merge static siblings by material. Keeps moving rides and tappable Fluff independent.
function batchStatic(parent){const groups=new Map();for(const child of [...parent.children]){if(child===fluff||child===sky||child===lake||child.isInstancedMesh)continue;if(child.isGroup){batchStatic(child);continue}if(!child.isMesh||child.material.transparent||Array.isArray(child.material)||!child.geometry.attributes.normal||!child.geometry.attributes.uv)continue;const key=child.material.uuid;const list=groups.get(key)||[];list.push(child);groups.set(key,list)}for(const list of groups.values()){if(list.length<5)continue;const buffers={position:[],normal:[],uv:[]};let count=0;for(const m of list){m.updateMatrix();let g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);for(const key in buffers)buffers[key].push(g.attributes[key].array);count+=g.attributes.position.count;g.dispose();parent.remove(m)}const g=new THREE.BufferGeometry();for(const key in buffers){const size=key==='uv'?2:3,array=new Float32Array(count*size);let offset=0;for(const a of buffers[key]){array.set(a,offset);offset+=a.length}g.setAttribute(key,new THREE.BufferAttribute(array,size))}const combined=new THREE.Mesh(g,list[0].material);combined.castShadow=true;combined.receiveShadow=true;parent.add(combined)}}batchStatic(scene);

// Books turn the walk into a knowledge trail. Each has its own field.
const bookSpecs=[
  {x:2.6,z:5.1,cat:'moral',label:'도덕과 판단',color:'#c9adff'},
  {x:-5,z:-46,cat:'science',label:'과학',color:'#a7dbf5'},
  {x:6,z:-56,cat:'math',label:'수학과 논리',color:'#b2c9ff'},
  {x:40,z:-24,cat:'law',label:'법과 사회',color:'#ebd2a3'},
  {x:52,z:-22,cat:'ethics',label:'생명윤리',color:'#eac0bb'},
  {x:44,z:24,cat:'philosophy',label:'철학자',color:'#ccb6f1'},
  {x:-6,z:49,cat:'nature',label:'동물과 환경',color:'#a4dec3'},
  {x:-42,z:32,cat:'art',label:'예술과 음악',color:'#efb4cf'},
  {x:-40,z:-24,cat:'history',label:'역사와 문화',color:'#ecd099'},
  {x:-52,z:-23,cat:'world',label:'세상과 언어',color:'#a8d3dd'}
];
const books=bookSpecs.map(spec=>{
  const root=new THREE.Group();root.position.set(spec.x,0,spec.z);scene.add(root);
  cylinder(.72,.82,.12,stone,0,.08,0,root,32);
  const ring=torus(.84,.025,new THREE.MeshBasicMaterial({color:spec.color}),0,.15,0,root);ring.rotation.x=-Math.PI/2;
  const book=new THREE.Group();book.position.y=1.55;root.add(book);
  for(const side of [-1,1]){const page=new THREE.Group();page.rotation.z=side*-.2;book.add(page);box(.54,.08,.72,M(spec.color),side*.28,0,0,page);box(.48,.08,.64,cream,side*.28,.065,0,page);for(let line=0;line<4;line++)box(.32,.007,.012,gold,side*.28,.112,-.21+line*.13,page);}
  cylinder(.035,.035,.72,gold,0,0,0,book,8).rotation.x=Math.PI/2;
  const sparkle=mesh(starGeo,new THREE.MeshBasicMaterial({color:spec.color}),0,2.25,0,root);sparkle.scale.setScalar(.35);
  const aura=halo(0,1.5,0,spec.color,2.7,root);
  return {...spec,root,book,ring,sparkle,aura};
});
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),status=document.getElementById('park-status');
const discoveryCard=document.getElementById('discovery-card'),screenPoint=new THREE.Vector3(),discoveryGate=createDiscoveryGate();
let canvasRect=canvas.getBoundingClientRect(),knowledgeOrigin=null,shownBook=null;
window.parkKnowledgeOrigin=()=>knowledgeOrigin;
window.dismissParkDiscovery=()=>{discoveryGate.dismiss();shownBook=null;window.showParkDiscovery(null)};
const keys=new Set(),tapUntil=new Map(),pointers=new Map(),velocity=new THREE.Vector2(),joy=new THREE.Vector2();
let route=[],destination=null,currentRegion='park',regionTimer,travelTimer;
let nearby=null,celebrateUntil=0,follow=false,jumpY=0,jumpVelocity=0,landingAt=-100,walkPhase=0,activeTime=0;
let lastX=0,lastY=0,moved=0,pinchDistance=0;
const typing=e=>['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.isContentEditable;
const paused=()=>document.body.classList.contains('quiz-open')||document.body.classList.contains('studio-open')||document.body.classList.contains('travelling');
const keyDirections={KeyW:[0,-1],ArrowUp:[0,-1],KeyS:[0,1],ArrowDown:[0,1],KeyA:[-1,0],ArrowLeft:[-1,0],KeyD:[1,0],ArrowRight:[1,0]};
function startJump(){if(paused()||jumpY>.01)return;jumpVelocity=6.1;}
function clearControls(){route=[];destination=null;keys.clear();tapUntil.clear();joy.set(0,0);velocity.set(0,0);pointers.clear();joyPointer=null;joystick.classList.remove('active');stick.style.transform='translate(-50%,-50%)';}
window.addEventListener('keydown',e=>{
  if(typing(e)||e.metaKey||e.ctrlKey||e.altKey||paused())return;
  if(keyDirections[e.code]){route=[];destination=null;e.preventDefault();document.activeElement?.blur();keys.add(e.code);if(!e.repeat)tapUntil.set(e.code,performance.now()+110);}
  if(e.code==='Space'&&!(e.target.closest('button,summary,a'))){e.preventDefault();if(!e.repeat)startJump();}
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',clearControls);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearControls()});
// Thumbstick also exposes four directional buttons for keyboard/accessibility use.
const joystick=document.getElementById('joystick'),stick=joystick.querySelector('.joystick-stick');let joyPointer=null;
function setJoystick(e){route=[];destination=null;const r=joystick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,range=34,len=Math.hypot(dx,dy),scale=Math.min(1,range/Math.max(1,len));joy.set(dx*scale/range,dy*scale/range);if(len<5)joy.set(0,0);stick.style.transform=`translate(calc(-50% + ${joy.x*range}px),calc(-50% + ${joy.y*range}px))`;}
joystick.addEventListener('pointerdown',e=>{if(paused())return;e.preventDefault();joyPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);joystick.classList.add('active');setJoystick(e)});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)setJoystick(e)});
function releaseJoystick(e){if(e.pointerId!==joyPointer)return;joyPointer=null;joy.set(0,0);joystick.classList.remove('active');stick.style.transform='translate(-50%,-50%)'}
joystick.addEventListener('pointerup',releaseJoystick);joystick.addEventListener('pointercancel',releaseJoystick);joystick.addEventListener('lostpointercapture',releaseJoystick);
joystick.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',e=>{if(e.detail===0){const code={up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD'}[b.dataset.move];tapUntil.set(code,performance.now()+220)}}));

function pointDistance(){const p=[...pointers.values()];return p.length===2?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0}
canvas.addEventListener('pointerdown',e=>{if(paused())return;document.activeElement?.blur();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});lastX=e.clientX;lastY=e.clientY;moved=0;if(pointers.size===2)pinchDistance=pointDistance();canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const d=pointDistance();targetDistance=Math.max(12,Math.min(100,targetDistance+(pinchDistance-d)*.045));pinchDistance=d;moved=100;return}const dx=e.clientX-lastX,dy=e.clientY-lastY;moved+=Math.abs(dx)+Math.abs(dy);targetYaw-=dx*.003;targetPitch=Math.max(.25,Math.min(.9,targetPitch+dy*.0018));lastX=e.clientX;lastY=e.clientY});
const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-.12),clickPoint=new THREE.Vector3();
function moveTo(x,z){const nextRoute=findPath({x:fluff.position.x,z:fluff.position.z},{x,z});if(!nextRoute.length)return;route=nextRoute;destination=route.at(-1);addRipple(destination.x,destination.z);window.labSound?.('move');document.body.classList.add('has-walked');}
canvas.addEventListener('pointerup',e=>{if(!paused()&&moved<8&&pointers.size===1){const rect=canvas.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);if(ray.intersectObject(fluff,true).length)startJump();else{const hit=books.find(b=>ray.intersectObject(b.root,true).length);if(hit)moveTo(hit.x,hit.z);else if(ray.ray.intersectPlane(groundPlane,clickPoint))moveTo(clickPoint.x,clickPoint.z);}}pointers.delete(e.pointerId);if(pointers.size){const p=[...pointers.values()][0];lastX=p.x;lastY=p.y}});
canvas.addEventListener('pointercancel',e=>pointers.delete(e.pointerId));canvas.addEventListener('wheel',e=>{e.preventDefault();targetDistance=Math.max(12,Math.min(100,targetDistance+e.deltaY*.015))},{passive:false});
window.parkCelebrate=()=>{celebrateUntil=performance.now()+1200;emitMotes(fluff.position.x,1.2,fluff.position.z,30)};
window.parkNearbyCategory=()=>nearby?.cat;
window.addEventListener('lab:open',()=>{clearControls();window.dismissParkDiscovery();if(nearby)emitMotes(nearby.x,1.6,nearby.z,42);else emitMotes(fluff.position.x,1.2,fluff.position.z,42)});
window.addEventListener('lab:close',clearControls);window.addEventListener('lab:pause',clearControls);
const ripples=Array.from({length:5},()=>{const uniforms={uAge:{value:2},uColor:{value:targetLight.clone()}};const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float uAge;uniform vec3 uColor;void main(){float d=length(vUv-.5)*2.;float a=uAge;float wave=exp(-pow((d-a*.8)*45.,2.));wave+=exp(-pow((d-a*.8+.18)*50.,2.))*.45;float fade=max(0.,1.-a/1.2);gl_FragColor=vec4(uColor,wave*fade*.8);}' });const m=mesh(new THREE.PlaneGeometry(5,5),mat,0,.17,0);m.rotation.x=-Math.PI/2;m.visible=false;m.castShadow=false;m.receiveShadow=false;return {m,uniforms,age:2};});let rippleCursor=0;
function addRipple(x,z){const r=ripples[rippleCursor++%ripples.length];r.m.position.set(x,.17,z);r.age=0;r.m.visible=true;r.uniforms.uColor.value.copy(targetLight);}
const destinationRing=mesh(new THREE.RingGeometry(.16,.2,40),new THREE.MeshBasicMaterial({color:'#e4e3ff',transparent:true,opacity:.6,depthWrite:false}),0,.18,0);destinationRing.rotation.x=-Math.PI/2;destinationRing.visible=false;destinationRing.castShadow=false;destinationRing.receiveShadow=false;
function announceRegion(region){clearTimeout(regionTimer);const banner=document.getElementById('region-arrival');document.getElementById('region-name').textContent=region.name;document.getElementById('region-subject').textContent=region.subject;banner.classList.add('show');regionTimer=setTimeout(()=>banner.classList.remove('show'),3400);window.dispatchEvent(new CustomEvent('lab:region',{detail:region.id}));}
window.travelToIsland=id=>{const island=islands.find(i=>i.id===id);if(!island)return;clearTimeout(travelTimer);clearControls();document.body.classList.add('travelling','has-walked');window.dismissParkDiscovery();window.labSound?.('travel');travelTimer=setTimeout(()=>{fluff.position.set(island.spawn.x,1,island.spawn.z);target.set(island.spawn.x,2.2,island.spawn.z);follow=true;targetDistance=innerWidth<650?31:23;targetYaw=Math.atan2(island.spawn.x-island.x,island.spawn.z-island.z);yaw=targetYaw;fluff.rotation.y=Math.atan2(island.x-island.spawn.x,island.z-island.spawn.z);targetPitch=.48;velocity.set(0,0);nearby=null;currentRegion=island.id;addRipple(fluff.position.x,fluff.position.z);announceRegion(island);setTimeout(()=>document.body.classList.remove('travelling'),450);},260);};
window.dispatchEvent(new CustomEvent('lab:region',{detail:'park'}));
// A single particle buffer for footsteps, landings and book discoveries.
const moteCount=72,motePositions=new Float32Array(moteCount*3).fill(-100),moteStates=Array.from({length:moteCount},()=>({life:0}));
const moteGeo=new THREE.BufferGeometry();moteGeo.setAttribute('position',new THREE.BufferAttribute(motePositions,3));
const motes=new THREE.Points(moteGeo,new THREE.PointsMaterial({color:'#ffe6b6',size:.14,map:glowMap,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(motes);let moteCursor=0,lastTrail=0;
function emitMotes(x,y,z,count){if(reduce.matches||document.body.classList.contains('still'))return;for(let i=0;i<count;i++){const a=random()*Math.PI*2,s=count>5?1.5+random()*2:.2;const m=moteStates[moteCursor++%moteCount];Object.assign(m,{x,y,z,vx:Math.cos(a)*s,vy:1+random()*2,vz:Math.sin(a)*s,life:.6+random()*.5});}}
function updateNearby(now){
  let candidate=nearby&&Math.hypot(fluff.position.x-nearby.x,fluff.position.z-nearby.z)<3.5?nearby:null;
  if(!candidate){let nearest=2.7;for(const b of books){const d=Math.hypot(fluff.position.x-b.x,fluff.position.z-b.z);if(d<nearest){candidate=b;nearest=d;}}}
  if(candidate!==nearby||!status.textContent){nearby=candidate;status.textContent=nearby?`${nearby.label} 잡지식 발견`:'바닥을 눌러 이동 · 책에 가까이 가면 질문이 나타납니다';}
  const eligible=discoveryGate.update(candidate?.cat||null,now),nextBook=paused()?null:eligible;
  if(nextBook!==shownBook){shownBook=nextBook;window.showParkDiscovery(nextBook?candidate:null);}
}
let lastFrame=0,previousWidth=0;
function animate(now){requestAnimationFrame(animate);if(document.hidden){lastFrame=now;return}if(now-lastFrame<(paused()?40:innerWidth<650?28:16))return;
  const dt=Math.min((now-lastFrame)/1000||.016,.05);lastFrame=now;activeTime+=dt;const t=activeTime,still=reduce.matches||document.body.classList.contains('still');
  let ix=joy.x,iz=joy.y;for(const [code,direction] of Object.entries(keyDirections)){if(keys.has(code)||(tapUntil.get(code)||0)>now){ix+=direction[0];iz+=direction[1];}}
  if(paused()){ix=0;iz=0;}
  let input=moveVector(ix,iz,yaw);let speed=6.2;
  if(!paused()&&!ix&&!iz&&route.length){let waypoint=route[0],dx=waypoint.x-fluff.position.x,dz=waypoint.z-fluff.position.z,d=Math.hypot(dx,dz);if(d<.22){route.shift();waypoint=route[0];if(!waypoint){destination=null;velocity.set(0,0);}}if(waypoint){dx=waypoint.x-fluff.position.x;dz=waypoint.z-fluff.position.z;d=Math.hypot(dx,dz);input={x:dx/Math.max(.001,d),z:dz/Math.max(.001,d)};speed=Math.min(6.2,d*9);}}
  const smooth=1-Math.exp(-dt*18);velocity.x+=(input.x*speed-velocity.x)*smooth;velocity.y+=(input.z*speed-velocity.y)*smooth;
  if(Math.abs(velocity.x)+Math.abs(velocity.y)<.025)velocity.set(0,0);
  const oldX=fluff.position.x,oldZ=fluff.position.z,next=moveOnGround({x:oldX,z:oldZ},{x:velocity.x,z:velocity.y},dt);
  fluff.position.x=next.x;fluff.position.z=next.z;const travelled=Math.hypot(next.x-oldX,next.z-oldZ),walking=travelled>.001;
  if(walking){if(!follow){follow=true;targetDistance=innerWidth<650?31:23;targetPitch=.47;}document.body.classList.add('has-walked');walkPhase+=travelled*4.2;const facing=Math.atan2(velocity.x,velocity.y);fluff.rotation.y+=Math.atan2(Math.sin(facing-fluff.rotation.y),Math.cos(facing-fluff.rotation.y))*Math.min(1,dt*12);if(t-lastTrail>.12){emitMotes(next.x,.13,next.z,2);window.labSound?.('step');lastTrail=t;}}
  if(!paused()&&(jumpY>0||jumpVelocity>0)){jumpVelocity-=15*dt;jumpY+=jumpVelocity*dt;if(jumpY<=0){jumpY=0;jumpVelocity=0;landingAt=t;emitMotes(next.x,.13,next.z,14);window.labSound?.('land');}}
  const celebrate=!still&&now<celebrateUntil,hop=celebrate?Math.abs(Math.sin(t*9))*.4:0,land=Math.max(0,1-(t-landingAt)/.22);
  fluff.position.y=1+jumpY+hop+(!still&&walking?Math.abs(Math.sin(walkPhase))*.08:0);
  fluff.scale.set(1+land*.09,1-land*.15,1+land*.09);fluff.rotation.z=!still&&walking?Math.sin(walkPhase)*.07:0;
  feet.forEach((foot,i)=>{foot.position.z=.15+(!still&&walking?Math.sin(walkPhase+i*Math.PI)*.23:0);foot.position.y=-.7+(!still&&walking?Math.max(0,Math.cos(walkPhase+i*Math.PI))*.11:0)});
  companionHalo.position.set(next.x,.12,next.z);companionHalo.scale.setScalar(Math.max(1,2-jumpY*.35));companionLight.position.set(next.x,3+jumpY,next.z+1);
  const tx=follow?next.x:0,tz=follow?next.z:0;
  target.x+=(tx-target.x)*(1-Math.exp(-dt*3));target.z+=(tz-target.z)*(1-Math.exp(-dt*3));target.y=follow?2.2:3;
  yaw+=(targetYaw-yaw)*(1-Math.exp(-dt*5));pitch+=(targetPitch-pitch)*(1-Math.exp(-dt*5));distance+=(targetDistance-distance)*(1-Math.exp(-dt*3));
  camera.position.set(target.x+Math.sin(yaw)*distance,target.y+Math.sin(pitch)*distance,target.z+Math.cos(yaw)*distance);camera.lookAt(target);
  moonlight.position.set(target.x-12,30,target.z+6);moonlight.target.position.set(target.x,0,target.z);moonlight.target.updateMatrixWorld();
  moonlight.color.lerp(targetLight,.04);hemi.color.lerp(targetLight,.02);moonlight.intensity+=(3.1*targetBrightness-moonlight.intensity)*.04;hemi.intensity+=(1.3*targetBrightness-hemi.intensity)*.04;
  const region=islandAt(next.x,next.z);if(region&&region.id!==currentRegion){currentRegion=region.id;announceRegion(region);}
  for(const r of ripples){if(r.age<1.25){r.age+=dt;r.uniforms.uAge.value=still?.38:r.age;r.uniforms.uColor.value.copy(targetLight);r.m.visible=true;}else r.m.visible=false;}
  destinationRing.visible=!!destination;if(destination){destinationRing.position.set(destination.x,.18,destination.z);destinationRing.material.opacity=still?.4:.35+Math.sin(t*4)*.15;}
  if(!still)archipelago.update(t);
  if(window.labPreviewVisible&&portraitRenderer&&now-portraitFrame>42){portraitFrame=now;const c=document.getElementById('fluff-preview');if(c.width!==Math.round(c.clientWidth*portraitRenderer.getPixelRatio())){portraitRenderer.setSize(c.clientWidth,c.clientHeight,false);portraitCamera.aspect=c.clientWidth/c.clientHeight;portraitCamera.updateProjectionMatrix();}portraitModel.children[0].scale.copy(fluff.children[0].scale);const sourceAccessories=fluff.children[0].children.at(-1),previewAccessories=portraitModel.children[0].children.at(-1);previewAccessories.children.forEach((child,i)=>child.visible=sourceAccessories.children[i].visible);portraitModel.rotation.y=still?-.12:Math.sin(t*.45)*.22;portraitRenderer.render(portraitScene,portraitCamera);}
  updateNearby(now);
  if(nearby){screenPoint.set(nearby.x,3.1,nearby.z).project(camera);const x=canvasRect.left+(screenPoint.x*.5+.5)*canvasRect.width,y=canvasRect.top+(-screenPoint.y*.5+.5)*canvasRect.height;knowledgeOrigin={x,y};discoveryCard.style.setProperty('--anchor-x',Math.max(180,Math.min(innerWidth-180,x)).toFixed(1)+'px');discoveryCard.style.setProperty('--anchor-y',Math.max(300,Math.min(innerHeight-80,y)).toFixed(1)+'px');}else knowledgeOrigin=null;
  if(!still){wheel.rotation.z=t*.08;gondolas.forEach(g=>g.rotation.z=-wheel.rotation.z);spinning.rotation.y=t*.16;seats.forEach((s,i)=>s.position.y=1.5+Math.sin(t*1.3+i)*.3);lanterns.forEach(({g,y,phase})=>{g.position.y=y+Math.sin(t*.5+phase)*.3;g.rotation.z=Math.sin(t*.4+phase)*.08});waterUniforms.uTime.value=t;skyUniforms.uTime.value=t;for(let i=0;i<fireCount;i++){const f=fireSeeds[i];fireData[i*3]=f.x+Math.sin(t*.3+f.p)*.6;fireData[i*3+1]=f.y+Math.sin(t*.8+f.p)*.4;fireData[i*3+2]=f.z+Math.cos(t*.4+f.p)*.6}fireGeo.attributes.position.needsUpdate=true;eyes.forEach(e=>e.scale.y=.138*(Math.sin(t*1.2)>.995?.12:1));stars.rotation.y=t*.002;}
  books.forEach((b,i)=>{const isNear=b===nearby;b.book.position.y=1.55+(still?0:Math.sin(t*1.7+i)*.13);b.book.rotation.y=still?.25:Math.sin(t*.35+i)*.28;b.sparkle.rotation.z=still?0:t*.4;b.ring.scale.setScalar(isNear?1.18:1);b.aura.material.opacity=isNear?.65:.25;});
  for(let i=0;i<moteCount;i++){const m=moteStates[i];if(m.life>0&&!still){m.life-=dt;m.x+=m.vx*dt;m.z+=m.vz*dt;m.y+=m.vy*dt;m.vy-=dt*3;motePositions.set([m.x,m.y,m.z],i*3)}else motePositions[i*3+1]=-100;}moteGeo.attributes.position.needsUpdate=true;
  renderer.render(scene,camera);
}
function resize(){const rect=canvas.getBoundingClientRect();canvasRect=rect;const w=Math.max(1,rect.width),h=Math.max(1,rect.height);renderer.setSize(w,h,false);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<650?1.35:1.7));camera.aspect=w/h;camera.fov=innerWidth<650?58:44;camera.updateProjectionMatrix();if(Math.abs(previousWidth-innerWidth)>60){targetDistance=innerWidth<650?(follow?31:43):(follow?23:29);targetPitch=follow?.47:innerWidth<650?.4:.32;previousWidth=innerWidth}status.textContent='';updateNearby(performance.now());}
resize();requestAnimationFrame(animate);window.addEventListener('resize',resize);new ResizeObserver(resize).observe(canvas);
}
