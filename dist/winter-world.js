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
 const steam=[],chairs=[],moving=new Set(),interactive=[],ribbonTime={value:0};
 function place(x,z,name){const g=new THREE.Group();g.position.set(x,0,z);g.name=name;root.add(g);return g;}
 function oval(mat,x,y,z,sx,sy,sz,parent){const b=ball(mat,x,y,z,1,parent);b.scale.set(sx,sy,sz);return b;}
 function target(g,action,x,y,z,w,h,d){const t=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),hitMaterial);t.position.set(x,y,z);t.userData.action=action;t.userData.winter=true;g.add(t);interactive.push(t);moving.add(t);return t;}
 function lantern(g,x,y,z){const frame=new THREE.Group();frame.position.set(x,y,z);g.add(frame);box(.36,.08,.36,brass,0,0,0,frame);box(.3,.4,.3,candle,0,.24,0,frame);for(const xx of [-.17,.17])for(const zz of [-.17,.17])rod([xx,0,zz],[xx,.46,zz],.018,brass,frame);cylinder(0,.28,.18,brass,0,.55,0,frame,4).rotation.y=Math.PI/4;halo(0,.25,0,'#ffcc85',1.4,frame);}
 function rug(g,w,d,x,z,mat){box(w,.045,d,mat,x,.13,z,g);for(const side of [-1,1])for(let i=0;i<14;i++)rod([x-w/2+i*w/13,.15,z+side*d/2],[x-w/2+i*w/13,.15,z+side*(d/2+.1)],.012,ivory,g);}
 function star(g,x,y,z,r){const s=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,v=i%2?r*.43:r;i?s.lineTo(Math.cos(a)*v,Math.sin(a)*v):s.moveTo(Math.cos(a)*v,Math.sin(a)*v);}s.closePath();return mesh(new THREE.ExtrudeGeometry(s,{depth:.08,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2}),candle,x,y,z,g);}
 function fir(g,x,z,h,decorated=false){
  cylinder(.16,.42,h*.88,cedar,x,h*.44,z,g,12);
  // Each bough is a curved, serrated fan. Frost follows its upper ridge so the
  // branch silhouette remains visible, rather than reading as white oval dots.
  function bough(origin,a,length,width,droop,mat,frost=false){
   const positions=[],uv=[],indices=[],steps=18,ca=Math.cos(a),sa=Math.sin(a);
   for(let i=0;i<=steps;i++){
    const u=i/steps,v=frost?.16+u*.8:u;
    const w=Math.pow(Math.sin(v*Math.PI),.7)*width*(1-v*.54)*(i%2?.89:1.06)*(frost?.68:1);
    const ridge=droop*(.35*Math.sin(v*Math.PI)-v*v),rise=Math.max(.035,width*.17)*(1-v);
    for(let side=0;side<4;side++){
     const lateral=side===0?-w:side===2?w:0;
     const y=ridge+(side===1?rise:side===3?-rise*.6:-rise*.12)+(frost?.045:0);
     positions.push(origin.x+ca*length*v-sa*lateral,origin.y+y,origin.z+sa*length*v+ca*lateral);uv.push(u,side/3);
    }
    if(i<steps)for(let side=0;side<(frost?2:4);side++){const n=i*4+side,m=i*4+(side+1)%4;indices.push(n,m,n+4,m,m+4,n+4);}
   }
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();mesh(geo,mat,0,0,0,g);
  }
  const layers=decorated?28:8;
  for(let layer=0;layer<layers;layer++){
   const t=layer/(layers-1),y=3+t*h*.79,r=h*.286*(1-t*.94),branches=decorated?18:8;
   cylinder(.06,r*.78,h*.09,pine[layer%3],x,y+h*.025,z,g,28);
   for(let j=0;j<branches;j++){
    const a=j/branches*Math.PI*2+layer*2.399,reach=r*(.94+rand()*.06),origin=new THREE.Vector3(x,y+(rand()-.5)*.28,z);
    bough(origin,a,reach,reach*.24,reach*.14,pine[(j+layer)%3]);
    bough(origin,a,reach,reach*.18,reach*.14,snow,true);
    for(let row=0;row<2;row++)for(const side of [-1,1]){
     const u=.3+row*.24,branch=origin.clone().add(new THREE.Vector3(Math.cos(a)*reach*u,reach*.075*(.35*Math.sin(u*Math.PI)-u*u),Math.sin(a)*reach*u));
     const length=reach*(.42-row*.12),angle=a+side*(.58-row*.1);
     bough(branch,angle,length,length*.25,length*.12,pine[(layer+j+row+1)%3]);
     if((j+row)%2===0)bough(branch,angle,length,length*.25,length*.12,snow,true);
    }
   }
  }
  if(!decorated)return;
  const opal=new THREE.MeshPhysicalMaterial({color:'#d8e7eb',emissive:'#a7d5ef',emissiveIntensity:.28,roughness:.2,metalness:.42,clearcoat:1,iridescence:.4,iridescenceIOR:1.35,side:THREE.DoubleSide});
  const ribbonGold=brass.clone();ribbonGold.emissive.set('#ffd59a');ribbonGold.emissiveIntensity=.38;
  for(const material of [opal,ribbonGold]){material.onBeforeCompile=shader=>{shader.uniforms.uRibbonTime=ribbonTime;shader.vertexShader='uniform float uRibbonTime;varying float vRibbonHeight;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRibbonHeight=position.y;float wave=sin(position.y*.65-uRibbonTime*.9);transformed.x+=wave*.13;transformed.z+=cos(position.y*.5-uRibbonTime*.75)*.13;transformed.y+=sin(position.y*.8+uRibbonTime)*.085;');shader.fragmentShader='uniform float uRibbonTime;varying float vRibbonHeight;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat pulse=pow(.5+.5*sin(vRibbonHeight*.75-uRibbonTime*1.4),10.);totalEmissiveRadiance+=vec3(.95,.67,.35)*pulse*.8;');};material.customProgramCacheKey=()=> 'animated-tree-ribbon-v3';}

  const ribbonPositions=[],ribbonUvs=[],ribbonIndices=[],edges=[[],[]],pts=[];
  // An open spiral leaves room for the ornaments added by visitors.
  for(let i=0;i<=256;i++){
   const t=i/256,a=t*Math.PI*2*4.3+.7,r=h*.29*(1-t*.94)+.1,y=2.6+t*h*.81,width=.19+(1-t)*.15;
   for(let side=0;side<2;side++){const p=new THREE.Vector3(x+Math.cos(a)*r,y+(side?width:-width),z+Math.sin(a)*r);ribbonPositions.push(p.x,p.y,p.z);ribbonUvs.push(t,side);edges[side].push(p);}
   if(i<256){const k=i*2;ribbonIndices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const ribbonGeo=new THREE.BufferGeometry();ribbonGeo.setAttribute('position',new THREE.Float32BufferAttribute(ribbonPositions,3));ribbonGeo.setAttribute('uv',new THREE.Float32BufferAttribute(ribbonUvs,2));ribbonGeo.setIndex(ribbonIndices);ribbonGeo.computeVertexNormals();mesh(ribbonGeo,opal,0,0,0,g);
  for(const edge of edges)mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge),200,.018,4,false),ribbonGold,0,0,0,g);
  for(let i=0;i<360;i++){
   const t=i/359,y=2.3+t*h*.82,a=t*Math.PI*2*7,r=h*.29*(1-t*.94)+.12,p=new THREE.Vector3(x+Math.cos(a)*r,y,z+Math.sin(a)*r);pts.push(p);
   if(i%3===0)ball(candle,p.x,p.y,p.z,.075+(1-t)*.016,g);
   if(i%29===0){const crystal=mesh(new THREE.OctahedronGeometry(.2,0),candle,p.x,p.y,p.z,g);crystal.scale.set(.45,1.4,.45);}
  }
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),240,.012,4,false),brass,0,0,0,g);
  star(g,x,h*.96,z,1.1);star(g,x,h*.96,z,1.1).rotation.y=Math.PI/2;
  const crown=mesh(new THREE.OctahedronGeometry(.45),opal,x,h*.96,z,g);crown.scale.y=1.3;
 }
 const tree=place(108,35,'winter-tree');

 const treePaths=createSnowPaths({root,stone:[M('#a1aaac',.98,0)],snow,heightAt:()=>.115});treePaths([[108,61],[108,54],[108,46]],3);cylinder(9.1,9.25,.16,darkStone,0,.08,0,tree,80);cylinder(9,9.1,.06,snow,0,.18,0,tree,80);fir(tree,0,0,32,true);
 treePaths(Array.from({length:33},(_,i)=>[108+Math.cos(i/32*Math.PI*2)*11.2,35+Math.sin(i/32*Math.PI*2)*11.2]),3.2);
 for(let i=0;i<8;i++){const a=i*Math.PI/4+.2,x=Math.cos(a)*11.8,z=Math.sin(a)*11.8;const bench=new THREE.Group();bench.position.set(x,0,z);bench.rotation.y=-a+Math.PI/2;tree.add(bench);box(2.4,.15,.7,cedarLight,0,.55,0,bench);box(2.4,.65,.12,cedar,0,.95,-.3,bench);for(const side of [-1,1])box(.12,.55,.6,ink,side*.95,.27,0,bench);lantern(tree,Math.cos(a+.15)*12.2,.08,Math.sin(a+.15)*12.2);}
 for(let i=0;i<28;i++){const a=i*2.399,r=7.7+(i%3)*.45,w=.5+rand()*.6,h=.4+rand()*.65,x=Math.cos(a)*r,z=Math.sin(a)*r;const gift=new THREE.Group();gift.position.set(x,.2,z);gift.rotation.y=a;tree.add(gift);box(w,h,w*.85,[berry,cedarLight,pine[1],ivory][i%4],0,h/2,0,gift);box(w+.015,.035,w*.85+.015,ribbon,0,h*.78,0,gift);box(.07,h+.02,w*.85+.025,ribbon,0,h/2,0,gift);for(const side of [-1,1]){const loop=torus(.08,.015,brass,side*.07,h+.04,0,gift);loop.scale.y=.6;loop.rotation.x=.3;}}
 target(tree,'tree',0,14,0,18,28,18);

 const mountain=buildAlpineResort(api),retreat=buildSpaResort(api),rides=resortRides,rideChair=mountain.rideChair;

 const quiet=place(50,34,'quiet-garden');cylinder(2.3,2.5,.1,M('#687971',.94,0),0,.13,0,quiet,48);for(let i=0;i<5;i++){const a=i*1.26;const pad=oval(M('#b3a2a1',.95,0),Math.cos(a)*1.5,.28,Math.sin(a)*1.5,.48,.13,.4,quiet);pad.rotation.y=-a;}cylinder(.35,.4,.4,stone,0,.4,0,quiet,32);ball(candle,0,.65,0,.1,quiet);halo(0,.65,0,'#ffddb2',1.6,quiet);target(quiet,'healing',0,.7,0,4.5,1.4,4.5);

 // Batch static geometry by material; retain moving chairs, steam and hit targets.
 root.updateMatrixWorld(true);const groups=new Map();root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.userData.snowTrail||Array.isArray(o.material)||moving.has(o))return;let parent=o.parent;while(parent&&parent!==root){if(moving.has(parent))return;parent=parent.parent;}if(!o.geometry.attributes.normal||!o.geometry.attributes.uv)return;const key=o.material.uuid;if(!groups.has(key))groups.set(key,{material:o.material,items:[]});groups.get(key).items.push(o);});
 for(const {material,items} of groups.values()){if(items.length<2)continue;const chunks={position:[],normal:[],uv:[]};let count=0;for(const item of items){let geo=item.geometry.clone().applyMatrix4(item.matrixWorld);if(geo.index)geo=geo.toNonIndexed();for(const key in chunks)chunks[key].push(geo.attributes[key].array);count+=geo.attributes.position.count;item.removeFromParent();geo.dispose();}const geo=new THREE.BufferGeometry();for(const key in chunks){const size=key==='uv'?2:3,out=new Float32Array(count*size);let offset=0;for(const a of chunks[key]){out.set(a,offset);offset+=a.length;}geo.setAttribute(key,new THREE.BufferAttribute(out,size));}geo.computeBoundingSphere();mesh(geo,material,0,0,0,root);}
 const destinations=[{id:'tree',name:'겨울의 큰 트리',x:108,z:53,kind:'tree',view:{distance:46,yaw:.12,pitch:.12,lookHeight:12}},...resortDestinations,{id:'healing',name:'고요한 쉼터',x:50,z:37,kind:'healing'}];
 const obstacles=[{x:108,z:35,r:9.4},...resortObstacles];
 return{setQuality:retreat.setQuality,root,interactive:[...interactive,...mountain.interactive,...retreat.interactive],destinations,obstacles,rides,rideChair,toggleRestroom:mountain.toggleRestroom,dynamic:[...moving],update(t,still){ribbonTime.value=still?0:t;mountain.update(t,still);retreat.update(t,still);if(still)return;for(const s of steam){const v=(t*.15+s.phase)%1;s.puff.position.set(s.x+Math.sin(t*.45+s.phase)*.25,.55+v*2.2,s.z);s.puff.scale.setScalar(1.1+v*1.3);s.puff.material.opacity=Math.sin(v*Math.PI)*.09;}for(const {g,offset,a,b}of chairs){const v=(t*.035+offset)%1;g.position.lerpVectors(a,b,v);g.rotation.z=Math.sin(t*.8+offset)*.025;}}};
}
