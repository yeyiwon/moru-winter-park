import * as THREE from './vendor/three.module.js';
import {islands,bridges,bridgeHeight} from './world-layout.js';

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
  for(const island of islands.slice(1))terrain(island);
  // Narrow sky bridges have detailed timber, warm edge lights and brass railings.
  // Six arched promenades: continuous wood deck, stone edge, curved brass rail.
  const deckMaterial=M('#687987',.85),edgeMaterial=M('#9baab4',.88),plankGeo=new THREE.BoxGeometry(4.2,.18,.51),planks=[];
  for(const [a,b] of bridges){const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len,start=a.r-1,end=len-b.r+1;
   const at=(d,side=0)=>new THREE.Vector3(a.x+ux*d+uz*side,bridgeHeight(a.x+ux*d,a.z+uz*d),a.z+uz*d-ux*side);
   for(let d=start;d<end;d+=.54){const p=at(d);planks.push({p,yaw:Math.atan2(ux,uz),tilt:Math.cos((d-start)/(end-start)*Math.PI)*1.35*Math.PI/(end-start)});}
   for(const side of [-1,1]){const rail=[],edge=[];for(let j=0;j<=40;j++){const p=at(start+(end-start)*j/40,side*2.2);edge.push(p.clone());rail.push(p.clone().add(new THREE.Vector3(0,.95,0)));}
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge),48,.12,8,false),edgeMaterial);mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rail),48,.045,7,false),gold);
    for(let d=start;d<=end;d+=2.1){const p=at(d,side*2.2);rod(p.toArray(),p.clone().add(new THREE.Vector3(0,.95,0)).toArray(),.045,gold);ball(M('#e6eceb',.98),p.x,p.y+.99,p.z,.105);if(Math.floor((d-start)/2.1)%3===0)halo(p.x,p.y+1.1,p.z,'#e3cda8',.7);}
    const support=edge.map(p=>p.clone().add(new THREE.Vector3(0,-.45,0)));mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(support),48,.16,8,false),deckMaterial);
   }
  }
  const bridgeMesh=new THREE.InstancedMesh(plankGeo,deckMaterial,planks.length),dummy=new THREE.Object3D();planks.forEach(({p,yaw,tilt},i)=>{dummy.position.copy(p);dummy.position.y-=.02;dummy.rotation.set(0,yaw,0);dummy.rotateX(-tilt);dummy.updateMatrix();bridgeMesh.setMatrixAt(i,dummy.matrix)});bridgeMesh.receiveShadow=true;scene.add(bridgeMesh);
  function groupAt(i,x=0,z=0){const g=new THREE.Group();g.position.set(i.x+x,0,i.z+z);scene.add(g);return g;}
  function ringFloor(parent,r,mat){cylinder(r,r+.2,.22,mat,0,.1,0,parent,64);const ring=torus(r-.1,.04,gold,0,.23,0,parent);ring.rotation.x=-Math.PI/2;}
  function arch(parent,x,z,h,w,color){
    const pts=[new THREE.Vector3(x-w,0,z),new THREE.Vector3(x-w,h*.65,z),new THREE.Vector3(x,h,z),new THREE.Vector3(x+w,h*.65,z),new THREE.Vector3(x+w,0,z)];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),48,.1,8,false),gold,0,0,0,parent);
    const shape=new THREE.Shape();shape.moveTo(-w,0);shape.lineTo(w,0);shape.lineTo(w,h*.6);shape.quadraticCurveTo(w,h,0,h);shape.quadraticCurveTo(-w,h,-w,h*.6);shape.closePath();
    const mirror=new THREE.MeshPhysicalMaterial({color,metalness:.85,roughness:.08,transparent:true,opacity:.7,side:THREE.DoubleSide,clearcoat:1});mesh(new THREE.ShapeGeometry(shape,36),mirror,x,.1,z,parent);halo(x,h*.5,z+.15,color,h*1.5,parent);
  }
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
  // Mirror forest: freestanding silver portals and a grove with individual branches.
  const forest=groupAt(islands[3]);for(let j=0;j<5;j++){const a=j/5*Math.PI*2,g=new THREE.Group();g.position.set(Math.cos(a)*7,0,Math.sin(a)*7);g.rotation.y=-a+Math.PI/2;forest.add(g);arch(g,0,0,4+rand(),1.2,'#b1abed');}
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
  // Open-air music theatre: a giant lyre and a sweeping ivory keyboard.
  const theatre=groupAt(islands[5],0,-2);ringFloor(theatre,6,M('#594e66'));ringFloor(theatre,4.7,M('#8d788b'));
  const lyrePts=[new THREE.Vector3(-3,7,0),new THREE.Vector3(-3.3,3,0),new THREE.Vector3(0,1,0),new THREE.Vector3(3.3,3,0),new THREE.Vector3(3,7,0)];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lyrePts),64,.18,12,false),gold,0,0,0,theatre);rod([-3,6.5,0],[3,6.5,0],.14,gold,theatre);const strings=[];for(let j=-5;j<=5;j++){const string=rod([j*.43,2+Math.abs(j)*.1,0],[j*.43,6.5,0],.025,gold,theatre);string.userData.action='sound';strings.push(string);}
  for(let j=0;j<17;j++){const a=-.9+j*.112,g=new THREE.Group();g.position.set(Math.sin(a)*8,.1,Math.cos(a)*8-1);g.rotation.y=a;theatre.add(g);box(.75,.15,1.8,ivory,0,0,0,g);if(j%7!==2&&j%7!==6)box(.3,.25,.85,dark,.39,.12,-.45,g);}
  for(let j=0;j<5;j++){const note=new THREE.Group();note.position.set(-4+j*2,7+Math.sin(j)*1.5,1);theatre.add(note);ball(gold,0,0,0,.18,note).scale.y=.65;rod([.15,0,0],[.15,.9,0],.035,gold,note);rotations.push({g:note,s:.12});}
  // Clock harbour: a clock face, layered brass gears and moored paper sails.
  const harbour=groupAt(islands[6],1,-2);ringFloor(harbour,4,ivory);box(3.7,5,2.8,M('#6f7280'),0,2.6,0,harbour);cylinder(0,3.4,2.8,M('#587484'),0,7,0,harbour,4).rotation.y=Math.PI/4;
  const face=cylinder(1.55,1.55,.14,M('#e1d6b2'),0,4.7,1.5,harbour,64);face.rotation.x=Math.PI/2;torus(1.6,.1,gold,0,4.7,1.62,harbour);
  for(let j=0;j<12;j++){const a=j/12*Math.PI*2;const tick=box(.06,.2,.03,gold,Math.sin(a)*1.3,4.7+Math.cos(a)*1.3,1.64,harbour);tick.rotation.z=-a;}rod([0,4.7,1.7],[.7,5.1,1.7],.045,dark,harbour);rod([0,4.7,1.71],[-.25,5.8,1.71],.03,dark,harbour);
  for(let j=0;j<3;j++){const gear=new THREE.Group();gear.position.set(-4+j*4,3+j*.8,-1);harbour.add(gear);torus(1.1,.13,gold,0,0,0,gear);for(let k=0;k<16;k++){const a=k/16*Math.PI*2;const cog=box(.2,.25,.2,gold,Math.cos(a)*1.2,Math.sin(a)*1.2,0,gear);cog.rotation.z=a-Math.PI/2;}for(let k=0;k<6;k++){const a=k/6*Math.PI*2;rod([0,0,0],[Math.cos(a),Math.sin(a),0],.04,gold,gear);}rotations.push({g:gear,s:(j%2?-1:1)*.1});}
  for(const side of [-1,1]){const boat=new THREE.Group();boat.position.set(side*8,.5,4);harbour.add(boat);const hull=ball(M('#9f8190'),0,0,0,1.1,boat);hull.scale.set(1.6,.3,.6);rod([0,0,0],[0,3.2,0],.05,gold,boat);const sail=new THREE.Shape();sail.moveTo(0,.5);sail.lineTo(0,3);sail.lineTo(1.4,.7);sail.closePath();mesh(new THREE.ShapeGeometry(sail),new THREE.MeshStandardMaterial({color:'#e3d1bb',side:THREE.DoubleSide}),0,0,0,boat);}
  // Designed promenades and planted borders replace random grass and pebble rings.
  const pathMat=M('#c4b9ba',.9),pathEdge=M('#b8a68b',.54,.2),soil=M('#2a3938',1),bedStone=M('#606771',.8);
  function promenade(points,width=2.7){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],.055,p[1]))),position=[],uv=[],index=[],left=[],right=[];const steps=64;for(let i=0;i<=steps;i++){const t=i/steps,p=curve.getPoint(t),d=curve.getTangent(t),n=new THREE.Vector3(-d.z,0,d.x).normalize().multiplyScalar(width/2);position.push(p.x+n.x,p.y,p.z+n.z,p.x-n.x,p.y,p.z-n.z);uv.push(0,t*12,1,t*12);left.push(p.clone().add(n));right.push(p.clone().sub(n));if(i<steps){const v=i*2;index.push(v,v+2,v+1,v+1,v+2,v+3);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(position,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();mesh(geo,pathMat);for(const points of [left,right])mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,.035,5,false),pathEdge);}
  function planter(parent,x,z,rx,rz,color){const base=cylinder(1,1.03,.19,bedStone,x,.1,z,parent,40);base.scale.set(rx,1,rz);const inside=cylinder(.91,.91,.035,soil,x,.21,z,parent,40);inside.scale.set(rx,1,rz);const bloom=M(color,.92,0),foliage=M('#4b6d64',.98,0);for(const [dx,dz,scale] of [[-.38,.08,.48],[.16,-.24,.6],[.45,.26,.35]]){const bush=mesh(canopyGeo,foliage,x+dx*rx,.37,z+dz*rz,parent);bush.scale.set(rx*scale,.26,rz*scale);}for(const [dx,dz,h] of [[-.43,-.15,.65],[-.12,.34,.61],[.23,-.39,.71],[.54,.12,.62],[.02,-.01,.78]]){const fx=x+dx*rx,fz=z+dz*rz;rod([fx,.22,fz],[fx,h,fz],.014,foliage,parent);for(let j=0;j<5;j++){const a=j*Math.PI*2/5,petal=ball(bloom,fx+Math.cos(a)*.075,h,fz+Math.sin(a)*.075,.069,parent);petal.scale.set(1,.45,.9);}ball(ivory,fx,h+.025,fz,.038,parent);}}
  for(const [x,z] of [[-3.7,-2.8],[3.7,-2.8],[-3.8,2.7],[3.8,2.7]])planter(garden,x,z,.85,1.05,'#d0b6d1');
  const pathSpecs={
    science:[[[0,15],[0,10],[-5,7],[-6,4],[-5,-1]],[[0,10],[5,8],[8,3],[7,-3]]],
    law:[[[-13,8],[-8,7],[-6,3],[-4,1]],[[13,8],[8,7],[6,5],[5,1]]],
    philosophy:[[[-13,-8],[-7,-5],[-2,-3],[2,0],[5,5],[13,8]]],
    nature:[[[0,-16],[0,-11],[-5,-8],[-7,-3],[-7,4],[0,10]],[[0,-11],[5,-8],[7,-2],[7,5],[0,10]]],
    art:[[[13,-8],[9,-4],[8,2],[4,6],[0,8],[-6,5],[-13,-8]]],
    history:[[[13,8],[8,6],[6,3],[5,0]],[[5,3],[0,6],[-6,5],[-10,0],[-13,-8]]]
  };
  for(const island of islands.slice(1)){
    const g=groupAt(island);for(const route of pathSpecs[island.id])promenade(route.map(([x,z])=>[island.x+x,island.z+z]));
    const positions={science:[[-10,-6,2,1.2]],law:[[-8,-5,1.4,2.2],[8,-5,1.7,1.3]],philosophy:[[-9,-4,1.5,2],[9,5,1.8,1.2]],nature:[[-10,-6,1.7,2.6],[9,7,2.2,1.5],[9,-5,1.3,2]],art:[[-10,-4,1.6,1.1],[10,3,1.5,1]],history:[[-10,-6,1.8,1.1],[10,4,1.4,2]]}[island.id];
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
  const seatMat=M('#83717f',.76),stageStone=M('#706a7e',.8);
  for(let level=0;level<3;level++){const r=7.2+level*.95,angleStart=.2,angleLength=Math.PI-.4;const terrace=mesh(new THREE.TorusGeometry(r,.28,8,80,angleLength),stageStone,0,.25+level*.28,0,theatre);terrace.rotation.x=Math.PI/2;terrace.rotation.z=angleStart;for(let j=0;j<13;j++){const a=angleStart+(j+.5)/13*angleLength,seat=box(.85,.12,.65,seatMat,Math.cos(a)*r,.6+level*.28,Math.sin(a)*r,theatre);seat.rotation.y=-a;}}
  const pedimentShape=new THREE.Shape();pedimentShape.moveTo(-5.4,0);pedimentShape.lineTo(0,2.3);pedimentShape.lineTo(5.4,0);pedimentShape.closePath();mesh(new THREE.ExtrudeGeometry(pedimentShape,{depth:.28,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:2}),ivory,0,5.3,2,archive);
  for(let j=-2;j<=2;j++)box(.07,4.2,.05,gold,j*.65,2.8,-2.8,archive);
  for(const side of [-1,1]){for(let level=0;level<4;level++)box(1.3,.08,.5,gold,side*1.8,.8+level*.9,-2.9,archive);}
  // Soft environmental reflections on brass and glass; no external texture downloads.
  const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;const ctx=envCanvas.getContext('2d'),grad=ctx.createLinearGradient(0,0,0,256);grad.addColorStop(0,'#293754');grad.addColorStop(.45,'#a7b8cd');grad.addColorStop(.52,'#677e9b');grad.addColorStop(1,'#172b30');ctx.fillStyle=grad;ctx.fillRect(0,0,512,256);const env=new THREE.CanvasTexture(envCanvas);env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;scene.environment=env;scene.environmentIntensity=.35;
  return {grain,tree,planter,strings,dynamic:rotations.map(r=>r.g),update(t){for(const {g,s,balance} of rotations){if(balance)g.rotation.z=Math.sin(t*.4)*.06;else g.rotation.z=t*s;}for(const u of waterfalls)u.time.value=t;}};
}
