// Metres, in the existing resort's local frame. The base and other islands do not move.
const clamp=t=>Math.max(0,Math.min(1,t));
export const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
// Compact the authored mountain, keeping the existing park bridge and base apron fixed.
// All courses, terraces and cables use these coordinates; avatars and track widths do not scale.
export const mountainZ=z=>z< -260?-260+(z+260)*.38:z;
const mountainX=(x,z)=>x*(1-.54*smooth((-z-260)/500));
const mountainY=(y,z)=>.09+(y-.09)*(1-.50*smooth((-z-260)/500));
const controlPoints=points=>points.map(([z,x])=>[mountainZ(z),mountainX(x,z)]);
export function mountainSpline(z,nodes){
 let i=0;while(i<nodes.length-2&&z>nodes[i+1][0])i++;
 const a=nodes[i],b=nodes[i+1],t=clamp((z-a[0])/(b[0]-a[0])),prev=nodes[Math.max(0,i-1)],next=nodes[Math.min(nodes.length-1,i+2)],m0=(b[1]-prev[1])/(b[0]-prev[0]),m1=(next[1]-a[1])/(next[0]-a[0]),d=b[0]-a[0];
 return(2*t**3-3*t*t+1)*a[1]+(t**3-2*t*t+t)*m0*d+(-2*t**3+3*t*t)*b[1]+(t**3-t*t)*m1*d;
}
export const mountainBounds={minX:-610,maxX:610,minZ:mountainZ(-5300),maxZ:-137};
export const mountainForm={x:0,z:(mountainZ(-5300)-137)/2,rx:610,rz:(-137-mountainZ(-5300))/2,depth:120};
const outline=controlPoints([[-5300,0],[-5150,250],[-4900,1050],[-4500,1000],[-3600,1150],[-2500,1100],[-1600,800],[-900,640],[-440,390],[-280,220],[-170,164],[-145,82],[-137,0]]);
export function mountainHalfWidth(z){return Math.max(0,mountainSpline(z,outline));}
export function mountainDistance(x,z){return Math.max(Math.abs(x)-mountainHalfWidth(z),mountainBounds.minZ-z,z-mountainBounds.maxZ);}

const mainShape=controlPoints([[-4850,-470],[-4500,-320],[-4080,-380],[-3700,-110],[-3240,420],[-2840,540],[-2410,170],[-2020,-380],[-1620,-440],[-1210,-120],[-820,170],[-430,90],[-172,-6]]);
const grades=[[-4900,1800.09],[-4850,1800.09],[-4700,1715.91],[-4400,1571.91],[-4100,1409.91],[-3800,1281.91],[-3500,1123.909999],[-3200,967.909999],[-2900,817.909999],[-2600,681.910001],[-2300,571.91],[-2000,473.91],[-1600,361.909999],[-1200,275.91],[-1000,221.91],[-600,113.91],[-300,25.909999],[-205,1.1],[-172,0.09]].map(([z,y])=>[mountainZ(z),mountainY(y,z)]);
// Monotone Hermite slopes keep the almost-flat summit from becoming an uphill bump.
const gradeTangents=grades.map((p,i)=>{const a=grades[Math.max(0,i-1)],b=grades[Math.min(grades.length-1,i+1)],left=(p[1]-a[1])/(p[0]-a[0]||1),right=(b[1]-p[1])/(b[0]-p[0]||1);return i===0?right:i===grades.length-1?left:left*right<=0?0:2*left*right/(left+right);});
function authoredRunHeight(z){let i=0;while(i<grades.length-2&&z>grades[i+1][0])i++;const a=grades[i],b=grades[i+1],d=b[0]-a[0],t=clamp((z-a[0])/d);return Math.max(.09,(2*t**3-3*t*t+1)*a[1]+(t**3-2*t*t+t)*gradeTangents[i]*d+(-2*t**3+3*t*t)*b[1]+(t**3-t*t)*gradeTangents[i+1]*d);}
// One tangent-continuous runout is used by terrain, skis and map alike.
// Multiplying the last 72 m by another flattening mask doubled the downhill grade.
const runoutStart=-460,runoutEnd=-244,runoutHeight=authoredRunHeight(runoutStart),runoutGrade=(authoredRunHeight(runoutStart+.1)-authoredRunHeight(runoutStart-.1))/.2;
export function skiRunHeight(z){
 if(z<=runoutStart)return authoredRunHeight(z);
 if(z>=runoutEnd)return .09;
 const d=runoutEnd-runoutStart,t=(z-runoutStart)/d;
 return(2*t**3-3*t*t+1)*runoutHeight+(t**3-2*t*t+t)*runoutGrade*d+(-2*t**3+3*t*t)*.09;
}
// Preserve the broad turns of the authored course in a shorter, steeper footprint.
const main=mainShape.map(([z,x])=>[z,-6+(x+6)*0.6685110867023468]);
const mainX=z=>mountainSpline(z,main);
const lines={main,
 easy:controlPoints([[-1200,-75],[-1050,-195],[-900,-230],[-780,-200],[-600,-130],[-410,-80],[-270,-45],[-174,-26]]),
 curve:controlPoints([[-3100,325],[-2800,720],[-2400,700],[-2140,545],[-1800,450],[-1430,340],[-1100,290],[-780,230],[-480,110],[-250,25],[-174,25]]),
 advanced:controlPoints([[-3500,90],[-3160,40],[-2700,-40],[-2300,30],[-1900,-110],[-1500,-70],[-1100,40],[-700,0],[-172,-6]]),
 explore:controlPoints([[-4050,-245],[-3800,-600],[-3430,-720],[-3000,-550],[-2680,-180],[-2400,110]])};
