import {stepBumper} from './bumper-physics.js';
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
 const decorative=builder(root,'festival-ground-details',palette),cupRoot=new THREE.Group(),cupRotor=new THREE.Group(),cups=[],cupSeats=[];
 cupRoot.position.set(-63,.1,-10);cupRoot.name='teacup-platform';root.add(cupRoot);cupRoot.add(cupRotor);
 const pedestal=builder(cupRoot,'teacup-carved-platform',palette);
 pedestal.add(cylinder(4.65,4.9,.28,72),4,[0,.14,0]);pedestal.add(cylinder(4.66,4.66,.055,72),0,[0,.295,0]);pedestal.add(cylinder(4.5,4.5,.035,72),1,[0,.335,0]);
 for(let i=0;i<48;i++){const a=i/48*Math.PI*2;pedestal.add(new THREE.SphereGeometry(.037,8,6),7,[Math.cos(a)*4.7,.21,Math.sin(a)*4.7]);}
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;pedestal.add(box(.035,.012,4.35,.003),0,[Math.sin(a)*2.19,.357,Math.cos(a)*2.19],[0,a,0]);}
 pedestal.finish();cupRotor.position.y=.36;
 for(let i=0;i<4;i++){
  const a=i*Math.PI/2,cup=new THREE.Group();cup.name='porcelain-cup-'+i;cup.position.set(Math.cos(a)*2.65,0,Math.sin(a)*2.65);cupRotor.add(cup);cups.push(cup);
  const b=builder(cup,'cup-porcelain-and-gilding',palette),profile=[[.3,.08],[.55,.09],[.65,.2],[.82,.72],[.87,.99],[.85,1.04],[.79,1.04],[.77,.97],[.7,.7],[.56,.21],[.3,.18]].map(p=>new THREE.Vector2(...p));
  b.add(new THREE.LatheGeometry(profile,48),i%2?2:3);b.add(new THREE.TorusGeometry(.83,.025,8,48),0,[0,1.037,0],[Math.PI/2,0,0]);b.add(new THREE.TorusGeometry(.42,.04,8,40),0,[0,.12,0],[Math.PI/2,0,0]);
  b.add(new THREE.TorusGeometry(.33,.067,10,32),i%2?2:3,[1.015,.66,0]);b.add(new THREE.TorusGeometry(.33,.016,6,32),0,[1.015,.66,.061]);
  b.add(cylinder(.61,.61,.095,32),4,[0,.46,0]);b.add(cylinder(.28,.28,.06,24),0,[0,.91,.43]);b.add(new THREE.TorusGeometry(.24,.025,8,32),0,[0,1.02,.43],[Math.PI/2,0,0]);b.add(cylinder(.025,.025,.19,12),6,[0,.92,.43]);
  for(let j=0;j<8;j++){const p=j*Math.PI/4;const points=[];for(let k=0;k<=16;k++){const t=k/16;points.push([Math.cos(p)*(.57+.23*t),.23+.68*t,Math.sin(p)*(.57+.23*t)]);}b.add(tube(points,.012,16,5),0);}
  b.finish();cupSeats.push(socket(cup,'teacup-seat-'+i,[0,.51,-.05]));
 }
 const pot=builder(cupRotor,'centerpiece-teapot',palette);
 pot.add(new THREE.SphereGeometry(1,28,20),1,[0,.78,0],[0,0,0],[.68,.68,.68]);pot.add(cylinder(.46,.53,.12,32),0,[0,1.34,0]);pot.add(new THREE.SphereGeometry(.17,16,12),7,[0,1.52,0]);
 pot.add(tube([[.49,.75,0],[.9,.84,0],[1.03,1.19,0]],.135,20,12),1);pot.add(new THREE.TorusGeometry(.39,.07,10,36),0,[-.67,.81,0]);pot.finish();

 const arena=new THREE.Group();arena.name='bumper-car-arena';arena.position.set(festivalLayout.bumper.x,.1,festivalLayout.bumper.z);root.add(arena);const court=builder(arena,'bumper-arena-floor-rails',palette);
 const {w,d}=festivalLayout.bumper,hx=w/2,hz=d/2;
 court.add(box(w,.19,d,.1),4,[0,.1,0]);court.add(box(w-.3,.03,d-.3,.05),3,[0,.21,0]);
 for(let x=-hx+.6;x<hx;x+=1.2)court.add(box(.015,.008,d-.5,.002),6,[x,.235,0]);
 for(const side of [-1,1]){court.add(box(.18,.35,d,.04),5,[side*hx,.35,0]);court.add(rod([side*hx,.8,-hz],[side*hx,.8,hz],.06),0);for(let z=-hz;z<=hz;z+=1.4)court.add(cylinder(.04,.055,.6,8),6,[side*hx,.52,z]);}
 court.add(box(w,.35,.18,.04),5,[0,.35,-hz]);court.add(rod([-hx,.8,-hz],[hx,.8,-hz],.06),0);
 for(const side of [-1,1]){court.add(box(hx-1.3,.35,.18,.04),5,[side*(hx+1.3)/2,.35,hz]);court.add(rod([side*1.3,.8,hz],[side*hx,.8,hz],.06),0);}
 for(const x of [-hx,hx])for(const z of [-hz,hz]){court.add(cylinder(.1,.18,4.1,12),2,[x,2.1,z]);court.add(cylinder(.3,.4,.2,16),0,[x,.2,z]);court.add(new THREE.SphereGeometry(.17,12,8),7,[x,4.2,z]);}
 for(const z of [-hz,hz]){for(let i=0;i<35;i++){const x=-hx+i*w/34,y=3.6+.006*x*x;court.add(new THREE.SphereGeometry(.06,8,6),7,[x,y,z]);}court.add(tube([[-hx,4.2,z],[0,3.6,z],[hx,4.2,z]],.019,36,5),6);}
 court.finish();
 const cars=[],carSeats=[];
 for(let i=0;i<4;i++){
  const car=new THREE.Group();car.name='bumper-car-'+i;arena.add(car);cars.push(car);const b=builder(car,'bumper-car-body',palette);
  b.add(new THREE.TorusGeometry(.72,.115,10,48),5,[0,.25,0],[Math.PI/2,0,0],[1,1.25,1]);
  b.add(new THREE.LatheGeometry([[.73,.22],[.77,.35],[.72,.53],[.61,.68],[.56,.65],[.62,.42],[.65,.25]].map(v=>new THREE.Vector2(...v)),48),i%2?3:2,[0,0,0],[0,0,0],[1,1,1.35]);
  b.add(box(.79,.17,.72,.07),4,[0,.49,-.19]);b.add(box(.77,.55,.16,.07),4,[0,.76,-.55],[.14,0,0]);b.add(box(.64,.14,.19,.06),1,[0,1.045,-.56]);
  for(const side of [-1,1]){b.add(new THREE.SphereGeometry(.11,12,10),7,[side*.37,.47,.77]);b.add(box(.09,.06,.12,.015),0,[side*.53,.49,.71]);}
  b.add(rod([0,.52,.16],[0,.9,.39],.026),6);b.add(new THREE.TorusGeometry(.2,.028,8,32),5,[0,.9,.39],[-.42,0,0]);for(let j=0;j<3;j++){const a=j*Math.PI*2/3;b.add(rod([0,.9,.39],[Math.cos(a)*.17,.9+Math.sin(a)*.15,.39-Math.sin(a)*.065],.012),6);}
  b.add(rod([0,.5,-.67],[0,2,-.67],.014),6);b.add(new THREE.SphereGeometry(.07,10,8),7,[0,2.02,-.67]);b.finish();carSeats.push(socket(car,'bumper-seat-'+i,[0,.58,-.2]));
 }
 const carStates=[{x:-5,z:3,yaw:Math.PI,speed:0},{x:4,z:-3,yaw:.4},{x:-4,z:-3,yaw:2.2},{x:5,z:3,yaw:-1}];let driven=false;
 const syncCars=()=>cars.forEach((car,i)=>{const p=carStates[i];car.position.set(p.x,.24,p.z);car.rotation.y=p.yaw;});syncCars();
 // Snowflake photo arch and a compact brass-wheeled confectionery cart.
 decorative.add(tube([[-77.2,.1,-8],[-77.2,2.5,-8],[-75,4.2,-8],[-72.8,2.5,-8],[-72.8,.1,-8]],.075,48,8),0);
 for(let i=0;i<21;i++){const a=i/20*Math.PI;decorative.add(new THREE.SphereGeometry(.06,10,7),7,[-75+Math.cos(a)*2.2,2.4+Math.sin(a)*1.8,-8]);}
 for(let i=0;i<6;i++){const a=i*Math.PI/3;decorative.add(rod([-75,3.05,-7.95],[-75+Math.sin(a)*.65,3.05+Math.cos(a)*.65,-7.95],.025),1);for(const sign of [-1,1]){const x=-75+Math.sin(a)*.43,y=3.05+Math.cos(a)*.43;decorative.add(rod([x,y,-7.95],[x+Math.sin(a+sign*.75)*.2,y+Math.cos(a+sign*.75)*.2,-7.95],.018),0);}}
 decorative.add(box(2.5,.94,1.35,.1),2,[-77,.77,-15]);decorative.add(box(2.7,.11,1.55,.04),0,[-77,1.3,-15]);
 for(const x of [-77.9,-76.1])for(const z of [-15.5,-14.5]){decorative.add(cylinder(.25,.25,.12,20),5,[x,.31,z],[Math.PI/2,0,0]);decorative.add(new THREE.TorusGeometry(.19,.024,6,20),0,[x,.31,z+.07]);}
 for(const x of [-78.1,-75.9])decorative.add(cylinder(.033,.033,1.35,10),0,[x,1.98,-15]);decorative.add(snowRoof(2.9,1.7),2,[-77,2.66,-15]);decorative.add(snowRoof(2.95,1.75),1,[-77,2.7,-15]);
 for(let i=0;i<5;i++){const x=-77.8+i*.4;decorative.add(cylinder(.012,.012,.55,8),4,[x,1.58,-14.72]);decorative.add(new THREE.SphereGeometry(1,18,14),i%2?1:2,[x,1.92,-14.72],[0,0,0],[.18,.26,.18]);}
 decorative.finish();
 const worldPosition=new THREE.Vector3(),worldQuaternion=new THREE.Quaternion(),forward=new THREE.Vector3();
 function seat(kind,index=0){const nodes=kind==='teacups'?cupSeats:kind==='bumper'?carSeats:null;if(!nodes)return null;const node=nodes[Math.abs(index)%nodes.length];root.updateMatrixWorld(true);node.getWorldPosition(worldPosition);node.getWorldQuaternion(worldQuaternion);forward.set(0,0,1).applyQuaternion(worldQuaternion);return{x:worldPosition.x,y:worldPosition.y+.82,z:worldPosition.z,yaw:Math.atan2(forward.x,forward.z),mode:'ride',seat:node.name};}
 function update(time,still=false){
  if(still)return;const t=time;cupRotor.rotation.y=t*.19;cups.forEach((cup,i)=>cup.rotation.y=-t*.31+i*.8);
  if(!driven){cars.forEach((car,i)=>{const a=t*.14+i*Math.PI/2,p=carStates[i];p.x=Math.cos(a)*6.2;p.z=Math.sin(a)*3.7;p.yaw=Math.atan2(-Math.sin(a)*6.2,Math.cos(a)*3.7);p.vx=0;p.vz=0;});syncCars();}
 }
 function driveBumper(dt,input={}){driven=true;const result=stepBumper(carStates,dt,input);syncCars();return result;}
 update(0);return{root,dynamic:[root],destinations:festivalDestinations,obstacles:festivalObstacles,update,seat,driveBumper,releaseBumper(){driven=false;carStates[0].speed=0;},sockets:{teacups:cupSeats,bumper:carSeats}};
}
