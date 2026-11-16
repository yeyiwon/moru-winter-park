import {alpineHeight,skiCenter} from './resort-layout.js';
// Routes describe the same surfaces and cable used by the visible models.
export function sampleRide(route,progress){
 const p=Math.max(0,Math.min(1,progress))*(route.points.length-1),i=Math.min(route.points.length-2,Math.floor(p)),t=p-i,a=route.points[i],b=route.points[i+1];
 return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t+(route.bodyOffset??(route.heightMode==='seat'?.55:.86)),z:a[2]+(b[2]-a[2])*t,yaw:Math.atan2(b[0]-a[0],b[2]-a[2])};
}
export function createRideController(routes){
 let mode='',elapsed=0,last=null,speed=0,z=0,offset=0,steer=0,recovery=0;
 return{get mode(){return mode;},start(kind){if(!routes[kind]||kind==='ski'&&mode!=='summit')return false;mode=kind;elapsed=0;last=sampleRide(routes[kind],0);if(kind==='ski'){speed=2;z=last.z;offset=0;steer=0;recovery=0;}return true;},stop(){const was=mode;mode='';last=null;return was;},update(dt,input={}){
 if(!mode)return null;if(mode==='summit')return{...last,mode};dt=Math.max(0,Math.min(120,dt));
 if(mode==='ski'){
  const finish=routes.ski.points.at(-1)[2];let remaining=dt;
  while(remaining>0&&z<finish){const step=Math.min(.025,remaining);remaining-=step;elapsed+=step;recovery=Math.max(0,recovery-step);
   const slope=Math.max(0,(alpineHeight(skiCenter(z),z)-alpineHeight(skiCenter(z+1),z+1)));
   const braking=!!input.brake,turn=recovery?0:Math.max(-1,Math.min(1,input.steer||0));
   speed=Math.max(0,Math.min(24,speed+(9.8*slope/Math.sqrt(1+slope*slope)-.035*speed*speed-(braking?12:0))*step));
   steer+=(turn-steer)*Math.min(1,step*5);offset+=steer*speed*.48*step;
   if(Math.abs(offset)>7){offset=Math.sign(offset)*7;speed*=.35;recovery=.8;steer*=-.35;}
   z=Math.min(finish,z+speed*step/Math.sqrt(1+slope*slope));
  }
  const x=skiCenter(z)+offset,dx=x-last.x,dz=z-last.z;
  const yaw=Math.hypot(dx,dz)>.001?Math.atan2(dx,dz):last.yaw,ux=Math.sin(yaw)*.4,uz=Math.cos(yaw)*.4,tilt=Math.atan((alpineHeight(x-ux,z-uz)-alpineHeight(x+ux,z+uz))/.8);
  last={x,y:alpineHeight(x,z)+.88/Math.cos(tilt),z,yaw,tilt,speed,lean:steer,raceTime:elapsed,recovery};
  if(z>=finish){mode='';return{...last,mode:'',finished:true};}return{...last,mode};
 }
 elapsed+=dt;const route=routes[mode];last=sampleRide(route,elapsed/route.duration);if(elapsed>=route.duration){if(mode==='lift'){mode='summit';const [x,y,z]=route.exit;last={x,y:y+.86,z,yaw:0};}else{mode='';return{...last,mode:'',finished:true};}}return{...last,mode};}};
}
