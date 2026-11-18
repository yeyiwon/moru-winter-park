import * as T from './vendor/three.module.js';

const cache=new Map();
function tailGeometry(round){
 if(cache.has(round))return cache.get(round);
 // A low, rearward sweep keeps the tip below the body's centre.
 const curve=new T.CatmullRomCurve3([[0,0,0],[.06,-.01,-.16],[.18,0,-.35],[.34,.065,-.55],[.47,.18,-.68],[.52,.32,-.70],[.49,.42,-.67]].map(p=>new T.Vector3(...p)));
 const segments=24,sides=14,geometry=round?new T.SphereGeometry(.17,20,16).translate(0,0,-.1):new T.TubeGeometry(curve,segments,1,sides,false);
 const frames=curve.computeFrenetFrames(segments,false),matrices=[],shades=[],count=round?1200:4200;
 const radius=t=>.085-.014*T.MathUtils.smoothstep(t,0,1);
 let seed=72631;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 const binormal=new T.Vector3();
 if(!round){
  const a=geometry.attributes.position;
  for(let i=0;i<a.count;i++){const t=Math.floor(i/(sides+1))/segments,c=curve.getPointAt(t),r=radius(t);a.setXYZ(i,c.x+(a.getX(i)-c.x)*r,c.y+(a.getY(i)-c.y)*r,c.z+(a.getZ(i)-c.z)*r);}
  geometry.computeVertexNormals();
 }
 const dummy=new T.Object3D(),up=new T.Vector3(0,1,0),normal=new T.Vector3(),direction=new T.Vector3(),tipPoint=curve.getPointAt(1),tipTangent=curve.getTangentAt(1);
 for(let i=0;i<count;i++){
  let t=round?(i*.62403398875)%1:random(),a=round?i*2.39996323:random()*Math.PI*2;
  // Independent random angle/length avoids the old diagonal bands of bare skin.
  if(!round&&i%12!==0)while(random()>.835+.165*(1-t))t=random();
  if(round){const y=t*2-1,r=Math.sqrt(1-y*y);normal.set(r*Math.cos(a),y,r*Math.sin(a));dummy.position.copy(normal).multiplyScalar(.17);dummy.position.z-=.1;}
  else if(i%12===0){
   // Cover the rounded end cap too, instead of leaving a bald pin tip.
   const r=Math.sqrt(1-t*t);normal.copy(frames.normals[segments]).multiplyScalar(r*Math.cos(a)).addScaledVector(frames.binormals[segments],r*Math.sin(a)).addScaledVector(tipTangent,t);
   dummy.position.copy(tipPoint).addScaledVector(normal,radius(1));
  }else{
   const f=t*segments,k=Math.min(segments-1,Math.floor(f)),blend=f-k;normal.copy(frames.normals[k]).lerp(frames.normals[k+1],blend).normalize();binormal.copy(frames.binormals[k]).lerp(frames.binormals[k+1],blend).normalize();normal.multiplyScalar(Math.cos(a)).addScaledVector(binormal,Math.sin(a)).normalize();dummy.position.copy(curve.getPointAt(t)).addScaledVector(normal,radius(t));
   direction.copy(curve.getTangentAt(t));normal.addScaledVector(direction,.12).normalize();
  }
  dummy.quaternion.setFromUnitVectors(up,normal);dummy.rotateY(a);dummy.scale.set(1,round?.76+.12*Math.sin(i*5):.80+random()*.35,1);dummy.updateMatrix();matrices.push(dummy.matrix.clone());shades.push(.91+.07*Math.max(0,normal.y*.65+normal.z*.3)+(round?0:random()*.015));
 }
 geometry.userData.shared=true;
 const tip=round?null:new T.SphereGeometry(radius(1),20,16).translate(...tipPoint.toArray());if(tip)tip.userData.shared=true;
 const result={geometry,tip,matrices,shades,count};cache.set(round,result);return result;
}

function softTipMaterial(material,bend){
 const paint=material.clone();
 paint.onBeforeCompile=shader=>{
  shader.uniforms.tailBend=bend;
  shader.vertexShader='uniform float tailBend;\n'+shader.vertexShader;
  // Apply after instancing so the coat and skin bend together. No CPU mesh updates.
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',T.ShaderChunk.project_vertex.replace('mvPosition = modelViewMatrix * mvPosition;', 'mvPosition.x += tailBend * pow(smoothstep(0.12,0.70,-mvPosition.z),2.0);\nmvPosition = modelViewMatrix * mvPosition;'));
 };
 paint.customProgramCacheKey=()=>'groomed-cat-tail-v2';return paint;
}

