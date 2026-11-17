import {withinRink} from './retreat-layout.js';
export function createSkatingController(){
 let active=false,x=-46,z=94,vx=0,vz=0,yaw=-Math.PI/2;
 return{get active(){return active},start(){active=true;x=-46;z=94;vx=vz=0;},stop(){active=false;vx=vz=0;},update(dt,input){if(!active)return null;dt=Math.min(.05,Math.max(0,dt));const dx=input.x||0,dz=input.z||0,amount=Math.min(1,Math.hypot(dx,dz)),drag=Math.exp(-dt*(input.brake?4:.65));vx=vx*drag+dx*8*dt;vz=vz*drag+dz*8*dt;const speed=Math.hypot(vx,vz);if(speed>8){vx*=8/speed;vz*=8/speed;}const nx=x+vx*dt,nz=z+vz*dt;if(withinRink(nx,nz,.7)){x=nx;z=nz;}else{vx*=-.2;vz*=-.2;}const heading=Math.atan2(vx,vz),turn=Math.atan2(Math.sin(heading-yaw),Math.cos(heading-yaw));if(speed>.1)yaw+=turn*(1-Math.exp(-dt*5));return{x,z,y:1.04,yaw,mode:'skate',speed:Math.hypot(vx,vz),lean:turn*amount,view:{distance:13,pitch:.4,yaw:yaw+Math.PI,lookHeight:0}};}};
}
