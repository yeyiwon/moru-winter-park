import {mountainDistance,mountainForm} from './mountain-layout.js';
import {regions,regionBridges} from './region-layout.js';
import {museumLayout} from './district-layout.js';
import {treeLayout,treeShift} from './tree-layout.js';
import {castleView} from './castle-layout.js';
import {interiorAt,interiorSurfaceHeight} from './interior-layout.js';
import {alpine,alpineHeight,resortGround,alpineShift} from './resort-layout.js';
const terrainIds={park:'park',ski:'alpine',spa:'spa',tree:'wish',museum:'philosophy'};
export const islands=Object.values(regions).map(r=>({id:terrainIds[r.id],name:r.name,...r.center,r:Math.min(r.size.rx,r.size.rz),spawn:r.arrival,color:r.id==='spa'?'#b5cdc0':'#bdd9e7',...(r.id==='park'?{view:castleView}:r.id==='tree'?{view:{distance:40,yaw:Math.PI,pitch:.15,lookHeight:12}}:{})}));
// Legacy learning IDs are data-only, with no extra terrain, buildings or map destinations.
for(const id of ['science','law','art','history'])islands.push({id,hidden:true,x:0,z:0,r:1,spawn:regions.park.arrival});
export const promenadeTrees=[{x:17,z:28,h:4.1,r:.35},{x:treeLayout.x+15,z:treeLayout.z+12,h:4.6,r:.35},{x:treeLayout.x+16,z:treeLayout.z-12,h:4.4,r:.35}];
export const bridgeHalfWidth=3.6;
export const bridges=regionBridges.map(b=>[{...b.start,r:1},{...b.end,r:1}]);
export function bridgeHeight(x,z){for(const [a,b] of bridges){const length=Math.hypot(b.x-a.x,b.z-a.z),d=((x-a.x)*(b.x-a.x)+(z-a.z)*(b.z-a.z))/length;if(d>=0&&d<=length&&segmentDistance(x,z,a,b)<bridgeHalfWidth+.4)return .09+Math.sin(d/length*Math.PI)*Math.min(.7,length*.025);}return .09;}
export function segmentDistance(x,z,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a.x-t*dx,z-a.z-t*dz);}
// The west gardens and rides share ONE large island. Other districts have real air gaps.
export const landforms=Object.values(regions).map(r=>({id:terrainIds[r.id],...r.center,...r.size,depth:r.depth,phase:r.phase,yaw:r.yaw||0,...(r.id==='ski'?{...mountainForm,z:mountainForm.z+alpineShift}: {})}));
export function landRadius(form,angle){if(form.id==='alpine'){let lo=0,hi=2;for(let i=0;i<23;i++){const r=(lo+hi)/2;if(mountainDistance(form.x+Math.cos(angle)*form.rx*r,form.z-alpineShift+Math.sin(angle)*form.rz*r)<0)lo=r;else hi=r;}return(lo+hi)/2;}return (1+.018*Math.sin(angle*5+form.phase)+.012*Math.sin(angle*9-form.phase));}
export function landPoint(form,angle,r=landRadius(form,angle)){const x=Math.cos(angle)*form.rx*r,z=Math.sin(angle)*form.rz*r,c=Math.cos(form.yaw||0),s=Math.sin(form.yaw||0);return{x:form.x+x*c+z*s,z:form.z-x*s+z*c};}
export function landDistance(x,z,form){if(form.id==='alpine')return mountainDistance(x,z-alpineShift);const c=Math.cos(form.yaw||0),s=Math.sin(form.yaw||0),x0=x-form.x,z0=z-form.z,dx=(x0*c-z0*s)/form.rx,dz=(x0*s+z0*c)/form.rz;return(Math.hypot(dx,dz)-landRadius(form,Math.atan2(dz,dx)))*Math.min(form.rx,form.rz);}
export const snowfields=landforms.map(f=>({a:{x:f.x,z:f.z},b:{x:f.x,z:f.z},r:f.rz}));
export function snowfieldDistance(x,z){return Math.min(...landforms.map(f=>landDistance(x,z,f)),...bridges.map(([a,b])=>segmentDistance(x,z,a,b)-bridgeHalfWidth));}
export function terrainAt(x,z){return Number.isFinite(x+z)&&(!!interiorAt(x,z)||snowfieldDistance(x,z)<-.35);}
export function islandAt(x,z){const form=landforms.find(f=>landDistance(x,z,f)<0);return form?islands.find(i=>i.id===form.id):undefined;}

// Learning data remains independent of the six visual island identities.
export const rooms=[
{id:'curiosity',name:'호기심 전시실',door:{x:-5,z:-46}},
{id:'perspective',name:'관점의 방',door:{x:40,z:-24}},
{id:'logic',name:'논리 공방',door:{x:44,z:24}},
{id:'probability',name:'확률 실험실',door:{x:2.6,z:5.1}},
{id:'garden',name:'관찰의 정원',door:{x:-6,z:49}},
{id:'memory',name:'기억 서재',door:{x:-40,z:-24}}
];
export const exhibits=[
{id:'park-choices',room:'probability',island:'park',name:'별빛 놀이공원',x:2.6,z:5.1,color:'#cfb9eb',fields:['확률','경제']},
{id:'observatory',room:'curiosity',island:'science',name:'유리별 관측소',x:-5,z:-46,color:'#a7cedd',fields:['과학','기술']},
{id:'logic-device',room:'logic',island:'science',name:'관측소 · 논리 공방',x:6,z:-49,color:'#b2bfd9',fields:['논리']},
{id:'archive-law',room:'perspective',island:'law',name:'달빛 기록원',x:40,z:-24,color:'#ddc69d',fields:['법','미디어']},
{id:'archive-ethics',room:'perspective',island:'law',name:'기록원 · 생명윤리',x:52,z:-22,color:'#d9bbb5',fields:['윤리','생명']},
{id:'mirror-ideas',room:'perspective',island:'philosophy',name:'고요한 숲',x:44,z:24,color:'#c2b2db',fields:['철학','윤리']},
{id:'lyre-listen',room:'garden',island:'art',name:'눈빛 음악 정원',x:-39,z:26,color:'#d5b1c4',fields:['예술','언어']},
{id:'harbour-history',room:'memory',island:'history',name:'기억의 산책길',x:-40,z:-24,color:'#ddc497',fields:['역사','경제']},
{id:'harbour-memory',room:'memory',island:'history',name:'항구 · 기억 서재',x:-52,z:-23,color:'#aac9d0',review:true}
];

export function surfaceHeight(x,z){const interior=interiorSurfaceHeight(x,z);return interior!==null?interior:Math.max(bridgeHeight(x,z),resortGround(x,z));}
