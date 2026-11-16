import {createSnowPaths} from './snow-path.js';
import {buildAlpineResort} from './alpine-resort.js';
import {buildSpaResort} from './spa-resort.js';
import {resortRides,resortDestinations,resortObstacles} from './resort-layout.js';
import * as THREE from './vendor/three.module.js';

// Shared winter landmarks, including a dedicated tree island.
export function buildWinterWorld(api){
 const hitMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
 const {scene,mesh,ball,cylinder,box,rod,torus,halo,M}=api;
 const root=new THREE.Group();root.name='winter-places';scene.add(root);
 const snow=M('#edf2f2',.96,0),stone=M('#7c8792',.88,0),darkStone=M('#415268',.78,.05),brass=M('#c5aa7f',.4,.45),cedar=M('#8e6d58',.88,0),cedarLight=M('#b08b6a',.9,0),ink=M('#19293e',.5,.15),ivory=M('#e9dfca',.8,0);
 const pine=[M('#264e4c',.96,0),M('#35605a',.96,0),M('#427267',.96,0)],berry=M('#aa4b51',.4,.18),ribbon=M('#b28b68',.68,.15);
 const candle=new THREE.MeshBasicMaterial({color:'#ffe1a2'}),water=new THREE.MeshPhysicalMaterial({color:'#79b4ba',roughness:.25,metalness:.2,clearcoat:.5});
 let seed=591;const rand=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 const steam=[],chairs=[],moving=new Set(),interactive=[];
 function place(x,z,name){const g=new THREE.Group();g.position.set(x,0,z);g.name=name;root.add(g);return g;}
 function oval(mat,x,y,z,sx,sy,sz,parent){const b=ball(mat,x,y,z,1,parent);b.scale.set(sx,sy,sz);return b;}
 function target(g,action,x,y,z,w,h,d){const t=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),hitMaterial);t.position.set(x,y,z);t.userData.action=action;t.userData.winter=true;g.add(t);interactive.push(t);moving.add(t);return t;}
 function lantern(g,x,y,z){const frame=new THREE.Group();frame.position.set(x,y,z);g.add(frame);box(.36,.08,.36,brass,0,0,0,frame);box(.3,.4,.3,candle,0,.24,0,frame);for(const xx of [-.17,.17])for(const zz of [-.17,.17])rod([xx,0,zz],[xx,.46,zz],.018,brass,frame);cylinder(0,.28,.18,brass,0,.55,0,frame,4).rotation.y=Math.PI/4;halo(0,.25,0,'#ffcc85',1.4,frame);}
 function rug(g,w,d,x,z,mat){box(w,.045,d,mat,x,.13,z,g);for(const side of [-1,1])for(let i=0;i<14;i++)rod([x-w/2+i*w/13,.15,z+side*d/2],[x-w/2+i*w/13,.15,z+side*(d/2+.1)],.012,ivory,g);}
 function star(g,x,y,z,r){const s=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,v=i%2?r*.43:r;i?s.lineTo(Math.cos(a)*v,Math.sin(a)*v):s.moveTo(Math.cos(a)*v,Math.sin(a)*v);}s.closePath();return mesh(new THREE.ExtrudeGeometry(s,{depth:.08,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2}),candle,x,y,z,g);}
 function fir(g,x,z,h,decorated=false){
  cylinder(.12,.25,h*.67,cedar,x,h*.34,z,g,12);
  const layers=decorated?15:7;
  // Staggered tapered boughs create a broken, dimensional silhouette instead of stacked discs.
  for(let layer=0;layer<layers;layer++){
   const t=layer/(layers-1),y=1.8+t*h*.82,r=h*.28*(1-t*.94),branches=decorated?15:8;
   cylinder(.02,r*.67,h*.17,pine[layer%3],x,y+h*.065,z,g,12);
   for(let j=0;j<branches;j++){
    const a=j/branches*Math.PI*2+layer*2.399,reach=r*(.84+rand()*.16),dx=Math.cos(a),dz=Math.sin(a);
    const center=new THREE.Vector3(x+dx*reach*.57,y+h*.026,z+dz*reach*.57);
    const end=new THREE.Vector3(x+dx*reach,y-h*.008,z+dz*reach);
    const base=new THREE.Vector3(x+dx*reach*.18,y+h*.065,z+dz*reach*.18);
    const branch=mesh(new THREE.ConeGeometry(reach*.18,base.distanceTo(end),7),pine[(j+layer)%3],center.x,center.y,center.z,g);
    branch.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.clone().sub(base).normalize());
    for(let k=0;k<2;k++){
     const d=reach*(.45+k*.25),cap=oval(snow,x+dx*d,y+h*(.041-k*.018),z+dz*d,reach*(.16-k*.03),Math.max(.065,reach*.035),reach*.09,g);cap.rotation.y=-a;cap.rotation.z=-.12;
    }
   }
  }
  if(!decorated)return;
  const pts=[];for(let i=0;i<320;i++){const t=i/319,y=2.3+t*h*.82,a=t*Math.PI*2*7,r=h*.29*(1-t*.94);pts.push(new THREE.Vector3(x+Math.cos(a)*r,y,z+Math.sin(a)*r));if(i%2===0)ball(candle,x+Math.cos(a)*r,y,z+Math.sin(a)*r,.09,g);if(i%5===0){const ba=a+.14,br=r+.07;rod([x+Math.cos(ba)*br,y,z+Math.sin(ba)*br],[x+Math.cos(ba)*br,y-.06,z+Math.sin(ba)*br],.008,brass,g);}}
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),150,.012,4,false),brass,0,0,0,g);star(g,x,h*.96,z,1.1);
 }
 const tree=place(108,35,'winter-tree');
 cylinder(27,28,1.5,stone,0,-.75,0,tree,96);cylinder(27,27.6,.2,snow,0,0,0,tree,96);
 const treePaths=createSnowPaths({root,stone:[M('#a1aaac',.98,0)],snow,heightAt:()=>.115});treePaths([[108,61],[108,54],[108,46]],3);cylinder(9.1,9.25,.16,darkStone,0,.08,0,tree,80);cylinder(9,9.1,.06,snow,0,.18,0,tree,80);fir(tree,0,0,32,true);
 treePaths(Array.from({length:33},(_,i)=>[108+Math.cos(i/32*Math.PI*2)*11.2,35+Math.sin(i/32*Math.PI*2)*11.2]),3.2);
 for(let i=0;i<8;i++){const a=i*Math.PI/4+.2,x=Math.cos(a)*11.8,z=Math.sin(a)*11.8;const bench=new THREE.Group();bench.position.set(x,0,z);bench.rotation.y=-a+Math.PI/2;tree.add(bench);box(2.4,.15,.7,cedarLight,0,.55,0,bench);box(2.4,.65,.12,cedar,0,.95,-.3,bench);for(const side of [-1,1])box(.12,.55,.6,ink,side*.95,.27,0,bench);lantern(tree,Math.cos(a+.15)*12.2,.08,Math.sin(a+.15)*12.2);}
 for(let i=0;i<7;i++){const a=i*.85,r=8.2+rand()*.6,w=.35+rand()*.3,h=.3+rand()*.4,x=Math.cos(a)*r,z=Math.sin(a)*r;const gift=new THREE.Group();gift.position.set(x,.2,z);gift.rotation.y=a;tree.add(gift);box(w,h,w*.85,[berry,cedarLight,pine[1],ivory][i%4],0,h/2,0,gift);box(w+.015,.035,w*.85+.015,ribbon,0,h*.78,0,gift);box(.07,h+.02,w*.85+.025,ribbon,0,h/2,0,gift);for(const side of [-1,1]){const loop=torus(.08,.015,brass,side*.07,h+.04,0,gift);loop.scale.y=.6;loop.rotation.x=.3;}}
 target(tree,'tree',0,14,0,18,28,18);

 const mountain=buildAlpineResort(api),retreat=buildSpaResort(api),rides=resortRides,rideChair=mountain.rideChair;

 // A curved grand piano, readable keys and an open score in the classical salon.
 const salon=place(-47.3,25,'classical-salon');salon.position.y=.18;rug(salon,4.3,3.4,0,.2,M('#594b63',1,0));
 const pianoShape=new THREE.Shape();pianoShape.moveTo(-.9,-.7);pianoShape.lineTo(.9,-.7);pianoShape.lineTo(.9,.1);pianoShape.bezierCurveTo(.9,.8,.1,1.65,-.65,1.5);pianoShape.quadraticCurveTo(-1.15,1.15,-.9,.45);pianoShape.closePath();const pianoGeo=new THREE.ExtrudeGeometry(pianoShape,{depth:.25,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:3});pianoGeo.rotateX(-Math.PI/2);mesh(pianoGeo,ink,0,1.05,0,salon);
 const lid=mesh(new THREE.ShapeGeometry(pianoShape,24),ink,0,1.36,0,salon);lid.rotation.x=-Math.PI/2;lid.rotation.z=-.22;rod([.72,1.27,.55],[.72,1.83,.55],.025,brass,salon);
 for(const [x,z] of [[-.7,.5],[.7,.5],[-.45,-1.15]]){cylinder(.05,.08,.95,ink,x,.6,z,salon,12);ball(brass,x,.14,z,.07,salon);}
 box(1.9,.14,.46,ink,0,1.05,.88,salon);for(let i=0;i<21;i++){box(.077,.045,.34,ivory,-.85+i*.085,1.15,.88,salon);if(i%7!==2&&i%7!==6)box(.045,.06,.2,ink,-.81+i*.085,1.2,.8,salon);}
 box(.75,.65,.04,cedar,0,1.6,.47,salon).rotation.x=-.15;for(const side of [-1,1]){const page=box(.34,.53,.012,ivory,side*.18,1.63,.51,salon);page.rotation.y=-side*.1;for(let j=0;j<6;j++)box(.28,.006,.006,ink,side*.18,1.82-j*.07,.524,salon);}
 box(1,.13,.6,ink,0,.68,1.7,salon);for(const side of [-1,1])for(const z of [1.49,1.91])cylinder(.035,.055,.55,brass,side*.38,.37,z,salon,8);lantern(salon,-2.7,.13,.8);lantern(salon,2.7,.13,.8);target(salon,'classical',0,1,1.2,3,2,3);

 // Original geometric canvases: material art, never copied artwork or external textures.
 const gallery=place(-48,37,'winter-gallery');box(7,.15,2.3,darkStone,0,.15,0,gallery);box(7,2.8,.18,M('#c4c3bf',.94,0),0,1.6,-.8,gallery);
 for(let i=0;i<3;i++){const frame=new THREE.Group();frame.position.set(-2.3+i*2.3,1.75,-.67);gallery.add(frame);box(1.8,2,.1,brass,0,0,0,frame);box(1.62,1.82,.12,ivory,0,0,.05,frame);box(1.4,1.6,.03,[M('#456370',1,0),M('#bd9b84',1,0),M('#69637d',1,0)][i],0,0,.13,frame);const disc=cylinder(.34,.34,.025,[ivory,ink,cedarLight][i],-.2,.3,.16,frame,48);disc.rotation.x=Math.PI/2;const arch=new THREE.Shape();arch.moveTo(-.6,-.7);arch.lineTo(.6,-.7);arch.lineTo(.6,-.05);arch.quadraticCurveTo(.2,.5,-.2,.04);arch.quadraticCurveTo(-.5,-.1,-.6,.2);arch.closePath();mesh(new THREE.ShapeGeometry(arch,24),[cedarLight,pine[0],ivory][i],0,0,.19,frame);for(let j=0;j<3;j++)box(.55,.025,.015,[ivory,brass,ink][i],.23,-.22-j*.13,.22,frame);box(.8,.08,.025,brass,0,-1.16,0,frame);}
 for(const side of [-1,1]){rod([side*3.4,.15,.7],[side*3.4,3.1,.7],.045,brass,gallery);rod([side*3.4,3.1,.7],[side*2.4,3.1,-.3],.035,brass,gallery);ball(candle,side*2.4,3.05,-.3,.1,gallery);}target(gallery,'gallery',0,1.6,.3,7,3,2);
 const forum=place(46,-20,'ethics-circle');cylinder(2.4,2.6,.12,darkStone,0,.1,0,forum,48);for(const side of [-1,1]){const b=box(1.65,.22,.65,cedarLight,side*1.65,.55,0,forum);b.rotation.y=-side*.45;for(const x of [-.55,.55])cylinder(.055,.09,.4,brass,side*1.65+x,.3,0,forum,8);box(.65,.1,.45,ivory,side*.25,.85,.1,forum);}
 cylinder(.6,.75,.65,stone,0,.45,0,forum,32);const book=box(.65,.09,.45,ivory,0,.83,0,forum);book.rotation.y=.2;lantern(forum,0,.16,-1.8);target(forum,'ethics',0,1,0,4.5,2,3);
 const quiet=place(50,34,'quiet-garden');cylinder(2.3,2.5,.1,M('#687971',.94,0),0,.13,0,quiet,48);for(let i=0;i<5;i++){const a=i*1.26;const pad=oval(M('#b3a2a1',.95,0),Math.cos(a)*1.5,.28,Math.sin(a)*1.5,.48,.13,.4,quiet);pad.rotation.y=-a;}cylinder(.35,.4,.4,stone,0,.4,0,quiet,32);ball(candle,0,.65,0,.1,quiet);halo(0,.65,0,'#ffddb2',1.6,quiet);target(quiet,'healing',0,.7,0,4.5,1.4,4.5);

 // Batch static geometry by material; retain moving chairs, steam and hit targets.
 root.updateMatrixWorld(true);const groups=new Map();root.traverse(o=>{if(!o.isMesh||o.userData.snowTrail||Array.isArray(o.material)||moving.has(o))return;let parent=o.parent;while(parent&&parent!==root){if(moving.has(parent))return;parent=parent.parent;}if(!o.geometry.attributes.normal||!o.geometry.attributes.uv)return;const key=o.material.uuid;if(!groups.has(key))groups.set(key,{material:o.material,items:[]});groups.get(key).items.push(o);});
 for(const {material,items} of groups.values()){if(items.length<2)continue;const chunks={position:[],normal:[],uv:[]};let count=0;for(const item of items){let geo=item.geometry.clone().applyMatrix4(item.matrixWorld);if(geo.index)geo=geo.toNonIndexed();for(const key in chunks)chunks[key].push(geo.attributes[key].array);count+=geo.attributes.position.count;item.removeFromParent();geo.dispose();}const geo=new THREE.BufferGeometry();for(const key in chunks){const size=key==='uv'?2:3,out=new Float32Array(count*size);let offset=0;for(const a of chunks[key]){out.set(a,offset);offset+=a.length;}geo.setAttribute(key,new THREE.BufferAttribute(out,size));}geo.computeBoundingSphere();mesh(geo,material,0,0,0,root);}
 const destinations=[{id:'tree',name:'겨울의 큰 트리',x:108,z:53,kind:'tree',view:{distance:46,yaw:.12,pitch:.12,lookHeight:12}},...resortDestinations,{id:'classical',name:'음악 정원 · 피아노',x:-47.3,z:28.2,kind:'classical',view:{distance:23,yaw:-.25,pitch:.34,lookHeight:1,lookAhead:2}},{id:'gallery',name:'겨울 미술관',x:-48,z:39,kind:'gallery'},{id:'ethics',name:'법과 마음의 서재',x:46,z:-17.3,kind:'ethics'},{id:'healing',name:'고요한 쉼터',x:50,z:37,kind:'healing'}];
 const obstacles=[{x:108,z:35,r:9.4},...resortObstacles];
 return{root,interactive:[...interactive,...mountain.interactive,...retreat.interactive],destinations,obstacles,rides,rideChair,dynamic:[...moving],update(t,still){mountain.update(t,still);retreat.update(t,still);if(still)return;for(const s of steam){const v=(t*.15+s.phase)%1;s.puff.position.set(s.x+Math.sin(t*.45+s.phase)*.25,.55+v*2.2,s.z);s.puff.scale.setScalar(1.1+v*1.3);s.puff.material.opacity=Math.sin(v*Math.PI)*.09;}for(const {g,offset,a,b}of chairs){const v=(t*.035+offset)%1;g.position.lerpVectors(a,b,v);g.rotation.z=Math.sin(t*.8+offset)*.025;}}};
}
