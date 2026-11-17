// One floor description drives the glasshouse model, movement and presence validation.
export const conservatoryLayout={x:0,z:64,radius:11.2,height:17,floor:.22,doorHalfWidth:2.1,walkRadius:7.6,walkHalfWidth:1.2,walkRise:4.98,walkArc:Math.PI*1.5};
export const conservatoryEntry={x:conservatoryLayout.x,z:conservatoryLayout.z-12.2};
export const conservatoryObstacles=[{x:-3.2,z:64.8,rx:3.05,rz:3.25}];
const tau=Math.PI*2;
export function conservatoryWalkPoint(t,side=0){const c=conservatoryLayout,u=Math.max(0,Math.min(1,t)),a=-Math.PI/2+u*c.walkArc,r=c.walkRadius+side*c.walkHalfWidth;return{x:c.x+Math.cos(a)*r,y:c.floor+c.walkRise*u,z:c.z+Math.sin(a)*r};}
export function conservatoryWalkAt(x,z){const c=conservatoryLayout,dx=x-c.x,dz=z-c.z,r=Math.hypot(dx,dz),angle=((Math.atan2(dz,dx)+Math.PI/2)%tau+tau)%tau;if(r<c.walkRadius-c.walkHalfWidth||r>c.walkRadius+c.walkHalfWidth||angle>c.walkArc)return null;return{height:c.floor+c.walkRise*angle/c.walkArc,t:angle/c.walkArc,r};}
export function conservatorySurfaceAt(x,z){const c=conservatoryLayout,r=Math.hypot(x-c.x,z-c.z);if(r>c.radius+.3)return null;const walk=conservatoryWalkAt(x,z);if(walk)return walk.height;return .09+(c.floor-.09)*Math.max(0,Math.min(1,(c.radius+.3-r)/.7));}
export function conservatoryCanStandAt(x,z,radius=.35){const c=conservatoryLayout,dx=x-c.x,dz=z-c.z,r=Math.hypot(dx,dz);if(r>c.radius+radius)return true;if(r>c.radius-radius&&!(Math.abs(dx)<c.doorHalfWidth-radius&&Math.abs(dz)>c.radius-1))return false;return !conservatoryObstacles.some(o=>((x-o.x)/(o.rx+radius))**2+((z-o.z)/(o.rz+radius))**2<1);}
// The ramp is reached through its foot, never by stepping sideways onto a 5 m ledge.
export function conservatoryCanMoveFrom(from,to){const a=conservatorySurfaceAt(from.x,from.z),b=conservatorySurfaceAt(to.x,to.z);if(a===null&&b===null)return true;return Math.abs((a??.09)-(b??.09))<=.22;}
