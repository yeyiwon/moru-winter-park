import {ryokanGardenObstacles} from './ryokan-exterior-layout.js';
import {mountainWayfinders,mountainShelter,mountainBounds,skiJumps,skiJumpCoordinates,mountainGroundHeight,alpineHeight,skiRunCenter,skiRunHalfWidth,skiRunHeight,skiRunAt,skiRuns,skiStarts,skiRunouts,skiNetwork,mountainTerraces,ridgeBase,ridgeSummit,ridgeLiftLayout,ridgeLiftEntry,ridgeLiftPoint,ridgeTransfers,summit,peakSummit,middleSummit,liftLayout,upperLiftLayout,upperLiftEntry,liftPoint,upperLiftPoint,summitTransfer,middleTransfer,mountainRest,beginnerAccess,gondolaEntry,gondolaApproach,liftApproach,gondolaPoints,gondolaStations} from './mountain-layout.js';
export {skiJumps,skiJumpCoordinates,mountainGroundHeight,alpineHeight,skiRunCenter,skiRunHalfWidth,skiRunHeight,skiRunAt,skiRuns,skiStarts,skiRunouts,skiNetwork,mountainTerraces,ridgeBase,ridgeSummit,ridgeLiftLayout,ridgeLiftEntry,ridgeLiftPoint,ridgeTransfers,summit,peakSummit,middleSummit,liftLayout,upperLiftLayout,upperLiftEntry,liftPoint,upperLiftPoint,summitTransfer,middleTransfer,mountainRest,beginnerAccess,gondolaEntry,gondolaApproach,liftApproach,gondolaPoints};
export const spaShift=-40;
export const alpine={x:0,z:-260,r:144,landZ:-230,rx:144,rz:174},spa={x:0,z:119+spaShift,r:31};
export const skiTicketBooth={x:-110,z:-187};
export const skiCenter=z=>skiRunCenter(z),skiHalfWidth=z=>skiRunHalfWidth(z);
function columns(line,half,t){const length=Math.hypot(line.dx,line.dz),nx=-line.dz/length,nz=line.dx/length;return[-1,1].flatMap(side=>[-1.65,1.65].map(d=>({x:line.x+line.dx*t+(2+side*half)*nx-d*nz,z:line.z+line.dz*t+(2+side*half)*nz+d*nx,r:.3})));}
export const summitFacilities=[
 {id:'trail-map',name:'슬로프 안내',interactive:false,x:9,z:-153,r:3.2,model:{x:9,z:-156}},
 {id:'odeng',name:'어묵 포장마차',x:-53,z:-163,model:{x:-53,z:-167},view:{distance:9,yaw:.25,pitch:.3}},
 {id:'marshmallow',name:'마시멜로 트럭',x:-68,z:-160,model:{x:-68,z:-164},view:{distance:9,yaw:.25,pitch:.3}},
 {id:'campfire',name:'모닥불',x:-39,z:-151,r:2.2,model:{x:-39,z:-154},view:{distance:11,yaw:.25,pitch:.3}},
 {id:'gondola',name:'구름정상 곤돌라',...gondolaEntry,r:6,model:{x:gondolaStations[0].x,z:gondolaStations[0].z}},
 {id:'ridgelift',name:'정상 연결 리프트',...ridgeLiftEntry,r:5.5,model:{x:ridgeLiftLayout.x,z:ridgeLiftLayout.z}},
 {id:'upperlift',name:'포레스트 리프트 · 초중급',...upperLiftEntry,r:5.5,model:{x:upperLiftLayout.x,z:upperLiftLayout.z},view:{distance:24,yaw:.75,pitch:.3}}
];
export const summitObstacles=[...mountainWayfinders.map(p=>({x:p.x,z:p.z,r:1.9})),...mountainRest.map(p=>({...p,w:2,d:.7})),...gondolaStations.flatMap(s=>s.columns),...[-18,18].flatMap(dx=>[-5,5].map(dz=>({x:mountainShelter.x+dx,z:mountainShelter.z+dz,r:.12}))),...columns(ridgeLiftLayout,5.2,0),...columns(ridgeLiftLayout,4.8,1),...columns(liftLayout,5.2,0),...columns(liftLayout,4.8,1),...columns(upperLiftLayout,5.2,0),...columns(upperLiftLayout,4.8,1),...summitFacilities.filter(p=>['odeng','marshmallow'].includes(p.id)).map(p=>({...p.model,w:4.15,d:1.85})),{x:-39,z:-154,r:1.65},{x:-42.8,z:-154,w:.6,d:1.6},{x:-35.2,z:-154,w:.6,d:1.6}];
export function summitPositionValid(x,z){return !summitObstacles.some(o=>o.r?Math.hypot(x-o.x,z-o.z)<o.r+.35:Math.abs(x-o.x)<o.w+.35&&Math.abs(z-o.z)<o.d+.35);}
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
const topStation=gondolaStations.at(-1),gondolaExit={x:topStation.x-Math.sin(topStation.yaw)*10,z:topStation.z-Math.cos(topStation.yaw)*10};
const ski=skiNetwork[0].points.map(p=>[p.x,p.y,p.z]);
const lift=Array.from({length:321},(_,i)=>liftPoint(i/320)),upperlift=Array.from({length:601},(_,i)=>upperLiftPoint(i/600));
export const resortRides={
 lift:{bodyOffset:.82,heightMode:'seat',points:lift,exit:[summitTransfer[0].x,alpineHeight(summitTransfer[0].x,summitTransfer[0].z),summitTransfer[0].z],duration:28,arrivalYaw:.65},
 upperlift:{bodyOffset:.82,heightMode:'seat',points:upperlift,exit:[middleSummit.x+20,alpineHeight(middleSummit.x+20,middleSummit.z),middleSummit.z],duration:46,arrivalYaw:.6},
 ridgelift:{bodyOffset:.82,heightMode:'seat',points:Array.from({length:321},(_,i)=>ridgeLiftPoint(i/320)),exit:[ridgeTransfers[1][0].x,alpineHeight(ridgeTransfers[1][0].x,ridgeTransfers[1][0].z),ridgeTransfers[1][0].z],duration:38,arrivalYaw:.6},
 gondola:{smoothHeading:true,bodyOffset:.82,heightMode:'seat',points:gondolaPoints,exit:[gondolaExit.x,alpineHeight(gondolaExit.x,gondolaExit.z),gondolaExit.z],baseExit:[gondolaEntry.x,alpineHeight(gondolaEntry.x,gondolaEntry.z),gondolaEntry.z],duration:65,boardingSeconds:14,arrivalSeconds:14,arrivalYaw:0},
 ski:{heightMode:'surface',points:ski,duration:480}
};
export const resortObstacles=[
 {x:-97,z:-176,w:9.3,d:6},{...skiTicketBooth,w:1.5,d:1.4},
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
export function resortGround(x,z){if(z< -137)return alpineHeight(x,z);const localZ=z-spaShift;if(x>0&&x<24&&localZ>115&&localZ<137)return .34;if(Math.abs(x-12)<2.2&&localZ>=114.2&&localZ<=115)return .09+.25*(localZ-114.2)/.8;if(x>=-.8&&x<=0&&Math.abs(z-spaPavilion.sideDoorZ)<2.3)return .09+.25*(x+.8)/.8;return .09;}
export function resortRidePosition(x,y,z,mode){
 if(!Number.isFinite(x+y+z))return false;
 if(mode==='lift')return Object.values(resortRides).filter(r=>r.heightMode==='seat').some(r=>r.points.slice(1).some((b,i)=>{const a=r.points[i],dx=b[0]-a[0],dz=b[2]-a[2],t=((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1);if(t< -1e-6||t>1+1e-6)return false;return Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz)<2&&Math.abs(y-.82-a[1]-t*(b[1]-a[1]))<(r.boardingSeconds?1.2:.2);}));
 const airLimit=mode==='ski'&&skiRuns.some(r=>z>=r.startZ&&z<=r.finish+12&&Math.abs(x-skiRunCenter(z,r.id))<=skiRunHalfWidth(z,r.id))?(skiJumps.some(j=>Math.hypot(x-j.x,z-j.z)<160)?32:16):3;
 return ['summit','ski'].includes(mode)&&z>=mountainBounds.minZ&&z<=mountainBounds.maxZ&&x>mountainBounds.minX&&x<mountainBounds.maxX&&y>=alpineHeight(x,z)-.1&&y<=alpineHeight(x,z)+airLimit;
}
