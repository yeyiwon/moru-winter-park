import {canStandAt} from './movement.js';

const STEP=.85, MIN=-66.3, SIZE=157;
const point=i=>({x:MIN+(i%SIZE)*STEP,z:MIN+Math.floor(i/SIZE)*STEP});
const walkable=new Uint8Array(SIZE*SIZE);
for(let i=0;i<walkable.length;i++){const p=point(i);walkable[i]=canStandAt(p.x,p.z)&&canStandAt(p.x+.12,p.z)&&canStandAt(p.x-.12,p.z)&&canStandAt(p.x,p.z+.12)&&canStandAt(p.x,p.z-.12)?1:0;}
export function clearSegment(a,b){
  const n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.12);
  for(let i=0;i<=n;i++){const t=n?i/n:0;if(!canStandAt(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false;}
  return true;
}
function closest(p,connect=false){
  const cx=Math.round((p.x-MIN)/STEP),cz=Math.round((p.z-MIN)/STEP);let best=-1,dist=Infinity;
  for(let radius=0;radius<14;radius++){
    for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){
      if(Math.max(Math.abs(dx),Math.abs(dz))!==radius)continue;const x=cx+dx,z=cz+dz;if(x<0||x>=SIZE||z<0||z>=SIZE)continue;
      const i=z*SIZE+x;if(!walkable[i])continue;const q=point(i),d=Math.hypot(q.x-p.x,q.z-p.z);if(d<dist&&(!connect||clearSegment(p,q))){dist=d;best=i;}
    }
    if(radius*STEP>dist+STEP)return {id:best,dist};
  }
  return {id:best,dist};
}
// A small cached navigation grid keeps clicks on the far side of rides reachable.
export function findPath(start,requested){
  if(!Number.isFinite(requested.x+requested.z)||Math.abs(requested.x)>66||Math.abs(requested.z)>72)return [];
  const end=closest(requested);if(end.id<0||end.dist>4)return [];
  const goal=canStandAt(requested.x,requested.z)?requested:point(end.id);
  if(clearSegment(start,goal))return [{...goal}];
  const first=closest(start,true);if(first.id<0)return [];
  const cost=new Float32Array(walkable.length).fill(Infinity),parent=new Int32Array(walkable.length).fill(-1),closed=new Uint8Array(walkable.length),open=[first.id];cost[first.id]=0;
  const estimate=id=>cost[id]+Math.hypot(point(id).x-goal.x,point(id).z-goal.z);
  while(open.length){
    let at=0;for(let i=1;i<open.length;i++)if(estimate(open[i])<estimate(open[at]))at=i;
    const id=open.splice(at,1)[0];if(closed[id])continue;
    if(id===end.id){
      const raw=[];let cur=id;while(cur!==-1){raw.unshift(point(cur));cur=parent[cur];}
      if(clearSegment(raw.at(-1),goal))raw.push({...goal});
      const route=[];let from=start,index=0;while(index<raw.length){let far=index;for(let j=index+1;j<raw.length;j++){if(!clearSegment(from,raw[j]))break;far=j;}route.push(raw[far]);from=raw[far];index=far+1;}return route;
    }
    closed[id]=1;const x=id%SIZE,z=Math.floor(id/SIZE);
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dz||x+dx<0||x+dx>=SIZE||z+dz<0||z+dz>=SIZE)continue;
      const next=id+dx+dz*SIZE;if(!walkable[next]||closed[next]||!clearSegment(point(id),point(next)))continue;
      const value=cost[id]+Math.hypot(dx,dz)*STEP;if(value<cost[next]){cost[next]=value;parent[next]=id;open.push(next);}
    }
  }
  return [];
}
