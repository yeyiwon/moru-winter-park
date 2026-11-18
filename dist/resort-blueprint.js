import {ryokanGardenObstacles} from './ryokan-exterior-layout.js';
// Local resort coordinates; the island, bridges and other districts stay fixed.
export const spaShift=-40;
export const alpine={x:0,z:-260,r:144,landZ:-230,rx:144,rz:174},spa={x:0,z:119+spaShift,r:31};
const clamp=t=>Math.max(0,Math.min(1,t)),smooth=t=>{t=clamp(t);return t*t*(3-2*t);},mix=(a,b,t)=>a+(b-a)*t;
function spline(z,nodes){let i=0;while(i<nodes.length-2&&z>nodes[i+1][0])i++;const a=nodes[i],b=nodes[i+1],t=clamp((z-a[0])/(b[0]-a[0])),prev=nodes[Math.max(0,i-1)],next=nodes[Math.min(nodes.length-1,i+2)],m0=(b[1]-prev[1])/(b[0]-prev[0]),m1=(next[1]-a[1])/(next[0]-a[0]),d=b[0]-a[0];return(2*t**3-3*t*t+1)*a[1]+(t**3-2*t*t+t)*m0*d+(-2*t**3+3*t*t)*b[1]+(t**3-t*t)*m1*d;}
export const summit={x:-62,z:-296,height:30.09,rx:27,rz:13};
export const peakSummit={x:16,z:-359,height:68.09,rx:48,rz:17};
export const liftLayout={x:-84,z:-188,dx:6,dz:-110,spacing:4,hanger:3.1,supports:[0,.16,.35,.55,.75,.92,1]};
export const upperLiftLayout={x:98,z:-202,dx:-38,dz:-158,spacing:4,hanger:3.1,supports:[0,.15,.32,.5,.68,.85,1]};
const n=Math.hypot(upperLiftLayout.dx,upperLiftLayout.dz),ux=-upperLiftLayout.dz/n,uz=upperLiftLayout.dx/n;
export const upperLiftEntry={x:upperLiftLayout.x-upperLiftLayout.dx/n*6,z:upperLiftLayout.z-upperLiftLayout.dz/n*6};
export const summitTransfer=[{x:-70,z:-298},{x:-49,z:-290},{x:-42,z:-286}];
export const beginnerAccess={start:summitTransfer[0],end:summitTransfer.at(-1),halfWidth:6};
const lines={
 main:[[-346,-12],[-318,-24],[-286,-14],[-250,0],[-214,-6],[-172,-6]],
 easy:[[-286,-42],[-259,-55],[-230,-48],[-199,-34],[-174,-26]],
 advanced:[[-346,10],[-316,15],[-284,18],[-252,14],[-224,0],[-172,-6]],
 curve:[[-346,34],[-324,43],[-299,57],[-272,61],[-243,48],[-215,29],[-174,25]]
};
export const skiRuns=[
 {id:'main',name:'센트럴 · 중급',level:'중급',color:'#8fcbe8',startX:-12,startZ:-346,finish:-172,width:12,adjacent:['advanced'],merges:[{with:'advanced',z:-224}]},
 {id:'easy',name:'메도우 · 초급',level:'초급',color:'#a7d8ba',startX:-42,startZ:-286,finish:-174,width:15,adjacent:['main'],merges:[{with:'main',z:-190}]},
 {id:'advanced',name:'리지 · 상급',level:'상급',color:'#e8a18f',startX:10,startZ:-346,finish:-172,width:9,adjacent:['main'],merges:[{with:'main',z:-224}]},
 {id:'curve',name:'파노라마 하산로',level:'중급',color:'#d8c6ea',startX:34,startZ:-346,finish:-174,width:11,adjacent:[],merges:[]}
];
export function skiRunCenter(z,id='main'){const own=spline(z,lines[id]||lines.main);return id==='advanced'?mix(own,spline(z,lines.main),smooth((z+250)/26)):own;}
export function skiRunHalfWidth(z,id='main'){const r=skiRuns.find(r=>r.id===id)||skiRuns[0];return mix(id==='easy'?7:5,r.width,smooth((z-r.startZ)/28));}
export const skiStarts=skiRuns.map(r=>({id:r.id,name:r.name,level:r.level,x:r.startX,z:r.startZ,r:4}));
export function skiRunAt(x,z){let nearest=skiRuns[0],distance=Infinity;for(const r of skiRuns){if(z<r.startZ-7||z>r.finish+16)continue;const d=Math.abs(x-skiRunCenter(z,r.id))/skiRunHalfWidth(z,r.id);if(d<distance){nearest=r;distance=d;}}return nearest;}
// Shared grades make joins flush. The beginner starts halfway down, below the steep pitch.
const grades=[[-346,68.09],[-320,55],[-294,30.09],[-265,20],[-230,8],[-198,1.7],[-172,.09]];
export function skiRunHeight(z){if(z<=-346)return 68.09;if(z>=-172)return .09;return Math.max(.09,spline(z,grades));}
export const skiRunouts=[{x:-25,z:-170,rx:20,rz:16},{x:0,z:-170,rx:20,rz:16},{x:25,z:-170,rx:20,rz:16}];
export const skiCenter=z=>skiRunCenter(z),skiHalfWidth=z=>skiRunHalfWidth(z);
function columns(line,half,t){const length=Math.hypot(line.dx,line.dz),nx=-line.dz/length,nz=line.dx/length;return[-1,1].flatMap(side=>[-1.65,1.65].map(d=>({x:line.x+line.dx*t+(2+side*half)*nx-d*nz,z:line.z+line.dz*t+(2+side*half)*nz+d*nx,r:.3})));}
export const summitFacilities=[
 {id:'trail-map',name:'슬로프 안내',interactive:false,x:9,z:-153,r:3.2,model:{x:9,z:-156}},
 {id:'odeng',name:'어묵 포장마차',x:-53,z:-163,model:{x:-53,z:-167},view:{distance:9,yaw:.25,pitch:.3}},
 {id:'marshmallow',name:'마시멜로 트럭',x:-68,z:-160,model:{x:-68,z:-164},view:{distance:9,yaw:.25,pitch:.3}},
 {id:'campfire',name:'모닥불',x:-39,z:-151,r:2.2,model:{x:-39,z:-154},view:{distance:11,yaw:.25,pitch:.3}},
 {id:'upperlift',name:'정상 리프트 · 중급·상급·파노라마',...upperLiftEntry,r:5.5,model:{x:upperLiftLayout.x,z:upperLiftLayout.z},view:{distance:24,yaw:.75,pitch:.3}}
];
export const summitObstacles=[...columns(liftLayout,5.2,0),...columns(liftLayout,3.4,1),...columns(upperLiftLayout,5.2,0),...columns(upperLiftLayout,3.4,1),...summitFacilities.filter(p=>['odeng','marshmallow'].includes(p.id)).map(p=>({...p.model,w:4.15,d:1.85})),{x:-39,z:-154,r:1.65},{x:-42.8,z:-154,w:.6,d:1.6},{x:-35.2,z:-154,w:.6,d:1.6}];
export function summitPositionValid(x,z){return !summitObstacles.some(o=>o.r?Math.hypot(x-o.x,z-o.z)<o.r+.35:Math.abs(x-o.x)<o.w+.35&&Math.abs(z-o.z)<o.d+.35);}
function terrainHeight(x,z){
 const height=skiRunHeight(z),edge=1-smooth((Math.hypot(x/1.03,z+260)-115)/42),back=1-smooth((-z-369)/39);
 const ridge=(7+5*Math.cos(x*.051+z*.014))*Math.exp(-(((z+320)/69)**2));
 let y=.09+(height-.09+ridge)*edge*back;
 for(const terrace of [summit,peakSummit]){const d=Math.hypot((x-terrace.x)/terrace.rx,(z-terrace.z)/terrace.rz);y=mix(y,terrace.height,1-smooth((d-.78)/.8));}
 // Pistes are cut into a single watertight heightfield, with broad soft snowbanks.
 let weight=0;
 for(const r of skiRuns){if(z<r.startZ-1||z>r.finish+16)continue;weight=Math.max(weight,1-smooth((Math.abs(x-skiRunCenter(z,r.id))-skiRunHalfWidth(z,r.id))/12));}
 y=mix(y,height,weight);
 // The middle arrival opens onto the beginner mouth; the final apron is level.
 if(z>=-312&&z<=-280){const q=smooth((z+298)/12),cx=mix(-70,-42,q),width=mix(11,7,q),along=smooth((z+312)/8)*(1-smooth((z+286)/6));y=mix(y,Math.min(summit.height,height),along*(1-smooth((Math.abs(x-cx)-width)/9)));}
 y=mix(y,.09,smooth((z+189)/25));
 return Math.max(.09,y);
}
function cable(line,t,top){t=clamp(t);const q=clamp(t/.96);return[line.x+line.dx*t,.69+(top-.09)*smooth(q),line.z+line.dz*t];}
export const liftPoint=t=>cable(liftLayout,t,summit.height);
export const upperLiftPoint=t=>cable(upperLiftLayout,t,peakSummit.height);
export function alpineHeight(x,z){let y=terrainHeight(x,z);for(const [line,point]of [[liftLayout,liftPoint],[upperLiftLayout,upperLiftPoint]]){const t=((x-line.x)*line.dx+(z-line.z)*line.dz)/(line.dx**2+line.dz**2);if(t<-.000001||t>1.000001)continue;const p=point(t),len=Math.hypot(line.dx,line.dz),cross=((x-p[0])*-line.dz+(z-p[2])*line.dx)/len,weight=1-smooth((Math.abs(cross-2)-4)/13),air=Math.min(smooth(t/.1),line===liftLayout?smooth((.9-t)/.16):smooth((1-t)/.1));const pisteClear=skiRuns.every(r=>z<r.startZ||z>r.finish||Math.abs(x-skiRunCenter(z,r.id))>skiRunHalfWidth(z,r.id)+1);if(pisteClear)y=mix(y,Math.min(y,p[1]-.6-air*3.2),weight);}return Math.max(.09,y);}
// Map, surface tests and the run controller consume these same sampled paths.
export const skiNetwork=skiRuns.map(r=>({...r,start:{x:r.startX,y:skiRunHeight(r.startZ),z:r.startZ},end:{x:skiRunCenter(r.finish,r.id),y:.09,z:r.finish},points:Array.from({length:81},(_,i)=>{const z=mix(r.startZ,r.finish,i/80);return{x:skiRunCenter(z,r.id),y:skiRunHeight(z,r.id),z,width:skiRunHalfWidth(z,r.id)*2,grade:(skiRunHeight(z-.5)-skiRunHeight(z+.5))/Math.hypot(skiRunCenter(z+.5,r.id)-skiRunCenter(z-.5,r.id),1)};})}));
export const resortDestinations=[
 {id:'ski',name:'초급 리프트',x:liftLayout.x,z:-185,kind:'ski',view:{distance:24,yaw:.6,pitch:.3,lookAhead:-1.8,lookHeight:0}},
 {id:'onsen',name:'설림 노천 온천',x:-10,z:114+spaShift,kind:'onsen',view:{distance:40,yaw:2.65,pitch:.62}},
 {id:'sauna',name:'료칸',x:12,z:113.6+spaShift,kind:'sauna',view:{distance:32,yaw:2.65,pitch:.55}}
];
export const restSeats={onsen:{x:-17.8,y:1.35,z:124+spaShift,yaw:Math.PI/2},sauna:{x:7.5,y:1.55,z:125+spaShift,yaw:Math.PI/2},healing:{x:50,y:1,z:35.5,yaw:Math.PI}};
export const spaPavilion={x:12,z:126+spaShift,w:24,d:22,sideDoorZ:121.5+spaShift};
export const spaActivities=Object.fromEntries(Object.entries({
 bath:{x:-10,y:.28,z:121,yaw:Math.PI,mode:'bath',label:'노천탕 · WASD로 천천히 이동',pool:{x:-10,z:124,rx:5.8,rz:4.8},view:{distance:12,yaw:2.7,pitch:.32}},
 smallbath:{x:-19,y:.28,z:132,yaw:Math.PI,mode:'bath',label:'작은 온천 · 물소리 듣기',pool:{x:-19,z:132,rx:2.4,rz:1.7},view:{distance:10,yaw:2.7,pitch:.35}},
 footbath:{x:20.6,y:1.05,z:132.5,yaw:-Math.PI/2,mode:'bath',label:'창가 족욕',pool:{x:20.6,z:132.5,rx:1.25,rz:.95},view:{distance:6,yaw:2.25,pitch:.3}},
 lounge:{x:1.8,y:1.66,z:127.5,yaw:Math.PI/2,mode:'sauna',label:'창가 소파',view:{distance:6,yaw:1.2,pitch:.24}},
 sauna:{x:7.5,y:1.8,z:125,yaw:Math.PI/2,mode:'sauna',label:'편백 벤치 · 포근하게 몸 녹이기',view:{distance:5,yaw:1.2,pitch:.18,lookHeight:-.8}},
 lie:{x:17,y:1.98,z:124.9,yaw:0,mode:'lie',label:'따뜻한 매트 · 누워 쉬는 중',view:{distance:6,yaw:2.7,pitch:.18,lookHeight:-.9}},
 tea:{x:15.2,y:1.28,z:118.8,yaw:0,mode:'tea',label:'찻자리 · 따뜻한 차 한 잔',view:{distance:5,yaw:.35,pitch:.2,lookHeight:-.8}}
}).map(([id,p])=>[id,{...p,z:p.z+spaShift,...(p.pool?{pool:{...p.pool,z:p.pool.z+spaShift}}:{})}]));
export function spaPositionValid(x,y,z,mode){return Object.values(spaActivities).some(a=>{if(a.mode!==mode||Math.abs(y-a.y)>.12)return false;if(a.pool)return ((x-a.pool.x)/a.pool.rx)**2+((z-a.pool.z)/a.pool.rz)**2<=1.02;return Math.hypot(x-a.x,z-a.z)<.15;});}
const ski=Array.from({length:181},(_,i)=>{const z=-346+i/180*174,x=skiCenter(z);return[x,alpineHeight(x,z),z];});
const lift=Array.from({length:321},(_,i)=>liftPoint(i/320)),upperlift=Array.from({length:401},(_,i)=>upperLiftPoint(i/400));
export const resortRides={lift:{bodyOffset:.82,heightMode:'seat',points:lift,exit:[-70,alpineHeight(-70,-298),-298],duration:26,arrivalYaw:.65},upperlift:{bodyOffset:.82,heightMode:'seat',points:upperlift,exit:[47,alpineHeight(47,-350),-350],duration:36,arrivalYaw:.6},ski:{heightMode:'surface',points:ski,duration:38}};
export const resortObstacles=[
 {x:-97,z:-176,w:9.3,d:6},{x:liftLayout.x-8,z:-185,w:1.5,d:1.4},
 ...summitObstacles,
 ...[
 ...ryokanGardenObstacles,
 {x:-10,z:124,rx:7.4,rz:6.4},{x:-19,z:132,rx:3.7,rz:3},
 {x:12,z:137,w:12,d:.18},{x:24,z:126,w:.18,d:11},
 {x:0,z:117.1,w:.18,d:2.1},{x:0,z:130.4,w:.18,d:6.6},
 {x:12,z:115,w:12,d:.18,door:{x:12,w:2.2}},
 {x:7.5,z:125,w:1.1,d:5},{x:17,z:127,w:1.1,d:3},
 {x:12,z:130,r:1.5},{x:16.5,z:120,w:1.7,d:.75},{x:5.2,z:118.5,w:1.4,d:.3},
 {x:20.6,z:132.5,rx:2.15,rz:1.75},{x:1.8,z:127.5,w:.9,d:2.4},
 {x:2.1,z:118.8,r:.32},{x:22,z:118.8,r:.32},
 {x:-16,z:101,rx:3.4,rz:2.5},{x:-22,z:98,rx:3.1,rz:2.4},{x:-27,z:106,rx:3.4,rz:2.1},{x:23,z:112,rx:2.8,rz:2.1}
 ].map(p=>({...p,z:p.z+spaShift}))
];
export function resortGround(x,z){if(Math.hypot(x,z+260)<144)return alpineHeight(x,z);const localZ=z-spaShift;if(x>0&&x<24&&localZ>115&&localZ<137)return .34;if(Math.abs(x-12)<2.2&&localZ>=114.2&&localZ<=115)return .09+.25*(localZ-114.2)/.8;if(x>=-.8&&x<=0&&Math.abs(z-spaPavilion.sideDoorZ)<2.3)return .09+.25*(x+.8)/.8;return .09;}
export function resortRidePosition(x,y,z,mode){
 if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(z))return false;
 if(mode==='lift'||mode==='upperlift'){
  return [[liftLayout,liftPoint],[upperLiftLayout,upperLiftPoint]].some(([line,point])=>{const t=((x-line.x)*line.dx+(z-line.z)*line.dz)/(line.dx*line.dx+line.dz*line.dz);if(t<-.001||t>1.001)return false;const p=point(t);return Math.hypot(x-p[0],z-p[2])<1.5&&Math.abs(y-p[1]-.82)<.5;});
 }
 return ['summit','ski'].includes(mode)&&Math.hypot(x,z+260)<142&&y>=alpineHeight(x,z)-.1&&y<=alpineHeight(x,z)+8;
}
