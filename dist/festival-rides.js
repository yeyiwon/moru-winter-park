import * as THREE from './vendor/three.module.js';

import {festivalLayout,festivalDestinations,festivalObstacles,festivalBenches,candyStall} from './festival-layout.js';
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
  new THREE.MeshStandardMaterial({color:'#efc4d5',roughness:.94}),
 ];
 const cart=new THREE.Group();cart.name='cotton-candy-cart';cart.position.set(candyStall.x+77,0,candyStall.z+15);root.add(cart);
 const decorative=builder(cart,'festival-ground-details',palette);
 // The confectionery counter opens directly onto the promenade.
 decorative.add(box(2.5,.94,1.35,.1),2,[-77,.77,-15]);decorative.add(box(2.7,.11,1.55,.04),0,[-77,1.3,-15]);
 for(const x of [-77.9,-76.1])for(const z of [-15.5,-14.5]){decorative.add(cylinder(.25,.25,.12,20),5,[x,.31,z],[Math.PI/2,0,0]);decorative.add(new THREE.TorusGeometry(.19,.024,6,20),0,[x,.31,z+.07]);}
 for(const x of [-78.1,-75.9])decorative.add(cylinder(.033,.033,1.35,10),0,[x,1.98,-15]);decorative.add(snowRoof(2.9,1.7),2,[-77,2.66,-15]);decorative.add(snowRoof(2.95,1.75),1,[-77,2.7,-15]);
 for(let i=0;i<5;i++){const x=-77.8+i*.4;decorative.add(cylinder(.012,.012,.55,8),4,[x,1.58,-14.72]);decorative.add(new THREE.SphereGeometry(1,18,14),i%2?1:8,[x,1.92,-14.72],[0,0,0],[.18,.26,.18]);}
 // Sugar spinner, a scalloped canopy and paper cones give the cart a usable counter.
 const bowlProfile=[[.14,0],[.36,.07],[.46,.25],[.47,.3],[.43,.31],[.4,.26],[.28,.12],[.14,.1]].map(p=>new THREE.Vector2(...p));
 decorative.add(new THREE.LatheGeometry(bowlProfile,32),6,[-77,1.38,-15.1]);decorative.add(cylinder(.09,.13,.22,16),0,[-77,1.57,-15.1]);
 for(let i=0;i<11;i++){const x=-78.35+i*.27;decorative.add(box(.265,.11,.20),i%2?1:3,[x,2.68,-14.15]);decorative.add(new THREE.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI/2),i%2?1:3,[x,2.61,-14.15],[0,0,Math.PI],[.133,.12,.08]);decorative.add(new THREE.SphereGeometry(.035,8,6),7,[x,2.48,-14.1]);}
 for(const side of [-1,1]){const x=-77+side*1.12;decorative.add(rod([x,.82,-14.28],[x,1.24,-14.28],.024),0);decorative.add(new THREE.TorusGeometry(.09,.014,6,16),0,[x,1.02,-14.24]);}
 for(let i=0;i<6;i++)decorative.add(cylinder(.055,.025,.28,12),1,[-76.1+(i%3)*.12,1.5,-15.35+Math.floor(i/3)*.12]);
 const sign=document.createElement('canvas');sign.width=512;sign.height=160;const context=sign.getContext('2d');context.fillStyle='#fff3df';context.font='500 64px "Apple SD Gothic Neo",sans-serif';context.textAlign='center';context.textBaseline='middle';context.fillText('솜사탕',256,80);const texture=new THREE.CanvasTexture(sign);texture.colorSpace=THREE.SRGBColorSpace;const label=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.46),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));label.position.set(-77,.88,-14.31);cart.add(label);
 // A walk-in garden, with an open view toward the wheel and castle, replaces both rides.
 const terrace=builder(root,'photo-garden-terrace',palette);
 // The museum approach uses the shared festival lampposts only.
 // Low benches face east. The central 12 m promenade remains completely open.
 for(const {x,z} of festivalBenches){
  terrace.add(box(4.4,.16,.85),4,[x,.56,z]);
  terrace.add(box(4.5,.7,.14),2,[x,.99,z+.4]);
  for(const dx of [-1.6,1.6])terrace.add(box(.14,.55,.7),6,[x+dx,.3,z]);
 }

 terrace.finish();decorative.finish();
 return{root,dynamic:[root],destinations:festivalDestinations,obstacles:festivalObstacles,update(){},seat(){return null;}};
}
