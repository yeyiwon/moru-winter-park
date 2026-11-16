// Terrain, ride routes and collision rules share world coordinates.
export const alpine={x:0,z:-260,r:144},spa={x:0,z:119,r:31};
const clamp=t=>Math.max(0,Math.min(1,t)),smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
function localSkiCenter(z){return 2+Math.sin(clamp((-z-96)/38)*Math.PI*2)*3;}
function localHeight(x,z){
 const t=clamp((-z-96)/38),ridge=31*Math.exp(-(((x+10)/17)**2)-((z+129)/19)**2)+18*Math.exp(-(((x-17)/12)**2)-((z+126)/15)**2),edge=1-smooth((Math.hypot(x,z+114)-30)/6);
 const terrain=.09+ridge*smooth((-z-94)/12)*edge;
 const corridor=(1-smooth((Math.abs(x-localSkiCenter(z))-5)/5))*smooth((-z-94)/2)*(1-smooth((-z-135)/7));
 return terrain*(1-corridor)+(.09+26*t**1.4)*corridor;
}
export const summit={x:-8,z:-347,height:72.09,rx:32,rz:18};
export const skiRuns=[
 {id:'main',name:'중급 슬로프',level:'자유 주행',color:'#8fcbe8',finish:-172},
 {id:'easy',name:'초급 슬로프',level:'넓은 코스',color:'#a7d8ba',finish:-172},
 {id:'curve',name:'커브 슬로프',level:'커브 코스',color:'#e9b5d8',finish:-172}
];
export function skiRunCenter(z,id='main'){
 const t=clamp((z+334)/162),main=-8+16*t+12*Math.sin(t*Math.PI*2),branch=smooth(t/.5);
 if(id==='easy')return main+32*branch;
 if(id==='curve')return main+64*branch+8*Math.sin(t*Math.PI*4)*smooth(t/.35)*(1-smooth((t-.85)/.15));
 return main;
}
export function skiRunHalfWidth(z,id='main'){return(id==='easy'?11:id==='curve'?9:12)+20*(1-smooth((z+342)/22));}
export const skiCenter=z=>skiRunCenter(z),skiHalfWidth=z=>skiRunHalfWidth(z);
export const summitObstacles=[
 {x:-18,z:-357,w:4.15,d:1.85},{x:2,z:-357,w:4.15,d:1.85},{x:-8,z:-349,r:1.4},
 {x:-11.8,z:-349,w:.6,d:1.6},{x:-4.2,z:-349,w:.6,d:1.6},
 {x:11.1,z:-352,w:.2,d:2.4},{x:16.9,z:-352,w:.2,d:2.4},{x:14,z:-354.4,w:2.9,d:.2},{x:14,z:-349.6,w:2.9,d:.2,door:{x:14,w:1.1}}
];
let summitRestroomOpen=true;
export function setSummitRestroomOpen(open){summitRestroomOpen=!!open;return summitRestroomOpen;}
export function summitPositionValid(x,z){if(!summitRestroomOpen&&Math.abs(x-14)<1.1&&Math.abs(z+349.6)<.22)return false;return !summitObstacles.some(o=>{if(o.door&&Math.abs(x-o.door.x)<o.door.w)return false;return o.r?Math.hypot(x-o.x,z-o.z)<o.r:Math.abs(x-o.x)<o.w&&Math.abs(z-o.z)<o.d;});}
export const summitFacilities=[
 {id:'odeng',name:'어묵 트럭',x:-18,z:-352.5,model:{x:-18,z:-357},view:{distance:9,yaw:.25,pitch:.3}},
 {id:'marshmallow',name:'마시멜로 트럭',x:2,z:-352.5,model:{x:2,z:-357},view:{distance:9,yaw:.25,pitch:.3}},
 {id:'campfire',name:'모닥불',x:-8,z:-345.5,model:{x:-8,z:-349},view:{distance:11,yaw:.25,pitch:.3}},
 {id:'restroom',name:'정상 화장실',x:14,z:-348,model:{x:14,z:-352},view:{distance:9,yaw:.25,pitch:.3}}
];
function alpineTerrainHeight(x,z){
 const original=.09+(localHeight(x/4,(z+260)/4-114)-.09)*4,t=clamp((z+334)/162);
 let corridor=0,normalized=Infinity;
 for(const run of skiRuns){const distance=Math.abs(x-skiRunCenter(z,run.id)),half=run.id==='main'?12:run.id==='easy'?11:9;normalized=Math.min(normalized,distance/half);corridor=Math.max(corridor,1-smooth((distance-half-2)/(run.id==='main'?15:10)));}
 const piste=.09+72*(1-smooth(t))+.10*Math.min(1,normalized*normalized);
 corridor*=smooth((z+378)/24)*(1-smooth((z+172)/12));
 let terrain=original*(1-corridor)+piste*corridor;
 // The sled valley is a separate gentle channel beyond the three ski runs.
 const sledX=108+8*Math.sin(clamp((-z-196)/76)*Math.PI),sledDistance=Math.abs(x-sledX),sledT=clamp((-z-192)/80),sledBlend=(1-smooth((sledDistance-5)/7))*smooth((z+282)/10)*(1-smooth((z+192)/8));
 terrain=terrain*(1-sledBlend)+(.09+19*smooth(sledT))*sledBlend;
 const d=Math.hypot((x-summit.x)/summit.rx,(z-summit.z)/summit.rz),terrace=1-smooth((d-.85)/.45);
 return terrain*(1-terrace)+summit.height*terrace;
}
// Support spans, not terrain ripples, define the ascending cable. The gentle sag
// stays smaller than each span's rise so a chair never unexpectedly drops.
export const liftLayout={x:-36,z:-188,dx:6,dz:-160,spacing:4,hanger:3.1,supports:[0,.08,.24,.42,.60,.78,.92,1]};
const liftBase=alpineTerrainHeight(liftLayout.x,liftLayout.z)+.6,liftTop=summit.height+.6;
const liftRise=[0,.11,.38,.67,.88,.975,1,1];
export function liftPoint(progress){
 const t=clamp(progress),stops=liftLayout.supports;
 let i=0;while(i<stops.length-2&&t>stops[i+1])i++;
 const u=(t-stops[i])/(stops[i+1]-stops[i]),a=liftBase+(liftTop-liftBase)*liftRise[i],b=liftBase+(liftTop-liftBase)*liftRise[i+1],sag=Math.min(.12,(b-a)*.18);
 return[liftLayout.x+liftLayout.dx*t,a+(b-a)*u-sag*4*u*(1-u),liftLayout.z+liftLayout.dz*t];
}
export function alpineHeight(x,z){
 const terrain=alpineTerrainHeight(x,z),t=(z-liftLayout.z)/liftLayout.dz;
 if(t<0||t>1)return terrain;
 const [lx,seat]=liftPoint(t),dx=x-(lx+liftLayout.spacing/2),width=dx<0?25:11;
 const channelRight=lx+liftLayout.spacing+1.3,fadeEnd=Math.max(channelRight+1.3,skiCenter(z)-skiHalfWidth(z)-1);
 const influence=(1-smooth((Math.abs(dx)-4)/width))*(1-smooth((x-channelRight)/(fadeEnd-channelRight)));
 const airborne=Math.min(smooth(t/.08),smooth((.92-t)/.12)),clearance=.6+3.6*airborne;
 // A graded service clearing beneath the line avoids an artificial ridge that
 // used to rise above the upper station and force the chairs downhill.
 return terrain+(Math.min(terrain,seat-clearance)-terrain)*influence;
}
const scalePoint=p=>{const x=p[0]*4,z=-260+(p[2]+114)*4;return[x,alpineHeight(x,z),z];};
export const resortDestinations=[
 {id:'ski',name:'설빛 산악 리조트',x:-36,z:-185,kind:'ski',view:{distance:10,yaw:1.5,pitch:.22,lookAhead:-1.8,lookHeight:0}},
 {id:'sled',name:'눈썰매 계곡',x:108,z:-192,kind:'sled',view:{distance:70,yaw:.45,pitch:.45,lookAhead:16,lookHeight:9}},
 {id:'onsen',name:'설림 노천 온천',x:-10,z:114,kind:'onsen',view:{distance:40,yaw:2.65,pitch:.62}},
 {id:'sauna',name:'편백 휴양관',x:12,z:115,kind:'sauna',view:{distance:32,yaw:2.65,pitch:.55}}
];
export const restSeats={onsen:{x:-17.8,y:1.35,z:124,yaw:Math.PI/2},sauna:{x:7.5,y:1.55,z:125,yaw:Math.PI/2},healing:{x:50,y:1,z:35.5,yaw:Math.PI}};
export const spaActivities={
 bath:{x:-10,y:.28,z:121,yaw:Math.PI,mode:'bath',label:'노천탕 · WASD로 천천히 이동',pool:{x:-10,z:124,rx:5.8,rz:4.8},view:{distance:12,yaw:2.7,pitch:.32}},
 smallbath:{x:-19,y:.28,z:132,yaw:Math.PI,mode:'bath',label:'작은 온천 · 물소리 듣기',pool:{x:-19,z:132,rx:2.4,rz:1.7},view:{distance:10,yaw:2.7,pitch:.35}},
 sauna:{x:7.5,y:1.8,z:125,yaw:Math.PI/2,mode:'sauna',label:'편백 벤치 · 포근하게 몸 녹이기',view:{distance:5,yaw:1.2,pitch:.18,lookHeight:-.8}},
 lie:{x:17,y:1.98,z:124.9,yaw:0,mode:'lie',label:'따뜻한 매트 · 누워 쉬는 중',view:{distance:6,yaw:2.7,pitch:.18,lookHeight:-.9}},
 tea:{x:15.2,y:1.28,z:118.8,yaw:0,mode:'tea',label:'찻자리 · 따뜻한 차 한 잔',view:{distance:5,yaw:.35,pitch:.2,lookHeight:-.8}}
};
export function spaPositionValid(x,y,z,mode){return Object.values(spaActivities).some(a=>{if(a.mode!==mode||Math.abs(y-a.y)>.12)return false;if(a.pool)return ((x-a.pool.x)/a.pool.rx)**2+((z-a.pool.z)/a.pool.rz)**2<=1.02;return Math.hypot(x-a.x,z-a.z)<.15;});}
const ski=Array.from({length:163},(_,i)=>{const z=-340+i/162*168,x=skiCenter(z);return[x,alpineHeight(x,z),z];});
const lift=Array.from({length:201},(_,i)=>liftPoint(i/200));
const sled=Array.from({length:51},(_,i)=>{const t=1-i/50,z=-98-t*19,x=17+Math.sin(t*Math.PI)*2;return[x,localHeight(x,z),z];});sled.push([17,localHeight(17,-97),-97]);

