import {landforms,landRadius,segmentDistance} from './world-layout.js';
import {alpine,alpineHeight,summit,peakSummit,skiRuns,skiRunCenter,skiRunHalfWidth,skiRunouts,liftPoint,upperLiftPoint,summitTransfer,summitFacilities} from './resort-blueprint.js';
import {worldPathLinks} from './world-paths.js';
import {alpineShift} from './resort-layout.js';

// Rendered trunks and movement use the same deterministic placements.
const worldForm=landforms.find(p=>p.id==='alpine'),form={...worldForm,z:worldForm.z-alpineShift};
const liftLines=[liftPoint,upperLiftPoint].map(point=>Array.from({length:49},(_,i)=>{const p=point(i/48);return{x:p[0]+2,z:p[2]};}));
const distanceToLine=(x,z,points)=>Math.min(...points.slice(1).map((p,i)=>segmentDistance(x,z,points[i],p)));
function clear(x,z,h){
 if(worldPathLinks.some(([a,b,width])=>a[1]<-40&&b[1]<-40&&segmentDistance(x,z+alpineShift,{x:a[0],z:a[1]},{x:b[0],z:b[1]})<width/2+h*.2+1))return false;
 if(Math.hypot(x-alpine.x,z-alpine.z)>alpine.r-9||z>-169||z<alpine.z-118)return false;
 if(skiRunouts.some(a=>Math.hypot((x-a.x)/(a.rx+6),(z-a.z)/(a.rz+6))<1))return false;
 if([summit,peakSummit].some(s=>Math.hypot((x-s.x)/(s.rx+7),(z-s.z)/(s.rz+7))<1))return false;
 if(skiRuns.some(run=>z>run.startZ-8&&z<run.finish+14&&Math.abs(x-skiRunCenter(z,run.id))<skiRunHalfWidth(z,run.id)+8))return false;

 if(liftLines.some(line=>distanceToLine(x,z,line)<9)||distanceToLine(x,z,summitTransfer)<9)return false;
 if(Math.abs(x+97)<16&&Math.abs(z+176)<15)return false;
 if(Math.abs(x+36)<8&&z>-196&&z<-169)return false;
 if(summitFacilities.some(p=>Math.hypot(x-(p.model?.x??p.x),z-(p.model?.z??p.z))<h*.4+7))return false;
 const grade=Math.hypot(alpineHeight(x+1,z)-alpineHeight(x-1,z),alpineHeight(x,z+1)-alpineHeight(x,z-1))/2;
 return grade<=1.4;
}
let seed=4277;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
const authoredTrees=[];
for(let attempt=0;attempt<2400&&authoredTrees.length<185;attempt++){
 // Radius is a fraction of the terrain ellipse, not a distance multiplied by it again.
 const angle=random()*Math.PI*2,r=Math.sqrt(.04+random()*.82),edge=landRadius(form,angle);
 const x=form.x+Math.cos(angle)*form.rx*edge*r,z=form.z+Math.sin(angle)*form.rz*edge*r,h=5+random()*7;
 if(!clear(x,z,h)||authoredTrees.some(p=>Math.hypot(x-p.x,z-p.z)<3.2))continue;
 authoredTrees.push({x,z,h,y:alpineHeight(x,z),r:h*.045,turn:random()*Math.PI*2,shade:Math.floor(random()*3),decorated:false});
}
// Lights frame guest routes; the remote mountainside remains a snowy forest.
const ranked=[...authoredTrees].sort((a,b)=>{
 const score=p=>Math.min(distanceToLine(p.x,p.z,liftLines[0]),distanceToLine(p.x,p.z,summitTransfer),Math.hypot(p.x+55,p.z+176));
 return score(a)-score(b);
});
const lit=[];
for(const tree of ranked){if(lit.length>=24)break;if(lit.some(p=>Math.hypot(tree.x-p.x,tree.z-p.z)<10))continue;tree.decorated=true;lit.push(tree);}

export const alpineTrees=authoredTrees.map(p=>({...p,z:p.z+alpineShift}));

// Click-to-walk searches many cells: query nearby trunks, not all 185 on every step.
const cells=new Map(),cellKey=(x,z)=>`${Math.floor(x/16)},${Math.floor(z/16)}`;
for(const tree of alpineTrees){const key=cellKey(tree.x,tree.z);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(tree);}
export function alpineTrunkBlocks(x,z,bodyRadius){
 if(z>-160+alpineShift)return false;
 const cx=Math.floor(x/16),cz=Math.floor(z/16);
 for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const tree of cells.get(`${cx+dx},${cz+dz}`)||[]){
  if((x-tree.x)**2+(z-tree.z)**2<(tree.r+bodyRadius)**2)return true;
 }
 return false;
}
