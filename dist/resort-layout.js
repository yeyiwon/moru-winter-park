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
export function skiCenter(z){const t=clamp((z+334)/162);return -8+16*t+12*Math.sin(t*Math.PI*2);}
export function skiHalfWidth(z){return 12+20*(1-smooth((z+342)/22));}
export function alpineHeight(x,z){
 const original=.09+(localHeight(x/4,(z+260)/4-114)-.09)*4,t=clamp((z+334)/162),offset=Math.abs(x-skiCenter(z));
 const piste=.09+72*(1-smooth(t))+.10*Math.min(1,(offset/12)**2);
 const corridor=(1-smooth((offset-14)/15))*smooth((z+378)/24)*(1-smooth((z+172)/12));
 const terrain=original*(1-corridor)+piste*corridor;
 const d=Math.hypot((x-summit.x)/summit.rx,(z-summit.z)/summit.rz),terrace=1-smooth((d-.85)/.45);
 return terrain*(1-terrace)+summit.height*terrace;
}
const scalePoint=p=>{const x=p[0]*4,z=-260+(p[2]+114)*4;return[x,alpineHeight(x,z),z];};
export const resortDestinations=[
 {id:'ski',name:'설빛 산악 리조트',x:-36,z:-185,kind:'ski',view:{distance:10,yaw:1.5,pitch:.22,lookAhead:-1.8,lookHeight:0}},
 {id:'sled',name:'눈썰매 계곡',x:68,z:-192,kind:'sled',view:{distance:70,yaw:.45,pitch:.45,lookAhead:16,lookHeight:9}},
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
const lift=Array.from({length:41},(_,i)=>{const t=i/40,x=-9+Math.sin(t*Math.PI)*1.5,z=-96-t*38;return[x,localHeight(x,z)+4.5,z];});
const sled=Array.from({length:51},(_,i)=>{const t=1-i/50,z=-98-t*19,x=17+Math.sin(t*Math.PI)*2;return[x,localHeight(x,z),z];});sled.push([17,localHeight(17,-97),-97]);

for(let i=0;i<sled.length;i++)sled[i]=scalePoint(sled[i]);
for(let i=0;i<lift.length;i++){const t=i/(lift.length-1),x=-36+6*t,z=-188-160*t,boarding=Math.min(smooth(t/.1),smooth((1-t)/.1));lift[i]=[x,alpineHeight(x,z)+.6+3.9*boarding,z];}
export const resortRides={lift:{bodyOffset:.82,heightMode:'seat',points:lift,exit:[-24,alpineHeight(-24,-342),-342],duration:45},ski:{heightMode:'surface',points:ski,duration:38},sled:{bodyOffset:1.03,heightMode:'surface',points:sled,duration:22}};
export const resortObstacles=[
 {x:-40,z:-176,w:9,d:6},
 {x:-10,z:124,rx:7.4,rz:6.4},{x:-19,z:132,rx:3.7,rz:3},
 {x:12,z:133,w:9,d:.3},{x:3,z:125,w:.3,d:8},{x:21,z:125,w:.3,d:8},
 {x:12,z:117,w:9,d:.3,door:{x:12,w:2.2}},
 {x:7.5,z:125,w:1.1,d:5},{x:17,z:127,w:1.1,d:3},
 {x:12,z:130,r:1.5},{x:16.5,z:120,w:1.7,d:.75},{x:5.2,z:118.5,w:1.4,d:.3}
];
export function resortGround(x,z){if(Math.hypot(x,z+260)<144)return alpineHeight(x,z);if(Math.abs(x-12)<9&&z>117&&z<133)return .34;return .09;}
export function resortRidePosition(x,y,z,mode){return ['lift','summit','ski','sled'].includes(mode)&&Math.hypot(x,z+260)<142&&Number.isFinite(y)&&y>=alpineHeight(x,z)-.1&&y<=alpineHeight(x,z)+8;}
