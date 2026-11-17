import {alpineShift} from '../dist/resort-layout.js';
import {skiStarts,skiRunCenter} from '../dist/resort-layout.js';
export function walkToStart(ride,id='main'){
 const gate=skiStarts.find(p=>p.id===id);if(['advanced','expert'].includes(id)){ride.start('upperlift');ride.update(28);}let p=ride.update(0);
 for(const target of [{x:gate.x,z:['advanced','expert'].includes(id)?(-378+alpineShift):(-342+alpineShift)},gate])for(let i=0;i<1000;i++){const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);if(d<.05)break;p=ride.update(.05,{x:dx/d*Math.min(1,d/.15),z:dz/d*Math.min(1,d/.15)});}
 return p;
}
export function followCourse(p,id){const desired=Math.atan2(skiRunCenter(p.z+6,id)-p.x,6),delta=Math.atan2(Math.sin((p.heading||0)-desired),Math.cos((p.heading||0)-desired));return{push:true,steer:Math.max(-1,Math.min(1,delta*2.5))};}
