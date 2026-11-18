import * as T from './vendor/three.module.js';
import {makeBuilder} from './architecture-kit.js';
import {balloonColors} from './balloon-design.js';
import {bubbleMaterial,balloonStar} from './held-balloon.js';

export function dressBalloonBooth(root){
 const b=makeBuilder(root),sphere=new T.SphereGeometry(1,20,14),paint=new T.MeshPhysicalMaterial({color:'#ffffff',roughness:.24,metalness:.08,clearcoat:1}),string=new T.MeshStandardMaterial({color:'#d8bf8c',roughness:.65});
 const opaque=new T.InstancedMesh(sphere,paint,32),clear=new T.InstancedMesh(sphere,bubbleMaterial(true),16),stars=new T.InstancedMesh(balloonStar(),paint,16),dummy=new T.Object3D();opaque.name='balloon-bouquet-colours';clear.name='balloon-bouquet-clear-shells';stars.name='balloon-bouquet-inner-stars';clear.renderOrder=3;
 let solids=0,shells=0;
 for(let i=0;i<48;i++){
  const a=i*2.399963,r=.4+Math.sqrt((i%12)/12)*1.35,x=Math.cos(a)*r,z=Math.sin(a)*r*.6-.2,y=3.2+Math.floor(i/12)*.83+(i%3)*.12,c=new T.Color(balloonColors[i%balloonColors.length]);
  b.tube([[i%2?-.7:.7,2.45,-.3],[x*.65,2.9+(y-3.2)*.5,z*.65],[x,y-.42,z]],.007,string,root,12);
  dummy.position.set(x,y,z);dummy.rotation.set(0,a*.12,Math.cos(a)*.1);dummy.scale.set(.35,.44,.35);dummy.updateMatrix();
  if(i%3){opaque.setMatrixAt(solids,dummy.matrix);opaque.setColorAt(solids++,c);}else{dummy.scale.set(.42,.47,.42);dummy.updateMatrix();clear.setMatrixAt(shells,dummy.matrix);dummy.scale.set(.25,.25,.25);dummy.updateMatrix();stars.setMatrixAt(shells,dummy.matrix);stars.setColorAt(shells++,c);}
 }
 opaque.computeBoundingSphere();clear.computeBoundingSphere();stars.computeBoundingSphere();root.add(opaque,clear,stars);
 (root.userData.lampGlow||=[]).push({x:-.8,y:2.4,z:.5,radius:2.6},{x:.8,y:2.4,z:.5,radius:2.6});
 const geometry=new T.SphereGeometry(1,12,8),seeds=new Float32Array(28);for(let i=0;i<28;i++)seeds[i]=i*.618%1;geometry.setAttribute('seed',new T.InstancedBufferAttribute(seeds,1));
 const material=bubbleMaterial(true),time={value:0};material.uniforms.time=time;
 material.vertexShader='attribute float seed;uniform float time;varying float lifeFade;'+material.vertexShader.replace('vec4 p=modelViewMatrix*instanceMatrix*vec4(position,1.);','float age=fract(seed+time*.043);lifeFade=smoothstep(0.,.1,age)*(1.-smoothstep(.72,1.,age));vec4 world=instanceMatrix*vec4(position,1.);world.y+=age*5.;world.x+=sin(age*4.+seed*32.)*.6;world.z+=cos(age*3.+seed*17.)*.45;vec4 p=modelViewMatrix*world;');
 material.fragmentShader='varying float lifeFade;'+material.fragmentShader.replace('.02+rim*.43+glint*.65','(.02+rim*.43+glint*.65)*lifeFade');
 const bubbles=new T.InstancedMesh(geometry,material,28);bubbles.name='balloon-booth-ambient-bubbles';bubbles.userData.cameraIgnore=true;bubbles.frustumCulled=false;
 for(let i=0;i<28;i++){const a=i*2.399963,r=1.2+(i%5)*.42;dummy.position.set(Math.cos(a)*r,1.2,Math.sin(a)*r);dummy.rotation.set(0,0,0);dummy.scale.setScalar(.10+(i%5)*.045);dummy.updateMatrix();bubbles.setMatrixAt(i,dummy.matrix);}root.add(bubbles);
 return{update(t,still){time.value=still?0:t;},setQuality(q){bubbles.count=q==='low'?8:q==='medium'?18:28;}};
}
