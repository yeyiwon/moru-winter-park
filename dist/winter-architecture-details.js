import * as T from './vendor/three.module.js';
import {makeBuilder} from './architecture-kit.js';
// Detail stays inside the existing building envelope: doors and walkable floor do not move.
export function museumFacadeDetails(root,m){
 const b=makeBuilder(root);
 for(let i=0;i<28;i++){
  const a=(i+.5)/28*Math.PI*2;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.24)continue;
  const bay=new T.Group();bay.position.set(Math.sin(a)*15.5,0,Math.cos(a)*15.5);bay.rotation.y=a;root.add(bay);
  for(const x of [-1.48,1.48]){b.box(.43,.2,.9,m.cream,x,1.05,.05,bay);b.box(.45,.17,.9,m.cream,x,4.85,.05,bay);for(const dx of [-.085,0,.085])b.rod([x+dx,1.2,.42],[x+dx,4.7,.42],.018,m.brass,bay);}
  b.tube([[-1.22,3.8,.25],[-1.06,4.45,.25],[0,4.83,.25],[1.06,4.45,.25],[1.22,3.8,.25]],.075,m.cream,bay,24);
  b.tube([[-1.1,3.8,.34],[-.93,4.35,.34],[0,4.65,.34],[.93,4.35,.34],[1.1,3.8,.34]],.018,m.lamp,bay,24);
  const star=b.mesh(new T.OctahedronGeometry(.17),m.brass,0,4.34,.33,bay);star.scale.set(.8,1.6,.35);
  for(const x of [-1,-.5,0,.5,1])b.box(.13,.28,.20,m.cream,x,5.1,.48,bay);
  b.box(2.6,.07,.1,m.snow,0,5.76,.42,bay);
 }
 // Engraved constellations follow the dome curvature; no floating ribbons or new light nodes.
 const domePoint=(a,t)=>[Math.sin(t)*Math.sin(a)*15.84,5.9+Math.cos(t)*15.84*.66,Math.sin(t)*Math.cos(a)*15.84];
 for(let bay=0;bay<16;bay++){
  const a=(bay+.5)*Math.PI/8;
  const outline=Array.from({length:17},(_,j)=>domePoint(a,.32+j*.068));b.tube(outline,.018,m.coolLamp,root,32);
  const gem=domePoint(a,.98);const medallion=b.mesh(new T.OctahedronGeometry(.19),m.lamp,...gem);medallion.scale.y=1.65;
  for(const side of [-1,1]){const scroll=Array.from({length:15},(_,j)=>{const u=j/14;return domePoint(a+side*(.025+.065*Math.sin(u*Math.PI)),1.06+u*.24);});b.tube(scroll,.025,m.brass,root,20);}
  const frost=domePoint(a,1.4);b.oval(m.snow,...frost,.35,.06,.18);
 }
 for(let i=0;i<84;i++){const a=i/84*Math.PI*2;b.oval(i%3?m.coolLamp:m.lamp,Math.sin(a)*15.82,5.96,Math.cos(a)*15.82,.045,.07,.045);}
 // Astronomical crown: spherical brass rings, an ivory crescent and crystal at its focus.
 const crown=new T.Group();crown.position.y=17.8;root.add(crown);
 for(const tilt of [-.65,.65]){const ring=b.mesh(new T.TorusGeometry(1.55,.055,8,64),m.brass,0,0,0,crown);ring.rotation.set(.6,tilt,.2);}
 const moon=b.mesh(new T.TorusGeometry(.66,.085,8,48,Math.PI*1.45),m.lamp,0,.15,0,crown);moon.rotation.z=-.7;
 for(const side of [-1,1]){b.rod([side*3.3,6.4,16],[side*3.3,8,16],.045,m.brass);b.mesh(new T.OctahedronGeometry(.25),m.coolLamp,side*3.3,8.12,16);}
 // A deep classical portico frames the existing doorway without narrowing it.
 for(const side of [-1,1]){for(const z of [15.8,17.0]){b.mesh(new T.LatheGeometry([[.49,0],[.49,.15],[.3,.3],[.27,5.5],[.45,5.65],[.49,5.8]].map(p=>new T.Vector2(...p)),20),m.cream,side*3.5,.2,z);for(let j=0;j<10;j++){const a=j*Math.PI/5;b.rod([side*3.5+Math.cos(a)*.28,.55,z+Math.sin(a)*.28],[side*3.5+Math.cos(a)*.28,5.6,z+Math.sin(a)*.28],.012,m.brass);}}}
 for(const [y,w,d]of [[6.1,8.1,2.5],[6.36,8.6,2.8],[6.6,8.85,2.9]])b.box(w,.18,d,m.cream,0,y,16.2);
 const pediment=new T.Shape();pediment.moveTo(-4.55,0);pediment.lineTo(0,2.4);pediment.lineTo(4.55,0);pediment.closePath();b.mesh(new T.ExtrudeGeometry(pediment,{depth:.38,bevelEnabled:false}),m.cream,0,6.65,17.45);
 b.tube([[-4.6,6.7,17.88],[0,9.12,17.88],[4.6,6.7,17.88]],.075,m.brass,root,24);b.tube([[-4.7,6.84,17.85],[0,9.26,17.85],[4.7,6.84,17.85]],.09,m.snow,root,24);
 const emblem=b.mesh(new T.TorusGeometry(.5,.035,8,48),m.brass,0,7.55,17.9);for(let i=0;i<12;i++){const a=i*Math.PI/6;b.rod([Math.cos(a)*.61,7.55+Math.sin(a)*.61,17.91],[Math.cos(a)*.8,7.55+Math.sin(a)*.8,17.91],.018,m.brass);}b.mesh(new T.OctahedronGeometry(.26),m.lamp,0,7.55,17.94);
 for(const side of [-1,1]){b.rod([side*3.5,3.8,17],[side*3.5,3.8,17.7],.035,m.brass);b.oval(m.lamp,side*3.5,3.4,17.7,.18,.32,.18);b.box(.45,.06,.45,m.brass,side*3.5,3.75,17.7);b.box(.4,.07,.4,m.brass,side*3.5,3.05,17.7);}
 root.userData.lampGlow=[{x:-3.3,y:4.5,z:16,radius:4.1,power:14,range:13},{x:3.3,y:4.5,z:16,radius:4.1,power:14,range:13}];
}
export function ryokanFacadeDetails(root,m){
 const b=makeBuilder(root);
 // Layered eaves, exposed rafter ends and warm slit lighting articulate the long roof.
 for(const side of [-1,1]){
  const x=12+side*13.65;
  b.box(.18,.20,25.5,m.endgrain,x,4.34,126);b.box(.065,.035,24.9,m.lamp,x-side*.2,4.18,126);
  for(let i=0;i<32;i++){const z=113.6+i*.8;b.box(.8,.15,.12,m.lightWood,x-side*.35,4.12,z);b.box(.38,.11,.10,m.endgrain,x-side*.6,3.98,z);}
 }
 // Fine ridge caps and snow cornices break the otherwise blank roof silhouette.
 b.box(.34,.13,26.4,m.endgrain,12,7.12,126);b.box(.29,.08,26.3,m.snow,12,7.23,126);
 for(const z of [113.1,138.9])for(const side of [-1,1]){
  const edge=Array.from({length:17},(_,i)=>{const u=i/16;return[12+side*13.7*u,7.08-2.55*u+.12*Math.sin(u*Math.PI),z];});b.tube(edge,.075,m.endgrain,root,24);
  const snowEdge=edge.map(([x,y,zz])=>[x,y+.12,zz]);b.tube(snowEdge,.062,m.snow,root,24);
  for(let j=1;j<13;j++){const x=12+side*j,y=7.08-j/13.7*2.55;b.rod([x,y-.32,z+.035],[x,y-.04,z+.035],.024,m.lightWood);}
 }
 // Roof ridge metalwork and a gable crest echo traditional joinery, not a new building.
 for(const z of [113.1,138.9]){
  b.tube([[10.8,6.85,z],[11.25,7.1,z],[12,7.18,z],[12.75,7.1,z],[13.2,6.85,z]],.07,m.brass);
  for(const x of [4,8,16,20]){const y=6.7-Math.abs(x-12)*.18;b.rod([x,y-.5,z],[x,y-.08,z],.055,m.endgrain);}
 }
 // Shoji transom and scalloped noren above (not across) the 4.4 m passage.
 for(let i=0;i<9;i++){const x=8.2+i*.95;b.box(.055,.6,.06,m.lightWood,x,4.25,110.18);}
 for(const x of [10.35,12,13.65]){b.box(1.5,.6,.04,m.linen,x,3.6,110.3);b.box(.035,.57,.02,m.brass,x,3.6,110.27);}
 for(const x of [9.2,14.8]){
  b.rod([x,4.05,112],[x,3.5,112],.018,m.brass);b.mesh(new T.LatheGeometry([[.2,0],[.33,.12],[.33,.65],[.2,.82]].map(p=>new T.Vector2(...p)),24),m.lamp,x,2.67,112);
  for(let j=0;j<12;j++){const a=j*Math.PI/6;b.rod([x+Math.cos(a)*.33,2.8,112+Math.sin(a)*.33],[x+Math.cos(a)*.33,3.29,112+Math.sin(a)*.33],.013,m.endgrain);}
  b.ring(.22,.025,m.brass,x,2.7,112);b.ring(.22,.025,m.brass,x,3.48,112);
 }
}
export function museumHallDetails(root,m){
 const b=makeBuilder(root);
 // A hanging celestial canopy sits well above the character and camera, leaving aisles clear.
 for(const [r,y]of [[6.4,11.5],[9.4,13.6],[12.5,15.8]]){
  b.ring(r,.055,m.brass,0,y,0);b.ring(r-.12,.022,m.coolLamp,0,y+.06,0);
  for(let i=0;i<24;i++){const a=i*Math.PI/12,x=Math.cos(a)*r,z=Math.sin(a)*r;b.rod([x,y,z],[x,y-.5-(i%3)*.18,z],.011,m.brass);const crystal=b.mesh(new T.OctahedronGeometry(.10+(i%3)*.02),i%3?m.coolLamp:m.lamp,x,y-.7-(i%3)*.18,z);crystal.scale.y=2.3;}
 }
 for(const side of [-1,1])for(const z of [-16,0,16]){
  const x=side*23.28;b.box(.12,4.4,1.6,m.navy,x,2.7,z);for(const dz of [-.85,.85])b.box(.16,4.6,.08,m.brass,x-side*.08,2.7,z+dz);
  const globe=b.mesh(new T.SphereGeometry(.24,16,12),m.lamp,x-side*.15,4.4,z);b.ring(.35,.025,m.brass,x-side*.2,4.4,z).rotation.z=Math.PI/2;
 }
}
export function ryokanHallDetails(root,m){
 const b=makeBuilder(root);
 // Kumiko ceiling medallions, soft shade rings and crafted tea-room joinery.
 for(const x of [-12,12])for(const z of [-8,8]){
  b.box(5.2,.045,5.2,m.lightWood,x,6.72,z);
  for(let j=-3;j<=3;j++){b.box(4.7,.05,.035,m.endgrain,x,6.68,z+j*.65);b.box(.035,.05,4.7,m.endgrain,x+j*.65,6.68,z);}
  b.box(4.8,.025,.035,m.lamp,x,6.63,z-2.4);b.box(4.8,.025,.035,m.lamp,x,6.63,z+2.4);
 }
 for(const x of [9,15])for(const z of [-6,-12]){for(let j=0;j<12;j++)b.box(1.25,.006,.009,m.tatamiEdge,x,.311,z-.5+j*.09);}
 for(const x of [-13,12]){const z=x<0?7:-9;b.box(1.6,.035,.75,m.endgrain,x,.85,z);for(const dx of [-.65,.65])b.box(.025,.025,.7,m.brass,x+dx,.88,z);}
}
