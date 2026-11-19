import {skiJumps,skiJumpCoordinates,mountainGroundHeight,mountainTerraces,alpineHeight,skiRunCenter,skiRunHalfWidth,skiRuns,skiRunAt,skiRunouts,summitPositionValid} from './resort-layout.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
function onTerrace(x,z){return mountainTerraces.some(a=>Math.hypot((x-a.x)/a.rx,(z-a.z)/a.rz)<=1.25);}
function onPiste(x,z){return skiRuns.some(r=>z>=r.startZ-10&&z<=r.finish+14&&Math.abs(x-skiRunCenter(z,r.id))<=skiRunHalfWidth(z,r.id))||onTerrace(x,z)||skiRunouts.some(a=>Math.hypot((x-a.x)/a.rx,(z-a.z)/a.rz)<1);}
// Arc length is cached once per shared route. Index interpolation caused cable
// pitches to change speed at supports and amplified the camera's tracking jitter.
const routeLengths=new WeakMap();
export function sampleRide(route,progress){
 let cache=routeLengths.get(route);if(!cache){const lengths=[0];for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i];lengths.push(lengths.at(-1)+Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]));}cache={lengths,total:lengths.at(-1)};routeLengths.set(route,cache);}
 const distance=Math.max(0,Math.min(1,progress))*cache.total;let lo=0,hi=cache.lengths.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(cache.lengths[m]<=distance)lo=m;else hi=m;}
 const i=Math.min(route.points.length-2,lo),t=(distance-cache.lengths[i])/(cache.lengths[i+1]-cache.lengths[i]||1),a=route.points[i],b=route.points[i+1];
 // Gondola return lanes are offset from the heading. A stepwise heading at a
 // route vertex made the cabin jump sideways even at constant cable speed.
 let yaw=Math.atan2(b[0]-a[0],b[2]-a[2]);
 if(route.smoothHeading){const before=route.points[Math.max(0,i-1)],after=route.points[Math.min(route.points.length-1,i+2)],ya=Math.atan2(b[0]-before[0],b[2]-before[2]),yb=Math.atan2(after[0]-a[0],after[2]-a[2]);yaw=ya+angle(yb-ya)*t;}
 return{x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t+(route.bodyOffset??(route.heightMode==='seat'?.55:.86)),z:a[2]+(b[2]-a[2])*t,yaw};
}

