import * as THREE from './vendor/three.module.js';
import {islands,bridges} from './world-layout.js';

export function buildArchipelago(api){
  const {scene,mesh,ball,cylinder,box,rod,torus,halo,M,glowMap}=api;
  let seed=619;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const gold=M('#c9ab76',.28,.72),ivory=M('#b6bac4',.62,.1),bark=M('#36454b'),green=M('#315d57'),dark=M('#283743');
  const rotations=[],waterfalls=[];
  function noiseTexture(){const c=document.createElement('canvas');c.width=c.height=256;const cx=c.getContext('2d'),im=cx.createImageData(256,256);for(let i=0;i<im.data.length;i+=4){const v=175+rand()*55;im.data.set([v,v,v,255],i);}cx.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(12,12);return t;}
  const grain=noiseTexture();
  function terrain(island){
    const mat=M(island.id==='nature'?'#315b50':'#3e4655',.96);mat.map=grain;mat.bumpMap=grain;mat.bumpScale=.09;
    const top=cylinder(island.r,island.r-.3,.25,mat,island.x,-.15,island.z,scene,96);top.name='island-ground';
    const rockGeo=new THREE.CylinderGeometry(island.r-.2,island.r*.55,6,64,5);const p=rockGeo.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),v=1+.025*Math.sin(a*9+y*2)+.04*Math.sin(a*5-y);p.setXYZ(i,x*v,y,z*v);}rockGeo.computeVertexNormals();
    mesh(rockGeo,M('#303946',.95),island.x,-3.3,island.z);
    const rim=torus(island.r-.25,.035,new THREE.MeshBasicMaterial({color:island.color,transparent:true,opacity:.36}),island.x,-.15,island.z);rim.rotation.x=Math.PI/2;
    for(let j=0;j<8;j++){const a=rand()*Math.PI*2,r=island.r*.75,x=island.x+Math.cos(a)*r,z=island.z+Math.sin(a)*r;const stone=mesh(new THREE.IcosahedronGeometry(.7+rand(),1),M('#45515b'),x,-1.7-rand()*3,z);stone.scale.set(1,2,1);}
    for(let j=0;j<4;j++){const a=j*Math.PI/2+.6;const mist=halo(island.x+Math.cos(a)*island.r,-5,island.z+Math.sin(a)*island.r,island.color,22);mist.material.opacity=.075;}
  }
  for(const island of islands.slice(1))terrain(island);
  // Narrow sky bridges have detailed timber, warm edge lights and brass railings.
  const plankMaterial=M('#67616b',.88),plankGeo=new THREE.BoxGeometry(3.7,.16,.62),planks=[];
  for(const [a,b] of bridges){
    const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len,start=a.r-1,end=len-b.r+1;
    for(let d=start;d<end;d+=.69)planks.push({x:a.x+ux*d,z:a.z+uz*d,yaw:Math.atan2(ux,uz)});
    for(const side of [-1,1]){
      const x1=a.x+ux*start+uz*side*2,z1=a.z+uz*start-ux*side*2,x2=a.x+ux*end+uz*side*2,z2=a.z+uz*end-ux*side*2;
      rod([x1,.85,z1],[x2,.85,z2],.035,gold);rod([x1,.28,z1],[x2,.28,z2],.025,gold);
      for(let d=start;d<=end;d+=3){const x=a.x+ux*d+uz*side*2,z=a.z+uz*d-ux*side*2;rod([x,.05,z],[x,.96,z],.06,gold);ball(new THREE.MeshBasicMaterial({color:a.color}),x,1.01,z,.075);}
    }
  }
  const bridgeMesh=new THREE.InstancedMesh(plankGeo,plankMaterial,planks.length),dummy=new THREE.Object3D();planks.forEach((p,i)=>{dummy.position.set(p.x,.02,p.z);dummy.rotation.set(0,p.yaw,0);dummy.updateMatrix();bridgeMesh.setMatrixAt(i,dummy.matrix)});bridgeMesh.receiveShadow=true;scene.add(bridgeMesh);
  function groupAt(i,x=0,z=0){const g=new THREE.Group();g.position.set(i.x+x,0,i.z+z);scene.add(g);return g;}
  function ringFloor(parent,r,mat){cylinder(r,r+.2,.22,mat,0,.1,0,parent,64);const ring=torus(r-.1,.04,gold,0,.23,0,parent);ring.rotation.x=-Math.PI/2;}
  function arch(parent,x,z,h,w,color){
    const pts=[new THREE.Vector3(x-w,0,z),new THREE.Vector3(x-w,h*.65,z),new THREE.Vector3(x,h,z),new THREE.Vector3(x+w,h*.65,z),new THREE.Vector3(x+w,0,z)];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),48,.1,8,false),gold,0,0,0,parent);
    const shape=new THREE.Shape();shape.moveTo(-w,0);shape.lineTo(w,0);shape.lineTo(w,h*.6);shape.quadraticCurveTo(w,h,0,h);shape.quadraticCurveTo(-w,h,-w,h*.6);shape.closePath();
    const mirror=new THREE.MeshPhysicalMaterial({color,metalness:.85,roughness:.08,transparent:true,opacity:.7,side:THREE.DoubleSide,clearcoat:1});mesh(new THREE.ShapeGeometry(shape,36),mirror,x,.1,z,parent);halo(x,h*.5,z+.15,color,h*1.5,parent);
  }
  const leafGeo=new THREE.BufferGeometry();leafGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.32,.42,.04,0,1,.13,.32,.42,.04,0,.45,.14],3));leafGeo.setAttribute('uv',new THREE.Float32BufferAttribute([.5,0,0,.42,.5,1,1,.42,.5,.45],2));leafGeo.setIndex([0,1,4,1,2,4,2,3,4,3,0,4]);leafGeo.computeVertexNormals();
  function tree(parent,x,z,height,color){
    const leaves=new THREE.MeshStandardMaterial({color,roughness:.8,side:THREE.DoubleSide});
    const foliage=new THREE.InstancedMesh(leafGeo,leaves,420),leafDummy=new THREE.Object3D();let n=0;
    const trunk=[new THREE.Vector3(x,0,z),new THREE.Vector3(x+.15,height*.45,z),new THREE.Vector3(x-.2,height*.85,z)];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trunk),10,.15,7,false),bark,0,0,0,parent);
    for(let j=0;j<7;j++){const a=j*2.4,r=.6+rand()*1.2,y=height*.62+rand()*height*.35,bx=x+Math.cos(a)*r,bz=z+Math.sin(a)*r;rod([x,height*.45,z],[bx,y,bz],.055,bark,parent);
      for(let k=0;k<60;k++){const az=rand()*Math.PI*2,h=rand()*2-1,radius=Math.cbrt(rand())*.95,w=Math.sqrt(1-h*h);leafDummy.position.set(bx+Math.cos(az)*w*radius,y+h*radius*.65,bz+Math.sin(az)*w*radius);leafDummy.rotation.set(rand()*2,rand()*6,rand()*3);leafDummy.scale.setScalar(.5+rand()*.45);leafDummy.updateMatrix();foliage.setMatrixAt(n,leafDummy.matrix);foliage.setColorAt(n,new THREE.Color().setScalar(.75+rand()*.35));n++;}}
    foliage.castShadow=true;foliage.receiveShadow=true;parent.add(foliage);
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
  // Living garden: a greenhouse, huge translucent leaves and waterfalls off the island.
  const garden=groupAt(islands[4],0,0);ringFloor(garden,4.7,green);
  for(let j=0;j<8;j++){const a=j/8*Math.PI*2,pts=[];for(let k=0;k<=24;k++){const t=k/24*Math.PI;pts.push(new THREE.Vector3(Math.cos(t)*4.7*Math.cos(a),Math.sin(t)*6,Math.cos(t)*4.7*Math.sin(a)));}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),32,.045,6,false),gold,0,0,0,garden);}
  tree(garden,0,0,7,'#77a28b');for(const [x,z] of [[-9,-1],[8,-4],[-6,8],[7,7]]){const h=2.5+rand()*2;const stem=[new THREE.Vector3(x,0,z),new THREE.Vector3(x+.4,h*.5,z),new THREE.Vector3(x,h,z)];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stem),16,.1,7,false),green,0,0,0,garden);const cap=mesh(new THREE.SphereGeometry(1.4,32,16,0,Math.PI*2,0,Math.PI/2),M('#86b8a1',.5),x,h,z,garden);cap.scale.y=.55;const under=cylinder(1.35,1.35,.05,new THREE.MeshBasicMaterial({color:'#c0ecd1',transparent:true,opacity:.7}),x,h-.03,z,garden);halo(x,h-.2,z,'#a4f4ce',4,garden);for(let j=0;j<12;j++){const a=j/12*Math.PI*2;rod([x,h-.05,z],[x+Math.cos(a)*1.25,h-.05,z+Math.sin(a)*1.25],.015,gold,garden);}}
  for(let j=0;j<3;j++){const u={time:{value:0}},mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:u,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float time;void main(){float s=pow(.5+.5*sin(vUv.x*70.+sin(vUv.y*15.+time*3.)),5.);float e=sin(vUv.x*3.14159)*smoothstep(0.,.25,vUv.y);gl_FragColor=vec4(.43,.78,.82,(.1+s*.2)*e);}'});mesh(new THREE.PlaneGeometry(2.3,11,1,16),mat,-3+j*3,-5.2,16,garden);waterfalls.push(u);}
  // Open-air music theatre: a giant lyre and a sweeping ivory keyboard.
  const theatre=groupAt(islands[5],0,-2);ringFloor(theatre,6,M('#594e66'));ringFloor(theatre,4.7,M('#8d788b'));
  const lyrePts=[new THREE.Vector3(-3,7,0),new THREE.Vector3(-3.3,3,0),new THREE.Vector3(0,1,0),new THREE.Vector3(3.3,3,0),new THREE.Vector3(3,7,0)];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lyrePts),64,.18,12,false),gold,0,0,0,theatre);rod([-3,6.5,0],[3,6.5,0],.14,gold,theatre);for(let j=-5;j<=5;j++)rod([j*.43,2+Math.abs(j)*.1,0],[j*.43,6.5,0],.016,gold,theatre);
  for(let j=0;j<17;j++){const a=-.9+j*.112,g=new THREE.Group();g.position.set(Math.sin(a)*8,.1,Math.cos(a)*8-1);g.rotation.y=a;theatre.add(g);box(.75,.15,1.8,ivory,0,0,0,g);if(j%7!==2&&j%7!==6)box(.3,.25,.85,dark,.39,.12,-.45,g);}
  for(let j=0;j<5;j++){const note=new THREE.Group();note.position.set(-4+j*2,7+Math.sin(j)*1.5,1);theatre.add(note);ball(gold,0,0,0,.18,note).scale.y=.65;rod([.15,0,0],[.15,.9,0],.035,gold,note);rotations.push({g:note,s:.12});}
  // Clock harbour: a clock face, layered brass gears and moored paper sails.
  const harbour=groupAt(islands[6],1,-2);ringFloor(harbour,4,ivory);box(3.7,5,2.8,M('#6f7280'),0,2.6,0,harbour);cylinder(0,3.4,2.8,M('#587484'),0,7,0,harbour,4).rotation.y=Math.PI/4;
  const face=cylinder(1.55,1.55,.14,M('#e1d6b2'),0,4.7,1.5,harbour,64);face.rotation.x=Math.PI/2;torus(1.6,.1,gold,0,4.7,1.62,harbour);
  for(let j=0;j<12;j++){const a=j/12*Math.PI*2;const tick=box(.06,.2,.03,gold,Math.sin(a)*1.3,4.7+Math.cos(a)*1.3,1.64,harbour);tick.rotation.z=-a;}rod([0,4.7,1.7],[.7,5.1,1.7],.045,dark,harbour);rod([0,4.7,1.71],[-.25,5.8,1.71],.03,dark,harbour);
  for(let j=0;j<3;j++){const gear=new THREE.Group();gear.position.set(-4+j*4,3+j*.8,-1);harbour.add(gear);torus(1.1,.13,gold,0,0,0,gear);for(let k=0;k<16;k++){const a=k/16*Math.PI*2;const cog=box(.2,.25,.2,gold,Math.cos(a)*1.2,Math.sin(a)*1.2,0,gear);cog.rotation.z=a-Math.PI/2;}for(let k=0;k<6;k++){const a=k/6*Math.PI*2;rod([0,0,0],[Math.cos(a),Math.sin(a),0],.04,gold,gear);}rotations.push({g:gear,s:(j%2?-1:1)*.1});}
  for(const side of [-1,1]){const boat=new THREE.Group();boat.position.set(side*8,.5,4);harbour.add(boat);const hull=ball(M('#9f8190'),0,0,0,1.1,boat);hull.scale.set(1.6,.3,.6);rod([0,0,0],[0,3.2,0],.05,gold,boat);const sail=new THREE.Shape();sail.moveTo(0,.5);sail.lineTo(0,3);sail.lineTo(1.4,.7);sail.closePath();mesh(new THREE.ShapeGeometry(sail),new THREE.MeshStandardMaterial({color:'#e3d1bb',side:THREE.DoubleSide}),0,0,0,boat);}
  // Ground foliage uses instancing, so the larger world stays inexpensive to draw.
  const grassGeo=new THREE.ConeGeometry(.065,.55,3),grassMat=M('#4b716a',.95),grass=new THREE.InstancedMesh(grassGeo,grassMat,3200);let n=0;
  for(const island of islands){for(let j=0;j<460&&n<3200;j++){const a=rand()*Math.PI*2,r=island.r*(.65+rand()*.25),x=island.x+Math.cos(a)*r,z=island.z+Math.sin(a)*r;if(island.id==='park'&&x<-4&&z<9)continue;dummy.position.set(x,.18,z);dummy.rotation.set((rand()-.5)*.4,a,(rand()-.5)*.4);dummy.scale.setScalar(.6+rand()*.8);dummy.updateMatrix();grass.setMatrixAt(n++,dummy.matrix);}}
  grass.count=n;grass.receiveShadow=true;scene.add(grass);
  for(const island of islands.slice(1)){for(let j=0;j<8;j++){const a=j/8*Math.PI*2+.3,x=Math.cos(a)*12,z=Math.sin(a)*12;if(j%2)tree(groupAt(island),x,z,2.5+rand()*1.5,island.id==='nature'?'#4d8b73':'#62647d');const pebble=mesh(new THREE.IcosahedronGeometry(.5,2),ivory,island.x+x,.25,island.z+z);pebble.scale.set(1,.45,1);}}
  // Inlaid paths and lantern gardens give each destination a lived-in foreground.
  const flagGeo=new THREE.CylinderGeometry(.56,.61,.08,6),flagM=M('#757b84',.9),flags=[];
  const decorativeLights=[];
  for(const island of islands.slice(1)){
    const color=new THREE.Color(island.color),lit=new THREE.MeshBasicMaterial({color:island.color}),flowerMaterial=M(island.color,.8),pathR=9.4;
    const inlay=torus(pathR,.025,gold,island.x,.09,island.z);inlay.rotation.x=-Math.PI/2;
    for(let j=0;j<64;j++){const a=j/64*Math.PI*2;flags.push({x:island.x+Math.cos(a)*pathR,z:island.z+Math.sin(a)*pathR,a});}
    for(let j=0;j<8;j++){
      const a=j/8*Math.PI*2+.4,x=island.x+Math.cos(a)*11,z=island.z+Math.sin(a)*11;
      cylinder(.055,.12,1.9,gold,x,.95,z,scene,10);const lantern=cylinder(.19,.24,.38,lit,x,2.05,z,scene,8);cylinder(0,.31,.24,gold,x,2.35,z,scene,8);halo(x,2.05,z,island.color,2.1);
      const pool=mesh(new THREE.PlaneGeometry(3.4,3.4),new THREE.MeshBasicMaterial({map:glowMap,color:island.color,transparent:true,opacity:.2,depthWrite:false,blending:THREE.AdditiveBlending}),x,.11,z);pool.rotation.x=-Math.PI/2;pool.castShadow=false;pool.receiveShadow=false;
      // Small rounded planters with luminous blossom clusters.
      const px=island.x+Math.cos(a)*12.6,pz=island.z+Math.sin(a)*12.6;cylinder(.7,.5,.35,dark,px,.18,pz,scene,16);
      for(let k=0;k<9;k++){const pa=k*2.4,pr=.15+rand()*.45,flower=ball(flowerMaterial,px+Math.cos(pa)*pr,.45+rand()*.25,pz+Math.sin(pa)*pr,.13+rand()*.13);flower.scale.y=.6;}
    }
    // Small motes over the gardens remain batched in a single buffer.
    for(let j=0;j<28;j++)decorativeLights.push(island.x+(rand()-.5)*25,1+rand()*5,island.z+(rand()-.5)*25);
  }
  const pathMesh=new THREE.InstancedMesh(flagGeo,flagM,flags.length);flags.forEach((p,i)=>{dummy.position.set(p.x,.065,p.z);dummy.rotation.set(0,p.a,0);dummy.scale.set(1,.6,1);dummy.updateMatrix();pathMesh.setMatrixAt(i,dummy.matrix)});pathMesh.receiveShadow=true;scene.add(pathMesh);
  const sparkleGeo=new THREE.BufferGeometry();sparkleGeo.setAttribute('position',new THREE.Float32BufferAttribute(decorativeLights,3));const specks=new THREE.Points(sparkleGeo,new THREE.PointsMaterial({map:glowMap,color:'#f2dfc1',size:.12,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(specks);
  // Observatory windows, concentric instrument markings and crystal clusters.
  const windowMaterial=new THREE.MeshBasicMaterial({color:'#9cc6da'});for(let j=0;j<18;j++){const a=j/18*Math.PI*2,x=Math.cos(a)*4.03,z=Math.sin(a)*4.03;const window=box(.4,.65,.035,windowMaterial,x,1,z,observatory);window.rotation.y=-a+Math.PI/2;}
  for(const radius of [4.3,4.65,5]){const stair=cylinder(radius,radius+.12,.12,ivory,0,.04+(5-radius)*.3,0,observatory);const rim=torus(radius,.025,gold,0,.14+(5-radius)*.3,0,observatory);rim.rotation.x=-Math.PI/2;}
  for(let j=0;j<12;j++){const a=j*2.4,x=Math.cos(a)*6.8,z=Math.sin(a)*6.8;if(z>2)continue;const crystal=cylinder(0,.16+rand()*.2,.8+rand()*1.1,M('#91bdcf',.18,.25),x,.65,z,observatory,6);crystal.rotation.z=(rand()-.5)*.3;}
  // Hanging seed lights and curled leaves make the greenhouse feel alive.
  for(let j=0;j<18;j++){const a=j/18*Math.PI*2,r=1.3+rand()*1.5,x=Math.cos(a)*r,z=Math.sin(a)*r,y=4.5+rand()*1.5,len=.8+rand()*1.8;const pts=[new THREE.Vector3(x*.5,6,z*.5),new THREE.Vector3(x,y+.5,z),new THREE.Vector3(x+.15,y-len,z)];mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),16,.018,5,false),gold,0,0,0,garden);ball(new THREE.MeshBasicMaterial({color:'#d6f4a8'}),x+.15,y-len,z,.065,garden);halo(x+.15,y-len,z,'#c9ecad',.8,garden);}
  const bigLeafMaterial=new THREE.MeshPhysicalMaterial({color:'#62a98a',side:THREE.DoubleSide,roughness:.55,sheen:.7,sheenColor:'#b1e8b8'});
  for(let j=0;j<12;j++){const a=j/12*Math.PI*2;const leaf=mesh(leafGeo,bigLeafMaterial,Math.cos(a)*4,.1,Math.sin(a)*4,garden);leaf.rotation.set(.3,a,Math.sin(a)*.35);leaf.scale.set(2.2,2.8+rand(),2);}
  // Soft environmental reflections on brass and glass; no external texture downloads.
  const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;const ctx=envCanvas.getContext('2d'),grad=ctx.createLinearGradient(0,0,0,256);grad.addColorStop(0,'#293754');grad.addColorStop(.45,'#a7b8cd');grad.addColorStop(.52,'#677e9b');grad.addColorStop(1,'#172b30');ctx.fillStyle=grad;ctx.fillRect(0,0,512,256);const env=new THREE.CanvasTexture(envCanvas);env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;scene.environment=env;scene.environmentIntensity=.35;
  return {grain,update(t){for(const {g,s,balance} of rotations){if(balance)g.rotation.z=Math.sin(t*.4)*.06;else g.rotation.z=t*s;}for(const u of waterfalls)u.time.value=t;}};
}
