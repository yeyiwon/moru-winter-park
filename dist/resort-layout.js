import {onsenTransitionValid} from './onsen-layout.js';
import {regions} from './region-layout.js';
// Public world coordinates. The mountain blueprint remains local so moving the district
// never shrinks chairs, changes piste gradients or misaligns multiplayer seats.
import * as blueprint from './resort-blueprint.js';
export const alpineShift=regions.ski.center.z-blueprint.alpine.z;
export const spaX=regions.spa.center.x,spaShift=regions.spa.center.z-119;
const spaPoint=p=>({...p,x:p.x+spaX,z:p.z+spaShift-blueprint.spaShift,...(p.door?{door:{...p.door,x:p.door.x+spaX}}:{})});
const point=p=>({...p,z:p.z+alpineShift});
const vector=p=>[p[0],p[1],p[2]+alpineShift];
export const alpine={...point(blueprint.alpine),landZ:blueprint.alpine.z+alpineShift,rz:144};
export const summit=point(blueprint.summit),peakSummit=point(blueprint.peakSummit);
export const upperLiftLayout=point(blueprint.upperLiftLayout),liftLayout=point(blueprint.liftLayout),upperLiftEntry=point(blueprint.upperLiftEntry);
export const summitTransfer=blueprint.summitTransfer.map(point),skiStarts=blueprint.skiStarts.map(point),skiRunouts=blueprint.skiRunouts.map(point);
export const skiRuns=blueprint.skiRuns.map(p=>({...p,startZ:p.startZ+alpineShift,finish:p.finish+alpineShift}));
export const beginnerAccess={...blueprint.beginnerAccess,start:point(blueprint.beginnerAccess.start),end:point(blueprint.beginnerAccess.end)};
export const summitObstacles=blueprint.summitObstacles.map(point);
export const summitFacilities=blueprint.summitFacilities.map(p=>({...point(p),...(p.model?{model:point(p.model)}:{})}));
export const resortDestinations=blueprint.resortDestinations.map(p=>p.id==='ski'?point(p):spaPoint(p));
export const resortRides=Object.fromEntries(Object.entries(blueprint.resortRides).map(([id,p])=>[id,{...p,points:p.points.map(vector),...(p.exit?{exit:vector(p.exit)}:{})}]));
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
export const spaPavilion={...spaPoint(blueprint.spaPavilion),sideDoorZ:blueprint.spaPavilion.sideDoorZ+spaShift-blueprint.spaShift};
export const spaActivities=Object.fromEntries(Object.entries(blueprint.spaActivities).map(([id,p])=>[id,{...spaPoint(p),...(p.pool?{pool:spaPoint(p.pool)}:{})}]));
export const spaPositionValid=(x,y,z,mode)=>blueprint.spaPositionValid(x-spaX,y,z-spaShift+blueprint.spaShift,mode)||onsenTransitionValid(x,y,z,mode);
export const restSeats=Object.fromEntries(Object.entries(blueprint.restSeats).filter(([id])=>id!=='healing').map(([id,p])=>[id,spaPoint(p)]));
export function resortGround(x,z){if(Math.abs(x-spaX)<39&&Math.abs(z-regions.spa.center.z)<34)return blueprint.resortGround(x-spaX,z-spaShift+blueprint.spaShift);return z< -40?alpineHeight(x,z):.09;}
