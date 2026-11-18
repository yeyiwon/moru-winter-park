import {buildMuseumLandmark} from './museum-world.js';
import {pathRoutes} from './path-routes.js';
import {postOffice} from './retreat-layout.js';
import {festivalDestinations} from './festival-layout.js';
import {buildConnectedTerrain} from './connected-terrain.js';
import {createTreeAtmosphere} from './tree-atmosphere.js';
import {createSnowPaths} from './snow-path.js';
import {createAuroraLandmarks} from './aurora-landmarks.js';
import * as THREE from './vendor/three.module.js';
import {islands,landforms,landDistance,bridges,bridgeHalfWidth,bridgeHeight,exhibits,surfaceHeight} from './world-layout.js';

export function buildArchipelago(api){
  const {scene,mesh,ball,cylinder,box,rod,torus,halo,M,glowMap}=api;
  let seed=619;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const gold=M('#c9ab76',.28,.72),ivory=M('#b6bac4',.62,.1),bark=M('#36454b'),green=M('#315d57'),dark=M('#283743');
  const rotations=[];
  const aurora=createAuroraLandmarks(api);
  function noiseTexture(){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#d4d6d7';ctx.fillRect(0,0,128,128);for(let i=0;i<8;i++){const x=(i*47)%128,y=(i*67)%128,g=ctx.createRadialGradient(x,y,0,x,y,46);g.addColorStop(0,'#9aa6ad30');g.addColorStop(1,'#9aa6ad00');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);return t;}
  const grain=noiseTexture();
  buildConnectedTerrain(scene);
  // Bowed timber and warm stone share the exact walking profile used by navigation.
  const deckMaterial=M('#927657',.88,0),edgeMaterial=M('#675340',.88,0),bridgeSnow=M('#e2e9e6',1,0),bridgeStone=M('#cbbba7',.94,0),bridgeRose=M('#edb7c5',.84,0);
  const lanternGlass=new THREE.MeshStandardMaterial({color:'#fff0cb',emissive:'#ffbd74',emissiveIntensity:.6,roughness:.35,metalness:.04});
  const plankShape=new THREE.Shape();plankShape.moveTo(-3.53,-.065);plankShape.lineTo(3.53,-.065);plankShape.quadraticCurveTo(3.6,-.065,3.6,-.015);plankShape.lineTo(3.6,.015);plankShape.quadraticCurveTo(3.6,.065,3.53,.065);plankShape.lineTo(-3.53,.065);plankShape.quadraticCurveTo(-3.6,.065,-3.6,.015);plankShape.lineTo(-3.6,-.015);plankShape.quadraticCurveTo(-3.6,-.065,-3.53,-.065);
  lanternGlass.userData.lightingTheme='personal';
  const plankGeo=new THREE.ExtrudeGeometry(plankShape,{depth:.32,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:1,curveSegments:3});plankGeo.translate(0,0,-.16);const planks=[];
  function bridgeLantern(p,yaw){
   const g=new THREE.Group();g.position.copy(p);g.rotation.y=yaw;g.userData.lampGlow=[{y:1.72,floor:.02,radius:2.5,power:7,range:8}];scene.add(g);
   cylinder(.105,.16,.13,gold,0,1.23,0,g,10);cylinder(.035,.06,.22,gold,0,1.38,0,g,8);
   const profile=[new THREE.Vector2(.14,0),new THREE.Vector2(.23,.1),new THREE.Vector2(.245,.31),new THREE.Vector2(.17,.48),new THREE.Vector2(.09,.52)];mesh(new THREE.LatheGeometry(profile,16),lanternGlass,0,1.45,0,g);
   for(let j=0;j<6;j++){const a=j*Math.PI/3,pts=profile.map(v=>new THREE.Vector3(Math.cos(a)*(v.x+.015),1.45+v.y,Math.sin(a)*(v.x+.015)));mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),10,.016,5,false),edgeMaterial,0,0,0,g);}
   for(const [y,r]of [[1.49,.18],[1.73,.25],[1.91,.19]]){const ring=torus(r,.018,gold,0,y,0,g);ring.rotation.x=Math.PI/2;}
   cylinder(.09,.28,.17,edgeMaterial,0,2.02,0,g,8);cylinder(.065,.22,.09,bridgeSnow,0,2.1,0,g,8);ball(gold,0,2.17,0,.055,g);
  }
  for(const [a,b] of bridges){const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len,start=a.r-1,end=len-b.r+1;
   const at=(d,side=0)=>new THREE.Vector3(a.x+ux*d+uz*side,bridgeHeight(a.x+ux*d,a.z+uz*d),a.z+uz*d-ux*side),yaw=Math.atan2(ux,uz),span=end-start;
   for(let d=start;d<end;d+=.35){const p=at(d);planks.push({p,yaw,tilt:Math.cos((d-start)/span*Math.PI)*Math.min(.7,span*.025)*Math.PI/span});}
   const count=Math.max(2,Math.ceil(span/1.75));
   for(const side of [-1,1]){
    const handrail=[],snowRail=[];for(let j=0;j<=count*3;j++){const p=at(start+span*j/(count*3),side*bridgeHalfWidth);handrail.push(p.clone().add(new THREE.Vector3(0,1.06,0)));snowRail.push(p.clone().add(new THREE.Vector3(0,1.115,0)));}
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(handrail),count*4,.07,7,false),edgeMaterial);mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(snowRail),count*4,.022,5,false),bridgeSnow);
    for(let j=0;j<=count;j++){
     const d=start+span*j/count,p=at(d,side*bridgeHalfWidth),post=mesh(new THREE.BoxGeometry(.18,1.14,.18),edgeMaterial,p.x,p.y+.57,p.z);post.rotation.y=yaw;
     cylinder(.16,.19,.12,bridgeStone,p.x,p.y+.13,p.z,scene,8);cylinder(.14,.14,.055,gold,p.x,p.y+1.17,p.z,scene,8);
     if(j%5===0||j===count)bridgeLantern(p,yaw);
     else{const cap=ball(bridgeSnow,p.x,p.y+1.22,p.z,.145);cap.scale.y=.35;}
     if(j<count){const q=at(start+span*(j+1)/count,side*bridgeHalfWidth),mid=p.clone().lerp(q,.5),v=q.clone().sub(p);
      for(const h of [.28,.85]){const pts=[p.clone().add(new THREE.Vector3(0,h,0)),mid.clone().add(new THREE.Vector3(0,h-.05,0)),q.clone().add(new THREE.Vector3(0,h,0))];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),10,.035,6,false),edgeMaterial);}
      const lo=mid.clone().add(new THREE.Vector3(0,.33,0)),hi=mid.clone().add(new THREE.Vector3(0,.89,0)),left=mid.clone().addScaledVector(v,-.25).add(new THREE.Vector3(0,.6,0)),right=mid.clone().addScaledVector(v,.25).add(new THREE.Vector3(0,.6,0));for(const [u,w]of [[lo,left],[left,hi],[hi,right],[right,lo]])rod(u.toArray(),w.toArray(),.022,gold);
      const medallion=torus(.09,.017,gold,mid.x,mid.y+.61,mid.z);medallion.rotation.y=yaw+Math.PI/2;
     }

    }

   }
   for(const d of [start,end]){const p=at(d),stone=box(8,.08,1.15,bridgeStone,p.x,p.y-.025,p.z);stone.rotation.y=yaw;for(const side of [-1,1]){const v=at(d,side*4.0);cylinder(.4,.48,.38,bridgeStone,v.x,v.y+.12,v.z,scene,12);const cap=ball(bridgeSnow,v.x,v.y+.34,v.z,.43);cap.scale.y=.18;}}
  }
  const bridgeMesh=new THREE.InstancedMesh(plankGeo,deckMaterial,planks.length),dummy=new THREE.Object3D();planks.forEach(({p,yaw,tilt},i)=>{dummy.position.copy(p);dummy.position.y-=.065;dummy.rotation.set(0,yaw,0);dummy.rotateX(-tilt);dummy.updateMatrix();bridgeMesh.setMatrixAt(i,dummy.matrix);bridgeMesh.setColorAt(i,new THREE.Color().setScalar(.94+(i%7)*.008));});bridgeMesh.receiveShadow=true;scene.add(bridgeMesh);
  function groupAt(i,x=0,z=0){const g=new THREE.Group();g.position.set(i.x+x,0,i.z+z);scene.add(g);return g;}
  function ringFloor(parent,r,mat){cylinder(r,r+.2,.22,mat,0,.1,0,parent,64);const ring=torus(r-.1,.04,gold,0,.23,0,parent);ring.rotation.x=-Math.PI/2;}
  const canopyGeo=new THREE.SphereGeometry(1,32,24),cp=canopyGeo.attributes.position;
  for(let i=0;i<cp.count;i++){const x=cp.getX(i),y=cp.getY(i),z=cp.getZ(i),r=1+.065*Math.sin(x*4+y*3)*Math.cos(z*4)+.025*Math.sin(y*8+z*3);cp.setXYZ(i,x*r,y*r,z*r);}canopyGeo.computeVertexNormals();
  const winterCapGeo=new THREE.SphereGeometry(1,12,8);
  function boughGeometry(frost=false){const positions=[],uv=[],indices=[],steps=16;for(let i=0;i<=steps;i++){const t=i/steps,u=frost?.12+t*.83:t,w=Math.sin(u*Math.PI)*.24*(1-u*.45)*(i%2?.83:1),y=.08*Math.sin(u*Math.PI)-u*u*.1;for(let j=0;j<4;j++){const lateral=(j===0?-w:j===2?w:0)*(frost?.68:1);positions.push(u,y+(j===1?.05*(1-u):j===3?-.025:0)+(frost?.022:0),lateral);uv.push(t,j/3);}if(i<steps)for(let j=0;j<(frost?2:4);j++){const a=i*4+j,b=i*4+(j+1)%4;indices.push(a,b,a+4,b,b+4,a+4);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;}
  const firBough=boughGeometry(),firFrost=boughGeometry(true),treeIllumination=createTreeAtmosphere(scene,{brightness:1.4});
  const firFoliage=M('#386c5d',.9,.02),firSnow=bridgeSnow,firGold=gold;
  firFoliage.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vNeedlePosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvNeedlePosition=position;');shader.fragmentShader='varying vec3 vNeedlePosition;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=.86+.22*sin(vNeedlePosition.x*13.+vNeedlePosition.y*7.+vNeedlePosition.z*11.);');};firFoliage.customProgramCacheKey=()=> 'winter-fir-needle-shading-v27';
  function lightTree(g,height){g.updateWorldMatrix(true,false);const p=g.getWorldPosition(new THREE.Vector3());treeIllumination.addTree({x:p.x,y:p.y,z:p.z,height});}
  function tree(parent,x,z,height,color){
    if(color!=='#77a28b'){
      const g=new THREE.Group();g.name='illuminated-snow-fir';g.position.set(x,0,z);parent.add(g);cylinder(.055,.14,height*.94,bark,0,height*.47,0,g,12);
      for(let tier=0;tier<11;tier++){
       const t=tier/10,y=height*(.19+t*.73),r=height*.3*(1-t*.92);
       for(let branch=0;branch<9;branch++){
        const a=branch*Math.PI*2/9+tier*2.399,reach=r*(.87+.13*Math.sin(branch*3+tier)**2),mat=firFoliage;
        rod([0,y-.045,0],[Math.cos(a)*reach*.83,y-reach*.07,Math.sin(a)*reach*.83],.012,bark,g);
        for(const [geometry,finish]of [[firBough,mat],[firFrost,firSnow]]){const leaf=mesh(geometry,finish,0,y,0,g);leaf.scale.set(reach,reach,reach*.72);leaf.rotation.y=-a;}
        for(const side of [-1,1])for(const row of [0,1]){const u=.28+row*.27,l=reach*(.5-row*.13),leaf=mesh(firBough,mat,Math.cos(a)*reach*u,y+reach*.02,Math.sin(a)*reach*u,g);leaf.scale.setScalar(l);leaf.rotation.y=-a+side*.68;}
        if((tier*9+branch)%8===0&&tier<8){const px=Math.cos(a)*reach*.83,pz=Math.sin(a)*reach*.83;rod([px,y-reach*.07,pz],[px,y-reach*.07-.14,pz],.005,firGold,g);const jewel=mesh(new THREE.OctahedronGeometry(.065,0),firGold,px,y-reach*.07-.18,pz,g);jewel.scale.y=1.5;}
       }
      }
      lightTree(g,height);return g;
    }

    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=(x>0?-.6:.35)+(z>0?.25:-.2);parent.add(g);const trunk=[new THREE.Vector3(0,0,0),new THREE.Vector3(-.1,height*.36,.03),new THREE.Vector3(.12,height*.72,0)];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trunk),18,.13,9,false),bark,0,0,0,g);
    for(const [dx,dy,dz,scale] of [[-.52,.68,.06,1],[.46,.86,-.12,.84],[.39,.59,.51,.64]]){const points=[new THREE.Vector3(0,height*.32,0),new THREE.Vector3(dx*.8,height*dy*.85,dz*.8),new THREE.Vector3(dx,height*dy,dz)];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,.065,7,false),bark,0,0,0,g);const crown=mesh(canopyGeo,M(color,.96,0),dx,height*dy,dz,g);crown.scale.set(height*.33*scale,height*.23*scale,height*.3*scale);crown.rotation.set(rand()*.25,rand()*2,rand()*.2);
    for(let i=0;i<5;i++){const a=i*2.4+rand()*.5,lobe=mesh(canopyGeo,M(color,.96,0),dx+Math.cos(a)*height*.17*scale,height*dy+(rand()-.4)*height*.18,dz+Math.sin(a)*height*.16*scale,g);lobe.scale.set(height*.16*scale,height*.14*scale,height*.16*scale);}}
    return g;
  }
  const museum=buildMuseumLandmark(scene);
  const strings=[];
  // The old clock, gear wheels and decorative boats are intentionally removed.
  // Designed promenades and planted borders replace random grass and pebble rings.
  const soil=M('#2a3938',1),bedStone=M('#606771',.8);
  const promenade=createSnowPaths({root:scene,stone:[M('#a3adae',1,0),M('#adb6b4',1,0),M('#a7afac',1,0)],snow:bridgeSnow,heightAt:surfaceHeight,contains:(x,z)=>landforms.some(form=>landDistance(x,z,form)<-.25),deferBuild:true});
  // Keep the original blurred snow-path material; only connect its authored routes.
  for(const route of pathRoutes)promenade(route.points,route.width);

  promenade.flush();
  function planter(parent,x,z,rx,rz,color){const base=cylinder(1,1.03,.19,bedStone,x,.1,z,parent,40);base.scale.set(rx,1,rz);const inside=cylinder(.91,.91,.035,soil,x,.21,z,parent,40);inside.scale.set(rx,1,rz);const bloom=M(color,.92,0),foliage=M('#4b6d64',.98,0);for(const [dx,dz,scale] of [[-.38,.08,.48],[.16,-.24,.6],[.45,.26,.35]]){const bush=mesh(canopyGeo,foliage,x+dx*rx,.37,z+dz*rz,parent);bush.scale.set(rx*scale,.26,rz*scale);}for(const [dx,dz,h] of [[-.43,-.15,.65],[-.12,.34,.61],[.23,-.39,.71],[.54,.12,.62],[.02,-.01,.78]]){const fx=x+dx*rx,fz=z+dz*rz;rod([fx,.22,fz],[fx,h,fz],.014,foliage,parent);for(let j=0;j<5;j++){const a=j*Math.PI*2/5,petal=ball(bloom,fx+Math.cos(a)*.075,h,fz+Math.sin(a)*.075,.069,parent);petal.scale.set(1,.45,.9);}ball(ivory,fx,h+.025,fz,.038,parent);}}
  // Soft environmental reflections on brass and glass; no external texture downloads.
  const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;const ctx=envCanvas.getContext('2d'),grad=ctx.createLinearGradient(0,0,0,256);grad.addColorStop(0,'#293754');grad.addColorStop(.45,'#a7b8cd');grad.addColorStop(.52,'#677e9b');grad.addColorStop(1,'#172b30');ctx.fillStyle=grad;ctx.fillRect(0,0,512,256);const env=new THREE.CanvasTexture(envCanvas);env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;scene.environment=env;scene.environmentIntensity=.35;
  return {grain,tree,planter,strings,setQuality(q){treeIllumination.setQuality(q);museum.setQuality(q);},dynamic:[museum.root,treeIllumination.root,...rotations.map(r=>r.g),...(aurora.dynamic||[])],update(t){museum.update(t);treeIllumination.update(t);for(const {g,s,balance} of rotations){if(balance)g.rotation.z=Math.sin(t*.4)*.06;else g.rotation.z=t*s;}aurora.update(t);}};
}