// Keep the short beginner line on the inland side of its separate chairlift.
for(const point of lines.easy)point[1]+=66*smooth((-point[0]-230)/180);
for(const id of ['easy','curve','advanced','explore'])lines[id][0][1]=mainX(lines[id][0][0]);
lines.explore.at(-1)[1]=mainX(lines.explore.at(-1)[0]);lines.advanced.at(-2)[1]=mainX(lines.advanced.at(-2)[0]);
export const skiRuns=[
 {id:'main',name:'은하 파노라마',level:'중급',color:'#68bcf4',startZ:-4850,finish:-172,width:32,adjacent:['advanced','curve','easy','explore'],merges:[]},
 {id:'easy',name:'눈꽃 메도우',level:'초급',color:'#69ccaa',startZ:-1200,finish:-174,width:32,adjacent:['main'],merges:[{with:'main',z:-1200}]},
 {id:'curve',name:'실버 포레스트',level:'초중급',color:'#b0a4ef',startZ:-3100,finish:-174,width:25,adjacent:['main','explore'],merges:[{with:'main',z:-3100}]},
 {id:'advanced',name:'크리스털 리지',level:'상급',color:'#ee947e',startZ:-3500,finish:-172,width:17,adjacent:['main'],merges:[{with:'main',z:-3500},{with:'main',z:-700}]},
 {id:'explore',name:'구름숲 연결로',level:'연결',color:'#e4d297',startZ:-4050,finish:-2400,width:21,adjacent:['main','curve'],merges:[{with:'main',z:-4050},{with:'main',z:-2400}]}];
