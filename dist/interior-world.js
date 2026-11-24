import {sharedSeatPose} from './ride-seats.js';
import {serverNow} from './server-clock.js';
import {aquariumLayout} from './ryokan-aquarium-layout.js';
import {addRyokanCraft,roundedRyokanSlab} from './ryokan-craft.js';
import {ryokanFinish} from './ryokan-finish.js';
import {ryokanWindow} from './ryokan-window.js';
import {createOnsenWater} from './onsen-water.js';
import {buildMuseumInterior} from './museum-world.js';
import {buildRyokanChef} from './ryokan-chef.js';
import {buildRyokanAquarium} from './ryokan-aquarium.js';
import * as T from './vendor/three.module.js';
import {createRetreatAtmosphere} from './retreat-atmosphere.js';
import {interiorRooms,ryokanFixtures} from './interior-layout.js';
import {makeBuilder,mergeFinish,materials} from './architecture-kit.js';
import {buildFootbathMasonry} from './ryokan-footbath.js';
import {disposeOwnedScene} from './scene-resources.js';

function leafGeometry(length=1,width=.22,bend=.24){
 const pos=[],uv=[],index=[],rows=12;for(let i=0;i<=rows;i++){const t=i/rows,profile=Math.pow(Math.sin(Math.PI*t),.8);for(const side of [-1,0,1]){pos.push(side*width*profile,t*length,bend*t*t+(side===0?.045*profile:0));uv.push((side+1)/2,t);}if(i<rows)for(let j=0;j<2;j++){const k=i*3+j;index.push(k,k+3,k+1,k+1,k+3,k+4);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return g;
}
function makePlanter(b,m,x,z,scale=1){
 const profile=[[.4,0],[.51,.1],[.56,.62],[.62,.68],[.59,.75],[.52,.75],[.47,.14],[.4,.1]].map(v=>new T.Vector2(v[0]*scale,v[1]*scale));b.mesh(new T.LatheGeometry(profile,24),m.cream,x,.09,z);b.ring(.57*scale,.025*scale,m.brass,x,.81*scale,z);
 b.mesh(new T.CylinderGeometry(.51*scale,.5*scale,.03,24),m.soil,x,.78*scale,z);
 for(let j=0;j<9;j++){const a=j*2.399,p=b.mesh(leafGeometry((1.2+(j%3)*.3)*scale,.24*scale,.3*scale),j%2?m.leaf:m.sage,x,.72*scale,z);p.rotation.set(.4+(j%3)*.18,a,Math.sin(a)*.4);}
}
function makeLantern(root,b,m,x,y,z,scale=1){
 const shade=new T.Group();shade.name='ryokan-washi-lantern';shade.position.set(x,y,z);shade.scale.setScalar(scale);b.mesh(new T.LatheGeometry([[.18,0],[.28,.06],[.37,.24],[.38,.43],[.31,.64],[.18,.72]].map(v=>new T.Vector2(...v)),32),m.lamp,0,0,0,shade);
 for(let j=0;j<12;j++){const a=j*Math.PI/6,points=[.04,.18,.36,.54,.69].map((h,i)=>[Math.cos(a)*[.26,.355,.382,.355,.245][i],h,Math.sin(a)*[.26,.355,.382,.355,.245][i]]);b.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),10,.009,4,false),m.endgrain,0,0,0,shade);}
 for(const h of [.06,.18,.32,.46,.6,.69]){const rib=b.mesh(new T.TorusGeometry(h<.1||h>.65?.26:h<.2||h>.55?.35:.38,.007,4,24),m.lightWood,0,h,0,shade);rib.rotation.x=Math.PI/2;}
 b.ring(.2,.018,m.brass,0,.72,0,shade);b.ring(.2,.018,m.brass,0,0,0,shade);b.mesh(new T.CylinderGeometry(.2,.2,.04,24),m.endgrain,0,-.02,0,shade);b.mesh(new T.SphereGeometry(.09,12,8),m.lamp,0,.27,0,shade);b.mesh(new T.PlaneGeometry(.08,.38),m.linen,0,-.24,0,shade);root.add(shade);
 for(const y of [-.05,.75]){b.mesh(new T.CylinderGeometry(.22,.2,.025,24),m.brass,0,y,0,shade);b.mesh(new T.CylinderGeometry(.13,.13,.06,20),m.endgrain,0,y+(y<0?-.035:.035),0,shade);}
 for(let j=0;j<5;j++){const a=j*Math.PI*.4;b.rod([Math.cos(a)*.032,-.09,Math.sin(a)*.032],[Math.cos(a)*.04,-.24,Math.sin(a)*.04],.006,m.endgrain,shade);}
 // The diffuser and the woven outer frame are separate silhouettes.
 for(let j=0;j<6;j++){const a=j*Math.PI/3;b.rod([Math.cos(a)*.21,.73,Math.sin(a)*.21],[0,.89,0],.008,m.brass,shade);}
}
function makeTeaService(b,m,x,y,z){
 const pot=b.oval(m.darkStone,x,y+.24,z,.32,.26,.28);pot.name='ceramic-teapot';b.ring(.18,.025,m.brass,x,y+.46,z);b.oval(m.darkStone,x,y+.5,z,.2,.04,.18);b.oval(m.brass,x,y+.56,z,.045,.05,.045);
 b.tube([[x+.22,y+.22,z],[x+.48,y+.3,z],[x+.53,y+.43,z]],.055,m.darkStone);
 const handle=b.mesh(new T.TorusGeometry(.23,.035,8,24),m.endgrain,x-.3,y+.28,z);handle.rotation.y=Math.PI/2;
 for(const [dx,dz]of [[-.75,-.15],[.65,.25],[0,.65]]){b.mesh(new T.CylinderGeometry(.21,.21,.03,24),m.brass,x+dx,y+.02,z+dz);b.mesh(new T.LatheGeometry([[.1,0],[.14,.03],[.16,.23],[.14,.25],[.12,.23],[.1,.05]].map(p=>new T.Vector2(...p)),24),m.cream,x+dx,y+.035,z+dz);const tea=b.mesh(new T.CircleGeometry(.12,24),m.endgrain,x+dx,y+.26,z+dz);tea.rotation.x=-Math.PI/2;}
}

