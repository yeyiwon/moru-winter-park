import {buildMuseumInterior} from './museum-world.js';
import {buildRyokanChef} from './ryokan-chef.js';
import {buildRyokanAquarium} from './ryokan-aquarium.js';
import {createRyokanMeal} from './ryokan-meal.js';
import * as T from './vendor/three.module.js';
import {createRetreatAtmosphere} from './retreat-atmosphere.js';
import {interiorRooms,ryokanFixtures} from './interior-layout.js';
import {makeBuilder,mergeFinish,materials} from './architecture-kit.js';
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
function makeLantern(b,m,x,y,z,scale=1){
 b.mesh(new T.LatheGeometry([[.22,0],[.34,.14],[.35,.5],[.25,.72]].map(v=>new T.Vector2(...v)),20),m.lamp,x,y,z).scale.setScalar(scale);
 for(let j=0;j<12;j++){const a=j*Math.PI/6;b.rod([x+Math.cos(a)*.34*scale,y+.1*scale,z+Math.sin(a)*.34*scale],[x+Math.cos(a)*.34*scale,y+.59*scale,z+Math.sin(a)*.34*scale],.013*scale,m.endgrain);}
 b.ring(.25*scale,.022*scale,m.brass,x,y+.72*scale,z);b.ring(.23*scale,.02*scale,m.brass,x,y,z);
}
function makeTeaService(b,m,x,y,z){
 const pot=b.oval(m.darkStone,x,y+.24,z,.32,.26,.28);pot.name='ceramic-teapot';b.ring(.18,.025,m.brass,x,y+.46,z);b.oval(m.darkStone,x,y+.5,z,.2,.04,.18);b.oval(m.brass,x,y+.56,z,.045,.05,.045);
 b.tube([[x+.22,y+.22,z],[x+.48,y+.3,z],[x+.53,y+.43,z]],.055,m.darkStone);
 const handle=b.mesh(new T.TorusGeometry(.23,.035,8,24),m.endgrain,x-.3,y+.28,z);handle.rotation.y=Math.PI/2;
 for(const [dx,dz]of [[-.75,-.15],[.65,.25],[0,.65]]){b.mesh(new T.CylinderGeometry(.21,.21,.03,24),m.brass,x+dx,y+.02,z+dz);b.mesh(new T.LatheGeometry([[.1,0],[.14,.03],[.16,.23],[.14,.25],[.12,.23],[.1,.05]].map(p=>new T.Vector2(...p)),24),m.cream,x+dx,y+.035,z+dz);const tea=b.mesh(new T.CircleGeometry(.12,24),m.endgrain,x+dx,y+.26,z+dz);tea.rotation.x=-Math.PI/2;}
}

