import {skiMapDestinations} from './resort-layout.js';
import {buildFestivalPlaza} from './festival-plaza.js';
import {treeBenches} from './bench-layout.js';
import {buildWinterBench} from './winter-bench.js';
import {createTreeTopper} from './tree-topper.js';
import {mergeMeshGeometry,spatialBatchKey} from './mesh-batch.js';
import {treeLayout,treeShift} from './tree-layout.js';
import {createTreeAtmosphere} from './tree-atmosphere.js';
import {createSnowPaths} from './snow-path.js';
import {buildAlpineResort} from './alpine-resort.js';
import {buildSpaResort} from './spa-resort.js';
import {resortRides,resortDestinations,resortObstacles} from './resort-layout.js';
import * as THREE from './vendor/three.module.js';

// Shared winter landmarks, including a dedicated tree island.
export function buildWinterWorld(api){
 const hitMaterial=new THREE.MeshBasicMaterial({visible:false,colorWrite:false,depthTest:false,transparent:true,opacity:0,depthWrite:false});
 const {scene,mesh,ball,cylinder,box,rod,torus,halo,M}=api;
 const root=new THREE.Group();root.name='winter-places';scene.add(root);
 const snow=M('#edf2f2',.96,0),stone=M('#7c8792',.88,0),darkStone=M('#415268',.78,.05),brass=M('#c5aa7f',.4,.45),cedar=M('#8e6d58',.88,0),cedarLight=M('#b08b6a',.9,0),ink=M('#19293e',.5,.15),ivory=M('#e9dfca',.8,0);
 const pine=[M('#264e4c',.96,0),M('#35605a',.96,0),M('#427267',.96,0)],berry=M('#aa4b51',.4,.18),ribbon=M('#b28b68',.68,.15);
 const candle=new THREE.MeshBasicMaterial({color:'#ffe1a2'}),water=new THREE.MeshPhysicalMaterial({color:'#79b4ba',roughness:.25,metalness:.2,clearcoat:.5});
 let seed=591;const rand=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 const steam=[],chairs=[],toppers=[],moving=new Set(),interactive=[],ribbonTime={value:0};
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
    const w=Math.pow(Math.sin(v*Math.PI),.55)*width*(1-v*.54)*(i%2?.89:1.06)*(frost?.68:1);
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
  const layers=decorated?30:8;
  for(let layer=0;layer<layers;layer++){
   const t=layer/(layers-1),y=3+t*h*.79,r=h*.286*(1-t*.94),branches=decorated?18:8;
   // A narrow, hidden core supports the branch whorls without exposed cone tiers.
   cylinder(.04,r*.32,h*.085,pine[layer%3],x,y+h*.025,z,g,16);
   for(let j=0;j<branches;j++){
    const a=j/branches*Math.PI*2+layer*2.399,reach=r*(.95+rand()*.05),origin=new THREE.Vector3(x,y+(rand()-.5)*.42,z);
    bough(origin,a,reach,reach*.22,reach*.12,pine[(j+layer)%3]);
    bough(origin,a,reach,reach*.12,reach*.12,snow,true);
    for(let row=0;row<3;row++)for(const side of [-1,1]){
     const u=.23+row*.22,branch=origin.clone().add(new THREE.Vector3(Math.cos(a)*reach*u,reach*.075*(.35*Math.sin(u*Math.PI)-u*u),Math.sin(a)*reach*u));
     const length=reach*(.48-row*.12),angle=a+side*(.68-row*.1);
     bough(branch,angle,length,length*.23,length*.10,pine[(layer+j+row+1)%3]);
     if((j+row)%3===0)bough(branch,angle,length,length*.14,length*.10,snow,true);
    }
   }
  }
  if(!decorated)return;
  // The living leader reaches the crown; the topper no longer floats above a flat cut-off.
  cylinder(.022,.12,h*.1,cedar,x,h*.9,z,g,10);
  for(let tier=0;tier<5;tier++)for(let j=0;j<7;j++){const length=h*(.036-tier*.006),origin=new THREE.Vector3(x,h*(.855+tier*.018),z),a=j*Math.PI*2/7+tier*2.399;bough(origin,a,length,length*.17,length*.09,pine[(tier+j)%3]);if(j%2===0)bough(origin,a,length,length*.13,length*.09,snow,true);}
  const opal=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:ribbonTime},vertexShader:`uniform float time;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.x+=sin(position.y*.52-time*.36)*.22;p.z+=cos(position.y*.7-time*.29)*.23;p.y+=sin(position.y*.42+time*.3)*.16;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float time;varying vec2 vUv;void main(){float edge=exp(-pow((vUv.y-.5)*5.,2.));float along=fract(vUv.x-time*.035+.38);float envelope=pow(max(0.,sin(clamp(along/.30,0.,1.)*3.14159)),.7)*(1.-step(.30,along));float fold=.5+.5*sin(vUv.x*65.-time*.85);float ends=smoothstep(0.,.02,vUv.x)*(1.-smoothstep(.98,1.,vUv.x));float alpha=edge*ends*envelope*(.29+pow(fold,5.)*.28);if(alpha<.006)discard;gl_FragColor=vec4(mix(vec3(.77,.86,.96),vec3(1.,.91,.72),fold*.65),alpha);}`});

  const ribbonPositions=[],ribbonUvs=[],ribbonIndices=[],edges=[[],[]],pts=[];
  // An open spiral leaves room for the ornaments added by visitors.
  for(let i=0;i<=256;i++){
   const t=i/256,a=t*Math.PI*2*4.3+.7,r=h*.29*(1-t*.94)+.1,y=2.6+t*h*.81,width=.26+(1-t)*.15;
   for(let side=0;side<2;side++){const p=new THREE.Vector3(x+Math.cos(a)*r,y+(side?width:-width),z+Math.sin(a)*r);ribbonPositions.push(p.x,p.y,p.z);ribbonUvs.push(t,side);edges[side].push(p);}
   if(i<256){const k=i*2;ribbonIndices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const ribbonGeo=new THREE.BufferGeometry();ribbonGeo.setAttribute('position',new THREE.Float32BufferAttribute(ribbonPositions,3));ribbonGeo.setAttribute('uv',new THREE.Float32BufferAttribute(ribbonUvs,2));ribbonGeo.setIndex(ribbonIndices);ribbonGeo.computeVertexNormals();mesh(ribbonGeo,opal,0,0,0,g);

  for(let i=0;i<360;i++){
   const t=i/359,y=2.3+t*h*.82,a=t*Math.PI*2*7,r=h*.29*(1-t*.94)+.12,p=new THREE.Vector3(x+Math.cos(a)*r,y,z+Math.sin(a)*r);pts.push(p);
   if(i%3===0)ball(candle,p.x,p.y,p.z,.075+(1-t)*.016,g);
   if(i%29===0){const crystal=mesh(new THREE.OctahedronGeometry(.2,0),candle,p.x,p.y,p.z,g);crystal.scale.set(.45,1.4,.45);}
  }
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),240,.012,4,false),brass,0,0,0,g);
  const topper=createTreeTopper(g,{x,y:h*.98,z});toppers.push(topper);moving.add(topper.root);
 }
 const tree=place(treeLayout.x,treeLayout.z,'winter-tree'),treeAtmosphere=createTreeAtmosphere(tree,{capacity:900});treeAtmosphere.addTree({height:32,hero:true});moving.add(treeAtmosphere.root);

 const treePaths=createSnowPaths({root,stone:[M('#a1aaac',.98,0)],snow,heightAt:()=>.115});treePaths([[treeLayout.x,treeLayout.z+19],[treeLayout.x,treeLayout.z+15],[treeLayout.x,treeLayout.z+11]],3);cylinder(9.1,9.25,.16,darkStone,0,.08,0,tree,80);cylinder(9,9.1,.06,snow,0,.18,0,tree,80);fir(tree,0,0,32,true);
 treePaths(Array.from({length:33},(_,i)=>[treeLayout.x+Math.cos(i/32*Math.PI*2)*11.2,treeLayout.z+Math.sin(i/32*Math.PI*2)*11.2]),3.2);
 const festivalPlaza=buildFestivalPlaza(tree);
 for(const p of treeBenches){tree.add(buildWinterBench({...p,x:p.x-treeLayout.x,z:p.z-treeLayout.z}));}

 for(let i=0;i<28;i++){const a=i*2.399,r=7.7+(i%3)*.45,w=.5+rand()*.6,h=.4+rand()*.65,x=Math.cos(a)*r,z=Math.sin(a)*r;const gift=new THREE.Group();gift.position.set(x,.2,z);gift.rotation.y=a;tree.add(gift);box(w,h,w*.85,[berry,cedarLight,pine[1],ivory][i%4],0,h/2,0,gift);box(w+.015,.035,w*.85+.015,ribbon,0,h*.78,0,gift);box(.07,h+.02,w*.85+.025,ribbon,0,h/2,0,gift);for(const side of [-1,1]){const loop=torus(.08,.015,brass,side*.07,h+.04,0,gift);loop.scale.y=.6;loop.rotation.x=.3;}}
 target(tree,'tree',0,14,0,18,28,18);

 const mountain=buildAlpineResort(api),retreat=buildSpaResort(api),rides=resortRides,rideChair=mountain.rideChair;


 // Batch static geometry by material; retain moving chairs, steam and hit targets.
 root.updateMatrixWorld(true);const groups=new Map();root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.userData.snowTrail||Array.isArray(o.material)||moving.has(o))return;let parent=o.parent;while(parent&&parent!==root){if(moving.has(parent))return;parent=parent.parent;}if(!o.geometry.attributes.normal||!o.geometry.attributes.uv)return;const key=o.material.uuid+':'+spatialBatchKey(o);if(!groups.has(key))groups.set(key,{material:o.material,items:[]});groups.get(key).items.push(o);});
 for(const {material,items} of groups.values()){if(items.length<2)continue;const geo=mergeMeshGeometry(items);for(const item of items)item.removeFromParent();mesh(geo,material,0,0,0,root);}
 const destinations=[{id:'tree',name:'겨울의 큰 트리',...treeLayout.arrival,kind:'tree',view:{distance:42,yaw:-1.25,pitch:.12,lookHeight:12}},...resortDestinations,...skiMapDestinations.filter(p=>p.mapOnly)];
 const obstacles=[{x:treeLayout.x,z:treeLayout.z,r:treeLayout.radius},...resortObstacles,...treeBenches.map(p=>({...p,r:2.1}))];
 return{setQuality(value){retreat.setQuality(value);mountain.setQuality(value);festivalPlaza.setQuality(value);treeAtmosphere.setQuality(value);},root,interactive:[...interactive,...mountain.interactive,...retreat.interactive],destinations,obstacles,rides,rideChair,dynamic:[...moving],update(t,still){for(const topper of toppers)topper.update(t,still);treeAtmosphere.update(t,still);ribbonTime.value=still?0:t;festivalPlaza.update(t,still);mountain.update(t,still);retreat.update(t,still);if(still)return;for(const s of steam){const v=(t*.15+s.phase)%1;s.puff.position.set(s.x+Math.sin(t*.45+s.phase)*.25,.55+v*2.2,s.z);s.puff.scale.setScalar(1.1+v*1.3);s.puff.material.opacity=Math.sin(v*Math.PI)*.09;}for(const {g,offset,a,b}of chairs){const v=(t*.035+offset)%1;g.position.lerpVectors(a,b,v);g.rotation.z=Math.sin(t*.8+offset)*.025;}}};
}
