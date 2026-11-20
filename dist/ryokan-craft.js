import * as T from './vendor/three.module.js';
import {makeBuilder} from './architecture-kit.js';
import {ryokanFixtures} from './interior-layout.js';

// Rounded joinery changes the silhouette without texture downloads or another
// renderer. All dimensions describe the finished, collision-safe outer edge.
export function roundedRyokanSlab(b,material,width,height,depth,x,y,z,radius=.12){
 const r=Math.min(radius,width/4,depth/4),w=width/2,d=depth/2,shape=new T.Shape();
 shape.moveTo(-w+r,-d);shape.lineTo(w-r,-d);shape.quadraticCurveTo(w,-d,w,-d+r);
 shape.lineTo(w,d-r);shape.quadraticCurveTo(w,d,w-r,d);shape.lineTo(-w+r,d);
 shape.quadraticCurveTo(-w,d,-w,d-r);shape.lineTo(-w,-d+r);shape.quadraticCurveTo(-w,-d,-w+r,-d);
 const geometry=new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,curveSegments:4,steps:1});
 geometry.rotateX(-Math.PI/2);
 return b.mesh(geometry,material,x,y-height/2,z);
}

// Every floor-standing addition stays inside an existing fixture. Nothing is
// placed in the central hall, the dining approach, or the aquarium viewing aisle.
// These meshes are intentionally not keepGroup: the room's final material batch
// absorbs them alongside the original cabinetry instead of adding one draw per slat.
export function addRyokanCraft(root,m,{room,ceiling}){
 const detail=new T.Group();detail.name='ryokan-crafted-finishes';root.add(detail);
 const b=makeBuilder(detail),cb=makeBuilder(ceiling),fixture=id=>ryokanFixtures.find(o=>o.id===id);
 detail.userData.fixtureIds=['reception','omakase-counter','chef-preparation','tea-table','tatami-table','tea-bench-back','tea-bench-side','footbath','aquarium','tatami-cabinet','locker'];

 // Four broad kumiko coffers give the room a clear rhythm. Their lowest edge
 // stays above the camera's ceiling-.45m envelope, including the luminous reveal.
 for(const x of [-12,12])for(const z of [-8,8]){
  cb.box(8.4,.045,7.6,m.lightWood,x,room.ceiling-.09,z);
  for(const side of [-1,1]){
   cb.box(8.4,.09,.13,m.endgrain,x,room.ceiling-.18,z+side*3.72);
   cb.box(.13,.09,7.6,m.endgrain,x+side*4.12,room.ceiling-.18,z);
   cb.box(7.9,.025,.045,m.lamp,x,room.ceiling-.23,z+side*3.43);
  }
  for(let j=-3;j<=3;j++){
   cb.box(7.9,.055,.04,m.cedar,x,room.ceiling-.185,z+j*.94);
   cb.box(.04,.055,7.0,m.cedar,x+j*1.1,room.ceiling-.185,z);
  }
 }

 // The preparation alcove is behind the chef, entirely inside its fixture.
 // Empty ceramic vessels and linens belong in the kitchen; guest meals are
 // created only by the existing synchronized chef handoff, never by this module.
 const prep=fixture('chef-preparation'),back=prep.z-prep.rz+.1;
 b.box(7.8,4.5,.16,m.cream,prep.x,2.34,back);
 for(const dx of [-3.82,3.82])b.box(.12,4.52,.2,m.endgrain,prep.x+dx,2.34,back+.04);
 for(let i=0;i<26;i++)b.box(.055,1.05,.075,m.cedar,prep.x-3.65+i*.292,4.01,back+.13);
 for(const y of [2.6,3.45]){
  roundedRyokanSlab(b,m.lightWood,7.55,.09,.48,prep.x,y,back+.27,.07);
  b.box(7.25,.022,.024,m.lamp,prep.x,y-.058,back+.43);
 }
 b.box(2.6,1.54,.025,m.linen,prep.x,1.78,back+.115);
 for(const y of [1,2.56])b.box(2.65,.055,.055,m.endgrain,prep.x,y,back+.15);
 // A restrained branch in the alcove replaces a wall of unrelated small props.
 b.tube([[prep.x-.55,1.22,back+.15],[prep.x+.12,1.65,back+.15],[prep.x-.08,2.06,back+.15],[prep.x+.5,2.35,back+.15]],.018,m.endgrain,undefined,14);
 for(const [dx,y]of [[-.2,1.55],[.2,1.9],[.35,2.23]]){
  const leaf=b.oval(m.sage,prep.x+dx,y,back+.165,.13,.055,.012);leaf.rotation.z=.65;
 }
 for(const [dx,scale]of [[-3.0,.6],[-2.25,.76],[2.45,.67],[3.13,.48]]){
  const jar=b.mesh(new T.LatheGeometry([[.17,0],[.24,.1],[.27,.42],[.18,.6],[.16,.64]].map(([x,y])=>new T.Vector2(x*scale,y*scale)),20),m.cream,prep.x+dx,2.65,back+.27);
  jar.name='ryokan-empty-kitchen-vessel';
  b.ring(.16*scale,.016,m.brass,prep.x+dx,2.65+.64*scale,back+.27);
 }
 for(const dx of [-2.7,2.7]){
  b.box(.84,.045,.34,m.linen,prep.x+dx,3.52,back+.27);
  b.box(.8,.045,.32,m.linen,prep.x+dx+.02,3.565,back+.27);
 }
 const counter=fixture('omakase-counter');
 b.box(7.5,.035,.018,m.lamp,counter.x,.92,counter.z+.786);
 b.box(7.5,.035,.022,m.brass,counter.x,.18,counter.z+.786);
 for(const x of [10,12,14]){
  // Empty place settings: folded cloth, chopstick rest and chopsticks only.
  b.box(.56,.025,.24,m.linen,x+.57,1.164,.49);
  b.oval(m.darkStone,x-.53,1.16,.5,.085,.035,.045);
  for(const z of [.49,.56])b.rod([x-.73,1.19,z],[x-.06,1.17,z],.013,m.endgrain);
 }

 // Cushioned engawa seats flank the existing tea table. Their upper surface
 // is exactly the authored seatY, so the seated avatar still rests on furniture.
 for(const id of ['tea-bench-back','tea-bench-side']){
  const seat=fixture(id),alongX=seat.rx>seat.rz;
  roundedRyokanSlab(b,m.linen,alongX?6.55:1.02,.03,alongX?1.02:4.75,seat.x,.6625,seat.z,.13);
  if(alongX){
   b.box(6.75,.85,.12,m.cedar,seat.x,1.075,seat.z+.55);
   b.box(6.46,.54,.04,m.linen,seat.x,1.12,seat.z+.47);
   b.box(6.6,.045,.15,m.lightWood,seat.x,1.52,seat.z+.54);
  }else{
   b.box(.12,.85,4.96,m.cedar,seat.x-.55,1.075,seat.z);
   b.box(.04,.54,4.65,m.linen,seat.x-.47,1.12,seat.z);
   b.box(.15,.045,4.9,m.lightWood,seat.x-.54,1.52,seat.z);
  }
 }
 for(const id of ['tea-table','tatami-table']){
  const table=fixture(id);
  roundedRyokanSlab(b,m.darkStone,1.85,.025,1.42,table.x,.835,table.z,.12);
  for(const side of [-1,1])b.box(.018,.018,1.2,m.brass,table.x+side*.8,.855,table.z);
 }

 const desk=fixture('reception');
 b.box(7.5,.025,.018,m.lamp,desk.x,1.24,desk.z+1.065);
 b.box(7.5,.025,.018,m.brass,desk.x,.17,desk.z+1.065);
 // Seasonal objects sit on existing cabinetry, keeping the shared walking/seat layout intact.
 const celadon=new T.MeshPhysicalMaterial({color:'#91aca0',roughness:.26,clearcoat:.7,clearcoatRoughness:.22}),plum=m.cream,petalGeo=new T.SphereGeometry(1,8,5);
 const vase=(x,y,z,scale=1)=>{const profile=[[.16,0],[.23,.035],[.29,.2],[.27,.42],[.15,.59],[.12,.7],[.105,.71],[.095,.68],[.13,.57],[.24,.4],[.24,.18],[.15,.045]].map(([r,h])=>new T.Vector2(r*scale,h*scale));b.mesh(new T.LatheGeometry(profile,32),celadon,x,y,z);};
 for(const [x,y,z,s]of [[16,1.39,10,1],[17.8,1.92,-13.5,1.5],[-14.8,.85,7,.7]]){
  vase(x,y,z,s);
  for(let j=0;j<3;j++){const a=j*2.1,dx=Math.cos(a)*s*.55,dz=Math.sin(a)*s*.32,top=y+s*(1.6+j*.24);b.tube([[x,y+s*.5,z],[x+dx*.3,y+s*1.08,z+dz*.4],[x+dx,top,z+dz]],.014*s,m.endgrain,undefined,10);
   for(let k=0;k<2;k++){const px=x+dx*(.6+k*.4),py=y+(top-y)*(.76+k*.24),pz=z+dz*(.6+k*.4);for(let petal=0;petal<5;petal++){const a=petal*Math.PI*.4,p=b.mesh(petalGeo,plum,px+Math.cos(a)*.055*s,py+Math.sin(a)*.055*s,pz);p.scale.set(.06*s,.043*s,.025*s);p.rotation.z=a;}b.oval(m.brass,px,py,pz+.02,.018*s,.018*s,.016*s);}
  }
 }
 // A small pine on the cabinet balances the blossom arrangement with a dark organic silhouette.
 const cabinet=fixture('locker');roundedRyokanSlab(b,m.darkStone,1.3,.14,.62,cabinet.x,1.98,cabinet.z,.12);
 b.tube([[cabinet.x,2.03,cabinet.z],[cabinet.x-.1,2.45,cabinet.z],[cabinet.x+.18,2.73,cabinet.z],[cabinet.x+.04,2.95,cabinet.z]],.045,m.endgrain,undefined,12);
 for(let j=0;j<7;j++){const a=j*2.4,r=.18+(j%3)*.11,x=cabinet.x+Math.cos(a)*r,z=cabinet.z+Math.sin(a)*r*.6,y=2.3+j*.1;b.rod([cabinet.x,y-.1,cabinet.z],[x,y,z],.025,m.endgrain);const foliage=b.mesh(new T.IcosahedronGeometry(1,1),m.green,x,y+.05,z);foliage.scale.set(.3,.13,.2);}
 // Towel rolls have visible spiral ends rather than flat stacked boxes.
 for(let j=0;j<3;j++){const x=17.1+j*.38,z=-13.25;b.mesh(new T.CylinderGeometry(.14,.14,.48,16),m.linen,x,2.08,z).rotation.x=Math.PI/2;const pts=Array.from({length:30},(_,i)=>{const a=i*.35,r=.02+i*.0036;return[x+Math.cos(a)*r,2.08+Math.sin(a)*r,z+.245];});b.tube(pts,.006,m.tatamiEdge,undefined,28);}
 // Natural stone coping reads as a crafted bath, with a continuous seat height
 // and a clear open water surface. No loose rocks spill into the walking route.
 const bath=fixture('footbath');
 for(const sx of [-1,1])for(const sz of [-1,1]){
  const stone=b.oval(m.stone,bath.x+sx*4.2,.49,bath.z+sz*2.0,.23,.13,.22);stone.rotation.y=sx*sz*.23;
 }
 for(const z of [-1,1])for(const x of [-3,-1,1,3])b.box(.018,.012,.32,m.darkStone,bath.x+x,.606,bath.z+z*2.1);
 b.box(4.7,.035,.07,m.darkStone,bath.x,.35,bath.z-1.63);
 detail.userData.floorObstacles='existing-fixtures-only';
 return detail;
}
