import * as THREE from './vendor/three.module.js';
// A continuous velvet surface: no fibre geometry, noise texture or particle coat.
export function createCompanion(){
 const group=new THREE.Group(),shape=new THREE.Group();group.add(shape);
 const velvet=new THREE.MeshPhysicalMaterial({color:'#e9e1d6',roughness:.92,metalness:0,sheen:1,sheenColor:'#d4c9df',sheenRoughness:.85});
 const geo=new THREE.SphereGeometry(1,48,40),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const y=p.getY(i),width=.7*(1-.07*y);p.setXYZ(i,p.getX(i)*width,y*.76,p.getZ(i)*width*.91);}geo.computeVertexNormals();
 const body=new THREE.Mesh(geo,velvet);body.castShadow=true;shape.add(body);
 const orb=(mat,x,y,z,sx,sy,sz,parent=shape)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,28,20),mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m;};
 const eyeMat=new THREE.MeshPhysicalMaterial({color:'#0d1422',roughness:.17,metalness:0,clearcoat:.6});const eyes=[],feet=[];
 for(const s of [-1,1]){const eye=orb(eyeMat,s*.205,.11,.576,.076,.114,.041);eyes.push(eye);orb(new THREE.MeshBasicMaterial({color:'#f7f2e9'}),-.23,.3,.92,.18,.12,.1,eye);feet.push(orb(velvet,s*.27,-.74,.14,.18,.12,.25));}
 const accents=new THREE.Group();shape.add(accents);
 const brooch=orb(new THREE.MeshStandardMaterial({color:'#c5a578',metalness:.65,roughness:.3}),.43,.49,.29,.085,.085,.055,accents);brooch.visible=false;
 const ribbon=orb(new THREE.MeshStandardMaterial({color:'#857895',roughness:.7}),-.4,.52,.24,.17,.075,.05,accents);ribbon.visible=false;
 let roundness=0;
 function customize(o){velvet.color.set(o.fur||'#e9e1d6');velvet.sheen=Math.max(.35,Math.min(1,(o.fluff||100)/100));roundness=((o.roundness??50)-50)/500;shape.scale.set(1+roundness,1-roundness*.5,1);brooch.visible=o.accessory==='star';ribbon.visible=o.accessory==='ribbon';}
 function pose({phase=0,walking=false,speed=0,time=0,landing=0,still=false,look=0}={}){const swing=walking&&!still?Math.sin(phase):0;group.rotation.z=still?0:-swing*.035;shape.scale.set(1+roundness+landing*.08,1-roundness*.5-landing*.12,1+landing*.08);feet.forEach((f,i)=>{const ph=phase+i*Math.PI;f.position.z=.14+(walking&&!still?Math.sin(ph)*.2:0);f.position.y=-.74+(walking&&!still?Math.max(0,Math.cos(ph))*.11:0);});const blink=still?1:((time%5.7)>5.5?Math.max(.06,Math.abs((time%5.7)-5.6)*10):1);eyes.forEach((e,i)=>{e.scale.y=.114*blink;e.position.x=(i?1:-1)*.205+Math.max(-.025,Math.min(.025,look));});}
 customize({});return{group,eyes,feet,customize,pose};
}