function buildRyokan(root,m){
 const b=makeBuilder(root),walls=[],ceil=new T.Group();ceil.name='ryokan-cutaway-ceiling';ceil.userData.keepGroup=true;root.add(ceil);const cb=makeBuilder(ceil);
 b.box(42,.28,34,m.endgrain,0,-.05,0);b.box(41.6,.035,33.6,m.cedar,0,.072,0);
 for(let i=0;i<84;i++){const x=-20.75+i*.5;b.box(.012,.006,33.5,m.endgrain,x,.092,0);for(let j=0;j<8;j++)b.box(.48,.007,.012,m.endgrain,x+.24,.094,-16+(j+.5*(i%2))*4.2);}
 // Quiet central circulation is 8 m wide, framed by actual occupied rooms.
 for(const x of [-3.8,3.8])b.box(.035,.008,30,m.brass,x,.097,0);
 for(const side of [-1,1]){const wall=new T.Group();wall.name='ryokan-cutaway-wall-'+(side<0?'west':'east');wall.userData.keepGroup=true;wall.userData.cutawayAxis='x';wall.userData.cutawaySign=side;root.add(wall);walls.push(wall);const wb=makeBuilder(wall);
  wb.box(.22,1,34,m.cedar,side*20.9,.55,0);wb.box(.26,.35,34,m.endgrain,side*20.9,6.7,0);
  for(let j=0;j<9;j++){const z=-16+j*4;wb.box(.3,6.5,.3,m.endgrain,side*20.8,3.35,z);if(j<8){wb.box(.035,4.7,3.7,m.glass,side*20.9,3.5,z+2);for(let n=1;n<5;n++)wb.box(.07,4.8,.045,m.lightWood,side*20.74,3.5,z+n*.8);for(const y of [1.15,3.5,5.85])wb.box(.09,.055,4,m.lightWood,side*20.73,y,z+2);}}
  mergeFinish(wall);
 }
 for(const side of [-1,1]){const wall=new T.Group();wall.name='ryokan-cutaway-wall-'+(side<0?'north':'south');wall.userData.keepGroup=true;wall.userData.cutawayAxis='z';wall.userData.cutawaySign=side;root.add(wall);walls.push(wall);const wb=makeBuilder(wall);
  for(const sx of [-1,1]){wb.box(17.6,1,.22,m.cedar,sx*12.1,.55,side*16.9);wb.box(17.6,4.8,.03,m.glass,sx*12.1,3.5,side*16.9);wb.box(17.6,.35,.28,m.endgrain,sx*12.1,6.7,side*16.9);for(let i=0;i<9;i++)wb.box(.075,5.7,.1,m.lightWood,sx*(3.4+i*2),3.8,side*16.76);for(const y of [1.15,3.5,5.85])wb.box(17.6,.055,.1,m.lightWood,sx*12.1,y,side*16.75);}
  for(const x of [-3.25,3.25])wb.box(.32,6.5,.32,m.endgrain,x,3.35,side*16.8);
  wb.box(6.5,1.05,.2,m.endgrain,0,6.25,side*16.8);if(side>0){for(const x of [-1.65,1.65])wb.box(3.1,1.6,.035,m.linen,x,4.65,16.75);wb.ring(.43,.025,m.brass,0,4.7,16.7).rotation.x=0;}
  else{wb.box(6.2,5.5,.025,m.glass,0,3.2,-16.9);for(const x of [-2,0,2])wb.box(.06,5.5,.09,m.lightWood,x,3.2,-16.8);}
  mergeFinish(wall);
 }
 cb.box(42,.15,34,m.cream,0,7.25,0);for(const z of [-16,-8,0,8,16]){cb.box(42,.32,.3,m.endgrain,0,7.04,z);for(const x of [-14,-7,0,7,14])cb.box(.22,.3,34,m.lightWood,x,6.8,0);}mergeFinish(ceil);
 const partitions=new T.Group();partitions.name='ryokan-room-screens';root.add(partitions);const pb=makeBuilder(partitions);
 for(const o of ryokanFixtures.filter(o=>o.id.includes('wall')||o.id==='tatami-screen')){pb.box(o.rx*2,2.5,o.rz*2,m.cream,o.x,1.34,o.z);const horizontal=o.rx>o.rz,length=horizontal?o.rx*2:o.rz*2;for(let i=0;i<=length/.38;i++)pb.box(horizontal?.045:.32,2.6,horizontal?.32:.045,m.endgrain,o.x+(horizontal?-o.rx+i*.38:0),1.39,o.z+(horizontal?0:-o.rz+i*.38));pb.box(o.rx*2+.06,.12,o.rz*2+.06,m.lightWood,o.x,2.68,o.z);}
 mergeFinish(partitions);
 // Tatami mats have woven linework and sewn cloth borders at actual floor height.
 for(let x=8;x<=17;x+=3)for(let z=-13;z<=-4;z+=3){b.box(2.95,.025,2.95,m.tatami,x,.108,z);for(const side of [-1,1])b.box(.085,.01,2.95,m.tatamiEdge,x+side*1.41,.128,z);for(let i=0;i<18;i++)b.box(2.7,.004,.009,m.sage,x,.13,z-1.4+i*.16);}
 const table=(id,material)=>{const o=ryokanFixtures.find(o=>o.id===id);b.box(o.rx*2,.18,o.rz*2,material,o.x,.73,o.z);for(const x of [-o.rx+.25,o.rx-.25])for(const z of [-o.rz+.25,o.rz-.25])b.box(.13,.54,.13,m.endgrain,o.x+x,.38,o.z+z);makeTeaService(b,m,o.x,.83,o.z);};table('tea-table',m.lightWood);table('tatami-table',m.cedar);
 for(const [x,z]of [[9,-6],[15,-6],[9,-12],[-13,4.6]]){const pillow=b.oval(m.linen,x,.2,z,.8,.11,.65);pillow.rotation.y=.08;for(const side of [-1,1])b.box(.025,.01,1.05,m.tatamiEdge,x+side*.58,.3,z);}
 for(const o of ryokanFixtures.filter(o=>o.id.includes('bench'))){b.box(o.rx*2,.5,o.rz*2,m.endgrain,o.x,.35,o.z);const alongX=o.rx>o.rz,n=Math.ceil((alongX?o.rz:o.rx)*2/.2);for(let j=0;j<n;j++)b.box(alongX?o.rx*2:.17,.075,alongX?.17:o.rz*2,m.lightWood,o.x+(alongX?0:-o.rx+.1+j*.2),.64,o.z+(alongX?-o.rz+.1+j*.2:0));if(o.id.includes('sauna')){b.box(o.rx*2,.25,o.rz*1.3,m.cedar,o.x,.45,o.z+.35);for(let j=-1;j<=1;j++)b.box(.85,.06,.55,m.linen,o.x+(alongX?j*2:0),.71,o.z+(alongX?0:j*2));}}
 // Reception has a bowed front, joinery, luggage niche and a discreet lamp.
 const desk=ryokanFixtures.find(o=>o.id==='reception');b.box(8,1.15,2.2,m.endgrain,desk.x,.67,desk.z);for(let i=0;i<40;i++){const x=desk.x-3.9+i*.2,z=desk.z+1.12+.12*Math.cos((i/39-.5)*Math.PI);b.box(.12,1.05,.09,m.lightWood,x,.67,z);}b.box(8.2,.13,2.45,m.darkStone,desk.x,1.32,desk.z);makeLantern(b,m,16,1.39,10,.6);b.box(1.3,.06,.75,m.cream,12,1.42,10);
 // A clear front aisle serves the dining counter, separate from reception and the tatami route.
 const counter=ryokanFixtures.find(o=>o.id==='omakase-counter');b.box(8.1,.18,1.9,m.lightWood,counter.x,1.06,counter.z);b.box(7.7,.85,1.55,m.cedar,counter.x,.55,counter.z);
 for(let i=0;i<34;i++)b.box(.09,.8,.035,m.endgrain,8.2+i*.23,.55,.79);
 for(const x of [10,12,14]){b.mesh(new T.CylinderGeometry(.45,.48,.12,32),m.linen,x,.69,2.1);b.mesh(new T.CylinderGeometry(.31,.34,.53,20),m.endgrain,x,.365,2.1);b.ring(.4,.025,m.brass,x,.47,2.1);const meal=createRyokanMeal();meal.position.set(x,1.15,.25);root.add(meal);b.mesh(new T.LatheGeometry([[.13,0],[.2,.05],[.21,.16],[.18,.19],[.15,.05]].map(p=>new T.Vector2(...p)),24),m.darkStone,x+.75,1.15,.1);b.rod([x-.6,6.6,.1],[x-.6,3.9,.1],.014,m.endgrain);makeLantern(b,m,x-.6,3.2,.1,.8);}
 // Layered shoji panels slide from a clear doorway; the collision opening remains unchanged.
 const doors=[];for(const side of [-1,1]){const door=new T.Group();door.name='ryokan-sliding-door';door.userData.keepGroup=true;door.position.set(side*1.55,0,16.6);root.add(door);const db=makeBuilder(door);db.box(2.9,3.8,.07,m.cream,0,2.0,0);for(const x of [-1.43,1.43])db.box(.09,3.9,.12,m.endgrain,x,2,0);for(const y of [.1,1.4,2.7,3.95])db.box(2.9,.065,.12,m.endgrain,0,y,0);for(let i=-3;i<=3;i++)db.box(.03,3.8,.1,m.lightWood,i*.36,2,0);db.box(.04,.23,.04,m.brass,-side*1.1,1.9,-.08);mergeFinish(door);doors.push({root:door,side});}
 const stove=ryokanFixtures.find(o=>o.id==='sauna-stove');b.mesh(new T.CylinderGeometry(.8,.9,1.2,24),m.darkStone,stove.x,.7,stove.z);for(let i=0;i<20;i++){const a=i*2.399,r=.65*Math.sqrt(i/20);b.oval(m.stone,stove.x+Math.cos(a)*r,1.32+(i%3)*.08,stove.z+Math.sin(a)*r,.24,.16,.22);}for(let j=0;j<20;j++){const a=j*Math.PI/10;b.rod([stove.x+Math.cos(a)*1,.2,stove.z+Math.sin(a)*1],[stove.x+Math.cos(a)*1,1.45,stove.z+Math.sin(a)*1],.035,m.cedar);}b.ring(1,.04,m.lightWood,stove.x,1.45,stove.z);
 const bath=ryokanFixtures.find(o=>o.id==='footbath');b.box(bath.rx*2,.28,bath.rz*2,m.darkStone,bath.x,.16,bath.z);b.box(5.3,.035,3.5,m.water,bath.x,.32,bath.z);for(const z of [-1,1])b.box(6.2,.16,.45,m.cedar,bath.x,.41,bath.z+z*1.95);for(const x of [-1,1])b.box(.45,.16,3.5,m.cedar,bath.x+x*2.85,.41,bath.z);
 for(const o of ryokanFixtures.filter(o=>['locker','tatami-cabinet'].includes(o.id))){b.box(o.rx*2,1.8,o.rz*2,m.cedar,o.x,1,o.z);for(let i=0;i<4;i++)for(let j=0;j<3;j++){const xx=o.x-o.rx+.5+i*(o.rx*2/4),y=.5+j*.55;b.box(o.rx*.43,.5,.04,m.lightWood,xx,y,o.z+o.rz+.035);b.oval(m.brass,xx+.12,y,o.z+o.rz+.065,.025,.025,.015);}}
 for(const p of ryokanFixtures.filter(o=>o.id.startsWith('planter')))makePlanter(b,m,p.x,p.z);
 for(const [x,z]of [[-12,7],[12,10],[-12,-8],[12,-8],[0,-6],[0,8]]){makeLantern(b,m,x,5.25,z,1.1);b.rod([x,6.8,z],[x,6.05,z],.015,m.endgrain);}
 const aquarium=buildRyokanAquarium(root,m),chef=buildRyokanChef(root,m);
 const light=new T.PointLight('#ffc991',75,38,2);light.position.set(0,5,0);root.add(light);const fill=new T.HemisphereLight('#ffe4bf','#685743',1.5);root.add(fill);
 const atmosphere=createRetreatAtmosphere(root,{name:'ryokan',
  waters:[{x:bath.x,y:.344,z:bath.z,rx:2.64,rz:1.74,rect:true,lights:[[0,5.5,-6],[-12,5.5,-8],[12,5.5,-8]]}],
  vapour:[{x:bath.x,y:.34,z:bath.z-.5,rx:2.15,rz:1.05,rise:1.25,size:.9,count:20,opacity:.11},{x:-13,y:1.25,z:7,rx:.18,rz:.18,rise:.65,size:.32,count:6,opacity:.1},{x:12,y:1.38,z:.1,rx:.2,rz:.2,rise:.6,size:.26,count:5,opacity:.08},{x:12,y:1.25,z:-9,rx:.18,rz:.18,rise:.65,size:.32,count:6,opacity:.1},{x:stove.x,y:1.5,z:stove.z,rx:.65,rz:.65,rise:1.6,size:.6,count:8,opacity:.065}],
  lamps:[[-12,7],[12,10],[-12,-8],[12,-8],[0,-6],[0,8]].map(([x,z])=>({x,y:.143,z,rx:3.3,rz:2.5}))
 });
 mergeFinish(root);return{root,walls,doors,doorOpen:0,ceiling:ceil,uniforms:[],atmosphere,update:(t,still,p)=>{aquarium.update(t,still,p);chef.update(t,still,p);},setQuality:q=>aquarium.setQuality(q),dispose:()=>aquarium.dispose()};
}

