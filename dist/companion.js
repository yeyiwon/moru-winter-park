import * as THREE from './vendor/three.module.js';
// A continuous velvet surface: no fibre geometry, noise texture or particle coat.
export function createCompanion(){
 const group=new THREE.Group(),shape=new THREE.Group();group.add(shape);
 const velvet=new THREE.MeshPhysicalMaterial({color:'#e9e1d6',roughness:.92,metalness:0,sheen:1,sheenColor:'#d4c9df',sheenRoughness:.85});
 const geo=new THREE.SphereGeometry(1,48,40),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const y=p.getY(i),width=.74*(1-.045*y);p.setXYZ(i,p.getX(i)*width,y*.74,p.getZ(i)*width*.91);}geo.computeVertexNormals();
 const body=new THREE.Mesh(geo,velvet);body.castShadow=true;shape.add(body);
 const orb=(mat,x,y,z,sx,sy,sz,parent=shape)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,28,20),mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m;};
 const eyeMat=new THREE.MeshPhysicalMaterial({color:'#0d1422',roughness:.17,metalness:0,clearcoat:.6});const eyes=[],feet=[];
 for(const s of [-1,1]){const eye=orb(eyeMat,s*.225,.1,.64,.09,.126,.048);eyes.push(eye);orb(new THREE.MeshBasicMaterial({color:'#f7f2e9'}),-.23,.3,.92,.18,.12,.1,eye);feet.push(orb(velvet,s*.27,-.74,.14,.18,.12,.25));}
 const accents=new THREE.Group();shape.add(accents);
 const pin=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.075:.16;i?pin.lineTo(Math.cos(a)*r,Math.sin(a)*r):pin.moveTo(Math.cos(a)*r,Math.sin(a)*r);}pin.closePath();const brooch=new THREE.Mesh(new THREE.ExtrudeGeometry(pin,{depth:.025,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:3}),new THREE.MeshStandardMaterial({color:'#c5a578',metalness:.65,roughness:.3}));brooch.position.set(.43,.47,.4);brooch.rotation.z=-.2;accents.add(brooch);brooch.visible=false;
 const ribbon=new THREE.Group();ribbon.position.set(-.4,.5,.35);ribbon.rotation.z=.2;accents.add(ribbon);const satin=new THREE.MeshPhysicalMaterial({color:'#9684b2',roughness:.7,sheen:1});for(const side of [-1,1]){const loop=orb(satin,side*.11,0,0,.13,.085,.045,ribbon);loop.rotation.z=side*.35;}orb(satin,0,0,.035,.045,.06,.04,ribbon);ribbon.visible=false;
 let roundness=0;
 function customize(o){velvet.color.set(o.fur||'#e9e1d6');velvet.sheen=Math.max(.35,Math.min(1,(o.fluff||100)/100));roundness=((o.roundness??50)-50)/500;shape.scale.set(1+roundness,1-roundness*.5,1);brooch.visible=o.accessory==='star';ribbon.visible=o.accessory==='ribbon';}
 function pose({phase=0,walking=false,time=0,landing=0,still=false,look=0}={}){
  const swing=walking&&!still?Math.sin(phase):0;
  group.rotation.z=still?0:-swing*.035;
  shape.scale.set(1+roundness+landing*.08,1-roundness*.5-landing*.12,1+landing*.08);
  feet.forEach((f,i)=>{const ph=phase+i*Math.PI;f.position.z=.14+(walking&&!still?Math.sin(ph)*.2:0);f.position.y=-.74+(walking&&!still?Math.max(0,Math.cos(ph))*.11:0);});
  // Keep the supporting sole on the ground as the body rolls, changes shape or lands.
  const sin=Math.sin(group.rotation.z),cos=Math.cos(group.rotation.z);
  const lowest=Math.min(...feet.map(f=>f.position.x*shape.scale.x*sin+f.position.y*shape.scale.y*cos-Math.hypot(f.scale.x*shape.scale.x*sin,f.scale.y*shape.scale.y*cos)));
  shape.position.y=(-.86-lowest)/cos;
  const blink=still?1:((time%5.7)>5.5?Math.max(.06,Math.abs((time%5.7)-5.6)*10):1);
  eyes.forEach((e,i)=>{e.scale.y=.126*blink;e.position.x=(i?1:-1)*.225+Math.max(-.025,Math.min(.025,look));});
 }
 customize({});return{group,eyes,feet,customize,pose};
}
