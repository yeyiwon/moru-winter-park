import * as THREE from './vendor/three.module.js';

import {festivalLayout,festivalDestinations,festivalObstacles} from './festival-layout.js';
export {festivalLayout,festivalDestinations,festivalObstacles};

const up=new THREE.Vector3(0,1,0),mat4=new THREE.Matrix4(),object=new THREE.Object3D();
function cylinder(rt,rb,h,n=24){return new THREE.CylinderGeometry(rt,rb,h,n);}
function tube(points,r=.035,segments=24,sides=6,closed=false){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed),segments,r,sides,closed);}
function rod(a,b,r=.025){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start),g=cylinder(r,r,delta.length(),8);object.position.copy(start.add(end).multiplyScalar(.5));object.quaternion.setFromUnitVectors(up,delta.normalize());object.scale.set(1,1,1);object.updateMatrix();return g.applyMatrix4(object.matrix);}
function box(w,h,d,r=.035){
 if(Math.min(w,h,d)<.18)return new THREE.BoxGeometry(w,h,d);
 r=Math.min(r,w/4,h/4,d/4);const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);const g=new THREE.ExtrudeGeometry(s,{depth:d-r*2,bevelEnabled:true,bevelSize:r*.35,bevelThickness:r,bevelSegments:2,curveSegments:6});g.translate(0,0,-d/2+r);return g;
}
function snowRoof(w,d){
 const positions=[],uv=[],indices=[],nx=16,nz=4;for(let iz=0;iz<=nz;iz++)for(let ix=0;ix<=nx;ix++){const x=(ix/nx-.5)*w,z=(iz/nz-.5)*d;positions.push(x,.32*(1-(2*x/w)**2)+.025*Math.cos(iz*2+ix*.7),z);uv.push(ix/nx,iz/nz);if(ix<nx&&iz<nz){const k=iz*(nx+1)+ix;indices.push(k,k+nx+1,k+1,k+1,k+nx+1,k+nx+2);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function builder(parent,name,palette){
 const parts=[];
 function add(geometry,material=0,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){object.position.set(...position);object.rotation.set(...rotation);object.scale.set(...scale);object.updateMatrix();geometry.applyMatrix4(object.matrix);parts.push({geometry,material});}
 function finish(){const geometry=new THREE.BufferGeometry(),arrays={position:[],normal:[],uv:[]};let count=0;for(const material of [...new Set(parts.map(p=>p.material))].sort((a,b)=>a-b)){const start=count;for(const part of parts){if(part.material!==material)continue;const source=part.geometry.index?part.geometry.toNonIndexed():part.geometry;for(const key in arrays)arrays[key].push(...source.attributes[key].array);count+=source.attributes.position.count;if(source!==part.geometry)source.dispose();part.geometry.dispose();}geometry.addGroup(start,count-start,material);}for(const [key,values]of Object.entries(arrays))geometry.setAttribute(key,new THREE.Float32BufferAttribute(values,key==='uv'?2:3));geometry.computeBoundingSphere();geometry.computeBoundingBox();const mesh=new THREE.Mesh(geometry,palette);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 return {add,finish};
}
function socket(parent,name,position){const node=new THREE.Object3D();node.name=name;node.position.set(...position);parent.add(node);return node;}

export function buildFestivalRides(scene){
 const root=new THREE.Group();root.name='winter-park-west';scene.add(root);
 const palette=[
  new THREE.MeshStandardMaterial({color:'#e4c18b',metalness:.7,roughness:.3}),
  new THREE.MeshStandardMaterial({color:'#f0eee6',roughness:.97,side:THREE.DoubleSide}),
  new THREE.MeshPhysicalMaterial({color:'#29465b',roughness:.29,metalness:.15,clearcoat:.8,side:THREE.DoubleSide}),
  new THREE.MeshPhysicalMaterial({color:'#aecdd0',roughness:.33,metalness:.12,clearcoat:.7}),
  new THREE.MeshStandardMaterial({color:'#75614b',roughness:.8}),
  new THREE.MeshStandardMaterial({color:'#34404a',roughness:.8}),
  new THREE.MeshStandardMaterial({color:'#b3bfc5',metalness:.78,roughness:.32}),
  new THREE.MeshBasicMaterial({color:'#ffdfa5',toneMapped:false}),
 ];
 const decorative=builder(root,'festival-ground-details',palette);
 // Snowflake photo arch and a compact brass-wheeled confectionery cart.
 decorative.add(tube([[-77.2,.1,-8],[-77.2,2.5,-8],[-75,4.2,-8],[-72.8,2.5,-8],[-72.8,.1,-8]],.075,48,8),0);
 for(let i=0;i<21;i++){const a=i/20*Math.PI;decorative.add(new THREE.SphereGeometry(.06,10,7),7,[-75+Math.cos(a)*2.2,2.4+Math.sin(a)*1.8,-8]);}
 for(let i=0;i<6;i++){const a=i*Math.PI/3;decorative.add(rod([-75,3.05,-7.95],[-75+Math.sin(a)*.65,3.05+Math.cos(a)*.65,-7.95],.025),1);for(const sign of [-1,1]){const x=-75+Math.sin(a)*.43,y=3.05+Math.cos(a)*.43;decorative.add(rod([x,y,-7.95],[x+Math.sin(a+sign*.75)*.2,y+Math.cos(a+sign*.75)*.2,-7.95],.018),0);}}
 decorative.add(box(2.5,.94,1.35,.1),2,[-77,.77,-15]);decorative.add(box(2.7,.11,1.55,.04),0,[-77,1.3,-15]);
 for(const x of [-77.9,-76.1])for(const z of [-15.5,-14.5]){decorative.add(cylinder(.25,.25,.12,20),5,[x,.31,z],[Math.PI/2,0,0]);decorative.add(new THREE.TorusGeometry(.19,.024,6,20),0,[x,.31,z+.07]);}
 for(const x of [-78.1,-75.9])decorative.add(cylinder(.033,.033,1.35,10),0,[x,1.98,-15]);decorative.add(snowRoof(2.9,1.7),2,[-77,2.66,-15]);decorative.add(snowRoof(2.95,1.75),1,[-77,2.7,-15]);
 for(let i=0;i<5;i++){const x=-77.8+i*.4;decorative.add(cylinder(.012,.012,.55,8),4,[x,1.58,-14.72]);decorative.add(new THREE.SphereGeometry(1,18,14),i%2?1:2,[x,1.92,-14.72],[0,0,0],[.18,.26,.18]);}
 // A walk-in garden, with an open view toward the wheel and castle, replaces both rides.
 const terrace=builder(root,'photo-garden-terrace',palette);
 for(const side of [-1,1]){
  const x=-65+side*10;
  for(let i=0;i<4;i++){
   const z=-6+i*5;terrace.add(box(.42,.14,.42),0,[x,.16,z]);
   terrace.add(cylinder(.045,.07,3.7,12),6,[x,1.9,z]);
   terrace.add(new THREE.SphereGeometry(.16,14,10),7,[x,3.8,z]);
  }
  for(let j=0;j<3;j++){
   const points=[];for(let k=0;k<=24;k++){const t=k/24;points.push([x,3.8-Math.sin(t*Math.PI)*.55,-6+j*5+t*5]);if(k%3===0)terrace.add(new THREE.SphereGeometry(.045,8,6),7,points.at(-1));}terrace.add(tube(points,.014),0);
  }
 }
 // Low benches face east. The central 12 m promenade remains completely open.
 for(const z of [-8,16])for(const x of [-71,-61]){
  terrace.add(box(4.4,.16,.85),4,[x,.56,z]);
  terrace.add(box(4.5,.7,.14),2,[x,.99,z+.4]);
  for(const dx of [-1.6,1.6])terrace.add(box(.14,.55,.7),6,[x+dx,.3,z]);
 }
 for(let j=0;j<6;j++){const a=j*Math.PI/3,pts=[];for(let k=0;k<=16;k++){const r=1.9+k*.12;pts.push([-65+Math.cos(a)*r,.115,8+Math.sin(a)*r]);}terrace.add(tube(pts,.018),0);}
 terrace.finish();decorative.finish();
 return{root,dynamic:[root],destinations:festivalDestinations,obstacles:festivalObstacles,update(){},seat(){return null;}};
}
