import {parkWalkways} from './park-layout.js';
import {createSnowPaths} from './snow-path.js';
import {createAuroraLandmarks} from './aurora-landmarks.js';
import {findPath,clearSegment} from './navigation.js';
import * as THREE from './vendor/three.module.js';
import {islands,bridges,bridgeHeight,exhibits,surfaceHeight} from './world-layout.js';

export function buildArchipelago(api){
  const {scene,mesh,ball,cylinder,box,rod,torus,halo,M,glowMap}=api;
  let seed=619;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const gold=M('#c9ab76',.28,.72),ivory=M('#b6bac4',.62,.1),bark=M('#36454b'),green=M('#315d57'),dark=M('#283743');
  const rotations=[];
  const aurora=createAuroraLandmarks(api);
  function noiseTexture(){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#d4d6d7';ctx.fillRect(0,0,128,128);for(let i=0;i<8;i++){const x=(i*47)%128,y=(i*67)%128,g=ctx.createRadialGradient(x,y,0,x,y,46);g.addColorStop(0,'#9aa6ad30');g.addColorStop(1,'#9aa6ad00');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);return t;}
  const grain=noiseTexture();
  function terrain(island){
    const mat=M(island.id==='nature'?'#c9d9d4':'#d7e3dd',.96);mat.map=grain;mat.bumpScale=0;
    const top=cylinder(island.r,island.r-.3,.25,mat,island.x,-.15,island.z,scene,96);top.name='island-ground';const edge=top.geometry.attributes.position;for(let i=0;i<edge.count;i++){const x=edge.getX(i),z=edge.getZ(i),a=Math.atan2(z,x),scale=1+.025*Math.sin(a*5)+.022*Math.sin(a*9+.6);edge.setX(i,x*scale);edge.setZ(i,z*scale);}top.geometry.computeVertexNormals();
    const rockGeo=new THREE.CylinderGeometry(island.r-.2,island.r*.55,6,64,5);const p=rockGeo.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),v=1+.025*Math.sin(a*9+y*2)+.04*Math.sin(a*5-y);p.setXYZ(i,x*v,y,z*v);}rockGeo.computeVertexNormals();
    mesh(rockGeo,M('#68717e',.95),island.x,-3.3,island.z);
    for(let j=0;j<8;j++){const a=rand()*Math.PI*2,r=island.r*.75,x=island.x+Math.cos(a)*r,z=island.z+Math.sin(a)*r;const stone=mesh(new THREE.IcosahedronGeometry(.7+rand(),1),M('#78848c'),x,-1.7-rand()*3,z);stone.scale.set(1,2,1);}
    for(let j=0;j<4;j++){const a=j*Math.PI/2+.6;const mist=halo(island.x+Math.cos(a)*island.r,-5,island.z+Math.sin(a)*island.r,island.color,22);mist.material.opacity=.075;}
  }
  for(const island of islands.slice(1,7).filter(island=>!island.hidden))terrain(island);
  // Bowed timber and warm stone share the exact walking profile used by navigation.
  const deckMaterial=M('#c5a17c',.88,0),edgeMaterial=M('#8c694f',.88,0),bridgeSnow=M('#e2e9e6',1,0),bridgeStone=M('#cbbba7',.94,0),bridgeRose=M('#edb7c5',.84,0);
  const lanternGlass=new THREE.MeshStandardMaterial({color:'#fff0cb',emissive:'#ffbd74',emissiveIntensity:.6,roughness:.35,metalness:.04});
  const plankShape=new THREE.Shape();plankShape.moveTo(-2.05,-.065);plankShape.lineTo(2.05,-.065);plankShape.quadraticCurveTo(2.1,-.065,2.1,-.015);plankShape.lineTo(2.1,.015);plankShape.quadraticCurveTo(2.1,.065,2.05,.065);plankShape.lineTo(-2.05,.065);plankShape.quadraticCurveTo(-2.1,.065,-2.1,.015);plankShape.lineTo(-2.1,-.015);plankShape.quadraticCurveTo(-2.1,-.065,-2.05,-.065);
  const plankGeo=new THREE.ExtrudeGeometry(plankShape,{depth:.32,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:1,curveSegments:3});plankGeo.translate(0,0,-.16);const planks=[];
  function bridgeLantern(p,yaw){
   const g=new THREE.Group();g.position.copy(p);g.rotation.y=yaw;scene.add(g);
   cylinder(.105,.16,.13,gold,0,1.23,0,g,10);cylinder(.035,.06,.22,gold,0,1.38,0,g,8);
   const profile=[new THREE.Vector2(.14,0),new THREE.Vector2(.23,.1),new THREE.Vector2(.245,.31),new THREE.Vector2(.17,.48),new THREE.Vector2(.09,.52)];mesh(new THREE.LatheGeometry(profile,16),lanternGlass,0,1.45,0,g);
   for(let j=0;j<6;j++){const a=j*Math.PI/3,pts=profile.map(v=>new THREE.Vector3(Math.cos(a)*(v.x+.015),1.45+v.y,Math.sin(a)*(v.x+.015)));mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),10,.016,5,false),edgeMaterial,0,0,0,g);}
   for(const [y,r]of [[1.49,.18],[1.73,.25],[1.91,.19]]){const ring=torus(r,.018,gold,0,y,0,g);ring.rotation.x=Math.PI/2;}
   cylinder(.09,.28,.17,edgeMaterial,0,2.02,0,g,8);cylinder(.065,.22,.09,bridgeSnow,0,2.1,0,g,8);ball(gold,0,2.17,0,.055,g);
  }
  for(const [a,b] of bridges){const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len,start=a.r-1,end=len-b.r+1;
   const at=(d,side=0)=>new THREE.Vector3(a.x+ux*d+uz*side,bridgeHeight(a.x+ux*d,a.z+uz*d),a.z+uz*d-ux*side),yaw=Math.atan2(ux,uz),span=end-start;
   for(let d=start;d<end;d+=.35){const p=at(d);planks.push({p,yaw,tilt:Math.cos((d-start)/span*Math.PI)*.35*Math.PI/span});}
   const count=Math.max(2,Math.ceil(span/1.75));
   for(const side of [-1,1]){
    const handrail=[],snowRail=[];for(let j=0;j<=count*3;j++){const p=at(start+span*j/(count*3),side*2.12);handrail.push(p.clone().add(new THREE.Vector3(0,1.06,0)));snowRail.push(p.clone().add(new THREE.Vector3(0,1.115,0)));}
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(handrail),count*4,.07,7,false),edgeMaterial);mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(snowRail),count*4,.022,5,false),bridgeSnow);
    for(let j=0;j<=count;j++){
     const d=start+span*j/count,p=at(d,side*2.12),post=box(.18,1.14,.18,edgeMaterial,p.x,p.y+.57,p.z);post.rotation.y=yaw;
     cylinder(.16,.19,.12,bridgeStone,p.x,p.y+.13,p.z,scene,8);cylinder(.14,.14,.055,gold,p.x,p.y+1.17,p.z,scene,8);
     if(j%3===0||j===count)bridgeLantern(p,yaw);
     else{const cap=ball(bridgeSnow,p.x,p.y+1.22,p.z,.145);cap.scale.y=.35;}
     if(j<count){const q=at(start+span*(j+1)/count,side*2.12),mid=p.clone().lerp(q,.5),v=q.clone().sub(p);
      for(const h of [.28,.85]){const pts=[p.clone().add(new THREE.Vector3(0,h,0)),mid.clone().add(new THREE.Vector3(0,h-.05,0)),q.clone().add(new THREE.Vector3(0,h,0))];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),10,.035,6,false),edgeMaterial);}
      const lo=mid.clone().add(new THREE.Vector3(0,.33,0)),hi=mid.clone().add(new THREE.Vector3(0,.89,0)),left=mid.clone().addScaledVector(v,-.25).add(new THREE.Vector3(0,.6,0)),right=mid.clone().addScaledVector(v,.25).add(new THREE.Vector3(0,.6,0));for(const [u,w]of [[lo,left],[left,hi],[hi,right],[right,lo]])rod(u.toArray(),w.toArray(),.022,gold);
      const medallion=torus(.09,.017,gold,mid.x,mid.y+.61,mid.z);medallion.rotation.y=yaw+Math.PI/2;
     }
     if(j%6===3){const v=at(d,side*2.38);rod([p.x,p.y+1,p.z],[v.x,v.y+.62,v.z],.018,gold);const basket=cylinder(.2,.12,.22,edgeMaterial,v.x,v.y+.49,v.z,scene,12);for(let k=0;k<6;k++){const angle=k*2.4,leaf=ball(green,v.x+Math.cos(angle)*.16,v.y+.63-Math.max(0,k-3)*.09,v.z+Math.sin(angle)*.16,.11);leaf.scale.set(1.2,.45,.7);if(k<3)ball(bridgeRose,v.x+Math.cos(angle)*.15,v.y+.7,v.z+Math.sin(angle)*.15,.065);}}
    }
    // Repeating structural arches keep the long mountain crossing from floating like a plank.
    const bays=Math.max(1,Math.ceil(span/10));for(let bay=0;bay<bays;bay++){const low=start+span*bay/bays,high=start+span*(bay+1)/bays,arc=[];for(let j=0;j<=24;j++){const t=j/24,p=at(low+(high-low)*t,side*1.92);p.y-=1.85-1.58*Math.sin(t*Math.PI);arc.push(p);}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc),28,.18,8,false),bridgeStone);}
    for(let j=0;j<=bays;j++){const p=at(start+span*j/bays,side*1.92);cylinder(.36,.5,3.5,bridgeStone,p.x,p.y-1.8,p.z,scene,12);cylinder(.57,.62,.3,edgeMaterial,p.x,p.y-3.5,p.z,scene,12);}
   }
   for(const d of [start,end]){const p=at(d),stone=box(4.8,.08,1.15,bridgeStone,p.x,p.y-.025,p.z);stone.rotation.y=yaw;for(const side of [-1,1]){const v=at(d,side*2.48);cylinder(.4,.48,.38,bridgeStone,v.x,v.y+.12,v.z,scene,12);const cap=ball(bridgeSnow,v.x,v.y+.34,v.z,.43);cap.scale.y=.18;}}
  }
  const bridgeMesh=new THREE.InstancedMesh(plankGeo,deckMaterial,planks.length),dummy=new THREE.Object3D();planks.forEach(({p,yaw,tilt},i)=>{dummy.position.copy(p);dummy.position.y-=.005;dummy.rotation.set(0,yaw,0);dummy.rotateX(-tilt);dummy.updateMatrix();bridgeMesh.setMatrixAt(i,dummy.matrix);bridgeMesh.setColorAt(i,new THREE.Color().setScalar(.94+(i%7)*.008));});bridgeMesh.receiveShadow=true;scene.add(bridgeMesh);
  function groupAt(i,x=0,z=0){const g=new THREE.Group();g.position.set(i.x+x,0,i.z+z);scene.add(g);return g;}
  function ringFloor(parent,r,mat){cylinder(r,r+.2,.22,mat,0,.1,0,parent,64);const ring=torus(r-.1,.04,gold,0,.23,0,parent);ring.rotation.x=-Math.PI/2;}
  const canopyGeo=new THREE.SphereGeometry(1,32,24),cp=canopyGeo.attributes.position;
  for(let i=0;i<cp.count;i++){const x=cp.getX(i),y=cp.getY(i),z=cp.getZ(i),r=1+.065*Math.sin(x*4+y*3)*Math.cos(z*4)+.025*Math.sin(y*8+z*3);cp.setXYZ(i,x*r,y*r,z*r);}canopyGeo.computeVertexNormals();
  const winterCapGeo=new THREE.SphereGeometry(1,12,8);
  function boughGeometry(frost=false){const positions=[],uv=[],indices=[],steps=16;for(let i=0;i<=steps;i++){const t=i/steps,u=frost?.12+t*.83:t,w=Math.sin(u*Math.PI)*.24*(1-u*.45)*(i%2?.83:1),y=.08*Math.sin(u*Math.PI)-u*u*.1;for(let j=0;j<4;j++){const lateral=(j===0?-w:j===2?w:0)*(frost?.68:1);positions.push(u,y+(j===1?.05*(1-u):j===3?-.025:0)+(frost?.022:0),lateral);uv.push(t,j/3);}if(i<steps)for(let j=0;j<(frost?2:4);j++){const a=i*4+j,b=i*4+(j+1)%4;indices.push(a,b,a+4,b,b+4,a+4);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;}
  const firBough=boughGeometry(),firFrost=boughGeometry(true);
  function tree(parent,x,z,height,color){
    if(color!=='#77a28b'){
      const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);const green=M('#355953',.98,0),snow=M('#e2e9e6',1,0);cylinder(.07,.14,height*.85,bark,0,height*.425,0,g,10);
      for(let tier=0;tier<8;tier++){const y=height*(.2+tier*.1),r=height*(.3-tier*.035);cylinder(.005,r*.38,height*.16,green,0,y+height*.03,0,g,10);
        for(let branch=0;branch<7;branch++){const a=branch*Math.PI*2/7+tier*2.399,reach=r*(.92+.08*Math.sin(branch*3+tier));rod([0,y-.045,0],[Math.cos(a)*reach*.83,y-reach*.07,Math.sin(a)*reach*.83],.017,bark,g);for(const [geometry,mat]of [[firBough,green],[firFrost,snow]]){const leaf=mesh(geometry,mat,0,y,0,g);leaf.scale.setScalar(reach);leaf.rotation.y=-a;}
         for(const side of [-1,1]){const leaf=mesh(firBough,green,Math.cos(a)*reach*.4,y+reach*.02,Math.sin(a)*reach*.4,g);leaf.scale.setScalar(reach*.42);leaf.rotation.y=-a+side*.65;}}
      }
      return g;
    }

    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=(x>0?-.6:.35)+(z>0?.25:-.2);parent.add(g);const trunk=[new THREE.Vector3(0,0,0),new THREE.Vector3(-.1,height*.36,.03),new THREE.Vector3(.12,height*.72,0)];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trunk),18,.13,9,false),bark,0,0,0,g);
    for(const [dx,dy,dz,scale] of [[-.52,.68,.06,1],[.46,.86,-.12,.84],[.39,.59,.51,.64]]){const points=[new THREE.Vector3(0,height*.32,0),new THREE.Vector3(dx*.8,height*dy*.85,dz*.8),new THREE.Vector3(dx,height*dy,dz)];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,.065,7,false),bark,0,0,0,g);const crown=mesh(canopyGeo,M(color,.96,0),dx,height*dy,dz,g);crown.scale.set(height*.33*scale,height*.23*scale,height*.3*scale);crown.rotation.set(rand()*.25,rand()*2,rand()*.2);
    for(let i=0;i<5;i++){const a=i*2.4+rand()*.5,lobe=mesh(canopyGeo,M(color,.96,0),dx+Math.cos(a)*height*.17*scale,height*dy+(rand()-.4)*height*.18,dz+Math.sin(a)*height*.16*scale,g);lobe.scale.set(height*.16*scale,height*.14*scale,height*.16*scale);}}
    return g;
  }
  const quiz=groupAt(islands[3]);aurora.quiz(quiz);
  const garden=groupAt(islands[4]);aurora.conservatory(garden);
  const strings=[];
  // The old clock, gear wheels and decorative boats are intentionally removed.
  // Designed promenades and planted borders replace random grass and pebble rings.
  const soil=M('#2a3938',1),bedStone=M('#606771',.8);
  const promenade=createSnowPaths({root:scene,stone:[M('#a3adae',1,0),M('#adb6b4',1,0),M('#a7afac',1,0)],snow:bridgeSnow,heightAt:surfaceHeight});
  for(const route of parkWalkways)promenade(route.points,route.width);
  // Every branch reaches a bridge landing or a real front door. No decorative dead ends.
  const drawn=new Set();function connect(a,b){const route=findPath(a,b);if(!route.length)return;const key=[a.x,a.z,b.x,b.z].join('/');if(drawn.has(key))return;drawn.add(key);promenade([[a.x,a.z],...route.map(p=>[p.x,p.z])]);}
  for(const island of islands.slice(0,7).filter(island=>!island.hidden)){
    const hub=island.spawn;for(const [a,b]of bridges){const other=a===island?b:b===island?a:null;if(!other)continue;const len=Math.hypot(other.x-island.x,other.z-island.z),r=island.r-1.1;connect(hub,{x:island.x+(other.x-island.x)/len*r,z:island.z+(other.z-island.z)/len*r});}
    if(island.id==='philosophy')connect(hub,{x:44,z:24});
  }
  function planter(parent,x,z,rx,rz,color){const base=cylinder(1,1.03,.19,bedStone,x,.1,z,parent,40);base.scale.set(rx,1,rz);const inside=cylinder(.91,.91,.035,soil,x,.21,z,parent,40);inside.scale.set(rx,1,rz);const bloom=M(color,.92,0),foliage=M('#4b6d64',.98,0);for(const [dx,dz,scale] of [[-.38,.08,.48],[.16,-.24,.6],[.45,.26,.35]]){const bush=mesh(canopyGeo,foliage,x+dx*rx,.37,z+dz*rz,parent);bush.scale.set(rx*scale,.26,rz*scale);}for(const [dx,dz,h] of [[-.43,-.15,.65],[-.12,.34,.61],[.23,-.39,.71],[.54,.12,.62],[.02,-.01,.78]]){const fx=x+dx*rx,fz=z+dz*rz;rod([fx,.22,fz],[fx,h,fz],.014,foliage,parent);for(let j=0;j<5;j++){const a=j*Math.PI*2/5,petal=ball(bloom,fx+Math.cos(a)*.075,h,fz+Math.sin(a)*.075,.069,parent);petal.scale.set(1,.45,.9);}ball(ivory,fx,h+.025,fz,.038,parent);}}
  for(const [x,z] of [[-3.7,-2.8],[3.7,-2.8],[-3.8,2.7],[3.8,2.7]])planter(garden,x,z,.85,1.05,'#d0b6d1');
  for(const island of islands.slice(1,7).filter(island=>!island.hidden)){
    const g=groupAt(island);
    const positions={science:[[-10,-6,2,1.2]],law:[[-8,-5,1.4,2.2],[8,-5,1.7,1.3]],philosophy:[[-9,-4,1.5,2],[9,5,1.8,1.2]],nature:[[-10,-6,1.7,2.6],[9,7,2.2,1.5],[9,-5,1.3,2]],art:[],history:[[-10,-6,1.8,1.1],[10,4,1.4,2]]}[island.id];
    for(const [x,z,rx,rz] of positions)planter(g,x,z,rx,rz,island.color);
    for(const [x,z] of (island.id==='nature'?[[-12,-2],[10,-8]]:island.id==='philosophy'?[]:[[-11,-7]]))tree(g,x,z,3.2,island.id==='nature'?'#619781':'#71788e');
    const lampMat=new THREE.MeshBasicMaterial({color:'#f4d5ab'});
    for(const [x,z] of (island.id==='science'?[[-5,8]]:island.id==='nature'?[[-5,-9],[6,6]]:island.id==='art'?[[8,3],[-7,4]]:[[-5,8],[8,2]])){cylinder(.055,.11,1.65,gold,x,.82,z,g,10);cylinder(.16,.19,.33,lampMat,x,1.8,z,g,8);cylinder(0,.25,.19,gold,x,2.06,z,g,8);halo(x,1.8,z,'#f8d6a8',1.6,g);}
  }
  // Soft environmental reflections on brass and glass; no external texture downloads.
  const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;const ctx=envCanvas.getContext('2d'),grad=ctx.createLinearGradient(0,0,0,256);grad.addColorStop(0,'#293754');grad.addColorStop(.45,'#a7b8cd');grad.addColorStop(.52,'#677e9b');grad.addColorStop(1,'#172b30');ctx.fillStyle=grad;ctx.fillRect(0,0,512,256);const env=new THREE.CanvasTexture(envCanvas);env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;scene.environment=env;scene.environmentIntensity=.35;
  return {grain,tree,planter,strings,dynamic:rotations.map(r=>r.g),update(t){for(const {g,s,balance} of rotations){if(balance)g.rotation.z=Math.sin(t*.4)*.06;else g.rotation.z=t*s;}aurora.update(t);}};
}
