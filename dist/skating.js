import {withinRink,rinkBounds} from './retreat-layout.js';
export function createSkatingController(){
 let active=false,x,z,vx=0,vz=0,yaw=-Math.PI/2;
 return{get active(){return active;},start(){active=true;x=rinkBounds.x+rinkBounds.rx-1.6;z=rinkBounds.z;vx=vz=0;yaw=-Math.PI/2;},stop(){active=false;vx=vz=0;},update(dt,input={}){
  if(!active)return null;dt=Math.min(.05,Math.max(0,dt));const length=Math.hypot(input.x||0,input.z||0),amount=Math.min(1,length),dx=(input.x||0)/Math.max(1,length),dz=(input.z||0)/Math.max(1,length),brake=!!input.brake,drag=Math.exp(-dt*(brake?6:.62));
  vx=vx*drag+(brake?0:dx*6.8*dt);vz=vz*drag+(brake?0:dz*6.8*dt);const speed=Math.hypot(vx,vz);if(speed>8){vx*=8/speed;vz*=8/speed;}
  const nx=x+vx*dt,nz=z+vz*dt,gate=nx>rinkBounds.x+rinkBounds.rx-1.5&&Math.abs(nz-rinkBounds.z)<rinkBounds.gateHalfWidth-.65;
  if(withinRink(nx,nz,.65)||gate){x=nx;z=nz;}else{vx*=-.18;vz*=-.18;}
  const heading=Math.atan2(vx,vz),turn=Math.atan2(Math.sin(heading-yaw),Math.cos(heading-yaw));if(speed>.12)yaw+=turn*(1-Math.exp(-dt*6));
  const finished=gate&&x>rinkBounds.x+rinkBounds.fenceRx+.8;if(finished)active=false;
  return{x,z,y:finished?.95:1.04,yaw,mode:finished?'':'skate',finished,speed:Math.hypot(vx,vz),brake,lean:Math.max(-1,Math.min(1,turn))*amount,view:{distance:14,pitch:.4,yaw:Math.PI/2,lookHeight:0}};
 }};
}
