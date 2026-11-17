import {alpineHeight,skiCenter,skiRunCenter,skiRunHalfWidth,skiRuns,skiRunAt,summit,peakSummit,beginnerAccess,skiRunouts,summitPositionValid} from './resort-layout.js';
function onTerrace(x,z){return [summit,peakSummit].some(a=>Math.hypot((x-a.x)/a.rx,(z-a.z)/a.rz)<=1)||z>=beginnerAccess.start.z&&z<=beginnerAccess.end.z&&Math.abs(x-24)<=beginnerAccess.halfWidth;}
// Routes describe the same surfaces and cable used by the visible models.
export function sampleRide(route,progress){
 const p=Math.max(0,Math.min(1,progress))*(route.points.length-1),i=Math.min(route.points.length-2,Math.floor(p)),t=p-i,a=route.points[i],b=route.points[i+1];
 return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t+(route.bodyOffset??(route.heightMode==='seat'?.55:.86)),z:a[2]+(b[2]-a[2])*t,yaw:Math.atan2(b[0]-a[0],b[2]-a[2])};
}
export function createRideController(routes){
 let mode='',elapsed=0,last=null,speed=0,z=0,x=0,heading=0,launched=false,steer=0,recovery=0,runId='main',activeRoute='',crossed=false;
 return{get mode(){return mode;},start(kind,position){const run=position&&skiRunAt(position.x,position.z),valid=run&&position.z>=run.startZ-7&&position.z<=run.finish&&Math.abs(position.x-skiRunCenter(position.z,run.id))<=skiRunHalfWidth(position.z,run.id);if(!routes[kind]||kind==='ski'&&mode!=='summit'&&!valid)return false;const launch=last||(valid?{...position,y:alpineHeight(position.x,position.z)+.86,yaw:0}:null);activeRoute=kind;mode=kind==='upperlift'?'lift':kind;elapsed=0;crossed=false;last=kind==='ski'&&launch?launch:sampleRide(routes[kind],0);if(kind==='ski'){speed=0;z=last.z;x=last.x;runId=skiRunAt(x,z).id;heading=Math.atan2(skiRunCenter(z+6,runId)-x,6);launched=false;steer=0;recovery=0;}return true;},stop(){const was=mode;mode='';last=null;return was;},update(dt,input={}){
 if(!mode)return null;if(mode==='summit'){const step=Math.min(.1,Math.max(0,dt)),vx=input.x||0,vz=input.z||0;let x=last.x+vx*3*step,z=last.z+vz*3*step;if(!onTerrace(x,z)){x=last.x;z=last.z;}if(!summitPositionValid(x,last.z))x=last.x;if(!summitPositionValid(x,z))z=last.z;last={x,z,y:alpineHeight(x,z)+.86,yaw:Math.hypot(vx,vz)>.01?Math.atan2(vx,vz):last.yaw};return{...last,mode};}dt=Math.max(0,Math.min(120,dt));
 if(mode==='ski'){
  const finish=skiRuns.find(r=>r.id===runId).finish;let remaining=dt;
  while(remaining>0&&z<finish+10){const step=Math.min(.025,remaining);remaining-=step;if(launched&&!crossed)elapsed+=step;recovery=Math.max(0,recovery-step);
   if(input.push)launched=true;
   const slope=alpineHeight(x,z)-alpineHeight(x+Math.sin(heading),z+Math.cos(heading));
   const braking=!!input.brake||crossed,turn=Math.max(-1,Math.min(1,input.steer||0));
   speed=launched?Math.max(0,Math.min(34,speed+(12*slope/Math.sqrt(1+slope*slope)+(input.push&&!crossed?5.2:0)-.012*speed*speed-(braking?23:0))*step)):0;
   steer+=(turn-steer)*(1-Math.exp(-step*12));heading-=steer*step*(1.95-Math.min(.65,speed*.018));heading=Math.atan2(Math.sin(heading),Math.cos(heading));
   const travel=speed*step/Math.sqrt(1+slope*slope),nx=x+Math.sin(heading)*travel,nz=Math.max(-392,Math.min(finish+10,z+Math.cos(heading)*travel));
   // All physical pistes are available. Course identity follows the ground,
   // never a selected rail or an automatic steering target.
   const intervals=skiRuns.filter(r=>nz>=r.startZ-7&&nz<=r.finish+12).map(r=>({left:skiRunCenter(nz,r.id)-skiRunHalfWidth(nz,r.id),right:skiRunCenter(nz,r.id)+skiRunHalfWidth(nz,r.id)}));
   const inside=onTerrace(nx,nz)&&summitPositionValid(nx,nz)||intervals.some(i=>nx>=i.left&&nx<=i.right)||skiRunouts.some(a=>Math.hypot((nx-a.x)/a.rx,(nz-a.z)/a.rz)<1);
   if(!launched)continue;
   if(inside){x=nx;z=nz;}else{
    const edge=intervals.flatMap(i=>[i.left,i.right]).sort((a,b)=>Math.abs(a-nx)-Math.abs(b-nx))[0];
    // Stop at the bank rather than snapping across the space between courses.
    if(Math.abs(edge-x)<=Math.max(.25,travel*1.5)){x=edge;z=nz;}
    speed*=Math.exp(-step*6);recovery=.15;
   }
   if(z>=finish)crossed=true;if(crossed&&speed<.3)break;
  }
  const yaw=heading,ux=Math.sin(yaw)*.4,uz=Math.cos(yaw)*.4,tilt=Math.atan((alpineHeight(x-ux,z-uz)-alpineHeight(x+ux,z+uz))/.8);
  last={x,y:alpineHeight(x,z)+.88/Math.cos(tilt),z,yaw,tilt,speed,lean:steer,raceTime:elapsed,recovery,heading,launched,brake:!!input.brake,runId};
  if(crossed&&(speed<.3||z>=finish+10)){mode='';return{...last,mode:'',finished:true};}return{...last,mode};
 }
 elapsed+=dt;const route=routes[activeRoute];last=sampleRide(route,elapsed/route.duration);if(elapsed>=route.duration){if(mode==='lift'){mode='summit';const [x,y,z]=route.exit;last={x,y:y+.86,z,yaw:activeRoute==='upperlift'?0:Math.atan2(skiCenter(-330)-x,-330-z),arrivalYaw:activeRoute==='upperlift'?Math.PI:-.65};}else{mode='';return{...last,mode:'',finished:true};}}return{...last,mode};}};
}