// A short station dwell and an integrated velocity ramp share exactly the same clock on every client.
export function sampleCableRide(route,elapsed){
 if(!route.boardingSeconds)return {...sampleRide(route,elapsed/route.duration),arrived:elapsed>=route.duration,doors:0};
 const dwell=route.boardingSeconds,travel=route.duration,ramp=6,topDwell=route.arrivalSeconds||12,turn=9.5,cycle=dwell+travel*2+topDwell+turn*2;
 const t=((elapsed%cycle)+cycle)%cycle,topAt=dwell+travel,returnAt=topAt+topDwell+turn;
 const travelProgress=t=>{t=clamp(t,0,travel);return(t<ramp?t*t/(2*ramp):t>travel-ramp?travel-ramp-(travel-t)**2/(2*ramp):t-ramp/2)/(travel-ramp);};
 let p,doors=0,arrived=false,station='';
 if(t<dwell){p=sampleRide(route,0);doors=clamp(dwell-t,0,1);station='base';arrived=elapsed>=cycle;}
 else if(t<topAt)p=sampleRide(route,travelProgress(t-dwell));
 else if(t<topAt+topDwell){p=sampleRide(route,1);station='summit';arrived=true;doors=Math.min(clamp((t-topAt)/2,0,1),clamp((topAt+topDwell-t)/2,0,1));}
 else if(t<returnAt){p=sampleRide(route,1);const a=(t-topAt-topDwell)/turn*Math.PI,c=Math.cos(p.yaw),s=Math.sin(p.yaw);p.x+=-c*6*(1-Math.cos(a))+s*6*Math.sin(a);p.z+=s*6*(1-Math.cos(a))+c*6*Math.sin(a);p.yaw+=a;}
 else if(t<returnAt+travel){p=sampleRide(route,1-travelProgress(t-returnAt));p.x-=Math.cos(p.yaw)*12;p.z+=Math.sin(p.yaw)*12;p.yaw+=Math.PI;}
 else{p=sampleRide(route,0);const a=(t-returnAt-travel)/turn*Math.PI,c=Math.cos(p.yaw),s=Math.sin(p.yaw);p.x-=c*6*(1+Math.cos(a))+s*6*Math.sin(a);p.z+=s*6*(1+Math.cos(a))-c*6*Math.sin(a);p.yaw+=Math.PI+a;}
 return {...p,arrived,doors,station,cycle};
}
export const skiPhysics={ski:{drag:.0030,friction:.035,turn:1.32,edgeResponse:10,brake:17,maxSpeed:56},board:{drag:.0031,friction:.032,turn:1.1,edgeResponse:3.8,brake:16,maxSpeed:56}};
export function createRideController(routes){
 let mode='',elapsed=0,last=null,speed=0,x=0,z=0,heading=0,launched=false,steer=0,recovery=0,runId='main',activeRoute='',crossed=false,equipment='ski',air=0,vertical=0,jumpHeld=false,checkpoint=null,checkpointTime=0,landing=0;
 function reset(){speed=steer=recovery=air=vertical=landing=0;launched=crossed=jumpHeld=false;}
 function summitPose(){const route=routes[activeRoute],[x,y,z]=last?.station==='base'&&route.baseExit?route.baseExit:route.exit;mode='summit';last={x,y:y+.86,z,yaw:0,arrivalYaw:route.arrivalYaw??.6};return {...last,mode};}
 return{get mode(){return mode;},get equipment(){return equipment;},get routeKind(){return activeRoute;},get arrived(){return mode==='lift'&&last?.arrived;},syncElapsed(seconds){if(mode==='lift')elapsed=Math.max(0,seconds);},
  disembark(){return mode==='lift'&&last?.arrived?summitPose():null;},
  recover(){if(mode!=='ski'||!checkpoint)return false;({x,z,heading}=checkpoint);reset();return true;},
  start(kind,position,gear='ski'){
   const valid=position&&onPiste(position.x,position.z);if(!routes[kind]||kind==='ski'&&mode!=='summit'&&!valid)return false;
   const launch=valid?position:mode==='summit'?last:null;activeRoute=kind;mode=kind==='ski'?'ski':'lift';elapsed=0;reset();last=kind==='ski'&&launch?launch:sampleCableRide(routes[kind],0);
   if(kind==='ski'){equipment=gear==='board'?'board':'ski';x=last.x;z=last.z;runId=skiRunAt(x,z).id;heading=Math.atan2(skiRunCenter(z+6,runId)-x,6);checkpoint={x,z,heading};checkpointTime=0;}
   return true;
  },stop(){const was=mode;mode='';last=null;elapsed=0;reset();activeRoute='';return was;},update(dt,input={}){
   if(!mode)return null;
   if(mode==='summit'){const step=clamp(dt,0,.1),vx=input.x||0,vz=input.z||0,pace=input.running?6:3;let x=last.x+vx*pace*step,z=last.z+vz*pace*step;
    if(!onPiste(x,z)||!summitPositionValid(x,z)){x=last.x;z=last.z;}last={...last,x,z,y:alpineHeight(x,z)+.86,yaw:Math.hypot(vx,vz)>.01?Math.atan2(vx,vz):last.yaw};return {...last,mode};}
   dt=clamp(dt,0,120);
   if(mode==='lift'){elapsed+=dt;last=sampleCableRide(routes[activeRoute],elapsed);if(last.arrived&&activeRoute!=='gondola')return summitPose();return {...last,mode,routeKind:activeRoute};}
   const model=skiPhysics[equipment],finish=Math.max(...skiRuns.map(r=>r.finish));let remaining=dt;
   if(input.jump&&!jumpHeld&&air===0&&launched){const slope=alpineHeight(x,z)-alpineHeight(x+Math.sin(heading),z+Math.cos(heading));vertical=4.3-speed*slope/Math.sqrt(1+slope*slope);air=.001;}jumpHeld=!!input.jump;
   while(remaining>0){const step=Math.min(.025,remaining);remaining-=step;if(launched&&!crossed)elapsed+=step;recovery=Math.max(0,recovery-step);landing=Math.max(0,landing-step*4);
    if(input.push)launched=true;
    const oldX=x,oldZ=z,oldGround=alpineHeight(x,z),slope=air>0?0:oldGround-alpineHeight(x+Math.sin(heading),z+Math.cos(heading)),braking=!!input.brake||crossed,turn=clamp(input.steer||0,-1,1);
    steer+=((Math.abs(turn)<.04?0:turn)-steer)*(1-Math.exp(-step*model.edgeResponse));
    // Arcade gravity and stronger launch help keep the compact course near one minute.
    // Gravity still follows the terrain; braking and optional ramp bypasses remain under player control.
    const gravity=15.2*slope/Math.sqrt(1+slope*slope),push=input.push&&!crossed?6*Math.max(0,1-speed/12):0;
    speed=launched?clamp(speed+(gravity+push-model.friction-model.drag*speed*speed-(braking?model.brake:0))*step,0,model.maxSpeed):0;
    heading=angle(heading-steer*step*model.turn/(1+speed*.045)*(air>0?.25:1));
    const travel=speed*step/Math.sqrt(1+slope*slope),slide=equipment==='board'?steer*speed*.012:0,nx=x+Math.sin(heading)*travel+Math.cos(heading)*slide*step,nz=z+Math.cos(heading)*travel-Math.sin(heading)*slide*step;
    if(launched){if(onPiste(nx,nz)&&summitPositionValid(nx,nz)){x=nx;z=nz;runId=skiRunAt(x,z).id;}
     else{speed*=Math.exp(-step*4);recovery=.2;}
    }
    // Crossing a kicker lip launches once; slow/braking riders can roll over it.
    if(air===0&&speed>10&&!braking)for(const jump of skiJumps){if(Math.abs(z-jump.z)>3)continue;const a=skiJumpCoordinates(jump,oldX,oldZ),b=skiJumpCoordinates(jump,x,z);if(a.along<0&&b.along>=0&&Math.abs(b.side)<jump.width/2-1.5){const down=(mountainGroundHeight(x-Math.sin(heading),z-Math.cos(heading))-mountainGroundHeight(x+Math.sin(heading),z+Math.cos(heading)))/2;
     // Carry the downhill velocity through take-off; an absolute upward impulse
     // on a steep piste sent riders tens of metres above the safe landing zone.
     const takeoffSlope=down-2*jump.height/jump.length;vertical=Math.min(7,4+speed*.07)-speed*takeoffSlope/Math.sqrt(1+takeoffSlope*takeoffSlope);air=.001;break;}}
    // Integrate height in world space, so a falling slope does not drag airborne skiers down.
    if(air>0||vertical){vertical-=9.81*step;air+=vertical*step+oldGround-alpineHeight(x,z);if(air<=0){air=vertical=0;landing=1;speed*=.985;}}
    checkpointTime+=step;if(checkpointTime>5&&onPiste(x,z)&&air===0){checkpoint={x,z,heading};checkpointTime=0;}
    if(z>=finish)crossed=true;if(crossed&&(speed<.3||z>=finish+10))break;
   }
   const ux=Math.sin(heading)*.4,uz=Math.cos(heading)*.4,tilt=clamp(Math.atan((alpineHeight(x-ux,z-uz)-alpineHeight(x+ux,z+uz))/.8),-.55,.55);
   last={x,y:alpineHeight(x,z)+.88/Math.cos(tilt)+air,z,yaw:heading,tilt,speed,lean:steer,raceTime:elapsed,recovery,heading,launched,brake:!!input.brake,runId,equipment,air,landing};
   if(crossed&&(speed<.3||z>=finish+10)){mode='';return {...last,mode:'',finished:true};}return {...last,mode};
  }};
}
