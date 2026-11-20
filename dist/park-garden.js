import * as T from './vendor/three.module.js';
import {parkFlowerbeds,parkWalkways,parkObstacles} from './park-layout.js';
import {surfaceHeight} from './world-layout.js';

// Scatter a few flat stones within the shared routes, leaving snow between them.
// A single grid prevents duplicate stones where routes intersect.
export function buildParkGarden(scene){
 const samples=[{x:-6,z:1,r:6.2}];
 for(const route of parkWalkways){const curve=new T.CatmullRomCurve3(route.points.map(([x,z])=>new T.Vector3(x,0,z))),n=Math.ceil(curve.getLength()/.4);for(let i=0;i<=n;i++){const p=curve.getPointAt(i/n);samples.push({x:p.x,z:p.z,r:route.width/2});}}
 const stones=[],random=(a,b)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n);};
 for(let row=-7;row<=13;row++)for(let col=-16;col<=12;col++){
  if(random(col,row)>.42)continue;
  const x=col*3.7+(row%2)*1.85+(random(col+91,row)-.5)*.65,z=row*3+(random(col,row+73)-.5)*.55;
  let edge=Infinity;for(const p of samples)edge=Math.min(edge,Math.hypot(x-p.x,z-p.z)-p.r);
  if(edge>0||parkObstacles.some(p=>Math.hypot((x-p.x)/(p.rx??p.r), (z-p.z)/(p.rz??p.r))<1.06))continue;
  if(edge>-.45)continue;
  stones.push([x,z]);
 }
 const material=new T.MeshStandardMaterial({color:'#ffffff',roughness:.86,metalness:0});
 material.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 stoneP;').replace('#include <begin_vertex>','#include <begin_vertex>\nstoneP=position;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 stoneP;').replace('#include <color_fragment>','#include <color_fragment>\nfloat grain=fract(sin(dot(floor(stoneP.xz*180.),vec2(12.9898,78.233)))*43758.5453); diffuseColor.rgb*=.91+grain*.15;');};material.customProgramCacheKey=()=> 'park-cut-granite-v57';
 const dummy=new T.Object3D(),color=new T.Color(),outline=new T.Shape();
 [[-.45,-.12],[-.28,-.32],[.13,-.35],[.43,-.16],[.46,.12],[.19,.31],[-.21,.33],[-.44,.15]].forEach(([x,z],i)=>i?outline.lineTo(x,z):outline.moveTo(x,z));outline.closePath();
 const geo=new T.ExtrudeGeometry(outline,{depth:.035,bevelEnabled:true,bevelThickness:.012,bevelSize:.025,bevelSegments:1,steps:1});geo.rotateX(-Math.PI/2);
 const batch=new T.InstancedMesh(geo,material,stones.length);batch.name='park-stone-walkways';batch.receiveShadow=true;
 stones.forEach(([x,z],i)=>{dummy.position.set(x,surfaceHeight(x,z)+.014,z);dummy.rotation.set(0,(random(i,41)-.5)*1.1,0);dummy.scale.set(.8+random(i,7)*.4,1,.8+random(i,19)*.35);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);batch.setColorAt(i,color.set(['#b3b5b0','#c7c1b3','#aab1b4','#bebdb5'][i%4]));});scene.add(batch);

 const root=new T.Group();root.name='hydrangea-gardens';scene.add(root);
 const petal=new T.BufferGeometry(),pos=[0,0,0,-.04,.01,.045,-.053,.023,.092,-.035,.03,.133,0,.035,.145,.035,.03,.133,.053,.023,.092,.04,.01,.045],indices=[];
 for(let i=1;i<7;i++)indices.push(0,i,i+1);petal.setAttribute('position',new T.Float32BufferAttribute(pos,3));petal.setIndex(indices);petal.computeVertexNormals();
 const petals=[],leaves=[],stems=[],centers=[],rims=[];
 const up=new T.Vector3(0,1,0),normal=new T.Vector3(),q=new T.Quaternion();
 for(const bed of parkFlowerbeds){
  const soil=new T.Mesh(new T.CylinderGeometry(1,1,.14,48),new T.MeshStandardMaterial({color:'#4c5148',roughness:1}));soil.position.set(bed.x,.2,bed.z);soil.scale.set(bed.rx*.91,1,bed.rz*.88);root.add(soil);
  for(let i=0;i<32;i++){const a=i/32*Math.PI*2;rims.push({p:[bed.x+Math.cos(a)*bed.rx,.23,bed.z+Math.sin(a)*bed.rz],s:[.44,.24,.22],yaw:Math.atan2(-Math.sin(a)*bed.rx,Math.cos(a)*bed.rz)});}
  for(let j=0;j<10;j++){
   const a=j*2.39996,r=Math.sqrt((j+.5)/10)*.7,x=bed.x+Math.cos(a)*bed.rx*r,z=bed.z+Math.sin(a)*bed.rz*r,h=.82+(j%3)*.13,radius=.28+(j%2)*.035;
   stems.push({p:[x,(h+.24)/2,z],s:[1,h-.24,1]});
   for(let k=0;k<4;k++)leaves.push({p:[x+Math.cos(a+k*1.7)*.15,.45+k*.055,z+Math.sin(a+k*1.7)*.15],yaw:a+k*1.7,s:[1,1,1]});
   for(let k=0;k<38;k++){
    const y=1-2*(k+.5)/38,theta=k*2.39996,rr=Math.sqrt(1-y*y);normal.set(Math.cos(theta)*rr,y,Math.sin(theta)*rr);q.setFromUnitVectors(up,normal);
    const p=[x+normal.x*radius,h+normal.y*radius,z+normal.z*radius];centers.push({p,s:[1,1,1]});
    for(let l=0;l<4;l++)petals.push({p,q:q.clone().multiply(new T.Quaternion().setFromAxisAngle(up,l*Math.PI/2)),s:[.8,.8,.8],color:['#91b9df','#b2a3d7','#d3b8d3','#d8e3e4'][(j+bed.tone)%4]});
   }
  }
 }
 const leaf=new T.BufferGeometry();leaf.setAttribute('position',new T.Float32BufferAttribute([0,0,0,-.14,.025,.16,-.1,.045,.32,0,.08,.44,.1,.045,.32,.14,.025,.16,0,.075,.2],3));leaf.setIndex([0,1,6,1,2,6,2,3,6,3,4,6,4,5,6,5,0,6]);leaf.computeVertexNormals();
 function instances(name,geometry,mat,items){const mesh=new T.InstancedMesh(geometry,mat,items.length);mesh.name=name;mesh.receiveShadow=true;items.forEach((o,i)=>{dummy.position.set(...o.p);dummy.scale.set(...o.s);dummy.quaternion.identity();if(o.q)dummy.quaternion.copy(o.q);else dummy.rotation.y=o.yaw||0;dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(o.color)mesh.setColorAt(i,color.set(o.color));});root.add(mesh);}
 instances('hydrangea-stone-edging',new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:'#c2b8a5',roughness:.9}),rims);
 instances('hydrangea-woody-stems',new T.CylinderGeometry(.013,.02,1,5),new T.MeshStandardMaterial({color:'#59634d',roughness:1}),stems);
 instances('hydrangea-veined-leaves',leaf,new T.MeshStandardMaterial({color:'#3e6e59',roughness:.85,side:T.DoubleSide}),leaves);
 instances('hydrangea-four-sepal-florets',petal,new T.MeshStandardMaterial({color:'#ffffff',roughness:.64,side:T.DoubleSide}),petals);
 instances('hydrangea-floret-centers',new T.IcosahedronGeometry(.024,0),new T.MeshStandardMaterial({color:'#e3e7cd',roughness:.7}),centers);
 return root;
}
