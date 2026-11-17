import * as THREE from './vendor/three.module.js';

// One authored lamp is cloned with shared geometry; opaque parts join the park's static batches.
export function buildParkLamps(api,positions){
 const {scene,mesh,ball,cylinder,rod,halo,M}=api;
 const bronze=M('#66546f'),gold=M('#e8c587',.28,.62),ivory=M('#fff0df');
 const enamel=M('#799da2',.42,.18),snow=M('#e4e9ed',.97,0),pine=M('#426c63',.93,0);
 const crystal=M('#c3dbe4',.22,.38);
 const flame=new THREE.MeshStandardMaterial({color:'#ffe5b4',emissive:'#ffd299',emissiveIntensity:1.85,roughness:.35,toneMapped:false});
 const glass=new THREE.MeshPhysicalMaterial({color:'#ffe5c2',emissive:'#ffc788',emissiveIntensity:.26,transparent:true,opacity:.32,roughness:.16,metalness:.05,clearcoat:1,depthWrite:false,side:THREE.DoubleSide});
 const rings=new Map(),leafGeo=new THREE.SphereGeometry(1,10,6);
 function ring(radius,tube,x,y,z,parent,material=gold){
  const key=radius+'/'+tube;
  if(!rings.has(key))rings.set(key,new THREE.TorusGeometry(radius,tube,5,24));
  const m=mesh(rings.get(key),material,x,y,z,parent);m.rotation.x=Math.PI/2;return m;
 }
 function curve(points,radius,parent,material=gold){
  const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  return mesh(new THREE.TubeGeometry(path,18,radius,6,false),material,0,0,0,parent);
 }
 function star(radius,depth){
  const shape=new THREE.Shape();
  for(let i=0;i<10;i++){
   const a=Math.PI/2+i*Math.PI/5,r=i%2?radius*.43:radius;
   if(i)shape.lineTo(Math.cos(a)*r,Math.sin(a)*r);else shape.moveTo(Math.cos(a)*r,Math.sin(a)*r);
  }
  shape.closePath();const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false});geometry.translate(0,0,-depth/2);return geometry;
 }
 const smallStar=star(.12,.035),finialStar=star(.17,.045);
 const template=new THREE.Group();template.name='park-ornate-lamp';template.userData.footprintRadius=.28;
 template.userData.lampGlow=[{x:-.58,y:3.6,z:0,radius:3.1},{x:.58,y:3.6,z:0,radius:3.1}];
 cylinder(.28,.28,.1,bronze,0,.06,0,template,12);
 cylinder(.22,.25,.13,ivory,0,.175,0,template,12);
 cylinder(.185,.22,.075,gold,0,.275,0,template,12);
 const footProfile=[[.18,0],[.18,.08],[.15,.14],[.12,.23],[.105,.36],[.10,.44]].map(([r,y])=>new THREE.Vector2(r,y));
 mesh(new THREE.LatheGeometry(footProfile,12),bronze,0,.31,0,template);
 cylinder(.057,.093,2.55,enamel,0,2.015,0,template,12);
 for(let i=0;i<6;i++){
  const a=i*Math.PI/3;
  rod([Math.cos(a)*.087,.76,Math.sin(a)*.087],[Math.cos(a)*.055,3.27,Math.sin(a)*.055],.009,gold,template);
 }
 for(const [y,r,h]of [[.75,.115,.07],[.9,.105,.05],[2.83,.085,.05],[3.12,.095,.07],[3.32,.12,.08]]){
  cylinder(r,r,h,ivory,0,y,0,template,12);ring(r+.005,.012,0,y+h/2,0,template);
 }
 // Twin wrought arms clear the path below and curl back to the hanging lanterns.
 for(const side of [-1,1]){
  curve([[0,2.98,0],[side*.29,3.23,0],[side*.67,3.68,0],[side*.74,4.05,0],[side*.63,4.22,0],[side*.51,4.14,0],[side*.58,4.08,0]],.035,template,bronze);
  curve([[0,3.17,.012],[side*.25,3.45,.012],[side*.41,3.77,.012],[side*.34,3.88,.012],[side*.25,3.81,.012]],.014,template);
  const hook=mesh(new THREE.TorusGeometry(.048,.012,5,16),gold,side*.58,4.105,0,template);
  hook.rotation.y=Math.PI/2;
 }
 cylinder(.035,.07,1.02,bronze,0,3.79,0,template,10);
 ring(.085,.014,0,3.49,0,template);ring(.064,.012,0,4.23,0,template);
 const crown=cylinder(0,.11,.19,gold,0,4.34,0,template,10);crown.rotation.y=Math.PI/10;
 mesh(finialStar,gold,0,4.51,0,template);
 ball(flame,0,4.51,.03,.043,template);
 // Short evergreen garlands wind around the centre instead of hanging into the walkway.
 for(let i=0;i<14;i++){
  const a=i*.76,y=2.43+i*.044,r=.12;
  const leaf=mesh(leafGeo,pine,Math.cos(a)*r,y,Math.sin(a)*r,template);
  leaf.scale.set(.13,.025,.055);leaf.rotation.set(.12,-a,.45);
  if(i%4===0)ball(gold,Math.cos(a)*.16,y+.035,Math.sin(a)*.16,.035,template);
 }
 const glazing=new THREE.InstancedMesh(new THREE.CylinderGeometry(.19,.225,.52,6,1,true),glass,2);
 glazing.name='park-lamp-glazing';glazing.castShadow=false;glazing.receiveShadow=false;
 const glassTransform=new THREE.Object3D();
 for(const [i,side]of [-1,1].entries()){
  const x=side*.58;
  glassTransform.position.set(x,3.57,0);glassTransform.rotation.y=Math.PI/6;glassTransform.updateMatrix();glazing.setMatrixAt(i,glassTransform.matrix);
  cylinder(.218,.25,.07,bronze,x,3.285,0,template,6);
  cylinder(.075,.21,.14,gold,x,3.19,0,template,6);
  ring(.222,.019,x,3.32,0,template);ring(.193,.019,x,3.82,0,template);
  for(let j=0;j<6;j++){
   const a=j*Math.PI/3+Math.PI/6;
   rod([x+Math.sin(a)*.225,3.31,Math.cos(a)*.225],[x+Math.sin(a)*.19,3.83,Math.cos(a)*.19],.017,bronze,template);
  }
  const roofProfile=[[.265,0],[.245,.07],[.15,.16],[.065,.21],[.028,.26]].map(([r,y])=>new THREE.Vector2(r,y));
  mesh(new THREE.LatheGeometry(roofProfile,12),bronze,x,3.835,0,template);
  ring(.26,.018,x,3.85,0,template);ring(.245,.02,x,3.89,0,template,snow);
  cylinder(.033,.058,.075,gold,x,4.105,0,template,10);
  cylinder(.054,.067,.35,flame,x,3.55,0,template,8);
  ball(flame,x,3.76,0,.065,template).scale.multiply(new THREE.Vector3(.65,1.4,.65));
  rod([x,3.12,0],[x,3.02,0],.01,gold,template);
  mesh(smallStar,gold,x,2.94,0,template);
  const gem=mesh(new THREE.OctahedronGeometry(.065),crystal,x,2.94,.035,template);gem.scale.set(.7,1.1,.5);
  halo(x,3.6,0,'#ffd7a6',1.1,template).material.opacity=.18;
 }
 glazing.computeBoundingSphere();template.add(glazing);
 return positions.map(({x,z})=>{
  const lamp=template.clone(true);lamp.position.set(x,0,z);scene.add(lamp);return lamp;
 });
}
