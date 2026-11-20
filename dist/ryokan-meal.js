import {mergeMeshGeometry} from './mesh-batch.js';
import * as T from './vendor/three.module.js';
// A bounded shared cache; the server's serving timestamp chooses the same fish
// on the chef's plate and every guest's view, including late arrivals.
const menu=[
 {name:'salmon',label:'연어',color:'#e49373',vein:'#f8d8b4',width:.12},
 {name:'tuna',label:'참치',color:'#b94559',vein:'#da8590',width:.115},
 {name:'yellowtail',label:'방어',color:'#e6d0b5',vein:'#bc8f92',width:.125},
 {name:'sea-bream',label:'도미',color:'#e5dfd4',vein:'#ccacb0',width:.11},
 {name:'mackerel',label:'고등어',color:'#8ba5ad',vein:'#d3d5ce',width:.125}
];
const templates=new Map();
export function diningMenuIndex(seed=0){let h=Math.floor(Number.isFinite(seed)?seed:0);h=(h%2147483647)|0;h=Math.imul(h^(h>>>16),0x45d9f3b);h=Math.imul(h^(h>>>16),0x45d9f3b);return((h^(h>>>16))>>>0)%menu.length;}
export function diningMenuName(seed){return menu[diningMenuIndex(seed)].label+' 초밥';}
export function diningChefMessage(stage,seed){
 const dish=diningMenuName(seed),lines={waiting:'앞 손님부터 대접할게요. 잠시만 기다려 주세요!',greeting:'어서 오세요! 맛있는 한 접시를 준비해 드릴게요.',preparing: dish+'을 정성껏 쥐고 있어요.',serving:'이번에는 '+dish+'이에요!',handoff:dish+' 나왔어요. 맛있게 드세요!',tasting:dish+'과 함께 느긋한 시간 보내세요.',finished:'잘 드셨나요? 따뜻하게 쉬다 가세요!'};
 return '셰프 · '+(lines[stage]||lines.waiting);
}
export function createRyokanMeal(seed=0){
 const index=diningMenuIndex(seed);if(templates.has(index))return templates.get(index).clone(true);
 const item=menu[index],root=new T.Group();root.name='omakase-serving';root.userData.menuIndex=index;root.userData.fish=item.name;
 const porcelain=new T.MeshPhysicalMaterial({color:'#607d76',roughness:.22,clearcoat:.8,clearcoatRoughness:.18}),rice=new T.MeshPhysicalMaterial({color:'#f6eddb',roughness:.48,clearcoat:.16}),fish=new T.MeshPhysicalMaterial({color:item.color,roughness:.24,clearcoat:.48,clearcoatRoughness:.2}),grain=new T.MeshStandardMaterial({color:item.vein,roughness:.4}),green=new T.MeshStandardMaterial({color:'#6d8653',roughness:.85,side:T.DoubleSide}),ginger=new T.MeshPhysicalMaterial({color:'#e8b9a6',roughness:.35,clearcoat:.15}),wood=new T.MeshStandardMaterial({color:'#73513b',roughness:.6});
 // Fine muscle/fat bands are shaded on the curved cut, rather than drawn as thick white wires.
 fish.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 sushiUv;').replace('#include <uv_vertex>','#include <uv_vertex>\nsushiUv=uv;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 sushiUv;').replace('#include <color_fragment>',`#include <color_fragment>
  float band=sin((sushiUv.x*18.+sushiUv.y*5.+sin(sushiUv.y*15.)*.16)*6.28318),fiber=sin(sushiUv.x*720.+sushiUv.y*130.);
  float fat=smoothstep(.78,.97,band)*${index===0?'.3':index===4?'.06':'.12'};diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.96,.86,.7),fat);diffuseColor.rgb*=.96+.035*fiber;
  ${index===4?'diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.12,.22,.28),smoothstep(.3,.8,sin(sushiUv.x*35.+sin(sushiUv.y*6.)*2.))*.45);':''}
 `);};fish.customProgramCacheKey=()=>`nigiri-muscle-${index}`;
 const mesh=(g,m,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);root.add(o);return o;};
 const profile=[[0,-.018],[.27,-.018],[.29,-.006],[.35,0],[.46,.025],[.51,.075],[.515,.095],[.505,.108],[.49,.108],[.44,.065],[.34,.04],[0,.04]].map(p=>new T.Vector2(...p));const plate=mesh(new T.LatheGeometry(profile,56),porcelain);plate.scale.set(1.4,1,1.02);
 const lip=mesh(new T.TorusGeometry(.504,.006,4,56),porcelain,0,.104,0);lip.rotation.x=Math.PI/2;lip.scale.set(1.4,1.02,1);
 for(const [x,z,turn]of [[-.25,-.045,-.12],[.22,.04,.13]]){
  const bed=mesh(new T.CapsuleGeometry(.095,.2,6,12),rice,x,.145,z);bed.rotation.set(Math.PI/2,0,Math.PI/2+turn);
  for(let i=0;i<84;i++){const a=i*2.399,r=Math.sqrt((i+.5)/84),dx=Math.cos(a)*.18*r,dz=Math.sin(a)*.083*r;const g=mesh(new T.CapsuleGeometry(.009,.022,3,5),rice,x+dx,.17+Math.sqrt(1-r*r)*.058,z+dz);g.rotation.set(.2,a*.17,1.1+a*.13);}
  const cut=new T.SphereGeometry(1,28,16),p=cut.attributes.position;for(let i=0;i<p.count;i++){const xx=p.getX(i),yy=p.getY(i),zz=p.getZ(i);p.setXYZ(i,xx*.245,yy*.038-.016*Math.abs(xx)**3+.004*Math.sin(xx*8+zz*5),zz*item.width*(1+.06*Math.sin(xx*7)));}cut.computeVertexNormals();const top=mesh(cut,fish,x,.25,z);top.rotation.y=turn;
  for(let j=-3;j<=3;j++){const points=[-.92,-.5,0,.5,.92].map(t=>new T.Vector3(x+j*.053+t*.028,.278-.027*t*t,z+t*item.width));mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),10,index===0?.0018:.0009,4,false),grain);}
 }
 const leaf=new T.Shape();leaf.moveTo(0,0);for(let i=0;i<=16;i++){const a=i/16*Math.PI*2,r=(i%2?.085:.11);leaf.lineTo(Math.cos(a)*r,Math.sin(a)*r*1.6);}leaf.closePath();const shiso=mesh(new T.ShapeGeometry(leaf),green,.41,.085,-.16);shiso.rotation.x=-Math.PI/2;
 mesh(new T.IcosahedronGeometry(.045,1),green,.43,.12,-.19).scale.set(1,.7,1);
 for(let i=0;i<4;i++){const petal=mesh(new T.SphereGeometry(1,12,8).scale(.06,.012,.04),ginger,-.46+i*.019,.09+i*.015,.2);petal.rotation.set(.2*i,.6*i,.2);}
 for(const z of [.36,.42]){const stick=mesh(new T.CylinderGeometry(.007,.013,.95,8),wood,0,.12,z);stick.rotation.z=Math.PI/2;}
 const batches=new Map();root.updateMatrixWorld(true);for(const o of root.children){if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(o);}for(const [material,items]of batches){const geometry=mergeMeshGeometry(items);for(const o of items){o.removeFromParent();o.geometry.dispose();}geometry.userData.shared=true;material.userData.shared=true;const merged=new T.Mesh(geometry,material);merged.userData.food=material!==porcelain&&material!==wood;root.add(merged);}templates.set(index,root);return root.clone(true);
}
export function updateRyokanMeal(root,seed){const index=diningMenuIndex(seed);if(root.userData.menuIndex===index)return;const next=createRyokanMeal(seed);root.clear();root.add(...next.children.slice());root.userData.menuIndex=index;root.userData.fish=next.userData.fish;}