export function createCharacterTail(parent,{velvet,fibreMaterial,fibreGeometry,remote=false}){
 const root=new T.Group();root.name='plush-tail';root.position.set(0,-.3,-.59);parent.add(root);
 const bend={value:0},catVelvet=softTipMaterial(velvet,bend),catFur=softTipMaterial(fibreMaterial,bend),depthSource=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking}),depth=softTipMaterial(depthSource,bend);depthSource.dispose();
 const choices=new Map();let catCoat=null,catData=null,catCapacity=0;const groomingMatrix=new T.Matrix4(),groomingScale=new T.Vector3();
 for(const [id,round]of [['tail-cat',false],['tail-round',true]]){
  const data=tailGeometry(round),group=new T.Group(),body=new T.Mesh(data.geometry,round?velvet:catVelvet),fur=new T.InstancedMesh(fibreGeometry,round?fibreMaterial:catFur,remote?(round?240:650):round?data.count:(globalThis.innerWidth??1024)<650?3000:data.count);
  group.name=id;body.name=id+'-body';body.castShadow=true;if(!round)body.customDepthMaterial=depth;group.add(body,fur);
  if(data.tip){const tip=new T.Mesh(data.tip,catVelvet);tip.castShadow=true;tip.customDepthMaterial=depth;group.add(tip);}
  if(!round){catCoat=fur;catData=data;catCapacity=fur.count;fur.name='cat-tail-coat';}
  for(let i=0;i<fur.count;i++){fur.setMatrixAt(i,data.matrices[i]);if(!round)fur.setColorAt(i,new T.Color().setScalar(data.shades[i]));}fur.instanceMatrix.needsUpdate=true;group.visible=false;root.add(group);choices.set(id,group);
 }
 let selected='',previousTime=null,previousYaw=0,lag=0;root.visible=false;
 return {
  select(items){selected=items.find(id=>choices.has(id))||'';for(const[id,g]of choices)g.visible=id===selected;root.visible=!!selected;previousTime=null;lag=0;},
  color(color){catVelvet.color.set(color);catVelvet.sheen=.45;catVelvet.sheenColor.set(color);catVelvet.emissive.set(color);catVelvet.emissiveIntensity=velvet.emissiveIntensity;catFur.color.set(color);catFur.emissive.set(color);catFur.emissiveIntensity=fibreMaterial.emissiveIntensity;},
  groom(fluff){groomingScale.set(1,.65+fluff/100*.35,1);for(let i=0;i<catCapacity;i++){groomingMatrix.copy(catData.matrices[i]).scale(groomingScale);catCoat.setMatrixAt(i,groomingMatrix);}catCoat.instanceMatrix.needsUpdate=true;},
  setViewDetail(pixels){const density=T.MathUtils.clamp((Math.max(0,pixels)/220)**1.25,remote?.35:.18,1);catCoat.count=Math.max(1,Math.round(catCapacity*density));},
  dispose(){depth.dispose();},
  pose({time=0,phase=0,walking=false,still=false,spa=false,yaw=0}){
   root.visible=!!selected&&!spa;if(!root.visible){previousTime=null;return;}
   if(selected==='tail-round'){root.rotation.y=still?0:Math.sin(time*1.6)*.075+(walking?Math.sin(phase*.7)*.19:0);root.rotation.x=still?0:Math.sin(time*1.3)*.025;return;}
   const dt=previousTime===null?0:Math.max(0,Math.min(.05,time-previousTime)),turn=previousTime===null?0:Math.atan2(Math.sin(yaw-previousYaw),Math.cos(yaw-previousYaw));previousTime=time;previousYaw=yaw;
   lag=still?0:T.MathUtils.clamp(lag-turn*.25,-.12,.12)*Math.exp(-dt*6);
   root.rotation.y=still?0:lag+Math.sin(time*1.35)*.035+(walking?Math.sin(phase*.55)*.045:0);
   root.rotation.x=still?0:Math.sin(time*1.1)*.012;
   bend.value=still?0:Math.sin(time*1.7-.7)*.014+lag*.1;
  }
 };
}
