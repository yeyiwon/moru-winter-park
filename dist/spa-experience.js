import {spaActivities} from './resort-layout.js';
import {onsenEntrances,canUseOnsen} from './onsen-layout.js';
// Water movement has a bounded basin; benches and mats use authored seat heights.
export function createSpaController(){
 let activity=null,position=null,elapsed=0,state='Idle',waypoints=[],exitPosition=null;
 function transition(points,next){waypoints=points.map(p=>({...p}));state=next;}
 function stop(){activity=null;position=null;waypoints=[];state='Idle';elapsed=0;exitPosition=null;}
 return{get active(){return !!activity;},get kind(){return activity?.id||'';},get state(){return state;},get position(){return position?{...position}:null;},exit(){const b=onsenEntrances[activity?.id];if(!b||state==='Exiting')return false;exitPosition=b.access;transition([b.entry,b.access],'Exiting');return true;},start(id,from){const spec=spaActivities[id];if(!spec||from&&onsenEntrances[id]&&!canUseOnsen(id,from))return false;activity={...spec,id};position={x:spec.x,y:spec.y,z:spec.z,yaw:spec.yaw};elapsed=0;state='Active';const b=onsenEntrances[id];if(b&&from){position={...from,y:.95,yaw:spec.yaw};transition([b.access,b.entry],'Entering');}return true;},stop,update(dt,input={}){
  if(!activity)return null;elapsed+=Math.min(.1,Math.max(0,dt));
  if(waypoints.length){const to=waypoints[0],dx=to.x-position.x,dz=to.z-position.z,d=Math.hypot(dx,dz),step=Math.min(d,2.4*Math.min(.1,Math.max(0,dt)));if(d>.001){position.x+=dx/d*step;position.z+=dz/d*step;position.y+=((to.y??activity.y)-position.y)*step/d;const angle=Math.atan2(dx,dz)-position.yaw;position.yaw+=Math.atan2(Math.sin(angle),Math.cos(angle))*(1-Math.exp(-dt*8));}if(d<.035){Object.assign(position,to);waypoints.shift();}if(!waypoints.length){if(state==='Exiting'){const result={...position,mode:'',finished:true,exitPosition};stop();return result;}state='Active';}return {...position,mode:activity.mode,transition:state,elapsed,view:{distance:15,pitch:.56,lookHeight:-.35}};}
  if(activity.pool){const {x,z,rx,rz}=activity.pool,vx=Number.isFinite(input.x)?input.x:0,vz=Number.isFinite(input.z)?input.z:0,l=Math.max(1,Math.hypot(vx,vz)),step=Math.min(.1,Math.max(0,dt));position.x+=vx/l*1.3*step;position.z+=vz/l*1.3*step;const dx=(position.x-x)/rx,dz=(position.z-z)/rz,d=Math.hypot(dx,dz);if(d>1){position.x=x+dx/d*rx;position.z=z+dz/d*rz;}if(Math.hypot(vx,vz)>.01)position.yaw=Math.atan2(vx,vz);}
  return{...position,mode:activity.mode,elapsed,view:onsenEntrances[activity.id]?{distance:15,pitch:.56,lookHeight:-.35}:activity.view,label:activity.label};
 }};
}