for(let i=0;i<sled.length;i++){const p=scalePoint(sled[i]),x=p[0]+40;sled[i]=[x,alpineHeight(x,p[2]),p[2]];}
export const resortRides={lift:{bodyOffset:.82,heightMode:'seat',points:lift,exit:[-24,alpineHeight(-24,-342),-342],duration:45},ski:{heightMode:'surface',points:ski,duration:38},sled:{bodyOffset:1.03,heightMode:'surface',points:sled,duration:22}};
export const resortObstacles=[
 {x:-55,z:-176,w:9.3,d:6},{x:-44,z:-185,w:1.5,d:1.4},
 ...summitObstacles,
 {x:-10,z:124,rx:7.4,rz:6.4},{x:-19,z:132,rx:3.7,rz:3},
 {x:12,z:133,w:9,d:.3},{x:3,z:125,w:.3,d:8},{x:21,z:125,w:.3,d:8},
 {x:12,z:117,w:9,d:.3,door:{x:12,w:2.2}},
 {x:7.5,z:125,w:1.1,d:5},{x:17,z:127,w:1.1,d:3},
 {x:12,z:130,r:1.5},{x:16.5,z:120,w:1.7,d:.75},{x:5.2,z:118.5,w:1.4,d:.3}
];
export function resortGround(x,z){if(Math.hypot(x,z+260)<144)return alpineHeight(x,z);if(Math.abs(x-12)<9&&z>117&&z<133)return .34;return .09;}
export function resortRidePosition(x,y,z,mode){
 if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(z))return false;
 if(mode==='lift'){
  const t=(z-liftLayout.z)/liftLayout.dz;if(t<0||t>1)return false;
  const p=liftPoint(t);return Math.abs(x-p[0])<.7&&Math.abs(y-p[1]-.82)<.5;
 }
 return ['summit','ski','sled'].includes(mode)&&Math.hypot(x,z+260)<142&&y>=alpineHeight(x,z)-.1&&y<=alpineHeight(x,z)+8;
}