for(const run of skiRuns){run.startZ=mountainZ(run.startZ);run.finish=mountainZ(run.finish);run.merges=run.merges.map(m=>({...m,z:mountainZ(m.z)}));}
export function skiRunCenter(z,id='main'){const own=mountainSpline(z,lines[id]||main);return id==='advanced'?mix(own,mainX(z),smooth((z-mountainZ(-900))/(mountainZ(-700)-mountainZ(-900)))):own;}
export function skiRunHalfWidth(z,id='main'){const run=skiRuns.find(r=>r.id===id)||skiRuns[0];return run.width*(.85+.15*smooth((z-run.startZ)/40));}
for(const run of skiRuns)run.startX=skiRunCenter(run.startZ,run.id);
export function skiRunAt(x,z){let best=skiRuns[0],distance=Infinity;for(const run of skiRuns){if(z<run.startZ-15||z>run.finish+20)continue;const d=Math.abs(x-skiRunCenter(z,run.id))/skiRunHalfWidth(z,run.id);if(d<distance){distance=d;best=run;}}return best;}
export const skiStarts=skiRuns.map(r=>({id:r.id,name:r.name,level:r.level,x:r.startX,z:r.startZ,r:8}));
export const skiRunouts=[{x:-25,z:-165,rx:28,rz:18},{x:0,z:-165,rx:28,rz:18},{x:25,z:-165,rx:28,rz:18}];
export const summit={x:-73,z:mountainZ(-920),height:skiRunHeight(mountainZ(-920)),rx:68,rz:45};
export const peakSummit={x:mainX(mountainZ(-4850)),z:mountainZ(-4880),height:mountainY(1800.09,-4880),rx:140,rz:48};
export const middleSummit={x:mountainX(780,-2420),z:mountainZ(-2420),height:skiRunHeight(mountainZ(-2420)),rx:90,rz:55};
export const ridgeBase={x:middleSummit.x+54,z:middleSummit.z-34,height:middleSummit.height,rx:32,rz:30};
export const ridgeSummit={x:peakSummit.x+82,z:peakSummit.z+6,height:peakSummit.height,rx:30,rz:32};
export const gondolaBase={x:-126,z:-210,height:.09,rx:40,rz:42};
export const mountainTerraces=[summit,peakSummit,middleSummit,ridgeBase,ridgeSummit,gondolaBase];
// Optional snow kickers sit off the racing line, with a full-width bypass.
export const skiJumps=[[-4490,-11],[-3899,11],[-3132,-11],[-2737,-11],[-2107,11],[-1589,11],[-1041,-11]].map(([authoredZ,offset],i)=>{
 const z=mountainZ(authoredZ);
 const yaw=Math.atan2(mainX(z+1)-mainX(z-1),2);
 return{id:'snow-kicker-'+(i+1),x:mainX(z)+Math.cos(yaw)*offset,z:z-Math.sin(yaw)*offset,yaw,length:18,width:10,height:2.8};
});
export function skiJumpCoordinates(jump,x,z){const dx=x-jump.x,dz=z-jump.z;return{along:dx*Math.sin(jump.yaw)+dz*Math.cos(jump.yaw),side:dx*Math.cos(jump.yaw)-dz*Math.sin(jump.yaw)};}
export function skiJumpHeight(x,z){let height=0;for(const jump of skiJumps){if(Math.abs(z-jump.z)>32||Math.abs(x-jump.x)>32)continue;const p=skiJumpCoordinates(jump,x,z);if(p.along< -jump.length||p.along>8||Math.abs(p.side)>jump.width/2)continue;
 const edge=1-smooth((Math.abs(p.side)-jump.width/2+1.5)/1.5),rise=p.along<=0?((p.along+jump.length)/jump.length)**2:1-smooth(p.along/8);height=Math.max(height,jump.height*rise*edge);}return height;}

