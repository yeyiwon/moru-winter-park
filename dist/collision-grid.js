// Broad phase only. The existing exact circle/ellipse/door tests remain the
// authority; each collider is inserted into every cell touched by its bounds.
export function createStaticColliderIndex(obstacles,{size=12,padding=0}={}){
 const cells=new Map(),empty=[];
 for(const obstacle of obstacles){const rx=(obstacle.rx??obstacle.r??obstacle.w??0)+padding,rz=(obstacle.rz??obstacle.r??obstacle.d??0)+padding;for(let x=Math.floor((obstacle.x-rx)/size);x<=Math.floor((obstacle.x+rx)/size);x++)for(let z=Math.floor((obstacle.z-rz)/size);z<=Math.floor((obstacle.z+rz)/size);z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(obstacle);}}
 return{query(x,z){return cells.get(Math.floor(x/size)+','+Math.floor(z/size))||empty;}};
}
