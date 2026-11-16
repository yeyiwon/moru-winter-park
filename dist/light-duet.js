import * as T from './vendor/three.module.js';
// Presence is enough: both visitors see the same installation light up.
export function createLightDuet(scene){
 const root=new T.Group();root.name='light-duet';scene.add(root);
 const pads=[{x:-9,z:3,color:'#e7a5eb'},{x:-4,z:3,color:'#9fe8e3'}],rings=[];
 for(const p of pads){const material=new T.MeshBasicMaterial({color:p.color,transparent:true,opacity:.25,depthWrite:false}),ring=new T.Mesh(new T.RingGeometry(.95,1.1,64),material);ring.rotation.x=-Math.PI/2;ring.position.set(p.x,.14,p.z);root.add(ring);rings.push(ring);}
 const positions=new Float32Array(90*3),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));
 const material=new T.PointsMaterial({color:'#fbe0ad',size:.14,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}),lights=new T.Points(geometry,material);root.add(lights);
 const glow=new T.PointLight('#eab9f5',0,15,2);glow.position.set(-6.5,3,3);root.add(glow);
 let peers=[],energy=0,active=false;
 window.addEventListener('lab:visitors',e=>peers=e.detail);
 return{update(self,time,dt,still){const people=[self,...peers.filter(p=>!window.isVisitorBlocked?.(p.id))];const occupied=pads.map(p=>people.map((person,i)=>Math.hypot(person.x-p.x,person.z-p.z)<1.2?i:-1).filter(i=>i>=0));const on=occupied[0].some(i=>occupied[1].some(j=>i!==j));if(on&&!active)window.labSound?.('duet');active=on;energy+=(Number(on)-energy)*(1-Math.exp(-dt*3));rings.forEach((r,i)=>r.material.opacity=occupied[i].length?.9:.3);lights.visible=energy>.01;material.opacity=energy*.85;glow.intensity=energy*10;for(let i=0;i<90;i++){const u=i/89,a=u*Math.PI*2+(still?0:time*.6),r=2.5+Math.sin(u*Math.PI)*.2;positions[i*3]=-6.5+Math.cos(a)*r;positions[i*3+1]=.6+Math.sin(u*Math.PI)*5*energy;positions[i*3+2]=3+Math.sin(a)*r;}geometry.attributes.position.needsUpdate=true;}};
}