export const mountainAprons=[
 {x:summit.x+2,z:summit.z,rx:35,rz:24,height:summit.height},
 {x:middleSummit.x+42,z:middleSummit.z-17,rx:57,rz:47,height:middleSummit.height},
 {x:peakSummit.x+25,z:peakSummit.z,rx:88,rz:50,height:peakSummit.height},
];
export function mountainGroundHeight(x,z){
 if(z>=-244)return .09;
 // Open snow faces follow the course grade. Raised flank ridges previously
 // carved every piste into a canyon and hid the view from the summit arrival.
 const height=skiRunHeight(z),edge=smooth(Math.max(0,-mountainDistance(x,z))/65),back=smooth((z-mountainBounds.minZ)/150);
 let y=.09+(height-.09)*edge*back;
 for(const r of skiRuns){if(z<r.startZ-55||z>r.finish+25)continue;const side=Math.abs(x-skiRunCenter(z,r.id)),weight=(1-smooth((side-skiRunHalfWidth(z,r.id))/140))*smooth((z-r.startZ+55)/55);y=mix(y,height,weight);}
 // The terminal apron is outside the piste; preserve its level floor after broad snow blending.
 const stationDistance=Math.hypot((x-gondolaBase.x)/gondolaBase.rx,(z-gondolaBase.z)/gondolaBase.rz);
 y=mix(y,gondolaBase.height,1-smooth((stationDistance-.8)/.2));
 // A broad graded concourse joins terminals to the hillside. Small nested
 // elliptical cuts made the mid-station look like an excavated crater.
 for(const apron of mountainAprons){
  const wx=1-smooth((Math.abs(x-apron.x)-apron.rx)/100),wz=1-smooth((Math.abs(z-apron.z)-apron.rz)/180);
  y=mix(y,apron.height,wx*wz);
 }
 // The concourse must not impose a sideways bank on a groomed ski run.
 for(const run of skiRuns){if(z<run.startZ||z>run.finish)continue;const gap=Math.abs(x-skiRunCenter(z,run.id))-skiRunHalfWidth(z,run.id);y=mix(y,height,1-smooth(gap/28));}
 return Math.max(.09,y);
}
export const alpineHeight=(x,z)=>mountainGroundHeight(x,z)+skiJumpHeight(x,z);
export const summitTransfer=[{x:summit.x-22,z:summit.z},{x:summit.x-22,z:summit.z+7},{x:summit.x,z:summit.z+7},{x:skiRunCenter(mountainZ(-900),'easy'),z:mountainZ(-900)}];
export const beginnerAccess={start:summitTransfer[0],end:summitTransfer.at(-1),halfWidth:9};
export const liftLayout={x:-72,z:-188,dx:summit.x-22+72,dz:summit.z+188,spacing:4,hanger:3.1,supports:Array.from({length:10},(_,i)=>i/9)};
export const upperLiftLayout={x:72,z:-202,dx:middleSummit.x+20-72,dz:middleSummit.z+202,spacing:4,hanger:3.1,supports:Array.from({length:22},(_,i)=>i/21)};
export const ridgeLiftLayout={x:ridgeBase.x+16,z:ridgeBase.z,dx:ridgeSummit.x+16-ridgeBase.x-16,dz:ridgeSummit.z-ridgeBase.z,spacing:4,hanger:3.1,supports:Array.from({length:9},(_,i)=>i/8)};
export const ridgeLiftEntry={x:ridgeBase.x+16,z:ridgeBase.z+6};
// A shared mid-mountain concourse connects the two lifts; the upper lift
// reaches the same summit as the gondola, rather than ending on a remote ridge.
export const ridgeTransfers=[
 [{x:middleSummit.x+20,z:middleSummit.z},{x:middleSummit.x+20,z:middleSummit.z+16},{x:ridgeBase.x+16,z:middleSummit.z+16},{x:ridgeBase.x+16,z:ridgeBase.z+6}],
 [{x:ridgeSummit.x+16,z:ridgeSummit.z+6},{x:peakSummit.x+65,z:peakSummit.z+28},{x:mainX(mountainZ(-4850)),z:mountainZ(-4850)}]
];
export const upperLiftEntry={x:72,z:-196};
// Cable spans are anchored above the actual mountain; station seats remain at boarding height.
function cableSamples(line){const count=Math.ceil(Math.hypot(line.dx,line.dz)/6),points=[];
 for(let i=0;i<=count;i++){const t=i/count,x=line.x+line.dx*t,z=line.z+line.dz*t,edge=Math.min(t,1-t),clearance=.69+22*smooth(edge/.08);let y=alpineHeight(x,z)+clearance;
  // Look ahead under the complete span; a chair never clips the crest between towers.
  for(let d=-24;d<=24;d+=4){const u=clamp(t+d/Math.hypot(line.dx,line.dz)),gx=line.x+line.dx*u,gz=line.z+line.dz*u;y=Math.max(y,alpineHeight(gx,gz)+clearance-Math.abs(d)*.3);}
  if(i===0||i===count){const len=Math.hypot(line.dx,line.dz);y=Math.max(alpineHeight(x,z),alpineHeight(x-line.dz/len*4,z+line.dx/len*4))+.69;}else y+=.7*Math.min(1,t*count,(1-t)*count);points.push([x,y,z]);}
 // Relax the cable profile before arc sampling. This removes slope kinks from
 // terrain-envelope maxima while preserving both station sockets and snow clearance.
 const nx=-line.dz/Math.hypot(line.dx,line.dz),nz=line.dx/Math.hypot(line.dx,line.dz);
 for(let pass=0;pass<18;pass++){const next=points.map(p=>p[1]);for(let i=1;i<points.length-1;i++){const p=points[i],floor=Math.max(alpineHeight(p[0],p[2]),alpineHeight(p[0]+nx*4,p[2]+nz*4))+.69;next[i]=Math.max(floor,(points[i-1][1]+points[i][1]*2+points[i+1][1])/4);}for(let i=1;i<points.length-1;i++)points[i][1]=next[i];}
 // Raise neighbouring spans instead of inheriting abrupt terrain slopes into the cable.
 // A forward/backward envelope keeps camera vertical acceleration bounded.
 const maxGrade=line===ridgeLiftLayout?1.3:.82;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],span=Math.hypot(b[0]-a[0],b[2]-a[2]);b[1]=Math.max(b[1],a[1]-maxGrade*span);}
 for(let i=points.length-2;i>=0;i--){const a=points[i+1],b=points[i],span=Math.hypot(b[0]-a[0],b[2]-a[2]);b[1]=Math.max(b[1],a[1]-maxGrade*span);}
 for(let pass=0;pass<12;pass++){const next=points.map(p=>p[1]);for(let i=1;i<points.length-1;i++)next[i]=Math.max(points[i][1],(points[i-1][1]+points[i][1]*2+points[i+1][1])/4);for(let i=1;i<points.length-1;i++)points[i][1]=next[i];}
 return points;}
