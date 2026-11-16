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
export const summit={x:-8,z:-347,height:72.09,rx:42,rz:22};
export const peakSummit={x:45,z:-380,height:100.09,rx:20,rz:12};
export const skiRuns=[
 {id:'main',name:'중급 슬로프',level:'중급',color:'#8fcbe8',startX:-12,startZ:-334,finish:-172,width:9.5},
 {id:'easy',name:'초급 슬로프',level:'초급',color:'#a7d8ba',startX:24,startZ:-294,finish:-172,width:12},
 {id:'curve',name:'커브 슬로프',level:'커브',color:'#e9b5d8',startX:4,startZ:-334,finish:-180,width:8},
 {id:'advanced',name:'상급 슬로프',level:'상급',color:'#e8a18f',startX:34,startZ:-374,finish:-180,width:6.5},
 {id:'expert',name:'최상급 슬로프',level:'최상급',color:'#bfa7da',startX:52,startZ:-378,finish:-180,width:5.5}
];
export const skiStarts=skiRuns.map(run=>({id:run.id,name:run.name,level:run.level,x:run.startX,z:run.startZ,r:3}));
const mix=(a,b,t)=>a+(b-a)*t;
function mainCenter(z){const t=clamp((z+334)/162),wave=smooth(t/.15)*(1-smooth((t-.85)/.15));return -12+20*t+8*Math.sin(t*Math.PI*2)*wave;}
function curveCenter(z){const t=clamp((z+334)/154);return 4+52*smooth(t)+36*Math.sin(t*Math.PI)*smooth(t/.18)*(1-smooth((t-.85)/.15));}
export function skiRunCenter(z,id='main'){
 if(id==='curve')return curveCenter(z);
 if(id==='easy'){const u=clamp((z+294)/122);return mix(24+25*Math.sin(u*Math.PI),mainCenter(z),smooth((z+244)/48));}
 if(id==='advanced')return z<=-334?mix(34,44,smooth((z+374)/40)):curveCenter(z)+40*(1-smooth((z+334)/74));
 if(id==='expert')return z<=-334?mix(52,69,smooth((z+378)/44)):skiRunCenter(z,'advanced')+25*(1-smooth((z+334)/46));
 return mainCenter(z);
}
export function skiRunHalfWidth(z,id='main'){const run=skiRuns.find(run=>run.id===id)||skiRuns[0];return 3.1+(run.width-3.1)*smooth((z-run.startZ-8)/40);}
export function skiRunAt(x,z){let nearest=skiRuns[0],distance=Infinity;const active=skiRuns.filter(run=>z>=run.startZ-7&&z<=run.finish+16);for(const run of active.length?active:skiRuns){const d=Math.abs(x-skiRunCenter(z,run.id))/skiRunHalfWidth(z,run.id);if(d<distance){nearest=run;distance=d;}}return nearest;}
function lowerHeight(z,length=162){return .09+72*(1-smooth((z+334)/length));}
function descent(z,start,end,height,length,pitch=0){const v=clamp((z-start)/(end-start)),t=v+pitch*Math.sin(v*Math.PI)**2,q=clamp((end+334)/length),low=lowerHeight(end,length),slope=-72*6*q*(1-q)/length;return (2*t**3-3*t*t+1)*height+(-2*t**3+3*t*t)*low+(t**3-t*t)*slope*(end-start);}
export function skiRunHeight(z,id='main'){
 if(id==='easy')return mix(lowerHeight(z,154),lowerHeight(z),smooth((z+244)/24));
 if(id==='advanced'||id==='expert')return z< -310?descent(z,id==='expert'?-378:-374,-310,100.09,154,id==='expert'?.15:0):lowerHeight(z,154);
 return lowerHeight(z,id==='curve'?154:162);
}
export const beginnerAccess={start:{x:24,z:-334},end:{x:24,z:-294},halfWidth:5.5};
export const skiRunouts=[{x:8,z:-172,rx:24,rz:18},{x:56,z:-180,rx:24,rz:18}];
export const skiCenter=z=>skiRunCenter(z),skiHalfWidth=z=>skiRunHalfWidth(z);
export function sledCenter(z){return 124+8*Math.sin(clamp((-z-196)/76)*Math.PI)-4*(1-smooth((-z-192)/20));}
export const summitObstacles=[
 {x:-18,z:-357,w:4.15,d:1.85},{x:2,z:-357,w:4.15,d:1.85},{x:-8,z:-349,r:1.4},
 {x:-11.8,z:-349,w:.6,d:1.6},{x:-4.2,z:-349,w:.6,d:1.6},
 {x:11.1,z:-352,w:.2,d:2.4},{x:16.9,z:-352,w:.2,d:2.4},{x:14,z:-354.4,w:2.9,d:.2},{x:14,z:-349.6,w:2.9,d:.2,door:{x:14,w:1.1}}
];
let summitRestroomOpen=true;
export function setSummitRestroomOpen(open){summitRestroomOpen=!!open;return summitRestroomOpen;}
export function summitPositionValid(x,z){if(!summitRestroomOpen&&Math.abs(x-14)<1.1&&Math.abs(z+349.6)<.22)return false;return !summitObstacles.some(o=>{if(o.door&&Math.abs(x-o.door.x)<o.door.w-.35)return false;return o.r?Math.hypot(x-o.x,z-o.z)<o.r+.35:Math.abs(x-o.x)<o.w+.35&&Math.abs(z-o.z)<o.d+.35;});}
export const summitFacilities=[
 {id:'odeng',name:'어묵 트럭',x:-18,z:-352.5,model:{x:-18,z:-357},view:{distance:9,yaw:.25,pitch:.3}},
 {id:'marshmallow',name:'마시멜로 트럭',x:2,z:-352.5,model:{x:2,z:-357},view:{distance:9,yaw:.25,pitch:.3}},
 {id:'campfire',name:'모닥불',x:-8,z:-346.8,r:1.1,model:{x:-8,z:-349},view:{distance:11,yaw:.25,pitch:.3}},
 {id:'restroom',name:'정상 화장실',x:14,z:-348,model:{x:14,z:-352},view:{distance:9,yaw:.25,pitch:.3}},
 {id:'upperlift',name:'상부 리프트',x:-33,z:-356.8,r:2.2,model:{x:-30,z:-358},view:{distance:10,yaw:1.5,pitch:.22}}
];
function alpineTerrainHeight(x,z){
 const original=.09+(localHeight(x/4,(z+260)/4-114)-.09)*4,lanes=skiRuns.filter(run=>z>=run.startZ-10&&z<=run.finish+16).map(run=>({center:skiRunCenter(z,run.id),half:skiRunHalfWidth(z,run.id),height:skiRunHeight(z,run.id),weight:smooth((z-run.startZ+10)/8)*(1-smooth((z-run.finish)/16))})).sort((a,b)=>a.center-b.center);
 let corridor=0,piste=original;
 for(let i=0;i<lanes.length;i++){
  const lane=lanes[i],distance=Math.abs(x-lane.center);
  corridor=Math.max(corridor,(1-smooth((distance-lane.half-1)/10))*lane.weight);
  if(distance<=lane.half){piste=lane.height+.06*(distance/lane.half)**2;break;}
  if(x<lane.center-lane.half){
   if(i===0)piste=lane.height+.06;
   else{const prev=lanes[i-1],left=prev.center+prev.half,right=lane.center-lane.half,u=clamp((x-left)/(right-left));piste=prev.height+(lane.height-prev.height)*smooth(u)+.06+Math.sin(u*Math.PI)*Math.min(1.6,(right-left)*.15)*smooth((-z-172)/14);}
   break;
  }
  piste=lane.height+.06;
 }
 // Grading the gaps between runs avoids vertical seams when adjacent courses
 // deliberately descend at different rates. The snowbanks stay below head height.
 if(lanes.length&&x>=lanes[0].center-lanes[0].half&&x<=lanes.at(-1).center+lanes.at(-1).half)corridor=Math.max(...lanes.map(lane=>lane.weight));
 let terrain=original*(1-corridor)+piste*corridor;
 // This open connecting snowfield reaches the beginner gate on the middle terrace.
 const accessBlend=(1-smooth((Math.abs(x-24)-beginnerAccess.halfWidth)/5))*smooth((z+342)/8)*(1-smooth((z+294)/8));
 terrain=mix(terrain,lowerHeight(z,154),accessBlend);
 const sledDistance=Math.abs(x-sledCenter(z)),sledT=clamp((-z-192)/80),sledBlend=(1-smooth((sledDistance-5)/5))*smooth((z+282)/10)*(1-smooth((z+192)/8));
 terrain=terrain*(1-sledBlend)+(.09+19*smooth(sledT))*sledBlend;
 for(const area of [summit,peakSummit]){const d=Math.hypot((x-area.x)/area.rx,(z-area.z)/area.rz),terrace=1-smooth((d-.85)/.45);terrain=mix(terrain,area.height,terrace);}
 // Upper pistes cut through the shoulders of the lower terrace, rather than
 // inheriting its sideways cliff where the two elevations approach each other.
 for(const run of skiRuns.filter(run=>['advanced','expert'].includes(run.id))){if(z<run.startZ||z> -310)continue;const d=Math.abs(x-skiRunCenter(z,run.id)),half=skiRunHalfWidth(z,run.id),weight=1-smooth((d-half)/4);terrain=mix(terrain,skiRunHeight(z,run.id)+.06*Math.min(1,d/half)**2,weight);}
 return terrain;
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
export const upperLiftLayout={x:-30,z:-358,dx:60,dz:-24,spacing:4,hanger:3.1,supports:[0,.25,.5,.75,1]};
export function upperLiftPoint(progress){const t=clamp(progress);return[upperLiftLayout.x+upperLiftLayout.dx*t,summit.height+.6+(peakSummit.height-summit.height)*smooth(t/.95),upperLiftLayout.z+upperLiftLayout.dz*t];}
export function alpineHeight(x,z){
 let terrain=alpineTerrainHeight(x,z);
 const u=upperLiftLayout,along=((x-u.x)*u.dx+(z-u.z)*u.dz)/(u.dx*u.dx+u.dz*u.dz);
 if(along>=0&&along<=1){const p=upperLiftPoint(along),distance=((x-p[0])*-u.dz+(z-p[2])*u.dx)/Math.hypot(u.dx,u.dz),weight=1-smooth((Math.abs(distance-2)-3)/4),airborne=Math.min(smooth(along/.14),smooth((1-along)/.14));terrain=mix(terrain,Math.min(terrain,p[1]-.6-3.2*airborne),weight);}
 const t=(z-liftLayout.z)/liftLayout.dz;
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
 {id:'sled',name:'눈썰매 계곡',x:120,z:-192,kind:'sled',view:{distance:70,yaw:.45,pitch:.45,lookAhead:16,lookHeight:9}},
 {id:'onsen',name:'설림 노천 온천',x:-10,z:114,kind:'onsen',view:{distance:40,yaw:2.65,pitch:.62}},
 {id:'sauna',name:'편백 휴양관',x:12,z:115,kind:'sauna',view:{distance:32,yaw:2.65,pitch:.55}}
];
export const restSeats={onsen:{x:-17.8,y:1.35,z:124,yaw:Math.PI/2},sauna:{x:7.5,y:1.55,z:125,yaw:Math.PI/2},healing:{x:50,y:1,z:35.5,yaw:Math.PI}};
export const spaPavilion={x:12,z:126,w:24,d:22,sideDoorZ:121.5};
export const spaActivities={
 bath:{x:-10,y:.28,z:121,yaw:Math.PI,mode:'bath',label:'노천탕 · WASD로 천천히 이동',pool:{x:-10,z:124,rx:5.8,rz:4.8},view:{distance:12,yaw:2.7,pitch:.32}},
 smallbath:{x:-19,y:.28,z:132,yaw:Math.PI,mode:'bath',label:'작은 온천 · 물소리 듣기',pool:{x:-19,z:132,rx:2.4,rz:1.7},view:{distance:10,yaw:2.7,pitch:.35}},
 footbath:{x:20.6,y:1.05,z:132.5,yaw:-Math.PI/2,mode:'bath',label:'창가 족욕',pool:{x:20.6,z:132.5,rx:1.25,rz:.95},view:{distance:6,yaw:2.25,pitch:.3}},
 lounge:{x:1.8,y:1.66,z:127.5,yaw:Math.PI/2,mode:'sauna',label:'창가 소파',view:{distance:6,yaw:1.2,pitch:.24}},
 sauna:{x:7.5,y:1.8,z:125,yaw:Math.PI/2,mode:'sauna',label:'편백 벤치 · 포근하게 몸 녹이기',view:{distance:5,yaw:1.2,pitch:.18,lookHeight:-.8}},
 lie:{x:17,y:1.98,z:124.9,yaw:0,mode:'lie',label:'따뜻한 매트 · 누워 쉬는 중',view:{distance:6,yaw:2.7,pitch:.18,lookHeight:-.9}},
 tea:{x:15.2,y:1.28,z:118.8,yaw:0,mode:'tea',label:'찻자리 · 따뜻한 차 한 잔',view:{distance:5,yaw:.35,pitch:.2,lookHeight:-.8}}
};
export function spaPositionValid(x,y,z,mode){return Object.values(spaActivities).some(a=>{if(a.mode!==mode||Math.abs(y-a.y)>.12)return false;if(a.pool)return ((x-a.pool.x)/a.pool.rx)**2+((z-a.pool.z)/a.pool.rz)**2<=1.02;return Math.hypot(x-a.x,z-a.z)<.15;});}
const ski=Array.from({length:163},(_,i)=>{const z=-340+i/162*168,x=skiCenter(z);return[x,alpineHeight(x,z),z];});
const lift=Array.from({length:201},(_,i)=>liftPoint(i/200));
const upperlift=Array.from({length:101},(_,i)=>upperLiftPoint(i/100));
const sled=Array.from({length:51},(_,i)=>{const t=1-i/50,z=-98-t*19,x=17+Math.sin(t*Math.PI)*2;return[x,localHeight(x,z),z];});sled.push([17,localHeight(17,-97),-97]);

for(let i=0;i<sled.length;i++){const p=scalePoint(sled[i]),x=sledCenter(p[2]);sled[i]=[x,alpineHeight(x,p[2]),p[2]];}
export const resortRides={lift:{bodyOffset:.82,heightMode:'seat',points:lift,exit:[-24,alpineHeight(-24,-342),-342],duration:45},upperlift:{bodyOffset:.82,heightMode:'seat',points:upperlift,exit:[36,alpineHeight(36,-378),-378],duration:28},ski:{heightMode:'surface',points:ski,duration:38},sled:{bodyOffset:1.03,heightMode:'surface',points:sled,duration:22}};
export const resortObstacles=[
 {x:-55,z:-176,w:9.3,d:6},{x:-44,z:-185,w:1.5,d:1.4},
 ...summitObstacles,
 {x:-10,z:124,rx:7.4,rz:6.4},{x:-19,z:132,rx:3.7,rz:3},
 {x:12,z:137,w:12,d:.18},{x:24,z:126,w:.18,d:11},
 {x:0,z:117.1,w:.18,d:2.1},{x:0,z:130.4,w:.18,d:6.6},
 {x:12,z:115,w:12,d:.18,door:{x:12,w:2.2}},
 {x:7.5,z:125,w:1.1,d:5},{x:17,z:127,w:1.1,d:3},
 {x:12,z:130,r:1.5},{x:16.5,z:120,w:1.7,d:.75},{x:5.2,z:118.5,w:1.4,d:.3},
 {x:20.6,z:132.5,rx:2.15,rz:1.75},{x:1.8,z:127.5,w:.9,d:2.4},
 {x:2.1,z:118.8,r:.32},{x:22,z:118.8,r:.32}
];
export function resortGround(x,z){if(Math.hypot(x,z+260)<144)return alpineHeight(x,z);if(x>0&&x<24&&z>115&&z<137)return .34;if(Math.abs(x-12)<2.2&&z>=114.2&&z<=115)return .09+.25*(z-114.2)/.8;if(x>=-.8&&x<=0&&Math.abs(z-spaPavilion.sideDoorZ)<2.3)return .09+.25*(x+.8)/.8;return .09;}
export function resortRidePosition(x,y,z,mode){
 if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(z))return false;
 if(mode==='lift'||mode==='upperlift'){
  return [[liftLayout,liftPoint],[upperLiftLayout,upperLiftPoint]].some(([line,point])=>{const t=((x-line.x)*line.dx+(z-line.z)*line.dz)/(line.dx*line.dx+line.dz*line.dz);if(t<-.001||t>1.001)return false;const p=point(t);return Math.hypot(x-p[0],z-p[2])<.7&&Math.abs(y-p[1]-.82)<.5;});
 }
 return ['summit','ski','sled'].includes(mode)&&Math.hypot(x,z+260)<142&&y>=alpineHeight(x,z)-.1&&y<=alpineHeight(x,z)+8;
}
