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
export function alpineHeight(x,z){return .09+(localHeight(x/4,(z+260)/4-114)-.09)*4;}
export function skiCenter(z){return localSkiCenter((z+260)/4-114)*4;}
const scalePoint=p=>{const x=p[0]*4,z=-260+(p[2]+114)*4;return[x,alpineHeight(x,z),z];};
export const resortDestinations=[
 {id:'ski',name:'설빛 산악 리조트',x:8,z:-172,kind:'ski',view:{distance:150,yaw:.35,pitch:.4,lookAhead:54,lookHeight:34}},
 {id:'sled',name:'눈썰매 계곡',x:68,z:-192,kind:'sled',view:{distance:70,yaw:.45,pitch:.45,lookAhead:16,lookHeight:9}},
 {id:'onsen',name:'설림 노천 온천',x:-10,z:114,kind:'onsen',view:{distance:40,yaw:2.65,pitch:.62}},
 {id:'sauna',name:'편백 휴양관',x:12,z:115,kind:'sauna',view:{distance:32,yaw:2.65,pitch:.55}}
];
export const restSeats={onsen:{x:-17.8,y:1.35,z:124,yaw:Math.PI/2},sauna:{x:7.5,y:1.55,z:125,yaw:Math.PI/2},healing:{x:50,y:1,z:35.5,yaw:Math.PI}};
const ski=Array.from({length:81},(_,i)=>{const z=-134+i/80*42,x=localSkiCenter(z)+Math.sin(i/80*Math.PI*4)*.6;return[x,localHeight(x,z),z];});ski.push([2,.09,-92]);
const lift=Array.from({length:41},(_,i)=>{const t=i/40,x=-9+Math.sin(t*Math.PI)*1.5,z=-96-t*38;return[x,localHeight(x,z)+4.5,z];});
const sled=Array.from({length:51},(_,i)=>{const t=1-i/50,z=-98-t*19,x=17+Math.sin(t*Math.PI)*2;return[x,localHeight(x,z),z];});sled.push([17,localHeight(17,-97),-97]);
for(let i=0;i<ski.length;i++)ski[i]=scalePoint(ski[i]);
for(let i=0;i<sled.length;i++)sled[i]=scalePoint(sled[i]);
for(let i=0;i<lift.length;i++){const t=i/(lift.length-1),x=-36+44*t,z=-188-152*t,boarding=Math.min(smooth(t/.1),smooth((1-t)/.1));lift[i]=[x,alpineHeight(x,z)+.6+3.9*boarding,z];}
export const resortRides={lift:{bodyOffset:.82,heightMode:'seat',points:lift,exit:[ski[0][0],ski[0][1],ski[0][2]],duration:45},ski:{heightMode:'surface',points:ski,duration:38},sled:{bodyOffset:1.03,heightMode:'surface',points:sled,duration:22}};
export const resortObstacles=[
 {x:-40,z:-176,w:9,d:6},
 {x:-10,z:124,rx:7.4,rz:6.4},{x:-19,z:132,rx:3.7,rz:3},
 {x:12,z:133,w:9,d:.3},{x:3,z:125,w:.3,d:8},{x:21,z:125,w:.3,d:8},
 {x:12,z:117,w:9,d:.3,door:{x:12,w:2.2}},
 {x:7.5,z:125,w:1.1,d:5},{x:17,z:127,w:1.1,d:3},
 {x:12,z:130,r:1.5}
];
export function resortGround(x,z){if(Math.hypot(x,z+260)<144)return alpineHeight(x,z);if(Math.abs(x-12)<9&&z>117&&z<133)return .34;return .09;}
export function resortRidePosition(x,y,z,mode){return ['lift','summit','ski','sled'].includes(mode)&&Math.hypot(x,z+260)<142&&Number.isFinite(y)&&y>=alpineHeight(x,z)-.1&&y<=alpineHeight(x,z)+8;}
