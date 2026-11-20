import * as T from './vendor/three.module.js';
import {createCompanion} from './companion.js';
import {mergeMeshGeometry} from './mesh-batch.js';

function batchCostume(root){
 root.updateWorldMatrix(true,true);
 const inverse=new T.Matrix4().copy(root.matrixWorld).invert(),batches=new Map(),sources=new Set();
 for(const mesh of root.children){sources.add(mesh.geometry);if(!batches.has(mesh.material))batches.set(mesh.material,[]);batches.get(mesh.material).push(mesh);}
 for(const [material,items]of batches){
  if(items.length<2)continue;
  const geometry=mergeMeshGeometry(items,{relativeTo:inverse}),mesh=new T.Mesh(geometry,material);
  mesh.name=items.find(o=>['scientist-lab-coat','scientist-flask','tree-keeper-crown','held-tree-ornament'].includes(o.name))?.name||'guide-costume-batch';
  for(const item of items)item.removeFromParent();root.add(mesh);
 }
 const retained=new Set(root.children.map(mesh=>mesh.geometry));for(const geometry of sources)if(!retained.has(geometry))geometry.dispose();
}

// NPC-only costumes are geometry, never wardrobe IDs available to visitors.
export function createFluffyGuide(parent,{role,x=0,y=.96,z=0,yaw=0}={}){
 const character=createCompanion({detail:'remote'}),root=character.group;
 root.name='fluffy-guide-'+role;root.userData.keepGroup=true;root.position.set(x,y,z);root.rotation.y=yaw;
 character.customize({fur:role==='tree'?'#d8ece0':role==='scientist'?'#e5edf4':'#fff1df',accessory:role==='scientist'?'silver-glasses':'',fluff:95,roundness:70});character.setViewDetail(120);parent.add(root);
 const shape=root.getObjectByName('plush-body').parent,costume=new T.Group();costume.name='npc-exclusive-'+role;shape.add(costume);
 const fabric=color=>new T.MeshStandardMaterial({color,roughness:.86}),ivory=fabric('#f7f5ed'),blue=fabric('#638fa6'),gold=new T.MeshStandardMaterial({color:'#e7bf6c',metalness:.35,roughness:.35}),pink=fabric('#e3a8ba');
 const sphere=new T.SphereGeometry(1,20,14);
 const mesh=(name,geometry,material,position,scale=[1,1,1])=>{const m=new T.Mesh(geometry,material);m.name=name;m.position.set(...position);m.scale.set(...scale);costume.add(m);return m;};
 const orb=(name,mat,p,s)=>mesh(name,sphere,mat,p,s);
 const star=(name,p,size)=>{const path=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.46:1;path[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);}path.closePath();const material=new T.MeshStandardMaterial({color:'#ffe8a4',emissive:'#ffd36b',emissiveIntensity:1.5,roughness:.4});return mesh(name,new T.ExtrudeGeometry(path,{depth:.16,bevelEnabled:true,bevelThickness:.05,bevelSize:.04,bevelSegments:2,steps:1}),material,p,[size,size,size]);};
 // Tiny cloud tufts distinguish these companions without copying wearable ears.
 for(const [i,p]of [[0,[-.17,.7,-.04]],[1,[0,.77,-.04]],[2,[.16,.7,-.04]]])orb('cloud-tuft-'+i,ivory,p,[.17,.18,.16]);
 if(role==='scientist'){
  const coat=mesh('scientist-lab-coat',new T.SphereGeometry(1,28,12,Math.PI/2+.15,Math.PI*2-.3,1.72,1.05),ivory,[0,0,0],[.79,.79,.74]);coat.material.side=T.DoubleSide;
  mesh('scientist-shirt',new T.BoxGeometry(.22,.38,.08),blue,[0,-.36,.65]);
  for(const side of [-1,1]){const lapel=mesh('coat-lapel',new T.BoxGeometry(.19,.34,.055),ivory,[side*.2,-.27,.7]);lapel.rotation.z=side*-.29;orb('coat-sleeve',ivory,[side*.69,-.28,.12],[.18,.23,.21]);}
  for(let i=0;i<3;i++)orb('coat-button',gold,[.13,-.28-i*.12,.73],[.025,.025,.018]);
  mesh('scientist-pocket',new T.BoxGeometry(.19,.15,.045),ivory,[-.38,-.41,.63]);
  mesh('scientist-id-card',new T.BoxGeometry(.1,.11,.024),blue,[-.37,-.33,.667]);star('scientist-badge',[-.37,-.32,.683],.034);
  const flaskMat=new T.MeshStandardMaterial({color:'#85dfdc',emissive:'#398f95',emissiveIntensity:.35,roughness:.23});
  orb('scientist-flask',flaskMat,[.73,-.13,.54],[.13,.16,.13]);mesh('flask-neck',new T.CylinderGeometry(.047,.055,.17,12),flaskMat,[.73,.035,.54]);mesh('flask-rim',new T.TorusGeometry(.048,.012,6,16),ivory,[.73,.12,.54]).rotation.x=Math.PI/2;
  orb('flask-mitten',ivory,[.72,-.25,.61],[.12,.1,.1]);
 }else if(role==='chef'){
  const ink=fabric('#283b4b');
  const coat=mesh('chef-kappogi',new T.SphereGeometry(1,24,12,Math.PI/2+.12,Math.PI*2-.24,1.6,1.15),ivory,[0,0,0],[.8,.79,.75]);coat.material.side=T.DoubleSide;
  for(const side of [-1,1]){const lapel=mesh('chef-crossed-collar',new T.BoxGeometry(.13,.35,.045),ivory,[side*.1,-.23,.73]);lapel.rotation.z=side*-.48;}
  mesh('chef-indigo-apron',new T.BoxGeometry(.61,.34,.05),ink,[0,-.5,.66]);mesh('chef-obi',new T.BoxGeometry(.78,.075,.05),ink,[0,-.35,.7]);
  mesh('chef-hat-band',new T.CylinderGeometry(.43,.46,.13,24),ivory,[0,.7,0]);orb('chef-soft-hat',ivory,[0,.9,-.01],[.45,.24,.37]);
  for(const side of [-1,1])orb('chef-blush',pink,[side*.42,.03,.63],[.09,.04,.018]);
 }else if(role==='tree'){
  const wrap=mesh('tree-keeper-cape',new T.SphereGeometry(1,24,10,Math.PI/2+.28,Math.PI*2-.56,1.7,1.03),fabric('#628f83'),[0,0,0],[.8,.77,.73]);wrap.material.side=T.DoubleSide;
  star('tree-keeper-crown',[0,.98,.01],.25);star('tree-cape-clasp',[0,-.15,.72],.09);
  orb('held-tree-ornament',new T.MeshStandardMaterial({color:'#d7a5bd',metalness:.45,roughness:.23,emissive:'#8e466d',emissiveIntensity:.15}),[.62,-.18,.58],[.2,.22,.2]);mesh('ornament-cap',new T.CylinderGeometry(.045,.065,.065,10),gold,[.62,.06,.58]);mesh('ornament-loop',new T.TorusGeometry(.055,.012,6,16),gold,[.62,.12,.58]);orb('ornament-mitten',ivory,[.62,-.35,.67],[.15,.1,.12]);
 }else{
  mesh('snow-guide-scarf',new T.TorusGeometry(.64,.085,8,32),blue,[0,-.3,0]).rotation.x=Math.PI/2;
  const tail=mesh('snow-guide-scarf-tail',new T.BoxGeometry(.16,.35,.045),blue,[-.3,-.48,.62]);tail.rotation.z=-.1;
  const hat=mesh('snow-guide-wool-cap',new T.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI/2),blue,[.04,.62,-.03],[.42,.3,.36]);hat.rotation.z=-.15;
  orb('cap-pompom',ivory,[.09,.95,-.03],[.15,.15,.15]);star('snow-guide-star-pin',[-.13,.73,.31],.095);
  for(const side of [-1,1])orb('snow-guide-mitten',pink,[side*.7,-.3,.18],[.16,.18,.17]);
 }
 // Static costume parts share draws, while the body still breathes and turns.
 batchCostume(costume);
 // Glass and fine fur must not stamp hard depth edges on the night sky.
 // Clone cached glass before changing it so visitor accessories stay unchanged.
 const clones=new Map(),transparent=m=>{if(!m.transparent)return m;if(m.userData.shared){if(!clones.has(m)){const copy=m.clone();copy.userData.shared=false;clones.set(m,copy);}m=clones.get(m);}m.depthWrite=false;return m;};
 root.traverse(o=>{if(o.material)o.material=Array.isArray(o.material)?o.material.map(transparent):transparent(o.material);});
 // NPCs never switch wardrobe. Keep inactive accessories off the scene graph,
 // but return them to their owner for the normal complete resource disposal.
 character.pose({still:true});const unused=[];
 root.traverse(o=>{if(o!==root&&!o.visible&&!unused.some(([p])=>{for(let n=o.parent;n;n=n.parent)if(n===p)return true;return false;}))unused.push([o,o.parent]);});
 for(const [o]of unused)o.removeFromParent();
 let last=-Infinity,disposed=false;
 return{root,pose:options=>character.pose(options),setQuality(q){character.setViewDetail(q==='low'?70:q==='medium'?120:170);},update(time,still,player){
  if(disposed||!root.visible||!parent.visible||!Number.isFinite(time)||time-last<1/30)return;
  const dt=Math.min(.1,Math.max(0,time-last));last=time;
  const dx=player?player.x-parent.position.x-x:0,dz=player?player.z-parent.position.z-z:1,near=!!player&&Math.hypot(dx,dz)<7;
  const target=near?Math.atan2(dx,dz):yaw,difference=Math.atan2(Math.sin(target-root.rotation.y),Math.cos(target-root.rotation.y));root.rotation.y+=difference*(still?1:1-Math.exp(-dt*3));
  character.pose({time,still,look:near?Math.sin(difference)*.02:0});root.position.y=y+(still?0:Math.sin(time*.9)*.008);
 },dispose(){if(disposed)return;disposed=true;for(const [o,parent]of unused)parent.add(o);root.removeFromParent();character.dispose();}};
}
