import {alpineHeight,skiCenter,skiHalfWidth,summit} from './resort-layout.js';
// Routes describe the same surfaces and cable used by the visible models.
export function sampleRide(route,progress){
 const p=Math.max(0,Math.min(1,progress))*(route.points.length-1),i=Math.min(route.points.length-2,Math.floor(p)),t=p-i,a=route.points[i],b=route.points[i+1];
 return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t+(route.bodyOffset??(route.heightMode==='seat'?.55:.86)),z:a[2]+(b[2]-a[2])*t,yaw:Math.atan2(b[0]-a[0],b[2]-a[2])};
}
export function createRideController(routes){
 let mode='',elapsed=0,last=null,speed=0,z=0,x=0,heading=0,launched=false,steer=0,recovery=0;
 return{get mode(){return mode;},start(kind){if(!routes[kind]||kind==='ski'&&mode!=='summit')return false;const launch=last;mode=kind;elapsed=0;last=kind==='ski'&&launch?launch:sampleRide(routes[kind],0);if(kind==='ski'){speed=0;z=last.z;x=last.x;heading=last.yaw;launched=false;steer=0;recovery=0;}return true;},stop(){const was=mode;mode='';last=null;return was;},update(dt,input={}){
 if(!mode)return null;if(mode==='summit'){const step=Math.min(.1,Math.max(0,dt)),vx=input.x||0,vz=input.z||0;let x=last.x+vx*3*step,z=last.z+vz*3*step;const d=Math.hypot((x-summit.x)/summit.rx,(z-summit.z)/summit.rz);if(d>1){x=summit.x+(x-summit.x)/d;z=summit.z+(z-summit.z)/d;}last={x,z,y:alpineHeight(x,z)+.86,yaw:Math.hypot(vx,vz)>.01?Math.atan2(vx,vz):last.yaw};return{...last,mode};}dt=Math.max(0,Math.min(120,dt));
 if(mode==='ski'){
  const finish=routes.ski.points.at(-1)[2];let remaining=dt;
  while(remaining>0&&z<finish){const step=Math.min(.025,remaining);remaining-=step;if(launched)elapsed+=step;recovery=Math.max(0,recovery-step);
   if(input.push)launched=true;
   const slope=alpineHeight(x,z)-alpineHeight(x+Math.sin(heading),z+Math.cos(heading));
   const braking=!!input.brake,turn=Math.max(-1,Math.min(1,input.steer||0));
   speed=launched?Math.max(0,Math.min(24,speed+(9.8*slope/Math.sqrt(1+slope*slope)+(input.push?3:0)-.035*speed*speed-(braking?16:0))*step)):0;
   steer+=(turn-steer)*Math.min(1,step*5);heading+=steer*step*(1.35-Math.min(.65,speed*.025));heading=Math.atan2(Math.sin(heading),Math.cos(heading));
   const travel=speed*step/Math.sqrt(1+slope*slope),nx=x+Math.sin(heading)*travel,nz=Math.max(-363,Math.min(finish,z+Math.cos(heading)*travel));
   const edge=skiHalfWidth(nz),center=skiCenter(nz);if(Math.abs(nx-center)>edge){x=Math.max(center-edge,Math.min(center+edge,nx));z=nz;speed*=Math.exp(-step*5);recovery=.15;}else{x=nx;z=nz;}
  }
  const dx=x-last.x,dz=z-last.z;
  const yaw=heading,ux=Math.sin(yaw)*.4,uz=Math.cos(yaw)*.4,tilt=Math.atan((alpineHeight(x-ux,z-uz)-alpineHeight(x+ux,z+uz))/.8);
  last={x,y:alpineHeight(x,z)+.88/Math.cos(tilt),z,yaw,tilt,speed,lean:steer,raceTime:elapsed,recovery,heading,launched};
  if(z>=finish){mode='';return{...last,mode:'',finished:true};}return{...last,mode};
 }
 elapsed+=dt;const route=routes[mode];last=sampleRide(route,elapsed/route.duration);if(elapsed>=route.duration){if(mode==='lift'){mode='summit';const [x,y,z]=route.exit;last={x,y:y+.86,z,yaw:Math.atan2(skiCenter(-330)-x,-330-z)};}else{mode='';return{...last,mode:'',finished:true};}}return{...last,mode};}};
}
