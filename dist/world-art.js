import {createSnowPaths} from './snow-path.js';
import {findPath,clearSegment} from './navigation.js';
import * as THREE from './vendor/three.module.js';
import {islands,bridges,bridgeHeight,exhibits,surfaceHeight} from './world-layout.js';

export function buildArchipelago(api){
  const {scene,mesh,ball,cylinder,box,rod,torus,halo,M,glowMap}=api;
  let seed=619;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const gold=M('#c9ab76',.28,.72),ivory=M('#b6bac4',.62,.1),bark=M('#36454b'),green=M('#315d57'),dark=M('#283743');
  const rotations=[],waterfalls=[];
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
  for(const island of islands.slice(1,7))terrain(island);
  // Warm timber footbridges: a continuous deck, substantial rails and snowy landing stones.
  const deckMaterial=M('#95765e',.95,0),edgeMaterial=M('#655345',.96,0),bridgeSnow=M('#e2e9e6',1,0),jointMat=M('#7b8586',1,0),plankGeo=new THREE.BoxGeometry(4.2,.13,.36),planks=[];
  for(const [a,b] of bridges){const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len,start=a.r-1,end=len-b.r+1;
   const at=(d,side=0)=>new THREE.Vector3(a.x+ux*d+uz*side,bridgeHeight(a.x+ux*d,a.z+uz*d),a.z+uz*d-ux*side);
   const yaw=Math.atan2(ux,uz);
   for(let d=start;d<end;d+=.375){const p=at(d);planks.push({p,yaw,tilt:Math.cos((d-start)/(end-start)*Math.PI)*.35*Math.PI/(end-start)});
    if(Math.floor((d-start)/.375)%3===0)for(const side of [-1,1]){const nail=at(d,side*1.8);cylinder(.027,.027,.012,dark,nail.x,nail.y+.075,nail.z,scene,6);}
   }
   for(const side of [-1,1]){
    const count=Math.max(2,Math.ceil((end-start)/1.8));
    for(let j=0;j<=count;j++){const d=start+(end-start)*j/count,p=at(d,side*2.12),post=box(.16,1.05,.16,edgeMaterial,p.x,p.y+.55,p.z);post.rotation.y=yaw;
     const cap=box(.24,.06,.25,bridgeSnow,p.x,p.y+1.11,p.z);cap.rotation.y=yaw;
     if(j<count){const q=at(start+(end-start)*(j+1)/count,side*2.12),mid=p.clone().add(q).multiplyScalar(.5),l=p.distanceTo(q),tilt=Math.atan2(q.y-p.y,Math.hypot(q.x-p.x,q.z-p.z));
      for(const h of [.35,.99]){const rail=box(.12,.12,l+.03,edgeMaterial,mid.x,mid.y+h,mid.z);rail.rotation.set(-tilt,yaw,0);}
      const frost=box(.13,.035,l+.03,bridgeSnow,mid.x,mid.y+1.065,mid.z);frost.rotation.set(-tilt,yaw,0);
      for(const k of [-1,1]){const v=mid.clone().addScaledVector(q.clone().sub(p),k*.24);const baluster=box(.06,.58,.06,edgeMaterial,v.x,v.y+.66,v.z);baluster.rotation.y=yaw;}
     }
    }
    const under=[];for(let j=0;j<=32;j++){const p=at(start+(end-start)*j/32,side*1.65);p.y-=.25;under.push(p);}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(under),32,.13,6,false),edgeMaterial);
   }
   // The abutment is flush with the snow; the bridge never starts with a floating step.
   for(const d of [start,end]){const p=at(d),stone=box(4.8,.08,1.05,ivory,p.x,p.y-.025,p.z);stone.rotation.y=yaw;for(const side of [-1,1]){const v=at(d,side*2.45);const cap=box(.62,.14,.85,bridgeSnow,v.x,v.y+.08,v.z);cap.rotation.y=yaw;}}
  }
  const bridgeMesh=new THREE.InstancedMesh(plankGeo,deckMaterial,planks.length),dummy=new THREE.Object3D();planks.forEach(({p,yaw,tilt},i)=>{dummy.position.copy(p);dummy.position.y-=.005;dummy.rotation.set(0,yaw,0);dummy.rotateX(-tilt);dummy.updateMatrix();bridgeMesh.setMatrixAt(i,dummy.matrix);bridgeMesh.setColorAt(i,new THREE.Color().setScalar(.9+(i%7)*.016));});bridgeMesh.receiveShadow=true;scene.add(bridgeMesh);
  function groupAt(i,x=0,z=0){const g=new THREE.Group();g.position.set(i.x+x,0,i.z+z);scene.add(g);return g;}
  function ringFloor(parent,r,mat){cylinder(r,r+.2,.22,mat,0,.1,0,parent,64);const ring=torus(r-.1,.04,gold,0,.23,0,parent);ring.rotation.x=-Math.PI/2;}
  const canopyGeo=new THREE.SphereGeometry(1,32,24),cp=canopyGeo.attributes.position;
  for(let i=0;i<cp.count;i++){const x=cp.getX(i),y=cp.getY(i),z=cp.getZ(i),r=1+.065*Math.sin(x*4+y*3)*Math.cos(z*4)+.025*Math.sin(y*8+z*3);cp.setXYZ(i,x*r,y*r,z*r);}canopyGeo.computeVertexNormals();
  const winterCapGeo=new THREE.SphereGeometry(1,12,8);
  function tree(parent,x,z,height,color){
    if(color!=='#77a28b'){
      const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);const green=M('#355953',.98,0),snow=M('#e2e9e6',1,0);cylinder(.07,.14,height*.85,bark,0,height*.425,0,g,10);
      for(let tier=0;tier<6;tier++){const y=height*(.24+tier*.12),r=height*(.29-tier*.038);const crown=cylinder(.015,r,height*.32,green,0,y,0,g,16);crown.rotation.y=tier*.6;
        for(let branch=0;branch<5;branch++){const a=branch*Math.PI*2/5+tier*.8,reach=r*.7;rod([0,y-.07,0],[Math.cos(a)*reach,y-.13,Math.sin(a)*reach],.024,bark,g);const cap=mesh(winterCapGeo,snow,Math.cos(a)*reach*.75,y+.015,Math.sin(a)*reach*.75,g);cap.scale.set(r*.43,height*.038,r*.28);cap.rotation.y=-a;}}
      return g;
    }

    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=(x>0?-.6:.35)+(z>0?.25:-.2);parent.add(g);const trunk=[new THREE.Vector3(0,0,0),new THREE.Vector3(-.1,height*.36,.03),new THREE.Vector3(.12,height*.72,0)];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trunk),18,.13,9,false),bark,0,0,0,g);
    for(const [dx,dy,dz,scale] of [[-.52,.68,.06,1],[.46,.86,-.12,.84],[.39,.59,.51,.64]]){const points=[new THREE.Vector3(0,height*.32,0),new THREE.Vector3(dx*.8,height*dy*.85,dz*.8),new THREE.Vector3(dx,height*dy,dz)];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,.065,7,false),bark,0,0,0,g);const crown=mesh(canopyGeo,M(color,.96,0),dx,height*dy,dz,g);crown.scale.set(height*.33*scale,height*.23*scale,height*.3*scale);crown.rotation.set(rand()*.25,rand()*2,rand()*.2);
    for(let i=0;i<5;i++){const a=i*2.4+rand()*.5,lobe=mesh(canopyGeo,M(color,.96,0),dx+Math.cos(a)*height*.17*scale,height*dy+(rand()-.4)*height*.18,dz+Math.sin(a)*height*.16*scale,g);lobe.scale.set(height*.16*scale,height*.14*scale,height*.16*scale);}}
    return g;
  }
  // Glass observatory: an armillary sphere, optical telescope and etched dome ribs.
  const observatory=groupAt(islands[1],0,-3);ringFloor(observatory,4.6,ivory);cylinder(4,4.1,1.7,dark,0,1,0,observatory,64);
  const glass=new THREE.MeshPhysicalMaterial({color:'#87d2e7',metalness:.15,roughness:.1,transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false,clearcoat:1});
  mesh(new THREE.SphereGeometry(4.1,48,24,0,Math.PI*2,0,Math.PI/2),glass,0,1.85,0,observatory);
  for(let j=0;j<12;j++){const a=j/12*Math.PI*2,pts=[];for(let k=0;k<=24;k++){const t=k/24*Math.PI/2;pts.push(new THREE.Vector3(Math.cos(a)*Math.cos(t)*4.12,1.85+Math.sin(t)*4.12,Math.sin(a)*Math.cos(t)*4.12));}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.035,5,false),gold,0,0,0,observatory);}
  cylinder(.18,.4,3,gold,0,2,0,observatory);const telescope=new THREE.Group();telescope.position.set(0,3.4,0);telescope.rotation.z=-.65;observatory.add(telescope);cylinder(.45,.6,3,ivory,0,0,0,telescope);cylinder(.61,.61,.18,gold,0,-1.5,0,telescope);cylinder(.39,.39,.06,new THREE.MeshBasicMaterial({color:'#8de0ee'}),0,1.52,0,telescope);
  const armillary=groupAt(islands[1],-8,2);cylinder(.3,.9,1.5,ivory,0,.75,0,armillary);for(let j=0;j<3;j++){const ring=torus(1.6,.055,gold,0,2.8,0,armillary);ring.rotation.set(j*.6,j*.8,.4);rotations.push({g:ring,s:.08+j*.04});}ball(new THREE.MeshBasicMaterial({color:'#c4ecff'}),0,2.8,0,.24,armillary);halo(0,2.8,0,'#80cae9',4,armillary);
  // The archive: a floating balance over a colonnade, shelves and copper-bound books.
  const archive=groupAt(islands[2],1,-3);ringFloor(archive,5.5,ivory);
  for(let j=0;j<9;j++){const a=j/8*Math.PI,x=Math.cos(a)*4.5,z=-Math.sin(a)*3.3;cylinder(.2,.32,4.8,ivory,x,2.5,z,archive,20);cylinder(.42,.42,.18,gold,x,4.9,z,archive);}
  const roof=cylinder(5.5,5.7,.3,ivory,0,5.2,-.8,archive,6);roof.rotation.y=Math.PI/6;
  rod([0,5.4,-.7],[0,9,-.7],.09,gold,archive);const balance=new THREE.Group();balance.position.set(0,8.7,-.7);archive.add(balance);rod([-3,0,0],[3,0,0],.08,gold,balance);rotations.push({g:balance,s:0,balance:true});
  for(const side of [-1,1]){for(const dz of [-.55,.55])rod([side*2.7,0,0],[side*2.7,-1.65,dz],.02,gold,balance);const bowl=mesh(new THREE.SphereGeometry(.82,24,12,0,Math.PI*2,Math.PI/2,Math.PI/2),gold,side*2.7,-1.6,0,balance);bowl.scale.y=.3;}
  for(let side of [-1,1])for(let shelf=0;shelf<3;shelf++){box(2.5,.1,.6,gold,side*3,shelf*.85+.6,-2,archive);for(let j=0;j<9;j++){const book=box(.16,.45+rand()*.2,.43,M(['#8f829a','#547f83','#b49679'][j%3]),side*3-1+j*.25,shelf*.85+.95,-2,archive);book.rotation.z=(rand()-.5)*.15;}}
  // A quiet snowy grove keeps the skyline open after removing the mirror portals.
  const forest=groupAt(islands[3]);
  for(const [x,z,h] of [[-5,-5,7],[5,-6,6],[8,3,5],[-7,4,6]])tree(forest,x,z,h,'#6b668f');
  // A glazed conservatory around a reflecting pool, with room to walk outside.
  const garden=groupAt(islands[4],0,0);ringFloor(garden,4.7,green);
  for(let j=0;j<4;j++){const a=j/4*Math.PI+Math.PI/8,pts=[];for(let k=0;k<=24;k++){const t=k/24*Math.PI;pts.push(new THREE.Vector3(Math.cos(t)*4.7*Math.cos(a),Math.sin(t)*6,Math.cos(t)*4.7*Math.sin(a)));}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),32,.045,6,false),gold,0,0,0,garden);}
  const poolMaterial=new THREE.MeshPhysicalMaterial({color:'#407c7e',metalness:.35,roughness:.12,clearcoat:1});
  cylinder(2.6,2.6,.1,poolMaterial,0,.3,0,garden,64);
  cylinder(1.3,1.5,.5,ivory,0,.4,0,garden,48);
  cylinder(1.18,1.18,.04,green,0,.67,0,garden,48);
  const specimen=new THREE.Group();specimen.position.y=.68;garden.add(specimen);tree(specimen,0,0,4.7,'#77a28b');
  for(const radius of [1.7,2.1,2.45]){const ripple=torus(radius,.012,M('#8eb9b2',.3,.3),0,.36,0,garden);ripple.rotation.x=-Math.PI/2;}
  const orangeryGlass=new THREE.MeshPhysicalMaterial({color:'#c4e0d8',roughness:.08,metalness:.1,transparent:true,opacity:.17,side:THREE.DoubleSide,depthWrite:false,clearcoat:1});
  const domeTop=mesh(new THREE.SphereGeometry(4.7,48,20,0,Math.PI*2,0,1.08),orangeryGlass,0,.3,0,garden);domeTop.scale.y=1.28;for(let panel=0;panel<12;panel++){if([2,3,8,9].includes(panel))continue;const pane=mesh(new THREE.SphereGeometry(4.7,8,8,panel*Math.PI/6,Math.PI/6,1.08,Math.PI/2-1.08),orangeryGlass,0,.3,0,garden);pane.scale.y=1.28;}
  for(const side of [-1,1]){const seat=new THREE.Group();seat.position.set(side*10,0,.3);seat.rotation.y=-side*Math.PI/2;garden.add(seat);const wood=M('#8d7e76');for(let j=0;j<4;j++)box(2.6,.1,.15,wood,0,.65,-.26+j*.18,seat);for(let j=0;j<3;j++)box(2.6,.13,.08,wood,0,.94+j*.18,-.38,seat);for(const x of [-1,1]){rod([x,.05,-.3],[x,1.4,-.38],.05,gold,seat);rod([x,.05,.3],[x,.64,.3],.05,gold,seat);}}
  for(let j=0;j<3;j++){const u={time:{value:0}},mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:u,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float time;void main(){float s=pow(.5+.5*sin(vUv.x*70.+sin(vUv.y*15.+time*3.)),5.);float e=sin(vUv.x*3.14159)*smoothstep(0.,.25,vUv.y);gl_FragColor=vec4(.43,.78,.82,(.1+s*.2)*e);}'});mesh(new THREE.PlaneGeometry(2.3,11,1,16),mat,-3+j*3,-5.2,16,garden);waterfalls.push(u);}
  // A human-scale acoustic garden: timber canopy, slatted backdrop and a playable chime stand.
  const theatre=groupAt(islands[5],0,-2);theatre.name='acoustic-garden';
  const timber=deckMaterial,roofMat=edgeMaterial,linen=M('#e4d4b7',1,0),stageMat=M('#a8a69d',1,0),lampMat=new THREE.MeshBasicMaterial({color:'#f1cf91'});
  cylinder(6,6.15,.2,stageMat,0,.11,0,theatre,64);
  for(let j=-13;j<=13;j++){const z=j*.36,w=2*Math.sqrt(Math.max(0,35-z*z));box(w,.025,.34,timber,0,.225,z,theatre);}
  for(const x of [-4.5,4.5])for(const z of [-3,2.5]){box(.22,4.15,.22,roofMat,x,2.2,z,theatre);box(.4,.15,.4,stageMat,x,.3,z,theatre);}
  for(const z of [-3,2.5]){const arch=[];for(let i=0;i<=24;i++){const x=-4.8+i*.4;arch.push(new THREE.Vector3(x,4.2+1.25*Math.cos(x/4.8*Math.PI/2),z));}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arch),36,.11,8,false),roofMat,0,0,0,theatre);}
  const roofPositions=[],roofUV=[],roofIndex=[];for(let i=0;i<=32;i++){const x=-5+i*10/32,y=4.25+1.25*Math.cos(x/5*Math.PI/2);roofPositions.push(x,y,-3.5,x,y,3);roofUV.push(i/32,0,i/32,1);if(i<32){const k=i*2;roofIndex.push(k,k+2,k+1,k+1,k+2,k+3);}}
  const roofGeometry=new THREE.BufferGeometry();roofGeometry.setAttribute('position',new THREE.Float32BufferAttribute(roofPositions,3));roofGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(roofUV,2));roofGeometry.setIndex(roofIndex);roofGeometry.computeVertexNormals();const canopy=mesh(roofGeometry,linen,0,0,0,theatre);canopy.material.side=THREE.DoubleSide;
  for(let x=-4.5;x<=4.5;x+=.45){const y=4.25+1.25*Math.cos(x/5*Math.PI/2);rod([x,y+.03,-3.5],[x,y+.03,3],.025,bridgeSnow,theatre);}
  for(let i=0;i<31;i++){const x=-4.4+i*.29;box(.11,2.5,.16,timber,x,1.5,-3,theatre);}box(9.2,.12,.32,roofMat,0,2.8,-3,theatre);
  for(const x of [-3,0,3]){rod([x,4.7,-.4],[x,3.5,-.4],.015,dark,theatre);cylinder(.25,.4,.4,linen,x,3.35,-.4,theatre,24);ball(lampMat,x,3.13,-.4,.12,theatre);}
  const chime=new THREE.Group();chime.position.set(2,.24,-1.5);theatre.add(chime);for(const x of [-.8,.8])rod([x,0,0],[x,2.3,0],.045,roofMat,chime);rod([-.85,2.3,0],[.85,2.3,0],.05,roofMat,chime);const strings=[];
  for(let j=0;j<7;j++){const x=-.6+j*.2,h=.8+j*.11,string=cylinder(.045,.045,h,gold,x,2-h*.5,0,chime,12);rod([x,2.3,0],[x,2,0],.008,dark,chime);string.userData.action='sound';strings.push(string);}
  // Low benches frame the garden without blocking the front promenade or the nearby grand piano.
  for(const [x,z,angle]of [[-3.3,5.8,.2],[.6,6.6,0],[4.7,5.3,-.35]]){const bench=new THREE.Group();bench.position.set(x,0,z);bench.rotation.y=angle;theatre.add(bench);for(let j=0;j<4;j++)box(2.5,.09,.17,timber,0,.58,-.28+j*.18,bench);for(let j=0;j<3;j++)box(2.5,.14,.08,timber,0,.93+j*.17,-.36,bench);for(const side of [-1,1]){box(.1,.55,.6,roofMat,side*.95,.3,0,bench);box(.1,.9,.1,roofMat,side*.95,.85,-.34,bench);}box(2.55,.035,.2,bridgeSnow,0,1.34,-.36,bench);}
  // The old clock, gear wheels and decorative boats are intentionally removed.
  // Designed promenades and planted borders replace random grass and pebble rings.
  const soil=M('#2a3938',1),bedStone=M('#606771',.8);
  const promenade=createSnowPaths({root:scene,stone:[M('#a3adae',1,0),M('#adb6b4',1,0),M('#a7afac',1,0)],snow:bridgeSnow,heightAt:surfaceHeight});
  // Every branch reaches a bridge landing or a real front door. No decorative dead ends.
  const drawn=new Set();function connect(a,b){const route=findPath(a,b);if(!route.length)return;const key=[a.x,a.z,b.x,b.z].join('/');if(drawn.has(key))return;drawn.add(key);promenade([[a.x,a.z],...route.map(p=>[p.x,p.z])]);}
  for(const island of islands.slice(0,7)){
    const hub=island.spawn;for(const [a,b]of bridges){const other=a===island?b:b===island?a:null;if(!other)continue;const len=Math.hypot(other.x-island.x,other.z-island.z),r=island.r-1.1;connect(hub,{x:island.x+(other.x-island.x)/len*r,z:island.z+(other.z-island.z)/len*r});}
    for(const e of exhibits.filter(e=>e.island===island.id))connect(hub,e);
  }
  function planter(parent,x,z,rx,rz,color){const base=cylinder(1,1.03,.19,bedStone,x,.1,z,parent,40);base.scale.set(rx,1,rz);const inside=cylinder(.91,.91,.035,soil,x,.21,z,parent,40);inside.scale.set(rx,1,rz);const bloom=M(color,.92,0),foliage=M('#4b6d64',.98,0);for(const [dx,dz,scale] of [[-.38,.08,.48],[.16,-.24,.6],[.45,.26,.35]]){const bush=mesh(canopyGeo,foliage,x+dx*rx,.37,z+dz*rz,parent);bush.scale.set(rx*scale,.26,rz*scale);}for(const [dx,dz,h] of [[-.43,-.15,.65],[-.12,.34,.61],[.23,-.39,.71],[.54,.12,.62],[.02,-.01,.78]]){const fx=x+dx*rx,fz=z+dz*rz;rod([fx,.22,fz],[fx,h,fz],.014,foliage,parent);for(let j=0;j<5;j++){const a=j*Math.PI*2/5,petal=ball(bloom,fx+Math.cos(a)*.075,h,fz+Math.sin(a)*.075,.069,parent);petal.scale.set(1,.45,.9);}ball(ivory,fx,h+.025,fz,.038,parent);}}
  for(const [x,z] of [[-3.7,-2.8],[3.7,-2.8],[-3.8,2.7],[3.8,2.7]])planter(garden,x,z,.85,1.05,'#d0b6d1');
  for(const island of islands.slice(1,7)){
    const g=groupAt(island);
    const positions={science:[[-10,-6,2,1.2]],law:[[-8,-5,1.4,2.2],[8,-5,1.7,1.3]],philosophy:[[-9,-4,1.5,2],[9,5,1.8,1.2]],nature:[[-10,-6,1.7,2.6],[9,7,2.2,1.5],[9,-5,1.3,2]],art:[],history:[[-10,-6,1.8,1.1],[10,4,1.4,2]]}[island.id];
    for(const [x,z,rx,rz] of positions)planter(g,x,z,rx,rz,island.color);
    for(const [x,z] of (island.id==='nature'?[[-12,-2],[10,-8]]:island.id==='philosophy'?[]:[[-11,-7]]))tree(g,x,z,3.2,island.id==='nature'?'#619781':'#71788e');
    const lampMat=new THREE.MeshBasicMaterial({color:'#f4d5ab'});
    for(const [x,z] of (island.id==='science'?[[-5,8]]:island.id==='nature'?[[-5,-9],[6,6]]:island.id==='art'?[[8,3],[-7,4]]:[[-5,8],[8,2]])){cylinder(.055,.11,1.65,gold,x,.82,z,g,10);cylinder(.16,.19,.33,lampMat,x,1.8,z,g,8);cylinder(0,.25,.19,gold,x,2.06,z,g,8);halo(x,1.8,z,'#f8d6a8',1.6,g);}
  }
  // Observatory windows, concentric instrument markings and crystal clusters.
  const windowMaterial=new THREE.MeshBasicMaterial({color:'#9cc6da'});for(let j=0;j<18;j++){const a=j/18*Math.PI*2,x=Math.cos(a)*4.03,z=Math.sin(a)*4.03;const window=box(.4,.65,.035,windowMaterial,x,1,z,observatory);window.rotation.y=-a+Math.PI/2;}
  for(const radius of [4.3,4.65,5]){const stair=cylinder(radius,radius+.12,.12,ivory,0,.04+(5-radius)*.3,0,observatory);const rim=torus(radius,.025,gold,0,.14+(5-radius)*.3,0,observatory);rim.rotation.x=-Math.PI/2;}
  for(let j=0;j<12;j++){const a=j*2.4,x=Math.cos(a)*6.8,z=Math.sin(a)*6.8;if(z>2)continue;const crystal=cylinder(0,.16+rand()*.2,.8+rand()*1.1,M('#91bdcf',.18,.25),x,.65,z,observatory,6);crystal.rotation.z=(rand()-.5)*.3;}
  // Hanging seed lights and curled leaves make the greenhouse feel alive.
  for(let j=0;j<9;j++){const a=j/9*Math.PI*2,r=1.3+rand()*1.5,x=Math.cos(a)*r,z=Math.sin(a)*r,y=4.5+rand()*1.5,len=.8+rand()*1.8;const pts=[new THREE.Vector3(x*.5,6,z*.5),new THREE.Vector3(x,y+.5,z),new THREE.Vector3(x+.15,y-len,z)];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),16,.018,5,false),gold,0,0,0,garden);ball(new THREE.MeshBasicMaterial({color:'#d6f4a8'}),x+.15,y-len,z,.065,garden);halo(x+.15,y-len,z,'#c9ecad',.8,garden);}
  const pedimentShape=new THREE.Shape();pedimentShape.moveTo(-5.4,0);pedimentShape.lineTo(0,2.3);pedimentShape.lineTo(5.4,0);pedimentShape.closePath();mesh(new THREE.ExtrudeGeometry(pedimentShape,{depth:.28,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:2}),ivory,0,5.3,2,archive);
  for(let j=-2;j<=2;j++)box(.07,4.2,.05,gold,j*.65,2.8,-2.8,archive);
  for(const side of [-1,1]){for(let level=0;level<4;level++)box(1.3,.08,.5,gold,side*1.8,.8+level*.9,-2.9,archive);}
  // Soft environmental reflections on brass and glass; no external texture downloads.
  const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;const ctx=envCanvas.getContext('2d'),grad=ctx.createLinearGradient(0,0,0,256);grad.addColorStop(0,'#293754');grad.addColorStop(.45,'#a7b8cd');grad.addColorStop(.52,'#677e9b');grad.addColorStop(1,'#172b30');ctx.fillStyle=grad;ctx.fillRect(0,0,512,256);const env=new THREE.CanvasTexture(envCanvas);env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;scene.environment=env;scene.environmentIntensity=.35;
  return {grain,tree,planter,strings,dynamic:rotations.map(r=>r.g),update(t){for(const {g,s,balance} of rotations){if(balance)g.rotation.z=Math.sin(t*.4)*.06;else g.rotation.z=t*s;}for(const u of waterfalls)u.time.value=t;}};
}
