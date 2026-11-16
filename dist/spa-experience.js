import {spaActivities} from './resort-layout.js';
// Water movement has a bounded basin; benches and mats use authored seat heights.
export function createSpaController(){
 let activity=null,position=null,elapsed=0;
 return{get active(){return !!activity;},get kind(){return activity?.id||'';},start(id){const spec=spaActivities[id];if(!spec)return false;activity={...spec,id};position={x:spec.x,y:spec.y,z:spec.z,yaw:spec.yaw};elapsed=0;return true;},stop(){activity=null;position=null;},update(dt,input={}){
  if(!activity)return null;elapsed+=Math.min(.1,Math.max(0,dt));
  if(activity.pool){const {x,z,rx,rz}=activity.pool,vx=Number.isFinite(input.x)?input.x:0,vz=Number.isFinite(input.z)?input.z:0,l=Math.max(1,Math.hypot(vx,vz)),step=Math.min(.1,Math.max(0,dt));position.x+=vx/l*1.3*step;position.z+=vz/l*1.3*step;const dx=(position.x-x)/rx,dz=(position.z-z)/rz,d=Math.hypot(dx,dz);if(d>1){position.x=x+dx/d*rx;position.z=z+dz/d*rz;}if(Math.hypot(vx,vz)>.01)position.yaw=Math.atan2(vx,vz);}
  return{...position,mode:activity.mode,elapsed,view:activity.view,label:activity.label};
 }};
}
