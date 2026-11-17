const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function stepBumper(cars,dt,input={},bounds={x:8.85,z:5.85}){
 const time=clamp(dt,0,.05),steps=Math.max(1,Math.ceil(time/.01)),h=time/steps;let impact=0;
 for(let n=0;n<steps;n++){
  const car=cars[0],throttle=clamp(input.throttle||0,-1,1),steer=clamp(input.steer||0,-1,1);
  car.speed=clamp((car.speed||0)+throttle*6.2*h,-3.4,6.2)*Math.exp(-h*(input.brake?9:throttle?.3:1.7));
  car.yaw-=steer*h*1.8*(.3+Math.min(1,Math.abs(car.speed)/2.5))*(car.speed<-.2?-1:1);
  car.x+=Math.sin(car.yaw)*car.speed*h;car.z+=Math.cos(car.yaw)*car.speed*h;
  for(let i=1;i<cars.length;i++){const o=cars[i];o.x+=(o.vx||0)*h;o.z+=(o.vz||0)*h;o.vx=(o.vx||0)*Math.exp(-h*1.8);o.vz=(o.vz||0)*Math.exp(-h*1.8);}
  for(const o of cars){for(const axis of ['x','z']){if(Math.abs(o[axis])>bounds[axis]){impact=Math.max(impact,Math.abs(o.speed||o['v'+axis]||0));o[axis]=clamp(o[axis],-bounds[axis],bounds[axis]);if(o===car)o.speed*=-.36;else o['v'+axis]*=-.4;}}}
  for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){
   const a=cars[i],b=cars[j],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),radius=1.9;if(d>=radius)continue;
   const nx=d>1e-5?dx/d:1,nz=d>1e-5?dz/d:0,overlap=(radius-d)/2+.001;a.x-=nx*overlap;a.z-=nz*overlap;b.x+=nx*overlap;b.z+=nz*overlap;
   if(i===0){const speed=Math.abs(a.speed);impact=Math.max(impact,speed);b.vx=(b.vx||0)+nx*speed*.8;b.vz=(b.vz||0)+nz*speed*.8;a.speed*=-.3;}
  }
 }return{impact,speed:cars[0].speed||0};
}
