import {onsenTransitionValid} from './onsen-layout.js';
import {spaToWorld,spaToLocal,spaYaw} from './spa-transform.js';
import {regions} from './region-layout.js';
// Public world coordinates. The mountain blueprint remains local so moving the district
// never shrinks chairs, changes piste gradients or misaligns multiplayer seats.
import * as blueprint from './resort-blueprint.js';
export const alpineShift=regions.ski.center.z-blueprint.alpine.z;
export const spaX=regions.spa.center.x,spaShift=regions.spa.center.z-119;
const spaPoint=p=>({...spaToWorld({...p,z:p.z-blueprint.spaShift}),yaw:(p.yaw||0)+spaYaw,...(p.door?{door:{...p.door,offset:p.door.x-p.x}}:{}),...(p.view?{view:{...p.view,yaw:p.view.yaw+spaYaw}}:{})});
const point=p=>({...p,z:p.z+alpineShift});
const vector=p=>[p[0],p[1],p[2]+alpineShift];
export const alpine={...point(blueprint.alpine),landZ:blueprint.alpine.z+alpineShift,rz:144};
export const summit=point(blueprint.summit),peakSummit=point(blueprint.peakSummit),middleSummit=point(blueprint.middleSummit),gondolaEntry=point(blueprint.gondolaEntry);
export const upperLiftLayout=point(blueprint.upperLiftLayout),liftLayout=point(blueprint.liftLayout),upperLiftEntry=point(blueprint.upperLiftEntry);
export const ridgeBase=point(blueprint.ridgeBase),ridgeSummit=point(blueprint.ridgeSummit),ridgeLiftLayout=point(blueprint.ridgeLiftLayout),ridgeLiftEntry=point(blueprint.ridgeLiftEntry);
export const ridgeTransfers=blueprint.ridgeTransfers.map(path=>path.map(point)),mountainTerraces=blueprint.mountainTerraces.map(point);
export const ridgeLiftPoint=t=>vector(blueprint.ridgeLiftPoint(t));
export const middleTransfer=blueprint.middleTransfer.map(point),mountainRest=blueprint.mountainRest.map(point);
export const summitTransfer=blueprint.summitTransfer.map(point),skiStarts=blueprint.skiStarts.map(point),skiRunouts=blueprint.skiRunouts.map(point);
export const skiNetwork=blueprint.skiNetwork.map(r=>({...r,startZ:r.startZ+alpineShift,finish:r.finish+alpineShift,start:point(r.start),end:point(r.end),points:r.points.map(point),merges:r.merges.map(m=>({...m,z:m.z+alpineShift}))}));
export const skiArrival={startZ:blueprint.skiArrival.startZ+alpineShift,finishZ:blueprint.skiArrival.finishZ+alpineShift};
export const skiJumps=blueprint.skiJumps.map(point);
export const skiJumpCoordinates=blueprint.skiJumpCoordinates;
export const skiRuns=blueprint.skiRuns.map(p=>({...p,startZ:p.startZ+alpineShift,finish:p.finish+alpineShift}));
export const beginnerAccess={...blueprint.beginnerAccess,start:point(blueprint.beginnerAccess.start),end:point(blueprint.beginnerAccess.end)};
export const summitObstacles=blueprint.summitObstacles.map(point);
export const summitFacilities=blueprint.summitFacilities.map(p=>({...point(p),...(p.model?{model:point(p.model)}:{})}));
export const resortDestinations=blueprint.resortDestinations.map(p=>p.id==='ski'?point(p):spaPoint(p));
export const resortRides=Object.fromEntries(Object.entries(blueprint.resortRides).map(([id,p])=>[id,{...p,points:p.points.map(vector),...(p.exit?{exit:vector(p.exit)}:{}),...(p.baseExit?{baseExit:vector(p.baseExit)}:{})}]));
// These are dismount/queue positions, never the moving chair or an automatic ride trigger.
export const gondolaApproach=blueprint.gondolaApproach.map(point),liftApproach=blueprint.liftApproach.map(point);
export const skiMapDestinations=[
 {...resortDestinations.find(p=>p.id==='ski'),name:'초급 리프트 · 왼쪽',icon:'lift',mapOnly:false},
 {id:'ski-right-base',name:'포레스트 리프트 · 오른쪽',...upperLiftEntry,icon:'lift',view:{distance:27,yaw:.65,pitch:.32}},
 {id:'ski-middle',name:'중턱 · 초급 출발',x:resortRides.lift.exit[0],z:resortRides.lift.exit[2],icon:'ski',view:{distance:26,yaw:Math.PI,pitch:.55}},
 {id:'ski-forest',name:'중간 쉼터 · 포레스트 출발',x:resortRides.upperlift.exit[0],z:resortRides.upperlift.exit[2],icon:'ski',view:{distance:26,yaw:Math.PI,pitch:.55}},
 {id:'ski-gondola-base',name:'구름정상 곤돌라',...gondolaEntry,icon:'gondola',view:{distance:27,yaw:.65,pitch:.32}},
 {id:'ski-ridge-base',name:'중간 쉼터 · 정상 리프트',...ridgeLiftEntry,icon:'lift',view:{distance:27,yaw:.65,pitch:.32}},
 {id:'ski-ridge-top',name:'정상 리프트 · 은하 파노라마',x:resortRides.ridgelift.exit[0],z:resortRides.ridgelift.exit[2],icon:'ski',view:{distance:26,yaw:Math.PI,pitch:.55}},
 {id:'ski-peak',name:'구름정상 · 은하 파노라마',x:resortRides.gondola.exit[0],z:resortRides.gondola.exit[2],icon:'summit',view:{distance:28,yaw:Math.PI,pitch:.62}}
].map(p=>{
 const stations={ski:['lift',0],'ski-right-base':['upperlift',0],'ski-middle':['lift',-1],'ski-forest':['upperlift',-1],'ski-gondola-base':['gondola',0],'ski-ridge-base':['ridgelift',0],'ski-ridge-top':['ridgelift',-1],'ski-peak':['gondola',-1]},[kind,index]=stations[p.id],station=resortRides[kind].points.at(index);
 // Pin the rendered station, while travel uses its separate, safe queue/dismount socket.
 return{mapOnly:true,...p,region:'ski',y:blueprint.alpineHeight(p.x,p.z-alpineShift),mapAnchor:{x:station[0],y:blueprint.alpineHeight(station[0],station[2]-alpineShift),z:station[2]}};
});
export const resortObstacles=blueprint.resortObstacles.map(p=>p.z<0?point(p):spaPoint(p));
export const skiRunCenter=(z,id)=>blueprint.skiRunCenter(z-alpineShift,id);
export const skiRunHalfWidth=(z,id)=>blueprint.skiRunHalfWidth(z-alpineShift,id);
export const skiRunHeight=(z,id)=>blueprint.skiRunHeight(z-alpineShift,id);
export const skiRunAt=(x,z)=>skiRuns.find(p=>p.id===blueprint.skiRunAt(x,z-alpineShift).id);
export const skiCenter=z=>skiRunCenter(z),skiHalfWidth=z=>skiRunHalfWidth(z);
export const mountainGroundHeight=(x,z)=>blueprint.mountainGroundHeight(x,z-alpineShift);
export const alpineHeight=(x,z)=>blueprint.alpineHeight(x,z-alpineShift);
export const summitPositionValid=(x,z)=>blueprint.summitPositionValid(x,z-alpineShift);
export const liftPoint=t=>vector(blueprint.liftPoint(t)),upperLiftPoint=t=>vector(blueprint.upperLiftPoint(t));
export const resortRidePosition=(x,y,z,mode)=>blueprint.resortRidePosition(x,y,z-alpineShift,mode);
export const spa={...blueprint.spa,...regions.spa.center};
export const spaPavilion={...spaPoint(blueprint.spaPavilion),sideDoor:spaToWorld({x:0,z:blueprint.spaPavilion.sideDoorZ-blueprint.spaShift})};
export const spaActivities=Object.fromEntries(Object.entries(blueprint.spaActivities).map(([id,p])=>[id,{...spaPoint(p),...(p.pool?{pool:spaPoint(p.pool)}:{})}]));
export function spaPositionValid(x,y,z,mode){const p=spaToLocal({x,z});return blueprint.spaPositionValid(p.x,y,p.z+blueprint.spaShift,mode)||onsenTransitionValid(x,y,z,mode);}
export const restSeats=Object.fromEntries(Object.entries(blueprint.restSeats).filter(([id])=>id!=='healing').map(([id,p])=>[id,spaPoint(p)]));
export function resortGround(x,z){const p=spaToLocal({x,z});if(Math.abs(p.x)<39&&Math.abs(p.z-119)<34)return blueprint.resortGround(p.x,p.z+blueprint.spaShift);return z< -40?alpineHeight(x,z):.09;}
