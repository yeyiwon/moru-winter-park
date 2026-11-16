import * as THREE from './vendor/three.module.js';

// Small, tangible winter places. All coordinates stay on the existing seven islands.
export function buildWinterWorld(api){
 const {scene,mesh,ball,cylinder,box,rod,torus,halo,M}=api;
 const root=new THREE.Group();root.name='winter-places';scene.add(root);
 const snow=M('#edf2f2',.96,0),stone=M('#7c8792',.88,0),darkStone=M('#415268',.78,.05),brass=M('#c5aa7f',.4,.45),cedar=M('#8e6d58',.88,0),cedarLight=M('#b08b6a',.9,0),ink=M('#19293e',.5,.15),ivory=M('#e9dfca',.8,0);
 const pine=[M('#264e4c',.96,0),M('#35605a',.96,0),M('#427267',.96,0)],berry=M('#aa4b51',.4,.18),ribbon=M('#b28b68',.68,.15);
 const candle=new THREE.MeshBasicMaterial({color:'#ffe1a2'}),water=new THREE.MeshPhysicalMaterial({color:'#79b4ba',roughness:.25,metalness:.2,clearcoat:.5});
 let seed=591;const rand=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 const steam=[],chairs=[],moving=new Set(),interactive=[];
 function place(x,z,name){const g=new THREE.Group();g.position.set(x,0,z);g.name=name;root.add(g);return g;}
 function oval(mat,x,y,z,sx,sy,sz,parent){const b=ball(mat,x,y,z,1,parent);b.scale.set(sx,sy,sz);return b;}
 function target(g,action,x,y,z,w,h,d){const t=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));t.position.set(x,y,z);t.userData.action=action;t.userData.winter=true;g.add(t);interactive.push(t);moving.add(t);return t;}
 function lantern(g,x,y,z){const frame=new THREE.Group();frame.position.set(x,y,z);g.add(frame);box(.36,.08,.36,brass,0,0,0,frame);box(.3,.4,.3,candle,0,.24,0,frame);for(const xx of [-.17,.17])for(const zz of [-.17,.17])rod([xx,0,zz],[xx,.46,zz],.018,brass,frame);cylinder(0,.28,.18,brass,0,.55,0,frame,4).rotation.y=Math.PI/4;halo(0,.25,0,'#ffcc85',1.4,frame);}
 function rug(g,w,d,x,z,mat){box(w,.045,d,mat,x,.13,z,g);for(const side of [-1,1])for(let i=0;i<14;i++)rod([x-w/2+i*w/13,.15,z+side*d/2],[x-w/2+i*w/13,.15,z+side*(d/2+.1)],.012,ivory,g);}
 function star(g,x,y,z,r){const s=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,v=i%2?r*.43:r;i?s.lineTo(Math.cos(a)*v,Math.sin(a)*v):s.moveTo(Math.cos(a)*v,Math.sin(a)*v);}s.closePath();return mesh(new THREE.ExtrudeGeometry(s,{depth:.08,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2}),candle,x,y,z,g);}
 function fir(g,x,z,h,decorated=false){
  cylinder(.12,.25,h*.67,cedar,x,h*.34,z,g,12);
  for(let layer=0;layer<7;layer++){
   const y=.6+layer*h*.105,r=(1-layer/8)*h*.28;
   const profile=[new THREE.Vector2(.02,y+h*.25),new THREE.Vector2(r*.48,y+h*.11),new THREE.Vector2(r,y),new THREE.Vector2(r*.94,y-.06),new THREE.Vector2(.08,y)];
   mesh(new THREE.LatheGeometry(profile,32),pine[layer%3],x,0,z,g);
   for(let j=0;j<8;j++){const a=j*Math.PI/4+layer*.31,dx=Math.cos(a),dz=Math.sin(a);const b=oval(pine[(layer+1)%3],x+dx*r*.65,y+.05,z+dz*r*.65,r*.43,.13+layer*.009,r*.13,g);b.rotation.y=-a;const cap=oval(snow,x+dx*r*.67,y+.16,z+dz*r*.67,r*.33,.07,r*.12,g);cap.rotation.y=-a;}
  }
  if(!decorated)return;
  const pts=[];for(let i=0;i<150;i++){const t=i/149,y=.8+t*h*.75,a=t*Math.PI*2*4.5,r=h*.29*(1-t*.88);pts.push(new THREE.Vector3(x+Math.cos(a)*r,y,z+Math.sin(a)*r));if(i%3===0)ball(candle,x+Math.cos(a)*r,y,z+Math.sin(a)*r,.043,g);if(i%7===0){const ba=a+.14,br=r+.07;ball(i%2?berry:brass,x+Math.cos(ba)*br,y-.16,z+Math.sin(ba)*br,.11,g);rod([x+Math.cos(ba)*br,y,z+Math.sin(ba)*br],[x+Math.cos(ba)*br,y-.06,z+Math.sin(ba)*br],.008,brass,g);}}
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),150,.012,4,false),brass,0,0,0,g);star(g,x,h*.94,z,.38);halo(x,h*.94,z,'#ffe5ad',2.1,g);
 }
 const tree=place(9,11,'winter-tree');cylinder(2.35,2.5,.16,darkStone,0,.08,0,tree,48);cylinder(2.25,2.35,.06,snow,0,.18,0,tree,48);fir(tree,0,0,7,true);
 for(let i=0;i<7;i++){const a=i*.85,r=1.2+rand()*.5,w=.35+rand()*.3,h=.3+rand()*.4,x=Math.cos(a)*r,z=Math.sin(a)*r;const gift=new THREE.Group();gift.position.set(x,.2,z);gift.rotation.y=a;tree.add(gift);box(w,h,w*.85,[berry,cedarLight,pine[1],ivory][i%4],0,h/2,0,gift);box(w+.015,.035,w*.85+.015,ribbon,0,h*.78,0,gift);box(.07,h+.02,w*.85+.025,ribbon,0,h/2,0,gift);for(const side of [-1,1]){const loop=torus(.08,.015,brass,side*.07,h+.04,0,gift);loop.scale.y=.6;loop.rotation.x=.3;}}
 lantern(tree,-2.2,.1,1.5);lantern(tree,2.2,.1,1.5);target(tree,'tree',0,2,0,4,4,4);

 // A swept, groomed slope; the base remains flat and reachable from the observatory.
 const ski=place(10,-55,'snow-slope'),slopeGeo=new THREE.PlaneGeometry(6,14,16,32),sp=slopeGeo.attributes.position;
 for(let i=0;i<sp.count;i++){const x=sp.getX(i),along=sp.getY(i),t=(along+7)/14;sp.setXYZ(i,x,.12+Math.pow(t,1.55)*5.3,-along);}
 slopeGeo.computeVertexNormals();mesh(slopeGeo,snow,0,0,0,ski);
 const slopeSides=new THREE.Shape();slopeSides.moveTo(-7,.12);for(let i=0;i<=32;i++){const t=i/32;slopeSides.lineTo(-7+t*14,.12+Math.pow(t,1.55)*5.3);}slopeSides.lineTo(7,-.1);slopeSides.closePath();
 for(const x of [-3,3]){const side=mesh(new THREE.ShapeGeometry(slopeSides),stone,x,0,0,ski);side.rotation.y=Math.PI/2;side.material=stone.clone();side.material.side=THREE.DoubleSide;}
 for(let row=0;row<8;row++){const t=row/7,y=.15+Math.pow(t,1.55)*5.3,z=7-t*14;for(const side of [-1,1]){rod([side*2.7,y,z],[side*2.7,y+.8,z],.025,brass,ski);const flag=box(.32,.2,.025,row%2?berry:ink,side*2.7,y+.65,z,ski);flag.rotation.y=.25;}const mark=box(4.8,.012,.025,M('#c9d9e2',1,0),0,y+.02,z,ski);mark.rotation.x=-Math.atan(5.3*1.55*Math.pow(Math.max(t,.01),.55)/14);}
 const lineA=new THREE.Vector3(-3.6,2.9,7),lineB=new THREE.Vector3(-3.6,8.1,-7);rod(lineA.toArray(),lineB.toArray(),.023,ink,ski);for(const [z,y]of [[6.5,3.2],[-6.5,8]]){cylinder(.09,.14,y,brass,-3.6,y/2,z,ski,10);rod([-4.05,y,z],[-3.15,y,z],.045,ink,ski);}
 for(let i=0;i<4;i++){const g=new THREE.Group();ski.add(g);rod([0,0,0],[0,-.7,0],.02,brass,g);box(.8,.08,.42,cedarLight,0,-.74,0,g);box(.8,.3,.06,cedar,0,-.56,-.2,g);for(const side of [-1,1])rod([side*.4,-.7,.18],[side*.4,-.38,-.2],.018,brass,g);g.position.lerpVectors(lineA,lineB,i/4);chairs.push({g,offset:i/4,a:lineA,b:lineB});moving.add(g);}
 const hut=place(7,-44.8,'ski-chalet');box(2.7,1.9,2,cedar,0,1,0,hut);for(let j=0;j<12;j++)box(.05,1.8,.035,cedarLight,-1.25+j*.23,1,1.02,hut);box(.9,1.45,.04,ink,0,.83,1.04,hut);box(.55,.65,.05,candle,-.85,1.2,1.03,hut);for(const side of [-1,1]){const roof=box(1.8,.16,2.7,ink,side*.68,2.3,0,hut);roof.rotation.z=-side*.46;const cap=box(1.8,.08,2.7,snow,side*.68,2.4,0,hut);cap.rotation.z=-side*.46;}for(let i=0;i<3;i++){const plank=box(.14,1.6,.05,[berry,ivory,ink][i],1.65+i*.2,.85,.75,hut);plank.rotation.z=-.18;}lantern(hut,-1.65,.15,1.25);target(hut,'ski',0,1,1.4,2,2,1);
 fir(ski,-3.65,-5.3,3);fir(ski,-5,1.8,2.3);
 // The narrow sled trail has its own shallow banking and cedar safety rails.
 const sled=place(14,-53,'sled-run'),sledGeo=new THREE.PlaneGeometry(1.6,10.8,8,32),slp=sledGeo.attributes.position;
 for(let i=0;i<slp.count;i++){const x=slp.getX(i),along=slp.getY(i),t=Math.max(0,Math.min(1,(along+5.4)/10.8));slp.setXYZ(i,x,.16+Math.pow(t,1.35)*3.6+.18*(x/.8)**2,-along);}sledGeo.computeVertexNormals();mesh(sledGeo,snow,0,0,0,sled);
 const sledSideShape=new THREE.Shape();sledSideShape.moveTo(-5.4,.05);for(let j=0;j<=24;j++){const t=j/24;sledSideShape.lineTo(-5.4+t*10.8,.16+Math.pow(t,1.35)*3.6);}sledSideShape.lineTo(5.4,.05);sledSideShape.closePath();const bankMaterial=snow.clone();bankMaterial.side=THREE.DoubleSide;for(const x of [-.8,.8]){const bank=mesh(new THREE.ShapeGeometry(sledSideShape),bankMaterial,x,0,0,sled);bank.rotation.y=Math.PI/2;}box(1.6,3.75,.12,snow,0,1.9,-5.4,sled);
 for(const side of [-1,1]){const points=[];for(let j=0;j<=24;j++){const t=j/24,z=5.4-t*10.8,y=.38+Math.pow(t,1.35)*3.6;points.push(new THREE.Vector3(side*.9,y,z));if(j%4===0)rod([side*.9,y-.12,z],[side*.9,y+.45,z],.035,cedar,sled);}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,.045,6,false),cedarLight,0,0,0,sled);}
 for(let j=0;j<4;j++){const t=j/3,z=5.4-t*10.8,y=.7+Math.pow(t,1.35)*3.6;const pennant=box(.32,.18,.025,berry,-1.05,y,z,sled);pennant.rotation.y=.3;rod([-1.05,y-.45,z],[-1.05,y+.15,z],.02,brass,sled);}
 const sledRack=place(11.7,-45.5,'sled-rack');for(let i=0;i<2;i++){const g=new THREE.Group();g.position.set(i*.55-.27,.6,0);g.rotation.z=-.12+i*.2;sledRack.add(g);for(const side of [-1,1]){rod([side*.18,-.4,-.45],[side*.18,-.4,.45],.025,berry,g);rod([side*.18,-.4,.45],[side*.18,-.22,.58],.025,berry,g);}for(let j=0;j<4;j++)box(.46,.05,.15,cedarLight,0,-.26,-.28+j*.18,g);}
 target(sledRack,'sled',0,1,0,1.7,2,1.5);
 // A separately controllable chair is reserved for the local rider; decorative chairs continue looping.
 const rideChair=new THREE.Group();rideChair.name='ride-chair';root.add(rideChair);moving.add(rideChair);rideChair.visible=false;
 rod([0,.74,0],[0,.04,0],.025,brass,rideChair);box(.9,.09,.55,cedarLight,0,0,0,rideChair);box(.9,.4,.07,cedar,0,.23,-.26,rideChair);for(const side of [-1,1]){rod([side*.46,0,.22],[side*.46,.37,-.25],.025,brass,rideChair);rod([side*.46,.37,-.25],[0,.74,0],.02,brass,rideChair);}
 const rides={
  lift:{heightMode:'seat',points:[[6.4,2.16,-48],[6.4,4.76,-55],[6.4,7.36,-62]],exit:[10,5.42,-62],duration:12},
  ski:{heightMode:'surface',points:Array.from({length:25},(_,i)=>{const t=1-i/24;return[10+Math.sin(i/24*Math.PI*3)*.75,.12+Math.pow(t,1.55)*5.3,-48-t*14];}).concat([[10,.12,-45],[7,.09,-42.7]]),duration:10},
  sled:{bodyOffset:1.03,heightMode:'surface',points:Array.from({length:25},(_,i)=>{const t=1-i/24;return[14,.16+Math.pow(t,1.35)*3.6,-47.6-t*10.8];}).concat([[13,.12,-46.5],[12,.09,-45.5]]),duration:8}
 };


 // Warm water and steam sit below a dry stone rim, beside a cedar bath house.
 const bath=place(-10,56,'onsen');cylinder(3.2,3.35,.34,darkStone,0,.19,0,bath,64);const pool=cylinder(2.65,2.65,.035,water,0,.38,0,bath,64);pool.scale.z=.8;
 for(let i=0;i<27;i++){const a=i/27*Math.PI*2,r=2.9+rand()*.11,stoneMesh=oval(i%3?stone:darkStone,Math.cos(a)*r,.45,Math.sin(a)*r*.86,.43+rand()*.12,.23+rand()*.13,.36,bath);stoneMesh.rotation.y=-a;}
 for(let i=0;i<4;i++){const ripple=torus(.6+i*.5,.012,M('#c6e3df',.4,.1),0,.415,0,bath);ripple.rotation.x=-Math.PI/2;ripple.scale.y=.8;}
 for(let i=0;i<8;i++){const puff=halo((rand()-.5)*4,.8+rand(),(rand()-.5)*3,'#dae8e9',1.8,bath);puff.material.blending=THREE.NormalBlending;puff.material.opacity=.07;steam.push({puff,x:puff.position.x,z:puff.position.z,phase:rand()*6});moving.add(puff);}
 for(const side of [-1,1]){box(.65,.16,1.2,cedarLight,side*3.25,.3,1,bath);const towel=box(.5,.12,.7,ivory,side*3.25,.45,1,bath);towel.rotation.y=side*.1;lantern(bath,side*2.6,.2,2.6);}
 // Hand-poured water spout with a narrow animated glint.
 cylinder(.11,.14,1.3,cedar,-2.9,.8,-.3,bath,12);const spout=cylinder(.08,.08,.65,cedar,-2.6,1.35,-.3,bath,12);spout.rotation.z=Math.PI/2;rod([-2.28,1.32,-.3],[-2.28,.42,-.3],.035,water,bath);target(bath,'onsen',0,.8,0,5,1.6,4.4);
 const sauna=place(9,56,'jjimjilbang');box(5.2,.25,4.5,cedar,0,.17,0,sauna);box(5.15,2.7,.16,cedar,0,1.6,-2.2,sauna);for(const side of [-1,1])box(.16,2.7,4.5,cedar,side*2.5,1.6,0,sauna);
 for(let j=0;j<22;j++)box(.12,2.62,.055,j%3?cedarLight:cedar,-2.35+j*.225,1.6,-2.09,sauna);
 for(const side of [-1,1])for(let j=0;j<18;j++)box(.055,2.6,.12,j%3?cedarLight:cedar,side*2.38,1.6,-2+j*.23,sauna);
 for(const side of [-1,1]){const roof=box(3,.15,5.1,ink,side*1.25,3.17,0,sauna);roof.rotation.z=-side*.25;const cap=box(3,.09,5.1,snow,side*1.25,3.29,0,sauna);cap.rotation.z=-side*.25;}
 for(const side of [-1,1]){box(1.1,.18,3.1,cedarLight,side*1.68,.75,-.25,sauna);for(let j=0;j<8;j++)box(.09,.05,3.05,cedar,side*1.68-.43+j*.12,.86,-.25,sauna);for(const z of [-1.3,.8]){box(.75,.1,.48,ivory,side*1.68,.94,z,sauna);box(.55,.07,.35,ivory,side*1.68,1.03,z,sauna);}}
 cylinder(.5,.55,.6,darkStone,0,.55,-1.55,sauna,12);for(let i=0;i<9;i++){const a=i*2.4;oval(stone,Math.cos(a)*.32,.9+rand()*.12,-1.55+Math.sin(a)*.32,.16,.12,.13,sauna);}lantern(sauna,-2.8,.4,2.1);lantern(sauna,2.8,.4,2.1);rug(sauna,1.4,2.4,0,.3,M('#a9927c',.98,0));target(sauna,'sauna',0,1,1,2,2,2);

 // A curved grand piano, readable keys and an open score in the classical salon.
 const salon=place(-53,22,'classical-salon');cylinder(3.4,3.6,.16,darkStone,0,.13,0,salon,64);rug(salon,4.3,3.4,0,.2,M('#594b63',1,0));
 const pianoShape=new THREE.Shape();pianoShape.moveTo(-.9,-.7);pianoShape.lineTo(.9,-.7);pianoShape.lineTo(.9,.1);pianoShape.bezierCurveTo(.9,.8,.1,1.65,-.65,1.5);pianoShape.quadraticCurveTo(-1.15,1.15,-.9,.45);pianoShape.closePath();const pianoGeo=new THREE.ExtrudeGeometry(pianoShape,{depth:.25,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:3});pianoGeo.rotateX(-Math.PI/2);mesh(pianoGeo,ink,0,1.05,0,salon);
 const lid=mesh(new THREE.ShapeGeometry(pianoShape,24),ink,0,1.36,0,salon);lid.rotation.x=-Math.PI/2;lid.rotation.z=-.22;rod([.72,1.27,.55],[.72,1.83,.55],.025,brass,salon);
 for(const [x,z] of [[-.7,.5],[.7,.5],[-.45,-1.15]]){cylinder(.05,.08,.95,ink,x,.6,z,salon,12);ball(brass,x,.14,z,.07,salon);}
 box(1.9,.14,.46,ink,0,1.05,.88,salon);for(let i=0;i<21;i++){box(.077,.045,.34,ivory,-.85+i*.085,1.15,.88,salon);if(i%7!==2&&i%7!==6)box(.045,.06,.2,ink,-.81+i*.085,1.2,.8,salon);}
 box(.75,.65,.04,cedar,0,1.6,.47,salon).rotation.x=-.15;for(const side of [-1,1]){const page=box(.34,.53,.012,ivory,side*.18,1.63,.51,salon);page.rotation.y=-side*.1;for(let j=0;j<6;j++)box(.28,.006,.006,ink,side*.18,1.82-j*.07,.524,salon);}
 box(1,.13,.6,ink,0,.68,1.7,salon);for(const side of [-1,1])for(const z of [1.49,1.91])cylinder(.035,.055,.55,brass,side*.38,.37,z,salon,8);lantern(salon,-2.7,.13,.8);lantern(salon,2.7,.13,.8);target(salon,'classical',0,1,1.2,3,2,3);

 // Original geometric canvases: material art, never copied artwork or external textures.
 const gallery=place(-48,37,'winter-gallery');box(7,.15,2.3,darkStone,0,.15,0,gallery);box(7,2.8,.18,M('#c4c3bf',.94,0),0,1.6,-.8,gallery);
 for(let i=0;i<3;i++){const frame=new THREE.Group();frame.position.set(-2.3+i*2.3,1.75,-.67);gallery.add(frame);box(1.8,2,.1,brass,0,0,0,frame);box(1.62,1.82,.12,ivory,0,0,.05,frame);box(1.4,1.6,.03,[M('#456370',1,0),M('#bd9b84',1,0),M('#69637d',1,0)][i],0,0,.13,frame);const disc=cylinder(.34,.34,.025,[ivory,ink,cedarLight][i],-.2,.3,.16,frame,48);disc.rotation.x=Math.PI/2;const arch=new THREE.Shape();arch.moveTo(-.6,-.7);arch.lineTo(.6,-.7);arch.lineTo(.6,-.05);arch.quadraticCurveTo(.2,.5,-.2,.04);arch.quadraticCurveTo(-.5,-.1,-.6,.2);arch.closePath();mesh(new THREE.ShapeGeometry(arch,24),[cedarLight,pine[0],ivory][i],0,0,.19,frame);for(let j=0;j<3;j++)box(.55,.025,.015,[ivory,brass,ink][i],.23,-.22-j*.13,.22,frame);box(.8,.08,.025,brass,0,-1.16,0,frame);}
 for(const side of [-1,1]){rod([side*3.4,.15,.7],[side*3.4,3.1,.7],.045,brass,gallery);rod([side*3.4,3.1,.7],[side*2.4,3.1,-.3],.035,brass,gallery);ball(candle,side*2.4,3.05,-.3,.1,gallery);}target(gallery,'gallery',0,1.6,.3,7,3,2);
 const forum=place(46,-20,'ethics-circle');cylinder(2.4,2.6,.12,darkStone,0,.1,0,forum,48);for(const side of [-1,1]){const b=box(1.65,.22,.65,cedarLight,side*1.65,.55,0,forum);b.rotation.y=-side*.45;for(const x of [-.55,.55])cylinder(.055,.09,.4,brass,side*1.65+x,.3,0,forum,8);box(.65,.1,.45,ivory,side*.25,.85,.1,forum);}
 cylinder(.6,.75,.65,stone,0,.45,0,forum,32);const book=box(.65,.09,.45,ivory,0,.83,0,forum);book.rotation.y=.2;lantern(forum,0,.16,-1.8);target(forum,'ethics',0,1,0,4.5,2,3);
 const quiet=place(50,34,'quiet-garden');cylinder(2.3,2.5,.1,M('#687971',.94,0),0,.13,0,quiet,48);for(let i=0;i<5;i++){const a=i*1.26;const pad=oval(M('#b3a2a1',.95,0),Math.cos(a)*1.5,.28,Math.sin(a)*1.5,.48,.13,.4,quiet);pad.rotation.y=-a;}cylinder(.35,.4,.4,stone,0,.4,0,quiet,32);ball(candle,0,.65,0,.1,quiet);halo(0,.65,0,'#ffddb2',1.6,quiet);target(quiet,'healing',0,.7,0,4.5,1.4,4.5);

 // Batch static geometry by material; retain moving chairs, steam and hit targets.
 root.updateMatrixWorld(true);const groups=new Map();root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||moving.has(o))return;let parent=o.parent;while(parent&&parent!==root){if(moving.has(parent))return;parent=parent.parent;}if(!o.geometry.attributes.normal||!o.geometry.attributes.uv)return;const key=o.material.uuid;if(!groups.has(key))groups.set(key,{material:o.material,items:[]});groups.get(key).items.push(o);});
 for(const {material,items} of groups.values()){if(items.length<2)continue;const chunks={position:[],normal:[],uv:[]};let count=0;for(const item of items){let geo=item.geometry.clone().applyMatrix4(item.matrixWorld);if(geo.index)geo=geo.toNonIndexed();for(const key in chunks)chunks[key].push(geo.attributes[key].array);count+=geo.attributes.position.count;item.removeFromParent();geo.dispose();}const geo=new THREE.BufferGeometry();for(const key in chunks){const size=key==='uv'?2:3,out=new Float32Array(count*size);let offset=0;for(const a of chunks[key]){out.set(a,offset);offset+=a.length;}geo.setAttribute(key,new THREE.BufferAttribute(out,size));}geo.computeBoundingSphere();mesh(geo,material,0,0,0,root);}
 const destinations=[{id:'tree',name:'겨울 트리',x:6,z:12,kind:'tree'},{id:'ski',name:'설빛 스키장',x:7,z:-42.7,kind:'ski'},{id:'sled',name:'작은 썰매장',x:12,z:-45.5,kind:'sled'},{id:'onsen',name:'노천 온천',x:-10,z:59.5,kind:'onsen'},{id:'sauna',name:'편백 찜질방',x:9,z:59.3,kind:'sauna'},{id:'classical',name:'클래식 살롱',x:-53,z:25.3,kind:'classical'},{id:'gallery',name:'겨울 미술관',x:-48,z:39,kind:'gallery'},{id:'ethics',name:'법과 마음의 서재',x:46,z:-17.3,kind:'ethics'},{id:'healing',name:'고요한 쉼터',x:50,z:37,kind:'healing'}];
 const obstacles=[{x:9,z:11,r:2.4},{x:10,z:-55,w:3.2,d:7.2},{x:7,z:-44.8,w:1.5,d:1.15},{x:14,z:-53,w:.9,d:5.5},{x:-10,z:56,r:3.2},{x:9,z:53.8,w:2.65,d:.2},{x:6.5,z:56,w:.2,d:2.2},{x:11.5,z:56,w:.2,d:2.2},{x:-53,z:22,r:1.5},{x:-48,z:36.2,w:3.6,d:.2},{x:46,z:-20,r:.8}];
 return{root,interactive,destinations,obstacles,rides,rideChair,dynamic:[...moving],update(t,still){if(still)return;for(const s of steam){const v=(t*.15+s.phase)%1;s.puff.position.set(s.x+Math.sin(t*.45+s.phase)*.25,.55+v*2.2,s.z);s.puff.scale.setScalar(1.1+v*1.3);s.puff.material.opacity=Math.sin(v*Math.PI)*.09;}for(const {g,offset,a,b}of chairs){const v=(t*.035+offset)%1;g.position.lerpVectors(a,b,v);g.rotation.z=Math.sin(t*.8+offset)*.025;}}};
}
