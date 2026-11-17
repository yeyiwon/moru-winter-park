// World placement lives here. Models keep local coordinates; bridges, map, collision
// and safe arrivals derive from the same region anchors.
const definitions={
 park:{id:'park',name:'놀이공원',center:{x:0,z:0},size:{rx:62,rz:34},depth:24,phase:.2,arrival:{x:0,z:24},anchors:{ski:{x:0,z:-28},tree:{x:0,z:30},spa:{x:48,z:-18},museum:{x:-48,z:-18}},landmarks:{castle:{x:0,z:-14},carousel:{x:16,z:3.8}}},
 ski:{id:'ski',name:'스키장',center:{x:0,z:-170},size:{rx:144,rz:144},depth:45,phase:1.2,arrival:{x:-36,z:75},anchors:{park:{x:0,z:117},spa:{x:86,z:104}}},
 spa:{id:'spa',name:'온천 · 료칸',center:{x:102,z:-18},size:{rx:37,rz:32},depth:24,phase:5.7,arrival:{x:0,z:-23},anchors:{park:{x:-31,z:0},ski:{x:-3,z:-27}},landmarks:{ryokan:{x:12,z:7}}},
 tree:{id:'tree',name:'소원 트리 광장',center:{x:0,z:80},size:{rx:32,rz:29},depth:25,phase:4.3,arrival:{x:-12,z:-6},anchors:{park:{x:0,z:-24}},landmarks:{postOffice:{x:-17,z:-15}}},
 museum:{id:'museum',name:'별빛 만물관',center:{x:-102,z:-18},size:{rx:29,rz:27},depth:24,phase:1.7,arrival:{x:19,z:0},anchors:{park:{x:23,z:0}}}
};
// Local anchors keep bridges and arrivals attached when a district origin changes.
export function resolveRegion(definition){const {center,...rest}=definition,point=p=>({...p,x:center.x+p.x,z:center.z+p.z});return {...rest,center,arrival:point(rest.arrival),anchors:Object.fromEntries(Object.entries(rest.anchors).map(([id,p])=>[id,point(p)])),landmarks:Object.fromEntries(Object.entries(rest.landmarks||{}).map(([id,p])=>[id,point(p)]))};}
export const regions=Object.fromEntries(Object.entries(definitions).map(([id,region])=>[id,resolveRegion(region)]));
export const regionConnections=[['park','ski'],['park','tree'],['park','spa'],['ski','spa'],['park','museum']];
export const regionBridges=regionConnections.map(([from,to])=>{
 const start={...regions[from].anchors[to]},end={...regions[to].anchors[from]},length=Math.hypot(end.x-start.x,end.z-start.z),dx=(end.x-start.x)/length,dz=(end.z-start.z)/length;
 // Reserve a straight six-metre apron at both ends before any path turns.
 return{id:from+'-'+to,from,to,start,end,approachStart:{x:start.x-dx*6,z:start.z-dz*6},approachEnd:{x:end.x+dx*6,z:end.z+dz*6}};
});
export const regionPoint=(id,x=0,z=0)=>({x:regions[id].center.x+x,z:regions[id].center.z+z});
