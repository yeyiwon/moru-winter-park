import {skiStarts,skiRuns,skiRunCenter} from '../dist/resort-layout.js';
// Unit physics starts at a real, validated trail gate. Lift walking is covered separately.
export function courseStart(id='main'){return skiStarts.find(p=>p.id===id);}
export function followCourse(p,id){const course=id==='explore'&&p.z>=skiRuns.find(r=>r.id==='explore').finish-20?'main':id,look=8+p.speed*.6,desired=Math.atan2(skiRunCenter(p.z+look,course)-p.x,look),delta=Math.atan2(Math.sin((p.heading||0)-desired),Math.cos((p.heading||0)-desired));return{push:true,steer:Math.max(-1,Math.min(1,delta*4))};}