function cablePoint(points,t){const f=clamp(t)*(points.length-1),i=Math.min(points.length-2,Math.floor(f)),u=f-i,a=points[i],b=points[i+1];return a.map((v,k)=>mix(v,b[k],u));}
const leftCable=cableSamples(liftLayout),rightCable=cableSamples(upperLiftLayout),ridgeCable=cableSamples(ridgeLiftLayout);
export const liftPoint=t=>cablePoint(leftCable,t),upperLiftPoint=t=>cablePoint(rightCable,t),ridgeLiftPoint=t=>cablePoint(ridgeCable,t);
// A straight cable alignment: terrain shapes the support heights, never the horizontal route.
// Intermediate towers carry one smooth vertical profile with clear terminal run-ins.
export const gondolaPoints=[];
const gondolaTop={x:peakSummit.x-34,z:peakSummit.z};
const cableLength=Math.hypot(gondolaTop.x-gondolaBase.x,gondolaTop.z-gondolaBase.z),spans=Math.ceil(cableLength/90);
const cableNX=-(gondolaTop.z-gondolaBase.z)/cableLength,cableNZ=(gondolaTop.x-gondolaBase.x)/cableLength;
export const gondolaSupports=Array.from({length:spans+1},(_,i)=>{
 const t=i/spans,x=mix(gondolaBase.x,gondolaTop.x,t),z=mix(gondolaBase.z,gondolaTop.z,t);
 let y=Math.max(...[-3,0,12,15].map(offset=>alpineHeight(x+cableNX*offset,z+cableNZ*offset)))+(i===0||i===spans?1.2:19);
 return[x,y,z];
}).filter((p,i)=>i===0||i===spans||skiRuns.every(r=>p[2]<r.startZ||p[2]>r.finish||Math.abs(p[0]+cableNX*6-skiRunCenter(p[2]+cableNZ*6,r.id))-skiRunHalfWidth(p[2],r.id)>7));
const supportLast=gondolaSupports.length-1;
// Lift only intermediate supports until every straight span clears both lanes.
for(let pass=0;pass<8;pass++)for(let i=1;i<=supportLast;i++){
 const a=gondolaSupports[i-1],b=gondolaSupports[i];let deficit=0;
 for(let j=1;j<40;j++){const t=j/40,x=mix(a[0],b[0],t),z=mix(a[2],b[2],t),floor=Math.max(...[-3,0,12,15].map(o=>alpineHeight(x+cableNX*o,z+cableNZ*o)))+1.2;deficit=Math.max(deficit,(floor-mix(a[1],b[1],t))/(i===1?t:i===supportLast?1-t:1));}
 if(deficit>0){if(i>1)a[1]+=deficit*1.5;if(i<supportLast)b[1]+=deficit*1.5;}
}
// Arrival stays level with the summit socket; no final overshoot and drop.
for(let i=1;i<supportLast;i++)gondolaSupports[i][1]=Math.min(gondolaSupports.at(-1)[1],gondolaSupports[i][1]);
for(let i=supportLast-1;i>=0;i--)gondolaSupports[i][1]=Math.min(gondolaSupports[i][1],gondolaSupports[i+1][1]);
const cableGrades=gondolaSupports.map((p,i)=>{
 if(i===0||i===supportLast)return 0;
 const a=gondolaSupports[i-1],b=gondolaSupports[i+1],left=(p[1]-a[1])/Math.hypot(p[0]-a[0],p[2]-a[2]),right=(b[1]-p[1])/Math.hypot(b[0]-p[0],b[2]-p[2]);
 return left*right<=0?0:2*left*right/(left+right);
});
for(let i=0;i<supportLast;i++)for(let j=0;j<16;j++){
 const a=gondolaSupports[i],b=gondolaSupports[i+1],t=j/16,d=Math.hypot(b[0]-a[0],b[2]-a[2]);
 const y=(2*t**3-3*t*t+1)*a[1]+(t**3-2*t*t+t)*cableGrades[i]*d+(-2*t**3+3*t*t)*b[1]+(t**3-t*t)*cableGrades[i+1]*d;
 gondolaPoints.push([mix(a[0],b[0],t),y,mix(a[2],b[2],t)]);
}
gondolaPoints.push(gondolaSupports.at(-1));

