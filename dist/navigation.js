import {landforms,landRadius} from './world-layout.js';
import {canStandAt,canMoveBetween} from './movement.js';
import {interiorAt} from './interior-layout.js';
const STEP=.85,grids=new Map();
const outline=landforms.flatMap(f=>Array.from({length:128},(_,i)=>{const angle=i/128*Math.PI*2,r=landRadius(f,angle);return {x:f.x+Math.cos(angle)*f.rx*r,z:f.z+Math.sin(angle)*f.rz*r};}));
export const navigationBounds={minX:Math.min(...outline.map(p=>p.x))-2,maxX:Math.max(...outline.map(p=>p.x))+2,minZ:Math.min(...outline.map(p=>p.z))-2,maxZ:Math.max(...outline.map(p=>p.z))+2};
export function clearSegment(a,b){
 const n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.12);let previous=a;
 for(let i=0;i<=n;i++){const t=n?i/n:0,p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};if(!canStandAt(p.x,p.z)||!canMoveBetween(previous,p))return false;previous=p;}return true;
}
function gridFor(room){
 const key=room?.id||'outdoors';if(grids.has(key))return grids.get(key);
 const minX=room?room.x-room.rx:navigationBounds.minX,minZ=room?room.z-room.rz:navigationBounds.minZ,width=room?Math.ceil(room.rx*2/STEP)+1:Math.ceil((navigationBounds.maxX-minX)/STEP)+1,height=room?Math.ceil(room.rz*2/STEP)+1:Math.ceil((navigationBounds.maxZ-minZ)/STEP)+1;
 const point=i=>({x:minX+i%width*STEP,z:minZ+Math.floor(i/width)*STEP}),walkable=new Int8Array(width*height);
 // Unknown cells are evaluated on demand. Building the full 231k-cell world
 // grid synchronously made the first obstructed click freeze for several seconds.
 const isWalkable=i=>{if(!walkable[i]){const p=point(i);walkable[i]=canStandAt(p.x,p.z)?1:-1;}return walkable[i]===1;};
 const grid={minX,minZ,width,height,point,walkable,isWalkable};grids.set(key,grid);return grid;
}
function closest(grid,p,connect=false){
 const {minX,minZ,width,height,isWalkable,point}=grid,cx=Math.round((p.x-minX)/STEP),cz=Math.round((p.z-minZ)/STEP);let best=-1,dist=Infinity;
 for(let radius=0;radius<8;radius++){
  for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dz))!==radius)continue;const x=cx+dx,z=cz+dz;if(x<0||x>=width||z<0||z>=height)continue;const id=z*width+x;if(!isWalkable(id))continue;const q=point(id),d=Math.hypot(q.x-p.x,q.z-p.z);if(d<dist&&(!connect||clearSegment(p,q))){best=id;dist=d;}
  }if(radius*STEP>dist+STEP)break;
 }return{id:best,dist};
}
class Queue{
 items=[];
 push(item){const a=this.items;a.push(item);let i=a.length-1;while(i){const p=(i-1)>>1;if(a[p].score<=item.score)break;a[i]=a[p];i=p;}a[i]=item;}
 pop(){const a=this.items,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].score<a[c].score)c++;if(a[c].score>=last.score)break;a[i]=a[c];i=c;}a[i]=last;}return first;}
}
// Per-room grids prevent paths jumping between a remote interior and the outdoors.
export function findPath(start,requested){
 if(!Number.isFinite(start.x+start.z+requested.x+requested.z))return [];
 const room=interiorAt(start.x,start.z),endRoom=interiorAt(requested.x,requested.z);if(room?.id!==endRoom?.id)return [];
 if(!room&&(requested.x<navigationBounds.minX||requested.x>navigationBounds.maxX||requested.z<navigationBounds.minZ||requested.z>navigationBounds.maxZ))return [];
 if(canStandAt(requested.x,requested.z)&&clearSegment(start,requested))return[{...requested}];
 const grid=gridFor(room),{width,height,point,walkable}=grid,end=closest(grid,requested,canStandAt(requested.x,requested.z));if(end.id<0||end.dist>4)return [];
 const goal=canStandAt(requested.x,requested.z)?requested:point(end.id),first=closest(grid,start,true);if(first.id<0)return [];
 const cost=new Float64Array(walkable.length).fill(Infinity),parent=new Int32Array(walkable.length).fill(-1),closed=new Uint8Array(walkable.length),queue=new Queue();cost[first.id]=0;queue.push({id:first.id,score:0});
 while(queue.items.length){
  const {id}=queue.pop();if(closed[id])continue;if(id===end.id){
   const raw=[];let cur=id;while(cur!==-1){raw.push(point(cur));cur=parent[cur];}raw.reverse();if(clearSegment(raw.at(-1),goal))raw.push({...goal});
   const route=[];let from=start,i=0;while(i<raw.length){let far=i;for(let j=i+1;j<raw.length;j++){if(!clearSegment(from,raw[j]))break;far=j;}route.push(raw[far]);from=raw[far];i=far+1;}return route;
  }
  closed[id]=1;const x=id%width,z=Math.floor(id/width);
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
   if(!dx&&!dz||x+dx<0||x+dx>=width||z+dz<0||z+dz>=height)continue;const next=id+dx+dz*width;if(closed[next]||!grid.isWalkable(next)||!clearSegment(point(id),point(next)))continue;
   const value=cost[id]+Math.hypot(dx,dz)*STEP;if(value<cost[next]){cost[next]=value;parent[next]=id;const p=point(next);queue.push({id:next,score:value+Math.hypot(p.x-goal.x,p.z-goal.z)});}
  }
 }return [];
}
