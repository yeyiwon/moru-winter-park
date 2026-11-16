import {createSnowPaths} from './snow-path.js';
import * as THREE from './vendor/three.module.js';
import {alpine,alpineHeight,skiCenter,skiHalfWidth,summit as summitLayout,resortRides,liftLayout,liftPoint,skiRuns,skiRunCenter,skiRunHalfWidth,summitFacilities,setSummitRestroomOpen} from './resort-layout.js';

// Geometry and ride code sample the same height function: no decorative ramp above an unrelated floor.
export function buildAlpineResort(api){
 const hitMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
 const {scene,mesh,ball,cylinder,box,rod,torus,M}=api;
 const root=new THREE.Group();root.name='alpine-mountain';scene.add(root);
 const snow=M('#e5edf0',.96,0),groomed=M('#f0f4f4',.92,0),bankSnow=M('#d3e0e7',.98,0),rock=M('#526276',.92,.02),rockLight=M('#71828d',.95,0),timber=M('#80634d',.88,0),oak=M('#a38a6b',.83,0),ink=M('#233448',.72,.08),metal=M('#9bacae',.45,.4),brass=M('#b99e73',.48,.4),red=M('#9f4c4b',.66,.02),blue=M('#5d89a4',.7,.02),pine=[M('#294d4e',.98,0),M('#365c57',.98,0),M('#41685e',.98,0)];
 const windowMat=new THREE.MeshStandardMaterial({color:'#d3bb8a',emissive:'#c89a58',emissiveIntensity:.35,roughness:.4,metalness:.12});
 const warm=new THREE.MeshBasicMaterial({color:'#efd4a0'}),interactive=[],dynamic=new Set(),chairs=[],steamSystems=[],flames=[];let restroomDoor=null,restroomOpen=true,fireLight=null;const steamDummy=new THREE.Object3D();
 let seed=4277;const rand=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 const ovalGeo=new THREE.SphereGeometry(1,12,8);
 function oval(mat,x,y,z,sx,sy,sz,p=root){const o=mesh(ovalGeo,mat,x,y,z,p);o.scale.set(sx,sy,sz);return o;}
 function place(x,z,name,y=alpineHeight(x,z)){const g=new THREE.Group();g.position.set(x,y,z);g.name=name;root.add(g);return g;}
 function target(x,y,z,w,h,d,action){const m=mesh(new THREE.BoxGeometry(w,h,d),hitMaterial,x,y,z,root);m.userData={winter:true,action};interactive.push(m);dynamic.add(m);return m;}
 function lamp(p,x,z,y=0){cylinder(.07,.12,2.5,ink,x,y+1.25,z,p,8);box(.36,.38,.3,warm,x,y+2.65,z,p);box(.52,.08,.44,ink,x,y+2.9,z,p);for(const dx of [-.18,.18])rod([x+dx,y+2.45,z-.15],[x+dx,y+2.85,z-.15],.015,brass,p);}

 // A smooth polar heightfield gives the island an uninterrupted, traversable mountain skin.
 const rings=100,sectors=160,positions=[alpine.x,alpineHeight(alpine.x,alpine.z),alpine.z],uv=[.5,.5],indices=[];
 for(let j=1;j<=rings;j++){const r=alpine.r*j/rings;for(let i=0;i<sectors;i++){const a=i/sectors*Math.PI*2,x=alpine.x+Math.cos(a)*r,z=alpine.z+Math.sin(a)*r;positions.push(x,alpineHeight(x,z),z);uv.push((x-alpine.x)/alpine.r/2+.5,(z-alpine.z)/alpine.r/2+.5);}}
 for(let i=0;i<sectors;i++)indices.push(0,1+(i+1)%sectors,1+i);
 for(let j=0;j<rings-1;j++)for(let i=0;i<sectors;i++){const a=1+j*sectors+i,b=1+j*sectors+(i+1)%sectors,c=a+sectors,d=b+sectors;indices.push(a,b,c,b,d,c);}
 const terrainGeo=new THREE.BufferGeometry();terrainGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));terrainGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));terrainGeo.setIndex(indices);terrainGeo.computeVertexNormals();const colors=[],baseColor=new THREE.Color('#e5edf0'),runColor=new THREE.Color('#f2f5f4');for(let i=0;i<positions.length;i+=3){const x=positions[i],z=positions[i+2],inside=z>=-342&&z<=-172?Math.max(...skiRuns.map(run=>1-Math.min(1,Math.max(0,(Math.abs(x-skiRunCenter(z,run.id))-skiRunHalfWidth(z,run.id)+2)/4)))):0,c=baseColor.clone().lerp(runColor,inside*.72);colors.push(c.r,c.g,c.b);}terrainGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));const terrainMaterial=snow.clone();terrainMaterial.color.set('#ffffff');terrainMaterial.vertexColors=true;const terrain=mesh(terrainGeo,terrainMaterial,0,0,0,root);terrain.name='alpine-heightfield';terrain.userData.skiTerrain=true;
 // Deep blue-grey rock under the snow makes the mountain read as land, not a white slab.
 const underside=new THREE.CylinderGeometry(alpine.r,alpine.r*.66,22,128,7,true),up=underside.attributes.position;
 for(let i=0;i<up.count;i++){const x=up.getX(i),z=up.getZ(i),y=up.getY(i),a=Math.atan2(z,x),f=(11-y)/22,v=1+(.018*Math.sin(a*9)+.013*Math.cos(a*17))*Math.sin(f*Math.PI);up.setXYZ(i,x*v,y-11.08+f*1.7*Math.sin(a*5),z*v);}underside.computeVertexNormals();mesh(underside,rock,alpine.x,0,alpine.z,root);
 for(let i=0;i<28;i++){const a=i/28*Math.PI*2,r=alpine.r*(.86+rand()*.08),x=alpine.x+Math.cos(a)*r,z=alpine.z+Math.sin(a)*r;const cliff=oval(i%3?rock:rockLight,x,-5-rand()*8,z,4+rand()*4,7+rand()*6,4+rand()*3);cliff.rotation.y=-a;}

 function ribbon(points,width,mat,offset=.055){const pos=[],uv=[],idx=[],columns=Math.max(1,Math.ceil(width/.75));for(let i=0;i<points.length;i++){const p=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next[0]-prev[0],dz=next[2]-prev[2],length=Math.hypot(dx,dz)||1,nx=-dz/length,nz=dx/length;for(let j=0;j<=columns;j++){const side=j/columns-.5,x=p[0]+nx*width*side,z=p[2]+nz*width*side;pos.push(x,alpineHeight(x,z)+offset,z);uv.push(j/columns,i/(points.length-1));if(i<points.length-1&&j<columns){const k=i*(columns+1)+j;idx.push(k,k+1,k+columns+1,k+1,k+columns+2,k+columns+1);}}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return mesh(g,mat,0,0,0,root);}

 const skiPoints=resortRides.ski.points.filter((p,i,a)=>i===0||Math.hypot(p[0]-a[i-1][0],p[2]-a[i-1][2])>.02),sledPoints=resortRides.sled.points;
 // The piste is part of the terrain itself; no lifted strip can cover a skier.
 ribbon(sledPoints,6.5,groomed,.025);
 function fence(points,width,spacing,mat){for(let i=0;i<points.length;i+=spacing){const p=points[i];for(const side of [-1,1]){const x=p[0]+width*side,z=p[2],y=alpineHeight(x,z);rod([x,y,z],[x,y+1.3,z],.035,mat,root);box(.32,.25,.035,side<0?blue:red,x,y+1.14,z,root);}}}
 fence(sledPoints,4,5,oak);
 const safetyNet=new THREE.MeshStandardMaterial({color:'#b87c64',roughness:1,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false});
 const runColors={main:blue,easy:M('#91c7b2',.6,0),curve:M('#c095bc',.6,0)};
 // Boundaries disappear through shared junctions instead of fencing across another run.
 for(const run of skiRuns){
  const points=Array.from({length:155},(_,i)=>{const z=-326+i;return[skiRunCenter(z,run.id),z];});
  const exposed=(x,z)=>!skiRuns.some(other=>other.id!==run.id&&Math.abs(x-skiRunCenter(z,other.id))<skiRunHalfWidth(z,other.id)+.7);
  for(const side of [-1,1]){const pos=[],idx=[];
   for(let i=0;i<points.length;i++){const [cx,z]=points[i],x=cx+side*(skiRunHalfWidth(z,run.id)+.5),y=alpineHeight(x,z),show=exposed(x,z);
    if(show&&i%8===0){rod([x,y,z],[x,y+1.3,z],.035,metal,root);box(.36,.28,.035,runColors[run.id],x,y+1.12,z,root);}
    if(i===points.length-1||!show)continue;const [nx,nz]=points[i+1],ex=nx+side*(skiRunHalfWidth(nz,run.id)+.5);if(!exposed(ex,nz))continue;
    const ey=alpineHeight(ex,nz),k=pos.length/3;pos.push(x,y+.2,z,x,y+1.05,z,ex,ey+.2,nz,ex,ey+1.05,nz);idx.push(k,k+1,k+2,k+1,k+3,k+2);
   }
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(geo,safetyNet,0,0,0,root);
  }
 }
 // Open start gate faces the downhill basin; boarding stays behind the left safety boundary.
 const startZ=-330,startX=skiCenter(startZ);for(const side of [-1,1]){const x=startX+side*10,y=alpineHeight(x,startZ);rod([x,y,startZ],[x,y+3.4,startZ],.09,ink,root);box(1.3,2.3,.04,side<0?blue:red,x,y+2,startZ,root);}
 for(const side of [-1,1]){const pts=sledPoints.map(p=>new THREE.Vector3(p[0]+side*3.9,alpineHeight(p[0]+side*3.9,p[2])+.85,p[2]));mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),100,.035,5,false),timber,0,0,0,root);}

 // One reusable irregular fir profile: layered boughs, quiet snow shelves, varied height and lean.
 function firGeometry(snowCap=false){const profile=snowCap?[new THREE.Vector2(.01,1),new THREE.Vector2(.07,.86),new THREE.Vector2(.03,.85),new THREE.Vector2(.14,.64),new THREE.Vector2(.09,.63),new THREE.Vector2(.23,.39),new THREE.Vector2(.15,.38),new THREE.Vector2(.3,.16)]:[new THREE.Vector2(.005,1),new THREE.Vector2(.1,.79),new THREE.Vector2(.035,.78),new THREE.Vector2(.19,.53),new THREE.Vector2(.08,.52),new THREE.Vector2(.29,.24),new THREE.Vector2(.13,.23),new THREE.Vector2(.36,.07),new THREE.Vector2(.04,.07)];const g=new THREE.LatheGeometry(profile,14),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),v=1+.055*Math.sin(a*7+y*9);p.setX(i,x*v);p.setZ(i,z*v);}g.computeVertexNormals();return g;}
 const firGeo=firGeometry(),capGeo=firGeometry(true),trunkGeo=new THREE.CylinderGeometry(.025,.045,1,7);
 function tree(x,z,h){const y=alpineHeight(x,z),g=place(x,z,'alpine-fir',y);g.rotation.y=rand()*6;const trunk=mesh(trunkGeo,timber,0,h*.36,0,g);trunk.scale.set(h,h*.72,h);const b=mesh(firGeo,pine[Math.floor(rand()*3)],0,h*.14,0,g);b.scale.set(h,h,h);const cap=mesh(capGeo,bankSnow,0,h*.18,0,g);cap.scale.set(h*.98,h*.99,h*.98);}
 let planted=0;for(let attempt=0;attempt<950&&planted<185;attempt++){const a=rand()*Math.PI*2,r=25+Math.sqrt(rand())*(alpine.r-34),x=alpine.x+Math.cos(a)*r,z=alpine.z+Math.sin(a)*r;if(Math.hypot(x,z-alpine.z)>alpine.r-9)continue;if(z>-169||z<alpine.z-118)continue;if(Math.hypot((x-summitLayout.x)/39,(z-summitLayout.z)/25)<1)continue;if(skiRuns.some(run=>Math.abs(x-skiRunCenter(z,run.id))<skiRunHalfWidth(z,run.id)+8)&&z<-168&&z>-350)continue;const t=Math.max(0,Math.min(1,(-z-188)/152)),lx=-36+6*t;if(Math.abs(x-lx)<5&&z<-183&&z>-347)continue;if(Math.abs(x-(108+8*Math.sin(Math.max(0,Math.min(1,(-z-196)/76))*Math.PI)))<11&&z>-280&&z<-185)continue;if(Math.abs(x+55)<16&&Math.abs(z+176)<15)continue;if(Math.abs(x+36)<8&&z>-196&&z<-169)continue;const grade=Math.hypot(alpineHeight(x+1,z)-alpineHeight(x-1,z),alpineHeight(x,z+1)-alpineHeight(x,z-1))/2;if(grade>1.4)continue;tree(x,z,5+rand()*7);planted++;}
 for(const [x,z]of [[-72,-174],[-70,-188],[-25,-171],[24,-164],[52,-167],[90,-177],[123,-205]])tree(x,z,7+rand()*3);
 // A few exposed, rounded rock faces belong to steep mountain shoulders, never the groomed routes.
 for(const [x,z,s]of [[-65,-286,9],[-70,-310,8],[-83,-282,7],[100,-288,8],[93,-312,8],[-47,-339,5],[99,-252,7]]){const y=alpineHeight(x,z);const b=oval(rockLight,x,y-2,z,s,s*.5,s*.7);b.rotation.y=rand()*3;const cap=oval(bankSnow,x,y+s*.25,z,s*.94,.7,s*.64);cap.rotation.y=b.rotation.y;}

 // Parallel cable spans share the rider path; smoothing a separate spline here
 // used to make the visible cable diverge from the actual chair near the summit.
 const liftPoints=resortRides.lift.points,cableCurve=offset=>{const curve=new THREE.Curve();curve.getPoint=t=>{const p=liftPoint(t);return new THREE.Vector3(p[0]+offset,p[1]+liftLayout.hanger,p[2]);};return curve;};
 for(const offset of [0,liftLayout.spacing])mesh(new THREE.TubeGeometry(cableCurve(offset),240,.027,6,false),ink,0,0,0,root);
 for(const t of liftLayout.supports.slice(1,-1)){
  const p=liftPoint(t),cx=p[0]+liftLayout.spacing/2,y=alpineHeight(cx,p[2]),top=p[1]+liftLayout.hanger;
  rod([cx,y,p[2]],[cx,top-.45,p[2]],.16,metal,root);
  rod([cx-2.7,top-.45,p[2]],[cx+2.7,top-.45,p[2]],.12,ink,root);
  for(const side of [-1,1]){
   rod([cx,top-1.5,p[2]],[cx+side*2.35,top-.45,p[2]],.065,metal,root);
   for(const dz of [-.6,-.2,.2,.6]){const q=liftPoint(t+dz/liftLayout.dz),wheel=torus(.17,.035,ink,q[0]+(side+1)*liftLayout.spacing/2,q[1]+liftLayout.hanger-.17,q[2],root);wheel.rotation.y=Math.PI/2;}
  }
  cylinder(.62,.8,.3,rock,cx,y+.15,p[2],root,12);
  // Ladder and maintenance landing give the support a readable human scale.
  for(let yy=y+.45;yy<top-.8;yy+=.42)rod([cx-.19,yy,p[2]+.22],[cx+.19,yy,p[2]+.22],.018,ink,root);
  for(const side of [-1,1])rod([cx+side*.19,y+.25,p[2]+.22],[cx+side*.19,top-.75,p[2]+.22],.023,metal,root);
 }
 function chair(){const g=new THREE.Group();g.name='alpine-lift-chair';root.add(g);dynamic.add(g);
 rod([0,liftLayout.hanger,0],[0,2.72,-.65],.065,metal,g);rod([0,2.72,-.65],[0,.72,-.65],.065,metal,g);box(.14,.11,.32,ink,0,liftLayout.hanger,0,g);
 box(2.5,.16,1.4,oak,0,0,0,g);box(2.5,.85,.13,ink,0,.55,-.65,g);for(const x of [-.63,.63]){box(1.14,.11,1.1,ink,x,.12,.06,g);box(1.14,.59,.08,oak,x,.55,-.56,g);}
 for(const side of [-1,1]){rod([side*1.15,.1,-.6],[side*1.15,.9,.65],.045,metal,g);rod([side*1.15,.8,-.6],[0,2.3,-.65],.045,metal,g);}
 rod([-1.15,.9,.65],[1.15,.9,.65],.055,metal,g);rod([-1.1,-.45,1],[1.1,-.45,1],.045,metal,g);
 // Each animated chair needs only three material draws, independent of its frame detail.
 g.updateMatrixWorld(true);for(const mat of [metal,oak,ink]){const items=g.children.filter(o=>o.isMesh&&o.material===mat);if(items.length<2)continue;const chunks={position:[],normal:[],uv:[]};let n=0;for(const o of items){let geo=o.geometry.clone().applyMatrix4(o.matrix);if(geo.index)geo=geo.toNonIndexed();n+=geo.attributes.position.count;for(const key in chunks)chunks[key].push(geo.attributes[key].array);o.removeFromParent();geo.dispose();}const geo=new THREE.BufferGeometry();for(const key in chunks){const size=key==='uv'?2:3,out=new Float32Array(n*size);let off=0;for(const a of chunks[key]){out.set(a,off);off+=a.length;}geo.setAttribute(key,new THREE.BufferAttribute(out,size));}mesh(geo,mat,0,0,0,g);}return g;}
 function pathPoint(t){const p=liftPoint(t);return new THREE.Vector3(...p);}
 const turnShare=Math.PI*liftLayout.spacing/2/Math.hypot(liftLayout.dx,liftLayout.dz),upYaw=Math.atan2(liftLayout.dx,liftLayout.dz);
 function loopPose(progress){
  const s=progress*(2+2*turnShare);
  if(s<=1)return{position:pathPoint(s),yaw:upYaw};
  if(s<=1+turnShare){const a=(s-1)/turnShare*Math.PI,p=liftPoints.at(-1);return{position:new THREE.Vector3(p[0]+2-2*Math.cos(a),p[1],p[2]-2*Math.sin(a)),yaw:Math.PI-a};}
  if(s<=2+turnShare){const position=pathPoint(2+turnShare-s);position.x+=liftLayout.spacing;return{position,yaw:upYaw-Math.PI};}
  const a=(s-2-turnShare)/turnShare*Math.PI,p=liftPoints[0];return{position:new THREE.Vector3(p[0]+2+2*Math.cos(a),p[1],p[2]+2*Math.sin(a)),yaw:-a};
 }
 for(let i=0;i<8;i++){const g=chair(),offset=i/8,pose=loopPose(offset);g.position.copy(pose.position);g.rotation.y=pose.yaw;chairs.push({g,offset});}
 const rideChair=chair();rideChair.name='alpine-personal-chair';rideChair.visible=false;rideChair.position.copy(pathPoint(0));
 function station(point,name,upper=false){
  const [x,seat,z]=point,y=alpineHeight(x,z),g=place(x+2,z,name,y),cable=seat-y+liftLayout.hanger,roof=cable+.9,half=upper?3.4:5.2,depth=upper?5.1:6.6;
  for(const side of [-1,1]){for(const dz of [-1.65,1.65])rod([side*half,0,dz],[side*half,roof,dz],.13,ink,g);box(.12,.6,3.2,metal,side*half,roof-.35,0,g);}
  box(half*2+.7,.28,depth,ink,0,roof,0,g);box(half*2+.8,.16,depth+.1,snow,0,roof+.2,0,g);box(half*2-.3,.045,depth-1.1,warm,0,roof-.17,0,g);for(const side of [-1,1]){box(half*2+.6,.065,.08,brass,0,roof-.15,side*depth/2,g);for(let k=0;k<=14;k++)ball(warm,-half+k/14*half*2,roof-.24,side*depth/2,.04,g);}
  const wheel=torus(2,.085,metal,0,cable,0,g);wheel.rotation.x=Math.PI/2;
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;rod([0,cable,0],[Math.cos(a)*1.96,cable,Math.sin(a)*1.96],.035,metal,g);}cylinder(.36,.36,.3,ink,0,cable,0,g,16);
  // The actual cable turns around the terminal wheel rather than ending in air.
  const arc=new THREE.Curve();arc.getPoint=t=>{const a=t*Math.PI;return new THREE.Vector3(-2*Math.cos(a),cable,(upper?-1:1)*2*Math.sin(a));};mesh(new THREE.TubeGeometry(arc,36,.027,6,false),ink,0,0,0,g);
  if(upper)box(6.8,.12,5.1,oak,0,.06,0,g);
  // The loading lane stays open at the front: railings and columns sit outside it.
  for(const side of [-1,1]){const edge=side*(half-.2);rod([edge,.13,-2],[edge,1.05,-2],.035,metal,g);rod([edge,1.05,-2],[edge,1.05,2],.035,metal,g);}
  box(1.15,.72,.18,blue,-half,2.15,2.05,g);for(const yy of [1.97,2.16,2.35])box(.65,.055,.025,snow,-half,yy,2.16,g);
  return g;
 }
 station(liftPoints[0],'alpine-base-terminal');station(liftPoints.at(-1),'alpine-summit-terminal',true);
 // The summit is an actual rest terrace; the front remains a broad, clear launch apron.
 const foodMat=M('#efd8b7',.8,0),truckRose=M('#bf747d',.65,.05),truckMint=M('#98c5b8',.65,.05),steamMat=new THREE.MeshBasicMaterial({color:'#fff4df',transparent:true,opacity:.11,depthWrite:false});
 function foodTruck(stop,paint,marshmallow=false){
  const g=place(stop.model.x,stop.model.z,`summit-${stop.id}-truck`);
  box(7.7,.2,2.8,ink,0,.65,0,g);box(5.5,.65,3,paint,-1,1.1,0,g);
  box(5.5,1.4,.13,paint,-1,2.12,-1.45,g);for(const x of [-3.75,1.75])box(.15,1.4,3,paint,x,2.12,0,g);
  box(5.75,.16,3.25,foodMat,-1,2.9,0,g);box(5.8,.1,3.28,snow,-1,3.03,0,g);
  box(2.2,2.15,2.88,paint,2.8,1.7,0,g);box(.035,.95,2.25,blue,3.92,2.25,0,g);box(.08,.07,2.4,metal,3.96,1.73,0,g);
  for(const side of [-1,1]){box(1.4,.9,.035,blue,2.75,2.22,side*1.46,g);box(.07,1.2,.05,metal,2.1,2.08,side*1.49,g);box(.4,.055,.05,brass,2.25,1.48,side*1.5,g);for(const x of [-2.5,2.6]){const tyre=cylinder(.5,.5,.28,ink,x,.5,side*1.48,g,20);tyre.rotation.x=Math.PI/2;const hub=cylinder(.25,.25,.3,metal,x,.5,side*1.51,g,20);hub.rotation.x=Math.PI/2;ball(brass,x,.5,side*1.7,.09,g);}ball(warm,3.94,1.16,side*.98,.12,g);box(.035,.24,.14,red,-3.83,1.0,side*1.18,g);}
  box(5.3,.13,.65,oak,-1,1.5,1.71,g);for(const x of [-3.62,1.62])rod([x,1.55,1.8],[x,2.84,2.02],.035,brass,g);
  for(let i=0;i<9;i++){const awning=box(.6,.06,1.15,i%2?paint:foodMat,-3.4+i*.6,2.8,1.8,g);awning.rotation.x=.16;box(.6,.18,.06,i%2?paint:foodMat,-3.4+i*.6,2.62,2.35,g);ball(warm,-3.4+i*.6,2.56,2.35,.04,g);}
  if(marshmallow){
   cylinder(.27,.22,.45,metal,-1,1.78,1.58,g,20);
   for(let i=0;i<5;i++){const x=-1.22+i*.12;rod([x,1.64,1.58],[x+(i-2)*.08,2.42,1.6],.014,oak,g);for(let j=0;j<2;j++)box(.18,.2,.18,foodMat,x+(i-2)*.055,2.16+j*.23,1.6,g);}
   for(let i=0;i<3;i++)box(.5,.09,.35,foodMat,.1+i*.55,1.62,1.75,g);
  }else{
   box(2.1,.25,.85,metal,-1.3,1.69,1.45,g);box(1.92,.025,.69,timber,-1.3,1.83,1.45,g);
   for(let i=0;i<7;i++){const x=-2.1+i*.25;rod([x,1.78,1.5],[x+.08,2.35,1.5],.014,oak,g);for(let j=0;j<3;j++){const fold=box(.17,.075,.12,foodMat,x+.025,1.95+j*.105,1.5,g);fold.rotation.z=(j%2?1:-1)*.3;}}
   for(let i=0;i<3;i++)cylinder(.1,.075,.24,foodMat,.15+i*.3,1.69,1.75,g,12);
  }
  const steam=new THREE.InstancedMesh(ovalGeo,steamMat,8);steam.frustumCulled=false;root.add(steam);dynamic.add(steam);steamSystems.push({mesh:steam,x:stop.model.x-1,y:g.position.y+2,z:stop.model.z+1.5});
 }
 foodTruck(summitFacilities.find(s=>s.id==='odeng'),truckRose);foodTruck(summitFacilities.find(s=>s.id==='marshmallow'),truckMint,true);
 const fire=place(-8,-349,'summit-campfire');cylinder(1.45,1.55,.14,rock,0,.07,0,fire,32);
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2,stone=oval(rockLight,Math.cos(a)*1.2,.22,Math.sin(a)*1.2,.32,.2,.25,fire);stone.rotation.y=-a;}
 for(let i=0;i<5;i++){const a=i/5*Math.PI,dx=Math.cos(a)*.8,dz=Math.sin(a)*.8;rod([-dx,.25,-dz],[dx,.4,dz],.11,timber,fire);}
 const ember=new THREE.MeshBasicMaterial({color:'#ef8a46'}),flameMat=new THREE.MeshBasicMaterial({color:'#ffdba0',transparent:true,opacity:.84,depthWrite:false});cylinder(.65,.72,.06,ember,0,.24,0,fire,24);
 const flameGeo=new THREE.LatheGeometry([new THREE.Vector2(0,0),new THREE.Vector2(.17,.15),new THREE.Vector2(.2,.35),new THREE.Vector2(.13,.65),new THREE.Vector2(.08,.82),new THREE.Vector2(.01,1.15)],12);
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2,f=mesh(flameGeo,i%2?flameMat:ember,Math.cos(a)*.32,.29,Math.sin(a)*.32,fire);f.rotation.z=Math.sin(a)*.16;dynamic.add(f);flames.push(f);}
 fireLight=new THREE.PointLight('#ffb168',12,11,2);fireLight.position.set(0,1.1,0);fire.add(fireLight);
 for(const x of [-11.8,-4.2]){const y=alpineHeight(x,-349);box(.8,.18,2.8,oak,x,y+.55,-349,root);box(.12,.65,2.8,timber,x+(x< -8?-.4:.4),y+.94,-349,root);for(const dz of [-1,1])box(.55,.45,.14,ink,x,y+.23,-349+dz,root);}
 const restroom=place(14,-352,'summit-restroom');box(5.8,.08,4.8,oak,0,.04,0,restroom);
 for(const side of [-1,1])box(.18,3.2,4.8,timber,side*2.9,1.6,0,restroom);box(5.8,3.2,.18,timber,0,1.6,-2.4,restroom);
 for(const side of [-1,1])box(1.8,3.2,.18,timber,side*2,1.6,2.4,restroom);box(2.2,.65,.18,timber,0,2.88,2.4,restroom);
 for(const side of [-1,1]){const roof=box(3.35,.17,5.7,ink,side*1.45,3.72,0,restroom);roof.rotation.z=-side*.33;const cap=box(3.4,.16,5.8,snow,side*1.45,3.89,0,restroom);cap.rotation.z=roof.rotation.z;}
 const frontGable=new THREE.Shape();frontGable.moveTo(-2.9,0);frontGable.lineTo(0,1.1);frontGable.lineTo(2.9,0);frontGable.closePath();mesh(new THREE.ShapeGeometry(frontGable),oak,0,3.2,2.41,restroom);
 box(.8,.9,.025,windowMat,-2,2.1,2.51,restroom);box(.8,.9,.025,windowMat,2,2.1,2.51,restroom);for(const x of [-2,2]){box(.055,1,.045,brass,x,2.1,2.54,restroom);box(.9,.055,.045,brass,x,2.1,2.54,restroom);}
 restroomDoor=new THREE.Group();restroomDoor.position.set(-1.05,0,2.4);restroomDoor.rotation.y=-Math.PI/2;restroom.add(restroomDoor);dynamic.add(restroomDoor);box(2.1,2.5,.11,oak,1.05,1.25,0,restroomDoor);box(.7,.55,.035,blue,1.05,1.95,.07,restroomDoor);ball(brass,1.82,1.2,.11,.06,restroomDoor);
 box(1.15,.35,.08,blue,0,2.88,2.52,restroom);for(const x of [-.22,.22]){ball(foodMat,x,2.96,2.58,.055,restroom);box(.08,.14,.035,foodMat,x,2.83,2.58,restroom);}
 cylinder(.23,.3,.45,groomed,.8,.23,-1.3,restroom,20);const bowl=torus(.31,.11,groomed,.8,.5,-1.3,restroom);bowl.rotation.x=Math.PI/2;box(.72,.64,.25,groomed,.8,.77,-1.85,restroom);box(.8,.1,.34,groomed,.8,1.1,-1.85,restroom);box(.8,.14,.55,groomed,-1.85,.95,0,restroom);rod([-1.85,1.0,-.17],[-1.85,1.25,-.17],.025,metal,restroom);rod([-1.85,1.25,-.17],[-1.85,1.25,.05],.025,metal,restroom);
 for(const x of [-22,6]){const y=alpineHeight(x,-359);rod([x,y,-359],[x,y+4.1,-359],.055,timber,root);}const festoon=Array.from({length:25},(_,i)=>{const t=i/24;return new THREE.Vector3(-22+28*t,summitLayout.height+4.1-Math.sin(t*Math.PI)*.55,-359);});mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(festoon),48,.018,6,false),ink,0,0,0,root);for(let i=0;i<festoon.length;i+=2){const p=festoon[i];ball(warm,p.x,p.y-.08,p.z,.065,root);}
 // Broad summit terrace belongs to the actual terrain, with an open downhill edge.
 for(let i=0;i<=22;i++){const a=Math.PI*.12+i/22*Math.PI*1.75,x=summitLayout.x+Math.cos(a)*34,z=summitLayout.z+Math.sin(a)*20;if(z>-334||x< -26&&z> -356)continue;const y=alpineHeight(x,z);rod([x,y,z],[x,y+1.1,z],.055,timber,root);if(i){const b=a-Math.PI*1.75/22,px=summitLayout.x+Math.cos(b)*34,pz=summitLayout.z+Math.sin(b)*20;rod([px,alpineHeight(px,pz)+1.05,pz],[x,y+1.05,z],.045,oak,root);}}
 // Low, snow-covered dismount apron follows ground directly beside the shared endpoint.
 const summit=liftPoints.at(-1),exit=resortRides.lift.exit;const apron=Array.from({length:15},(_,i)=>{const t=i/14,x=summit[0]+(exit[0]-summit[0])*t,z=summit[2]+(exit[2]-summit[2])*t;return[x,alpineHeight(x,z),z];});ribbon(apron,3.2,snow,.025);

 const basePaths=createSnowPaths({root,stone:[M('#a1aaac',.98,0)],snow,heightAt:alpineHeight});
 const trailToBase=Array.from({length:30},(_,i)=>{const t=i/29;return[8-44*t,-172-6*t+Math.sin(t*Math.PI)*3];});basePaths(trailToBase,4.8);
 basePaths([[-36,-170],[-36,-178],[-36,-184],[-36,-188]],5.6);
 // A wide, groomed queue approaches the chair directly; nothing crosses its mouth.
 for(const side of [-1,1]){const x=-36+side*3.7;for(const z of [-179,-182,-185]){const y=alpineHeight(x,z);cylinder(.075,.1,1.0,timber,x,y+.5,z,root,10);ball(brass,x,y+1.05,z,.1,root);}for(const z of [-179,-182])rod([x,alpineHeight(x,z)+.82,z],[x,alpineHeight(x,z-3)+.82,z-3],.032,oak,root);lamp(root,x,-177,alpineHeight(x,-177));}


 // Full-scale timber lodge: inset glazing, balcony rails, stone chimney and layered snow roof.
 const lodge=place(-55,-176,'alpine-base-lodge'),foundation=rockLight;
 box(18,.65,12,foundation,0,.32,0,lodge);box(17.3,5.7,11.3,timber,0,3.5,0,lodge);
 for(let i=0;i<54;i++)box(.11,5.6,.06,oak,-8.4+i*.318,3.5,5.69,lodge);
 for(const side of [-1,1])for(let i=0;i<32;i++)box(.06,5.6,.11,oak,side*8.69,3.5,-5.4+i*.34,lodge);
 for(const x of [-6,-3,3,6]){box(2.1,2.45,.08,windowMat,x,3.2,5.76,lodge);for(const dx of [-1.1,0,1.1])box(.065,2.58,.13,ink,x+dx,3.2,5.85,lodge);for(const y of [1.95,3.2,4.45])box(2.25,.065,.13,ink,x,y,5.85,lodge);box(2.4,.12,.4,oak,x,1.88,5.92,lodge);}
 box(1.8,3.2,.13,ink,0,2.2,5.8,lodge);box(1.45,2.6,.04,windowMat,0,2.35,5.89,lodge);rod([.5,1.7,5.98],[.5,2.25,5.98],.035,brass,lodge);
 const gable=new THREE.Shape();gable.moveTo(-8.65,0);gable.lineTo(0,4.3);gable.lineTo(8.65,0);gable.closePath();mesh(new THREE.ShapeGeometry(gable),timber,0,6.35,5.67,lodge);const backGable=mesh(new THREE.ShapeGeometry(gable),timber,0,6.35,-5.67,lodge);backGable.rotation.y=Math.PI;
 for(const side of [-1,1]){const r=box(10,.25,13.5,ink,side*4.3,8.5,0,lodge);r.rotation.z=-side*.46;const s=box(10,.24,13.65,snow,side*4.3,8.73,0,lodge);s.rotation.z=-side*.46;for(let z=-6;z<=6;z+=1.1){const icicle=mesh(new THREE.ConeGeometry(.055,.38+rand()*.35,5),bankSnow,side*8.75,6.25,z,lodge);icicle.rotation.z=Math.PI;}}
 box(1.2,4.1,1.4,rock,-5,9.5,-2,lodge);box(1.5,.2,1.7,ink,-5,11.65,-2,lodge);for(let y=8.2;y<11.5;y+=.35)box(1.24,.035,1.44,rockLight,-5,y,-2,lodge);
 box(18.5,.2,2.3,oak,0,.75,6.7,lodge);for(const side of [-1,1]){for(let i=0;i<8;i++)rod([side*(1.7+i*.96),.85,7.72],[side*(1.7+i*.96),1.75,7.72],.035,ink,lodge);rod([side*1.7,1.75,7.72],[side*8.8,1.75,7.72],.06,oak,lodge);}for(let i=0;i<4;i++)box(2.9,.18,1.0,foundation,0,.11+i*.18,9.6-i*.7,lodge);
 for(const x of [-7,7]){box(2,.16,.65,oak,x,1.15,6.4,lodge);for(const side of [-1,1])box(.12,.5,.5,ink,x+side*.7,.82,6.4,lodge);lamp(lodge,x,8.2);}
 // Skis, poles, folded blankets and a trail board make the base visibly inhabited.
 for(let i=0;i<5;i++){const x=10+i*.25,s=box(.16,2.6,.06,i%2?red:blue,x,1.5,4.6,lodge);s.rotation.z=-.16;rod([x+.08,.3,4.5],[x+.08,2.5,4.5],.016,metal,lodge);}for(let i=0;i<3;i++)box(.75,.12,.5,bankSnow,-7,1.3+i*.13,6.4,lodge);
 // Warm timber ticket window beside the queue, with its footprint out of the approach.
 const booth=place(-44,-185,'alpine-ticket-window');box(3,.3,2.8,rockLight,0,.15,0,booth);box(2.7,2.7,2.5,timber,0,1.65,0,booth);
 for(const x of [-1.4,1.4])box(.14,2.9,2.6,oak,x,1.65,0,booth);
 const boothArch=new THREE.Shape();boothArch.moveTo(-.95,0);boothArch.lineTo(-.95,.95);boothArch.quadraticCurveTo(0,1.65,.95,.95);boothArch.lineTo(.95,0);boothArch.closePath();mesh(new THREE.ShapeGeometry(boothArch),windowMat,0,1.05,1.26,booth);
 const outline=boothArch.getPoints(24).map(p=>new THREE.Vector3(p.x,p.y+1.05,1.29));mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(outline,true),40,.04,8,true),brass,0,0,0,booth);box(2.2,.12,.6,oak,0,1.04,1.4,booth);
 for(const side of [-1,1]){const eave=box(1.85,.14,3.5,ink,side*.73,3.2,0,booth);eave.rotation.z=-side*.36;const cap=box(1.88,.14,3.6,snow,side*.73,3.35,0,booth);cap.rotation.z=eave.rotation.z;}
 for(let i=0;i<9;i++)ball(warm,-1.4+i*.35,2.95+Math.sin(i/8*Math.PI)*.2,1.77,.055,booth);
 const sign=place(-26,-184,'alpine-trail-board');for(const x of [-1.2,1.2])rod([x,0,0],[x,3.1,0],.08,timber,sign);box(3,1.9,.18,ink,0,2.4,0,sign);for(let i=0;i<3;i++){const line=box(1.8,.055,.02,i===0?blue:i===1?red:bankSnow,.15,2.9-i*.42,.11,sign);line.rotation.z=(i-1)*.12;const disc=cylinder(.12,.12,.025,i===0?blue:i===1?red:bankSnow,-1.03,2.9-i*.42,.11,sign,16);disc.rotation.x=Math.PI/2;}box(3.2,.16,.6,snow,0,3.43,0,sign);
 const sledBase=resortRides.sled.points.at(-1),sledRack=place(sledBase[0]+4,sledBase[2]+2,'alpine-sled-hut');for(const x of [-1.4,1.4])rod([x,0,-.7],[x,2.1,-.7],.08,timber,sledRack);box(3.5,.15,2.4,ink,0,2.15,0,sledRack);box(3.55,.14,2.5,snow,0,2.28,0,sledRack);for(let i=0;i<3;i++){const g=new THREE.Group();g.position.set(-1+i,1,.1);g.rotation.z=.2;sledRack.add(g);for(const side of [-1,1]){rod([side*.3,-.55,-.5],[side*.3,-.55,.5],.035,red,g);rod([side*.3,-.55,.5],[side*.3,-.3,.68],.035,red,g);}for(let j=0;j<5;j++)box(.68,.06,.15,oak,0,-.38,-.3+j*.17,g);}lamp(sledRack,-2.5,1.4);
 target(-36,alpineHeight(-36,-188)+1.3,-188,5,2.6,4,'ski');target(sledBase[0]+4,alpineHeight(sledBase[0]+4,sledBase[2]+2)+1.2,sledBase[2]+2,5,2.5,4,'sled');

 // Merge stationary geometry by material. Moving chair roots retain small local meshes.
 root.updateMatrixWorld(true);const batches=new Map();root.traverse(o=>{if(!o.isMesh||o.userData.snowTrail||o.userData.skiTerrain||Array.isArray(o.material)||dynamic.has(o))return;for(let p=o.parent;p&&p!==root;p=p.parent)if(dynamic.has(p))return;if(!o.geometry.attributes.normal||!o.geometry.attributes.uv)return;const k=o.material.uuid;if(!batches.has(k))batches.set(k,{material:o.material,items:[]});batches.get(k).items.push(o);});
 for(const {material,items}of batches.values()){if(items.length<2)continue;const chunks={position:[],normal:[],uv:[]};let n=0;for(const o of items){let g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(g.index)g=g.toNonIndexed();n+=g.attributes.position.count;for(const key in chunks)chunks[key].push(g.attributes[key].array);o.removeFromParent();g.dispose();}const g=new THREE.BufferGeometry();for(const key in chunks){const size=key==='uv'?2:3,a=new Float32Array(n*size);let offset=0;for(const chunk of chunks[key]){a.set(chunk,offset);offset+=chunk.length;}g.setAttribute(key,new THREE.BufferAttribute(a,size));}g.computeBoundingSphere();mesh(g,material,0,0,0,root);}
 return{root,interactive,rideChair,toggleRestroom(open=!restroomOpen){restroomOpen=setSummitRestroomOpen(open);restroomDoor.rotation.y=restroomOpen?-Math.PI/2:0;return restroomOpen;},update(t,still){const dummy=steamDummy;for(const system of steamSystems){for(let i=0;i<8;i++){const phase=((still?0:t*.2)+i/8)%1;dummy.position.set(system.x+Math.sin(i*2+phase)*.3,system.y+phase*2,system.z+Math.cos(i*3)*.2);const scale=Math.sin(phase*Math.PI)*(.18+phase*.4);dummy.scale.set(scale,scale*.75,scale);dummy.updateMatrix();system.mesh.setMatrixAt(i,dummy.matrix);}system.mesh.instanceMatrix.needsUpdate=true;}for(let i=0;i<flames.length;i++)flames[i].scale.set(1,still?1:.85+Math.sin(t*5+i*1.8)*.18,1);if(fireLight)fireLight.intensity=still?10:10+Math.sin(t*6)*1.5;if(still)return;for(const {g,offset}of chairs){const pose=loopPose((t/94+offset)%1);g.position.copy(pose.position);g.rotation.set(0,pose.yaw,Math.sin(t*.6+offset)*.009);g.visible=!rideChair.visible||g.position.distanceTo(rideChair.position)>5;}}};
}
