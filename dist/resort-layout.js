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
export const summit=point(blueprint.summit),peakSummit=point(blueprint.peakSummit);
export const upperLiftLayout=point(blueprint.upperLiftLayout),liftLayout=point(blueprint.liftLayout),upperLiftEntry=point(blueprint.upperLiftEntry);
export const summitTransfer=blueprint.summitTransfer.map(point),skiStarts=blueprint.skiStarts.map(point),skiRunouts=blueprint.skiRunouts.map(point);
export const skiNetwork=blueprint.skiNetwork.map(r=>({...r,startZ:r.startZ+alpineShift,finish:r.finish+alpineShift,start:point(r.start),end:point(r.end),points:r.points.map(point),merges:r.merges.map(m=>({...m,z:m.z+alpineShift}))}));
export const skiRuns=blueprint.skiRuns.map(p=>({...p,startZ:p.startZ+alpineShift,finish:p.finish+alpineShift}));
export const beginnerAccess={...blueprint.beginnerAccess,start:point(blueprint.beginnerAccess.start),end:point(blueprint.beginnerAccess.end)};
export const summitObstacles=blueprint.summitObstacles.map(point);
export const summitFacilities=blueprint.summitFacilities.map(p=>({...point(p),...(p.model?{model:point(p.model)}:{})}));
export const resortDestinations=blueprint.resortDestinations.map(p=>p.id==='ski'?point(p):spaPoint(p));
export const resortRides=Object.fromEntries(Object.entries(blueprint.resortRides).map(([id,p])=>[id,{...p,points:p.points.map(vector),...(p.exit?{exit:vector(p.exit)}:{})}]));
// These are dismount/queue positions, never the moving chair or an automatic ride trigger.
export const skiMapDestinations=[
 {...resortDestinations.find(p=>p.id==='ski'),name:'초급 리프트 · 왼쪽',icon:'lift',mapOnly:false},
 {id:'ski-right-base',name:'정상 리프트 · 오른쪽',...upperLiftEntry,icon:'lift',view:{distance:27,yaw:.65,pitch:.32}},
 {id:'ski-middle',name:'중턱 · 초급 출발',x:resortRides.lift.exit[0],z:resortRides.lift.exit[2],icon:'ski',view:{distance:30,yaw:Math.PI,pitch:.34}},
 {id:'ski-peak',name:'정상 · 코스 출발',x:resortRides.upperlift.exit[0],z:resortRides.upperlift.exit[2],icon:'summit',view:{distance:34,yaw:Math.PI,pitch:.32}}
].map(p=>({mapOnly:true,...p,region:'ski',y:blueprint.alpineHeight(p.x,p.z-alpineShift)}));
export const resortObstacles=blueprint.resortObstacles.map(p=>p.z<0?point(p):spaPoint(p));
export const skiRunCenter=(z,id)=>blueprint.skiRunCenter(z-alpineShift,id);
export const skiRunHalfWidth=(z,id)=>blueprint.skiRunHalfWidth(z-alpineShift,id);
export const skiRunHeight=(z,id)=>blueprint.skiRunHeight(z-alpineShift,id);
export const skiRunAt=(x,z)=>skiRuns.find(p=>p.id===blueprint.skiRunAt(x,z-alpineShift).id);
export const skiCenter=z=>skiRunCenter(z),skiHalfWidth=z=>skiRunHalfWidth(z);
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
