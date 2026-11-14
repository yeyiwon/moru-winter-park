// Pure ground movement shared by keyboard and touch controls.
export const obstacles = [
  {x:7.1,z:-3.2,r:3.9}, {x:-7.8,z:-5,r:2.9},
  {x:1,z:-15,w:7.1,d:3.1},
  {x:8,z:-10,w:1.9,d:1.6}, {x:11.2,z:-10.7,w:1.9,d:1.6}, {x:14.4,z:-11.4,w:1.9,d:1.6},
  {x:-6,z:10,r:.8},{x:8,z:9,r:.8},{x:13,z:-7,r:.8},{x:-15,z:-10,r:.8}
];
export function canStandAt(x,z){
  if(!Number.isFinite(x+z)||Math.hypot(x,z)>18.7)return false;
  if(((x+10)/7.85)**2+((z+3)/12.25)**2<1)return false;
  return !obstacles.some(o=>o.r?Math.hypot(x-o.x,z-o.z)<o.r:Math.abs(x-o.x)<o.w&&Math.abs(z-o.z)<o.d);
}
export function moveVector(x,z,yaw){
  const length=Math.hypot(x,z),s=length>1?1/length:1;
  return {x:(x*Math.cos(yaw)+z*Math.sin(yaw))*s,z:(z*Math.cos(yaw)-x*Math.sin(yaw))*s};
}
export function moveOnGround(position,velocity,dt){
  const time=Math.max(0,Math.min(dt,.08)),steps=Math.max(1,Math.ceil(Math.hypot(velocity.x,velocity.z)*time/.15));
  let {x,z}=position;const dx=velocity.x*time/steps,dz=velocity.z*time/steps;
  for(let i=0;i<steps;i++){if(canStandAt(x+dx,z))x+=dx;if(canStandAt(x,z+dz))z+=dz;}
  return {x,z};
}
