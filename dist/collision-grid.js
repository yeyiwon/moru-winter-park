// Broad phase only. The existing exact circle/ellipse/door tests remain the
// authority; each collider is inserted into every cell touched by its bounds.
export function createStaticColliderIndex(obstacles,{size=12,padding=0}={}){
 const cells=new Map(),empty=[];
 for(const obstacle of obstacles){const c=Math.abs(Math.cos(obstacle.yaw||0)),s=Math.abs(Math.sin(obstacle.yaw||0)),u=(obstacle.rx??obstacle.r??obstacle.w??0)+padding,v=(obstacle.rz??obstacle.r??obstacle.d??0)+padding,rx=u*c+v*s,rz=u*s+v*c;for(let x=Math.floor((obstacle.x-rx)/size);x<=Math.floor((obstacle.x+rx)/size);x++)for(let z=Math.floor((obstacle.z-rz)/size);z<=Math.floor((obstacle.z+rz)/size);z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(obstacle);}}
 return{query(x,z){return cells.get(Math.floor(x/size)+','+Math.floor(z/size))||empty;}};
}

export function colliderContains(o,x,z,padding=0){
 const c=Math.cos(o.yaw||0),s=Math.sin(o.yaw||0),wx=x-o.x,wz=z-o.z,dx=wx*c-wz*s,dz=wx*s+wz*c;
 if(o.door&&Math.abs(dx-(o.door.offset??o.door.x-o.x))<o.door.w-padding)return false;
 if(o.rx)return (dx/(o.rx+padding))**2+(dz/(o.rz+padding))**2<1;
 return o.r?Math.hypot(dx,dz)<o.r+padding:Math.abs(dx)<o.w+padding&&Math.abs(dz)<o.d+padding;
}