export function buildInteriors(scene,{lazy=false,onLoad=()=>{},onRelease=()=>{},retainMs=90000}={}){
 const root=new T.Group();root.name='independent-interiors';root.visible=false;scene.add(root);const rooms={},occluders=[];
 let active=null,quality='medium',lastUsed=0;
 function ensure(id){if(rooms[id])return rooms[id];const layout=interiorRooms[id];if(!layout)return null;const roomRoot=new T.Group();roomRoot.name=id+'-interior';roomRoot.position.set(layout.x,0,layout.z);roomRoot.visible=false;root.add(roomRoot);const palette=materials();if(id==='ryokan'){palette.glass.transparent=false;palette.glass.opacity=1;palette.glass.color.set('#dfd6bd');palette.glass.emissive.set('#e3b779');palette.glass.emissiveIntensity=.07;}const asset=(id==='museum'?buildMuseumInterior:buildRyokan)(roomRoot,palette);asset.atmosphere.setQuality(quality);asset.setQuality?.(quality);rooms[id]={...asset,layout};roomRoot.traverse(o=>{if(o.isMesh&&!o.material.transparent&&!o.material.isShaderMaterial)occluders.push(o);});onLoad(roomRoot);return rooms[id];}
 if(!lazy)for(const id of Object.keys(interiorRooms))ensure(id);
 function release(id){const room=rooms[id];if(!room||id===active)return false;onRelease(room.root);for(let i=occluders.length-1;i>=0;i--){let node=occluders[i];while(node&&node!==room.root)node=node.parent;if(node)occluders.splice(i,1);}room.dispose?.();room.atmosphere.dispose();disposeOwnedScene(room.root);delete rooms[id];return true;}
 function maintain(now,nearEntrance=false){if(active||nearEntrance)lastUsed=now;if(lazy&&!active&&!nearEntrance&&now-lastUsed>retainMs)for(const id of Object.keys(rooms))release(id);}
 function setActive(id){active=id&&ensure(id)?id:null;root.visible=!!active;for(const [key,room]of Object.entries(rooms))room.root.visible=key===active;}
 function setCamera(position){const room=rooms[active];if(!room||!position)return;position.y=Math.min(position.y,room.layout.ceiling-.45);
 const bounds=room.layout,dx=position.x-bounds.x,dz=position.z-bounds.z;
 if(bounds.shape==='ellipse'){const curve=Math.sqrt(Math.max(.2,1-(Math.max(0,position.y)/bounds.ceiling)**2)),rx=(bounds.rx-1)*curve,rz=(bounds.rz-1)*curve,r=Math.hypot(dx/rx,dz/rz);if(r>1){position.x=bounds.x+dx/r;position.z=bounds.z+dz/r;}}
 else{position.x=Math.max(bounds.x-bounds.rx+1,Math.min(bounds.x+bounds.rx-1,position.x));position.z=Math.max(bounds.z-bounds.rz+1,Math.min(bounds.z+bounds.rz-1,position.z));}
 if(active==='museum'){const r=Math.hypot(position.x-bounds.x,position.z-bounds.z);position.y=Math.min(position.y,5.5+Math.sqrt(Math.max(0,21.6**2-r*r)));}
 const local={x:position.x-room.layout.x,z:position.z-room.layout.z};for(const wall of room.walls){const axis=wall.userData.cutawayAxis,sign=wall.userData.cutawaySign;wall.visible=true;}if(room.ceiling)room.ceiling.visible=true;}
 function update(time,still=false,quality){const room=rooms[active];if(!room)return;if(!still)for(const u of room.uniforms||[])u.time.value=time;room.atmosphere.update(time,still,quality);room.update?.(time,still,globalThis.window?.labPlayerState);const p=globalThis.window?.labPlayerState,near=active==='ryokan'&&!!p&&Math.hypot(p.x-room.layout.x,p.z-16.6)<7;if(near!==room.doorNear){room.doorNear=near;globalThis.window?.labSound?.('sliding-door');}const dt=Math.min(.1,Math.max(0,time-(room.doorTime??time)));room.doorTime=time;room.doorOpen+=(Number(near)-room.doorOpen)*(still?1:1-Math.exp(-8*dt));for(const d of room.doors)d.root.position.x=d.side*(1.55+room.doorOpen*2.7);}
 function setQuality(value){quality=value;for(const room of Object.values(rooms)){room.atmosphere.setQuality(value);room.setQuality?.(value);}}
 return{react(id,time){rooms.museum?.react?.(id,time);},puzzle(steps){rooms.museum?.puzzle?.(steps);},root,rooms,occluders,ensure,release,maintain,setActive,setCamera,update,setQuality,dispose(){active=null;for(const id of Object.keys(rooms))release(id);root.removeFromParent();},get active(){return active;}};
}
