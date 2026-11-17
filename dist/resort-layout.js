// Public world coordinates. The mountain blueprint remains local so moving the district
// never shrinks chairs, changes piste gradients or misaligns multiplayer seats.
import * as blueprint from './resort-blueprint.js';
export const alpineShift=90;
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
export const resortDestinations=blueprint.resortDestinations.map(p=>['ski','sled'].includes(p.id)?point(p):p);
export const resortRides=Object.fromEntries(Object.entries(blueprint.resortRides).map(([id,p])=>[id,{...p,points:p.points.map(vector),...(p.exit?{exit:vector(p.exit)}:{})}]));
export const resortObstacles=blueprint.resortObstacles.map(p=>p.z<0?point(p):p);
export const skiRunCenter=(z,id)=>blueprint.skiRunCenter(z-alpineShift,id);
export const skiRunHalfWidth=(z,id)=>blueprint.skiRunHalfWidth(z-alpineShift,id);
export const skiRunHeight=(z,id)=>blueprint.skiRunHeight(z-alpineShift,id);
export const skiRunAt=(x,z)=>skiRuns.find(p=>p.id===blueprint.skiRunAt(x,z-alpineShift).id);
export const skiCenter=z=>skiRunCenter(z),skiHalfWidth=z=>skiRunHalfWidth(z);
export const sledCenter=z=>blueprint.sledCenter(z-alpineShift);
export const alpineHeight=(x,z)=>blueprint.alpineHeight(x,z-alpineShift);
export const summitPositionValid=(x,z)=>blueprint.summitPositionValid(x,z-alpineShift);
export const liftPoint=t=>vector(blueprint.liftPoint(t)),upperLiftPoint=t=>vector(blueprint.upperLiftPoint(t));
export const resortRidePosition=(x,y,z,mode)=>blueprint.resortRidePosition(x,y,z-alpineShift,mode);
export function resortGround(x,z){return Math.hypot(x-alpine.x,z-alpine.z)<alpine.r?alpineHeight(x,z):z<0?.09:blueprint.resortGround(x,z);}
export {spaShift,spa,spaActivities,spaPavilion,spaPositionValid,restSeats} from './resort-blueprint.js';