export const gondolaPoint=t=>cablePoint(gondolaPoints,t);
export const gondolaStations=[0,gondolaPoints.length-1].map(index=>{const p=gondolaPoints[index],a=gondolaPoints[Math.max(0,index-1)],b=gondolaPoints[Math.min(gondolaPoints.length-1,index+1)],yaw=Math.atan2(b[0]-a[0],b[2]-a[2]);return{x:p[0],z:p[2],y:alpineHeight(p[0],p[2]),yaw,columns:[-16,-4,4].flatMap(x=>[-5,5].map(z=>({x:p[0]+x*Math.cos(yaw)+z*Math.sin(yaw),z:p[2]+z*Math.cos(yaw)-x*Math.sin(yaw),r:.18})))};});
// Entry sockets face the open base promenade, opposite the uphill cable heading.
export const gondolaEntry={x:gondolaStations[0].x-Math.sin(gondolaStations[0].yaw)*12,z:gondolaStations[0].z-Math.cos(gondolaStations[0].yaw)*12};
export const gondolaApproach=[{x:-62,z:-150},{x:-80,z:-157},{x:-80,z:-194},gondolaEntry];
// Share the promenade until past the food truck; branch into the front queue.
export const liftApproach=[...gondolaApproach.slice(0,2),{x:-80,z:-172},{x:liftLayout.x,z:-172},{x:liftLayout.x,z:-185}];
export const skiNetwork=skiRuns.map(r=>{const count=Math.ceil((r.finish-r.startZ)/3),points=Array.from({length:count+1},(_,i)=>{const z=mix(r.startZ,r.finish,i/count);return{x:skiRunCenter(z,r.id),y:alpineHeight(skiRunCenter(z,r.id),z),z,width:skiRunHalfWidth(z,r.id)*2,grade:(skiRunHeight(z-.5)-skiRunHeight(z+.5))/Math.hypot(skiRunCenter(z+.5,r.id)-skiRunCenter(z-.5,r.id),1)};});let length=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];length+=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);}return{...r,points,start:points[0],end:points.at(-1),length,drop:points[0].y-points.at(-1).y};});
export const mountainZones=[{id:'summit',name:'구름 위 능선',from:-5300,to:-4000},{id:'upper',name:'크리스털 설원',from:-4000,to:-2900},{id:'forest',name:'은빛 침엽수 계곡',from:-2900,to:-900},{id:'lower',name:'리조트 하산로',from:-900,to:-205},{id:'base',name:'하단 베이스',from:-205,to:-137}].map(p=>({...p,from:mountainZ(p.from),to:mountainZ(p.to)}));

export const middleTransfer=[{x:middleSummit.x+35,z:middleSummit.z},{x:middleSummit.x+25,z:middleSummit.z+10},{x:skiRunCenter(mountainZ(-2400),'curve'),z:mountainZ(-2400)}];
export const mountainRest=[{id:'alpine-forest-bench-west',x:middleSummit.x+6,z:middleSummit.z-25,yaw:0},{id:'alpine-forest-bench-east',x:middleSummit.x+30,z:middleSummit.z-25,yaw:0}];

export const mountainShelter={x:middleSummit.x+24,z:middleSummit.z-26,width:40,depth:14};

// Signs sit beside station aprons and transfers, never in a downhill lane.
export const mountainWayfinders=[
 {id:'gondola-base',x:gondolaEntry.x-14,z:gondolaEntry.z+4,lines:['구름정상 곤돌라 ↖','← 어묵 · 모닥불']},
 {id:'left-queue',x:liftLayout.x-14,z:-182,lines:['눈꽃 리프트 ↖','초급 코스 · 쉼터']},
 {id:'right-queue',x:upperLiftLayout.x+10,z:-187,lines:['포레스트 리프트 ↖','중간 쉼터 · 초중급']},
 {id:'snow-meadow',x:summit.x-35,z:summit.z+18,lines:['눈꽃 메도우 →','초급 · 베이스']},
 {id:'forest-rest',x:middleSummit.x+2,z:middleSummit.z+18,lines:['← 실버 포레스트','쉼터 · 능선 방향']},
 {id:'ridge-transfer',x:ridgeBase.x+42,z:ridgeBase.z+15,lines:['정상 리프트 ↖','구름정상 · 중급']},
 {id:'ridge-top',x:ridgeSummit.x+24,z:ridgeSummit.z+18,lines:['← 은하 파노라마','구름정상 · 베이스']},
 {id:'peak',x:peakSummit.x+48,z:peakSummit.z+9,lines:['← 은하 파노라마','중급 · 베이스']}
].map(p=>({...p,yaw:0}));
