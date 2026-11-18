// World placement lives here. Models keep local coordinates; bridges, map, collision
// and safe arrivals derive from the same region anchors.
const museumCenter={x:-77,z:57},museumGate={x:-38,z:25};
const museumYaw=Math.atan2(museumGate.x-museumCenter.x,museumGate.z-museumCenter.z);
// Face the lodge approach toward the park's clear eastern promenade.
const spaCenter={x:94,z:26},spaGate={x:48,z:7};
const spaYaw=Math.atan2(spaCenter.x-spaGate.x,spaCenter.z-spaGate.z);
const definitions={
 park:{id:'park',name:'놀이공원',center:{x:0,z:0},size:{rx:62,rz:38},depth:24,phase:.2,arrival:{x:0,z:24},anchors:{ski:{x:0,z:-28},tree:{x:0,z:32},spa:spaGate,museum:museumGate},landmarks:{castle:{x:0,z:-14},carousel:{x:16,z:3.8}}},
 ski:{id:'ski',name:'스키장',center:{x:0,z:-170},size:{rx:144,rz:144},depth:45,phase:1.2,arrival:{x:-36,z:75},anchors:{park:{x:0,z:117},spa:{x:76,z:113}}},
 spa:{id:'spa',name:'온천 · 료칸',center:spaCenter,size:{rx:37,rz:32},depth:24,phase:5.7,yaw:spaYaw,arrival:{x:0,z:-19},anchors:{park:{x:0,z:-27},ski:{x:24,z:-17}},landmarks:{ryokan:{x:12,z:7}}},
 tree:{id:'tree',name:'소원 트리 광장',center:{x:0,z:80},size:{rx:32,rz:29},depth:25,phase:4.3,arrival:{x:-12,z:-6},anchors:{park:{x:0,z:-24}},landmarks:{postOffice:{x:-17,z:-15}}},
 museum:{id:'museum',name:'별빛 만물관',center:museumCenter,size:{rx:34,rz:31},depth:26,phase:1.7,yaw:museumYaw,arrival:{x:0,z:21.5},anchors:{park:{x:0,z:28}},landmarks:{door:{x:0,z:17.4}}}
};
// Local anchors keep bridges and arrivals attached when a district origin changes.
export function resolveRegion(definition){const {center,...rest}=definition,c=Math.cos(rest.yaw||0),s=Math.sin(rest.yaw||0),point=p=>({...p,x:center.x+p.x*c+p.z*s,z:center.z-p.x*s+p.z*c});return {...rest,center,arrival:point(rest.arrival),anchors:Object.fromEntries(Object.entries(rest.anchors).map(([id,p])=>[id,point(p)])),landmarks:Object.fromEntries(Object.entries(rest.landmarks||{}).map(([id,p])=>[id,point(p)]))};}
export const regions=Object.fromEntries(Object.entries(definitions).map(([id,region])=>[id,resolveRegion(region)]));
export const regionConnections=[['park','ski'],['park','tree'],['park','spa'],['ski','spa'],['park','museum']];
export const regionBridges=regionConnections.map(([from,to])=>{
 const start={...regions[from].anchors[to]},end={...regions[to].anchors[from]},length=Math.hypot(end.x-start.x,end.z-start.z),dx=(end.x-start.x)/length,dz=(end.z-start.z)/length;
 // Reserve a straight six-metre apron at both ends before any path turns.
 return{id:from+'-'+to,from,to,start,end,approachStart:{x:start.x-dx*6,z:start.z-dz*6},approachEnd:{x:end.x+dx*6,z:end.z+dz*6}};
});
export function regionPoint(id,x=0,z=0){const r=regions[id],c=Math.cos(r.yaw||0),s=Math.sin(r.yaw||0);return{x:r.center.x+x*c+z*s,z:r.center.z-x*s+z*c};}
export function regionLocalPoint(id,x,z){const r=regions[id],dx=x-r.center.x,dz=z-r.center.z,c=Math.cos(r.yaw||0),s=Math.sin(r.yaw||0);return{x:dx*c-dz*s,z:dx*s+dz*c};}