function buildRyokan(root,m){
 const room=interiorRooms.ryokan,H=room.ceiling,shojiTop=Math.min(5.95,H-.65);
 m.cedar.color.set('#aa8c67');m.lightWood.color.set('#cdb58d');m.endgrain.color.set('#5b4736');m.cream.color.set('#ece2cb');m.tatami.color.set('#b1ad87');m.darkStone.color.set('#485550');m.stone.color.set('#92998b');
 m.cedar.roughness=.68;m.lightWood.roughness=.57;m.endgrain.roughness=.7;
 for(const material of [m.cedar,m.lightWood,m.endgrain])ryokanFinish(material);for(const material of [m.darkStone,m.stone])ryokanFinish(material,'stone');ryokanFinish(m.cream,'plaster');ryokanFinish(m.glass,'paper');ryokanFinish(m.lamp,'paper');ryokanFinish(m.tatami,'tatami');
 const windowTime={value:0};
 const b=makeBuilder(root),walls=[],ceil=new T.Group();ceil.name='ryokan-cutaway-ceiling';ceil.userData.keepGroup=true;root.add(ceil);const cb=makeBuilder(ceil);
 b.box(room.rx*2,.28,room.rz*2,m.endgrain,0,-.05,0);b.box(room.rx*2-.4,.035,room.rz*2-.4,m.cedar,0,.072,0);
 for(let i=0;i<60;i++){const x=-20.65+i*.7;b.box(.008,.006,33.5,m.endgrain,x,.092,0);for(let j=0;j<8;j++)b.box(.68,.007,.008,m.endgrain,x+.24,.094,-16+(j+.5*(i%2))*4.2);}
 // Quiet central circulation is 8 m wide, framed by actual occupied rooms.
 for(const x of [-3.8,3.8])b.box(.035,.008,30,m.brass,x,.097,0);
 for(const side of [-1,1]){
  const wall=new T.Group();wall.name='ryokan-cutaway-wall-'+(side<0?'west':'east');wall.userData.keepGroup=true;wall.userData.cutawayAxis='x';wall.userData.cutawaySign=side;root.add(wall);walls.push(wall);const wb=makeBuilder(wall),x=side*(room.rx-.1);
  // A continuous opaque backing closes the taller room. Human-scale shoji
  // stays below the plaster frieze, instead of stretching into a huge window.
  wb.box(.22,H,room.rz*2,m.cream,x,H/2+.09,0);
  wb.box(.25,1,room.rz*2,m.cedar,x-side*.05,.55,0);
  wb.box(.3,.24,room.rz*2,m.endgrain,x-side*.06,H-.13,0);
  wb.box(.27,.12,room.rz*2,m.endgrain,x-side*.08,shojiTop+.14,0);
  for(let j=0;j<9;j++){
   const z=-16+j*4;wb.box(.3,H-.24,.3,m.endgrain,x-side*.1,(H-.24)/2+.09,z);
   if(j<8){
    wb.box(.035,shojiTop-1.2,3.7,m.glass,x-side*.14,(shojiTop+1.2)/2,z+2);
    for(let n=1;n<5;n++)wb.box(.07,shojiTop-1.2,.045,m.lightWood,x-side*.2,(shojiTop+1.2)/2,z+n*.8);
    for(const y of [1.2,3.5,shojiTop])wb.box(.09,.055,4,m.lightWood,x-side*.21,y,z+2);
    for(const dz of [.7,2,3.3])wb.box(.055,H-shojiTop-.7,.075,m.lightWood,x-side*.14,(H+shojiTop)/2,z+dz);
   }
  }
  const windowZ=side<0?[6,10]:[-10,-6];
  for(const z of windowZ)wall.add(ryokanWindow(wb,m,side*(room.rx-.38),3.1,z,3.6,3.25,-side*Math.PI/2,windowTime));
  mergeFinish(wall);
 }
 for(const side of [-1,1]){
  const wall=new T.Group();wall.name='ryokan-cutaway-wall-'+(side<0?'north':'south');wall.userData.keepGroup=true;wall.userData.cutawayAxis='z';wall.userData.cutawaySign=side;root.add(wall);walls.push(wall);const wb=makeBuilder(wall),z=side*(room.rz-.1);
  if(side<0){wb.box(42,H-aquariumLayout.height-.55,.45,m.cream,0,(H+aquariumLayout.height+.55)/2,z);for(const x of [-20.3,20.3])wb.box(1.4,H,.6,m.cedar,x,H/2,z);wb.box(39,.12,.16,m.lamp,0,9.6,z+.25);mergeFinish(wall);continue;}
  for(const sx of [-1,1]){
   wb.box(17.6,H,.22,m.cream,sx*12.1,H/2+.09,z);
   wb.box(17.6,1,.25,m.cedar,sx*12.1,.55,z-side*.03);
   wb.box(17.6,shojiTop-1.2,.03,m.glass,sx*12.1,(shojiTop+1.2)/2,z-side*.14);
   wb.box(17.6,.24,.28,m.endgrain,sx*12.1,H-.13,z-side*.06);
   wb.box(17.6,.12,.24,m.endgrain,sx*12.1,shojiTop+.14,z-side*.08);
   for(let i=0;i<9;i++)wb.box(.075,H-.35,.1,m.lightWood,sx*(3.4+i*2),(H-.35)/2+.18,z-side*.2);
   for(const y of [1.2,3.5,shojiTop])wb.box(17.6,.055,.1,m.lightWood,sx*12.1,y,z-side*.21);
  }
  for(const x of [-3.25,3.25])wb.box(.32,H-.15,.32,m.endgrain,x,(H-.15)/2+.09,z-side*.1);
  // Only the south doorway opens; the upper transom remains opaque at any
  // ceiling height. Sliding leaves keep their original opening and animation.
  wb.box(6.5,H-4.03,.22,m.cream,0,(H+4.03)/2,z);
  wb.box(6.5,.2,.28,m.endgrain,0,4.04,z-side*.13);
  wb.box(6.5,.24,.28,m.endgrain,0,H-.13,z-side*.06);
  if(side>0){for(const x of [-1.65,1.65])wb.box(3.1,1.6,.035,m.linen,x,4.65,z-.15);wb.ring(.43,.025,m.brass,0,4.7,z-.2).rotation.x=0;}
  else{wb.box(6.2,4.03,.22,m.glass,0,2.06,z);for(const x of [-2,0,2])wb.box(.06,4.03,.09,m.lightWood,x,2.06,z+.16);}
  mergeFinish(wall);
 }
 // The camera cap is H-.45. All roof joinery remains above H-.28 so its
 // upward clearance no longer collides with the former 6.7 m floating beams.
 for(const x of [-19.9,19.9])cb.box(.09,.035,31,m.lamp,x,H-.22,0);
 cb.box(room.rx*2,.2,room.rz*2,m.cream,0,H+.1,0);
 for(const z of [-16,-8,0,8,16])cb.box(room.rx*2,.28,.3,m.endgrain,0,H-.1,z);
 for(const x of [-14,-7,0,7,14])cb.box(.22,.14,room.rz*2,m.lightWood,x,H-.2,0);
 const partitions=new T.Group();partitions.name='ryokan-room-screens';root.add(partitions);const pb=makeBuilder(partitions);
 for(const o of ryokanFixtures.filter(o=>o.id.includes('wall')||o.id==='tatami-screen')){pb.box(o.rx*2,.9,o.rz*2,m.cream,o.x,.54,o.z);const horizontal=o.rx>o.rz,length=horizontal?o.rx*2:o.rz*2;for(let i=0;i<=length/.38;i++)pb.box(horizontal?.045:.32,1.0,horizontal?.32:.045,m.endgrain,o.x+(horizontal?-o.rx+i*.38:0),.59,o.z+(horizontal?0:-o.rz+i*.38));pb.box(o.rx*2+.06,.12,o.rz*2+.06,m.lightWood,o.x,1.12,o.z);}
 mergeFinish(partitions);
 // Genkan stone inlay and a narrow brass threshold are flush with the walkable floor.
 b.box(7.3,.009,6.8,m.darkStone,0,.1,12.9);for(const x of [-3.65,3.65])b.box(.035,.012,6.8,m.brass,x,.106,12.9);
 for(let i=0;i<6;i++)b.box(7.2,.004,.012,m.stone,0,.107,10.15+i*1.05);
 // Tatami mats have woven linework and sewn cloth borders at actual floor height.
 for(let x=8;x<=17;x+=3)for(let z=-13;z<=-4;z+=3){b.box(2.95,.025,2.95,m.tatami,x,.108,z);for(const side of [-1,1])b.box(.085,.01,2.95,m.tatamiEdge,x+side*1.41,.128,z);for(let i=0;i<18;i++)b.box(2.7,.004,.009,m.sage,x,.13,z-1.4+i*.16);}
 const table=(id,material)=>{const o=ryokanFixtures.find(o=>o.id===id);roundedRyokanSlab(b,material,o.rx*2,.18,o.rz*2,o.x,.73,o.z,.16);for(const x of [-o.rx+.25,o.rx-.25])for(const z of [-o.rz+.25,o.rz-.25])b.box(.13,.54,.13,m.endgrain,o.x+x,.38,o.z+z);makeTeaService(b,m,o.x,.83,o.z);};table('tea-table',m.lightWood);table('tatami-table',m.cedar);
 for(const [x,z]of [[9,-6],[15,-6],[9,-12],[15,-12],[-14,4.6],[-12,4.6]]){const pillow=b.oval(m.linen,x,.2,z,.8,.11,.65);pillow.rotation.y=.08;for(const side of [-1,1])b.box(.025,.01,1.05,m.tatamiEdge,x+side*.58,.3,z);}
 for(const o of ryokanFixtures.filter(o=>o.id.includes('bench'))){b.box(o.rx*2,.5,o.rz*2,m.endgrain,o.x,.35,o.z);const alongX=o.rx>o.rz,n=Math.ceil((alongX?o.rz:o.rx)*2/.2);for(let j=0;j<n;j++)b.box(alongX?o.rx*2:.17,o.id.includes('sauna')?.075:.055,alongX?.17:o.rz*2,m.lightWood,o.x+(alongX?0:-o.rx+.1+j*.2),o.id.includes('sauna')?.64:.62,o.z+(alongX?-o.rz+.1+j*.2:0));if(o.id.includes('sauna')){b.box(o.rx*2,.25,o.rz*1.3,m.cedar,o.x,.45,o.z+.35);for(const j of [-1,1])b.box(.85,.06,.55,m.linen,o.x+(alongX?j*.94:0),.71,o.z+(alongX?0:j*.94));}}
 // Reception has a bowed front, joinery, luggage niche and a discreet lamp.
 const desk=ryokanFixtures.find(o=>o.id==='reception');b.box(8,1.15,2.2,m.endgrain,desk.x,.67,desk.z);for(let i=0;i<40;i++){const x=desk.x-3.9+i*.2,z=desk.z+1.025+.025*Math.cos((i/39-.5)*Math.PI);b.box(.12,1.05,.09,m.lightWood,x,.67,z);}roundedRyokanSlab(b,m.darkStone,7.98,.13,2.18,desk.x,1.32,desk.z,.18);makeLantern(root,b,m,16,1.39,10,.6);b.box(1.3,.06,.75,m.cream,12,1.42,10);
 // A clear front aisle serves the dining counter, separate from reception and the tatami route.
 const counter=ryokanFixtures.find(o=>o.id==='omakase-counter');roundedRyokanSlab(b,m.lightWood,7.98,.18,1.78,counter.x,1.06,counter.z,.15);b.box(7.7,.85,1.55,m.cedar,counter.x,.55,counter.z);
 for(let i=0;i<34;i++)b.box(.09,.8,.035,m.endgrain,8.2+i*.23,.55,.79);
 for(const x of [10,12,14]){b.mesh(new T.CylinderGeometry(.45,.48,.12,32),m.linen,x,.69,2.1);b.mesh(new T.CylinderGeometry(.31,.34,.53,20),m.endgrain,x,.365,2.1);b.ring(.4,.025,m.brass,x,.47,2.1);b.mesh(new T.LatheGeometry([[.13,0],[.2,.05],[.21,.16],[.18,.19],[.15,.05]].map(p=>new T.Vector2(...p)),24),m.darkStone,x+.75,1.15,.1);b.rod([x-.6,H-.32,.1],[x-.6,H-1.2,.1],.014,m.endgrain);makeLantern(root,b,m,x-.6,H-1.82,.1,.8);}
 // Layered shoji panels slide from a clear doorway; the collision opening remains unchanged.
 const doors=[];for(const side of [-1,1]){const door=new T.Group();door.name='ryokan-sliding-door';door.userData.keepGroup=true;door.position.set(side*1.55,0,16.6);root.add(door);const db=makeBuilder(door);db.box(2.9,3.8,.07,m.cream,0,2.0,0);for(const x of [-1.43,1.43])db.box(.09,3.9,.12,m.endgrain,x,2,0);for(const y of [.1,1.4,2.7,3.95])db.box(2.9,.065,.12,m.endgrain,0,y,0);for(let i=-3;i<=3;i++)db.box(.03,3.8,.1,m.lightWood,i*.36,2,0);db.box(.04,.23,.04,m.brass,-side*1.1,1.9,-.08);mergeFinish(door);doors.push({root:door,side});}
 const stove=ryokanFixtures.find(o=>o.id==='sauna-stove');b.mesh(new T.CylinderGeometry(.8,.9,1.2,24),m.darkStone,stove.x,.7,stove.z);const hotRockGeometry=new T.IcosahedronGeometry(1,2),hotRockPositions=hotRockGeometry.attributes.position;for(let i=0;i<hotRockPositions.count;i++){const x=hotRockPositions.getX(i),y=hotRockPositions.getY(i),z=hotRockPositions.getZ(i),r=1+.1*Math.sin(x*8+y*11+z*7);hotRockPositions.setXYZ(i,x*r,y*r,z*r);}hotRockGeometry.computeVertexNormals();for(let i=0;i<24;i++){const a=i*2.399,r=.64*Math.sqrt(i/24),rock=b.mesh(hotRockGeometry,m.darkStone,stove.x+Math.cos(a)*r,1.32+(i%3)*.075,stove.z+Math.sin(a)*r);rock.scale.set(.23,.14,.21);rock.rotation.set(i*.3,i*.7,i*.1);}for(let j=0;j<20;j++){const a=j*Math.PI/10;b.rod([stove.x+Math.cos(a)*1,.2,stove.z+Math.sin(a)*1],[stove.x+Math.cos(a)*1,1.45,stove.z+Math.sin(a)*1],.035,m.cedar);}b.ring(1,.04,m.lightWood,stove.x,1.45,stove.z);
 const bath=ryokanFixtures.find(o=>o.id==='footbath');
 roundedRyokanSlab(b,m.darkStone,9.2,.32,4.7,bath.x,.23,bath.z,.55);
 const footWater=createOnsenWater({interior:true,rect:true,color:'#2b5b58',lights:[[0,5.5,-6],[-12,5.5,-8],[12,5.5,-8]],basin:[0,-11,4.1,1.9]});
 const waterGeo=new T.PlaneGeometry(8.3,3.85,32,16);waterGeo.rotateX(-Math.PI/2);waterGeo.translate(bath.x,.5,bath.z);b.mesh(waterGeo,footWater.material).name='ryokan-footbath-water';
 buildFootbathMasonry(b,m,bath);
 for(const o of ryokanFixtures.filter(o=>['locker','tatami-cabinet'].includes(o.id))){b.box(o.rx*2,1.8,o.rz*2,m.cedar,o.x,1,o.z);for(let i=0;i<4;i++)for(let j=0;j<3;j++){const xx=o.x-o.rx+.5+i*(o.rx*2/4),y=.5+j*.55;b.box(o.rx*.43,.5,.04,m.lightWood,xx,y,o.z+o.rz+.035);b.oval(m.brass,xx+.12,y,o.z+o.rz+.065,.025,.025,.015);}}
 for(const p of ryokanFixtures.filter(o=>o.id.startsWith('planter')))makePlanter(b,m,p.x,p.z);
 for(const [x,z]of [[-12,7],[12,10],[-12,-8],[12,-8]]){const y=H-3.7;makeLantern(root,b,m,x,y,z,1.35);b.rod([x,H-.3,z],[x,y+1.2,z],.018,m.endgrain);b.mesh(new T.CylinderGeometry(.2,.2,.07,24),m.brass,x,H-.25,z);for(let i=0;i<5;i++)b.mesh(new T.TorusGeometry(.035,.009,4,12),m.lightWood,x,y+1.25+i*.06,z).rotation.x=Math.PI/2;}
 addRyokanCraft(root,m,{room,ceiling:ceil});mergeFinish(ceil);ceil.traverse(o=>{o.castShadow=false;});// the key light shines through the roof plane
 const aquarium=buildRyokanAquarium(root,m),chef=buildRyokanChef(root,m);
 // Local pools keep the room intimate; the aquarium remains the strongest source.
 for(const [x,y,z,power,range]of [[-13,2.4,7,30,10],[12,2.6,-9,24,9],[12,3,.1,26,13],[-13,2.3,-11,22,9],[15,2.2,10,24,9]]){const lamp=new T.PointLight('#ffd1a0',power,range,2);lamp.position.set(x,y,z);root.add(lamp);}
 const fill=new T.HemisphereLight('#ffe8cc','#8a8f9c',.44);root.add(fill);// cooler bounce keeps shadowed undersides from going flat amber
 const atmosphere=createRetreatAtmosphere(root,{name:'ryokan',
  waters:[],
  fireflies:[{x:12,y:2.1,z:-9,rx:4,rz:3,height:2.3,size:.06,count:18,color:'#f0d8a5'},{x:-13,y:1.5,z:7,rx:3,rz:2,height:2,size:.05,count:12,color:'#e8d2b1'}],
  vapour:[{x:bath.x,y:.52,z:bath.z-.5,rx:3.7,rz:1.6,rise:1.25,size:.9,count:20,opacity:.11},{x:-13,y:1.15,z:7,rx:.12,rz:.12,rise:.8,size:.3,count:16,opacity:.13},{x:12,y:1.15,z:-9,rx:.12,rz:.12,rise:.8,size:.3,count:16,opacity:.13},{x:stove.x,y:1.5,z:stove.z,rx:.55,rz:.55,rise:1.9,size:.8,count:28,opacity:.12}],
  lamps:[...[[-12,7],[12,10],[-12,-8],[12,-8],[0,-6],[0,8]].map(([x,z])=>({x,y:.143,z,rx:3.3,rz:2.5})),
   // cold snow-light falling in from the four scenic windows
   ...[[-18.2,6],[-18.2,10],[18.2,-10],[18.2,-6]].map(([x,z])=>({x,y:.144,z,rx:2.9,rz:1.75,color:'#7fa6e6'}))]
 });
 let lastRipple=-Infinity;
 mergeFinish(root);
 // Cut-away walls and doors are hidden whenever the camera passes behind them; if they cast shadows the
 // room's lighting would change with the camera, so the key light ignores them.
 for(const hidden of [...walls,...doors.map(d=>d.root)])hidden.traverse(o=>{o.castShadow=false;});
 root.traverse(o=>{if(o.material===m.lamp)o.castShadow=false;});// glowing paper shades must not drop dark blots on the floor
 return{root,walls,doors,doorOpen:0,ceiling:ceil,uniforms:[],atmosphere,update:(t,still,p)=>{footWater.update(t,still);if(!still)windowTime.value=t;if(!still&&t-lastRipple>1.1){const guests=[p,...(globalThis.window?.labRideSeats||[]).filter(r=>r.id!==globalThis.window?.labGuestId&&r.kind==='bench').map(r=>sharedSeatPose(r,serverNow()))].filter(g=>g?.mode==='footbath'&&Math.abs(g.x-400)<4.6&&Math.abs(g.z+11)<3);for(const g of guests)footWater.ripple(g.x-400,g.z+Math.cos(g.yaw)*.45,.22);if(guests.length)lastRipple=t;}aquarium.update(t,still,p);chef.update(t,still,p);},setQuality:q=>{aquarium.setQuality(q);chef.setQuality(q);footWater.setQuality(q);},dispose:()=>{aquarium.dispose();chef.dispose();}};
}

