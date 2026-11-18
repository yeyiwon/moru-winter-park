import {alpineShift,alpineHeight,skiCenter,skiRunCenter,skiRunHalfWidth,skiRuns,skiRunAt,summit,peakSummit,beginnerAccess,skiRunouts,summitPositionValid} from './resort-layout.js';
function onTerrace(x,z){return [summit,peakSummit].some(a=>Math.hypot((x-a.x)/a.rx,(z-a.z)/a.rz)<=1.08);}
// Arc length is cached once per shared route. Index interpolation caused cable
// pitches to change speed at supports and amplified the camera's tracking jitter.
const routeLengths=new WeakMap();
export function sampleRide(route,progress){
 let cache=routeLengths.get(route);if(!cache){const lengths=[0];for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i];lengths.push(lengths.at(-1)+Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]));}cache={lengths,total:lengths.at(-1)};routeLengths.set(route,cache);}
 const distance=Math.max(0,Math.min(1,progress))*cache.total;let lo=0,hi=cache.lengths.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(cache.lengths[m]<=distance)lo=m;else hi=m;}
 const i=Math.min(route.points.length-2,lo),t=(distance-cache.lengths[i])/(cache.lengths[i+1]-cache.lengths[i]||1),a=route.points[i],b=route.points[i+1];
 return{x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t+(route.bodyOffset??(route.heightMode==='seat'?.55:.86)),z:a[2]+(b[2]-a[2])*t,yaw:Math.atan2(b[0]-a[0],b[2]-a[2])};
}
export function createRideController(routes){
 let mode='',elapsed=0,last=null,speed=0,z=0,x=0,heading=0,launched=false,steer=0,recovery=0,runId='main',activeRoute='',crossed=false;
 return{get mode(){return mode;},syncElapsed(seconds){if(mode==='lift')elapsed=Math.max(0,seconds);},start(kind,position){const run=position&&skiRunAt(position.x,position.z),valid=run&&position.z>=run.startZ-7&&position.z<=run.finish&&Math.abs(position.x-skiRunCenter(position.z,run.id))<=skiRunHalfWidth(position.z,run.id);if(!routes[kind]||kind==='ski'&&mode!=='summit'&&!valid)return false;const launch=last||(valid?{...position,y:alpineHeight(position.x,position.z)+.86,yaw:0}:null);activeRoute=kind;mode=kind==='upperlift'?'lift':kind;elapsed=0;crossed=false;last=kind==='ski'&&launch?launch:sampleRide(routes[kind],0);if(kind==='ski'){speed=0;z=last.z;x=last.x;runId=skiRunAt(x,z).id;heading=Math.atan2(skiRunCenter(z+6,runId)-x,6);launched=false;steer=0;recovery=0;}return true;},stop(){const was=mode;mode='';last=null;elapsed=speed=steer=recovery=0;launched=crossed=false;activeRoute='';return was;},update(dt,input={}){
 if(!mode)return null;if(mode==='summit'){const step=Math.min(.1,Math.max(0,dt)),vx=input.x||0,vz=input.z||0,pace=input.running?6:3;let x=last.x+vx*pace*step,z=last.z+vz*pace*step;if(!onTerrace(x,z)){x=last.x;z=last.z;}if(!summitPositionValid(x,last.z))x=last.x;if(!summitPositionValid(x,z))z=last.z;last={arrivalYaw:last.arrivalYaw,x,z,y:alpineHeight(x,z)+.86,yaw:Math.hypot(vx,vz)>.01?Math.atan2(vx,vz):last.yaw};return{...last,mode};}dt=Math.max(0,Math.min(120,dt));
 if(mode==='ski'){
  const finish=skiRuns.find(r=>r.id===runId).finish;let remaining=dt;
  while(remaining>0&&z<finish+10){const step=Math.min(.025,remaining);remaining-=step;if(launched&&!crossed)elapsed+=step;recovery=Math.max(0,recovery-step);
   if(input.push)launched=true;
   const slope=alpineHeight(x,z)-alpineHeight(x+Math.sin(heading),z+Math.cos(heading));
   const braking=!!input.brake||crossed,rawTurn=Math.max(-1,Math.min(1,input.steer||0)),turn=Math.abs(rawTurn)<.08?0:rawTurn;
   speed=launched?Math.max(0,Math.min(34,speed+(12*slope/Math.sqrt(1+slope*slope)+(input.push&&!crossed?5.2:0)-.012*speed*speed-(braking?23:0))*step)):0;
   steer+=(turn-steer)*(1-Math.exp(-step*12));heading-=steer*step*(1.70-Math.min(.45,speed*.013));heading=Math.atan2(Math.sin(heading),Math.cos(heading));
   const travel=speed*step/Math.sqrt(1+slope*slope),nx=x+Math.sin(heading)*travel,nz=Math.max(-392+alpineShift,Math.min(finish+10,z+Math.cos(heading)*travel));
   // All physical pistes are available. Course identity follows the ground,
   // never a selected rail or an automatic steering target.
   const intervals=skiRuns.filter(r=>nz>=r.startZ-7&&nz<=r.finish+12).map(r=>({left:skiRunCenter(nz,r.id)-skiRunHalfWidth(nz,r.id),right:skiRunCenter(nz,r.id)+skiRunHalfWidth(nz,r.id)}));
   const inside=onTerrace(nx,nz)&&summitPositionValid(nx,nz)||intervals.some(i=>nx>=i.left&&nx<=i.right)||skiRunouts.some(a=>Math.hypot((nx-a.x)/a.rx,(nz-a.z)/a.rz)<1);
   if(!launched)continue;
   if(inside){x=nx;z=nz;}else{
    const edge=intervals.flatMap(i=>[i.left,i.right]).sort((a,b)=>Math.abs(a-nx)-Math.abs(b-nx))[0];
    // Stop at the bank rather than snapping across the space between courses.
    if(Math.abs(edge-x)<=Math.max(.25,travel*1.5)){x=edge;z=nz;}
    // A glancing bank contact removes lateral momentum without killing downhill control.
    const forward=Math.max(0,Math.cos(heading));speed*=Math.exp(-step*(forward>.4?1.2:5));if(forward>.4)heading*=Math.exp(-step*5);recovery=.15;
   }
   if(z>=finish)crossed=true;if(crossed&&speed<.3)break;
  }
  const yaw=heading,ux=Math.sin(yaw)*.4,uz=Math.cos(yaw)*.4,tilt=Math.atan((alpineHeight(x-ux,z-uz)-alpineHeight(x+ux,z+uz))/.8);
  last={x,y:alpineHeight(x,z)+.88/Math.cos(tilt),z,yaw,tilt,speed,lean:steer,raceTime:elapsed,recovery,heading,launched,brake:!!input.brake,runId};
  if(crossed&&(speed<.3||z>=finish+10)){mode='';return{...last,mode:'',finished:true};}return{...last,mode};
 }
 elapsed+=dt;const route=routes[activeRoute];last=sampleRide(route,elapsed/route.duration);if(elapsed>=route.duration){if(mode==='lift'){mode='summit';const [x,y,z]=route.exit;last={x,y:y+.86,z,yaw:0,arrivalYaw:route.arrivalYaw??.6};}else{mode='';return{...last,mode:'',finished:true};}}return{...last,mode};}};
}