export function buildInteriors(scene,{lazy=false,onLoad=()=>{},onRelease=()=>{},retainMs=90000}={}){
 const root=new T.Group();root.name='independent-interiors';root.visible=false;scene.add(root);const rooms={},occluders=[];
 let active=null,quality='medium',lastUsed=0;
 function ensure(id){if(rooms[id])return rooms[id];const layout=interiorRooms[id];if(!layout)return null;const roomRoot=new T.Group();roomRoot.name=id+'-interior';roomRoot.position.set(layout.x,0,layout.z);roomRoot.visible=false;root.add(roomRoot);const palette=materials();if(id==='ryokan'){palette.glass.transparent=false;palette.glass.opacity=1;palette.glass.color.set('#dfd6bd');palette.glass.emissive.set('#e3b779');palette.glass.emissiveIntensity=.07;}const asset=(id==='museum'?buildMuseumInterior:buildRyokan)(roomRoot,palette);asset.atmosphere.setQuality(quality);asset.setQuality?.(quality);rooms[id]={...asset,layout};roomRoot.traverse(o=>{if(o.isMesh&&!o.material.transparent&&!o.material.isShaderMaterial)occluders.push(o);});onLoad(roomRoot);return rooms[id];}
 if(!lazy)for(const id of Object.keys(interiorRooms))ensure(id);
 function release(id){const room=rooms[id];if(!room||id===active)return false;onRelease(room.root);for(let i=occluders.length-1;i>=0;i--){let node=occluders[i];while(node&&node!==room.root)node=node.parent;if(node)occluders.splice(i,1);}room.dispose?.();room.atmosphere.dispose();disposeOwnedScene(room.root);delete rooms[id];return true;}
 function maintain(now,nearEntrance=false){if(active||nearEntrance)lastUsed=now;if(lazy&&!active&&!nearEntrance&&now-lastUsed>retainMs)for(const id of Object.keys(rooms))release(id);}
 function setActive(id){active=id&&ensure(id)?id:null;root.visible=!!active;for(const [key,room]of Object.entries(rooms)){room.root.visible=key===active;room.setActive?.(key===active);}}
 function setCamera(position,camera,pixelRatio){const room=rooms[active];if(!room||!position)return;position.y=Math.min(position.y,room.layout.ceiling-.45);
 room.setView?.(camera,pixelRatio);
 const bounds=room.layout,dx=position.x-bounds.x,dz=position.z-bounds.z;
 if(bounds.shape==='ellipse'){const curve=Math.sqrt(Math.max(.2,1-(Math.max(0,position.y)/bounds.ceiling)**2)),rx=(bounds.rx-1)*curve,rz=(bounds.rz-1)*curve,r=Math.hypot(dx/rx,dz/rz);if(r>1){position.x=bounds.x+dx/r;position.z=bounds.z+dz/r;}}
 else{position.x=Math.max(bounds.x-bounds.rx+1,Math.min(bounds.x+bounds.rx-1,position.x));position.z=Math.max(bounds.z-bounds.rz+1,Math.min(bounds.z+bounds.rz-1,position.z));}
 if(active==='museum'){const r=Math.hypot(position.x-bounds.x,position.z-bounds.z);position.y=Math.min(position.y,5.5+Math.sqrt(Math.max(0,21.6**2-r*r)));}
 const local={x:position.x-room.layout.x,z:position.z-room.layout.z};for(const wall of room.walls){const axis=wall.userData.cutawayAxis,sign=wall.userData.cutawaySign;wall.visible=true;}if(room.ceiling)room.ceiling.visible=true;}
 function update(time,still=false,quality){const room=rooms[active];if(!room)return;if(!still)for(const u of room.uniforms||[])u.time.value=time;room.atmosphere.update(time,still,quality);room.update?.(time,still,globalThis.window?.labPlayerState);const p=globalThis.window?.labPlayerState,near=active==='ryokan'&&!!p&&Math.hypot(p.x-room.layout.x,p.z-16.6)<7;if(near!==room.doorNear){room.doorNear=near;globalThis.window?.labSound?.('sliding-door');}const dt=Math.min(.1,Math.max(0,time-(room.doorTime??time)));room.doorTime=time;room.doorOpen+=(Number(near)-room.doorOpen)*(still?1:1-Math.exp(-8*dt));for(const d of room.doors)d.root.position.x=d.side*(1.55+room.doorOpen*2.7);}
 function setQuality(value){quality=value;for(const room of Object.values(rooms)){room.atmosphere.setQuality(value);room.setQuality?.(value);}}
 return{react(id,time){rooms.museum?.react?.(id,time);},puzzle(steps){rooms.museum?.puzzle?.(steps);},root,rooms,occluders,ensure,release,maintain,setActive,setCamera,update,setQuality,dispose(){active=null;for(const id of Object.keys(rooms))release(id);root.removeFromParent();},get active(){return active;}};
}
