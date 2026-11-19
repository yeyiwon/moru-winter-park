// User intent is kept separate from collision clearance and temporary framing.
export const cameraDefaults=Object.freeze({yaw:.33,pitch:.48,distance:16.5,fov:50,focusHeight:.45,interiorYaw:.5,interiorPitch:.65,interiorDistance:15});
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const angleDelta=(to,from)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));

// A temporary composition must move its focus and lens together. Independent
// easing made the view pivot around the tree while the zoom was still catching up.
export function createCameraTransition(){
 let from=null,elapsed=0;
 return{
  get active(){return !!from;},
  begin(focus,view){from={focus:{...focus},view:{...view}};elapsed=0;},
  cancel(){from=null;},
  step(focus,view,dt){
   if(!from)return false;
   elapsed+=Math.max(0,dt);const t=Math.min(1,elapsed/2),blend=t*t*t*(t*(t*6-15)+10);
   for(const key of ['x','y','z'])focus[key]=from.focus[key]+(focus[key]-from.focus[key])*blend;
   for(const key of ['pitch','distance'])view[key]=from.view[key]+(view[key]-from.view[key])*blend;
   view.yaw=from.view.yaw+angleDelta(view.yaw,from.view.yaw)*blend;
   if(t===1)from=null;
   return true;
  }
 };
}

export function createCameraPolicy(){
 let requested={yaw:cameraDefaults.yaw,pitch:cameraDefaults.pitch,distance:cameraDefaults.distance},manualYaw=false,context=null,outside=null,mode='',skiAuto=false,treeOffset=0,treeView=null,revision=0,carouselManual=false;
 const indoorViews=new Map(),resolved={...cameraDefaults,automaticYaw:false};
 const copy=()=>({view:{...requested},manualYaw});
 function restore(saved){requested={...saved.view};manualYaw=saved.manualYaw;}
 function setMode(next,renderedYaw=requested.yaw){
  next=next||'';if(next===mode)return;
  // An automatic ski heading becomes the neutral viewing side on dismount.
  // Explicit user yaw is never rewritten by an activity transition.
  if(mode==='ski'&&skiAuto&&!manualYaw&&Number.isFinite(renderedYaw))requested.yaw=renderedYaw;
  mode=next;carouselManual=false;skiAuto=mode==='ski'&&!manualYaw;
 }
 function adoptCarouselView(){if(mode!=='carousel'||carouselManual)return;requested.distance=Math.max(24,requested.distance);requested.pitch=Math.min(.16,requested.pitch);carouselManual=true;}
 return {
  orbit(dx,dy,renderedYaw=requested.yaw){
   if(!Number.isFinite(dx)||!Number.isFinite(dy))return;adoptCarouselView();
   if(treeView){requested={...requested,...treeView};treeView=null;treeOffset=0;}
   if(dx){if(skiAuto)requested.yaw=renderedYaw;manualYaw=true;skiAuto=false;requested.yaw-=dx*.004;}
   requested.pitch=clamp(requested.pitch+dy*.003,-.95,1.08);revision++;
  },
  zoom(amount,renderedDistance){
   if(!Number.isFinite(amount))return;adoptCarouselView();
   if(treeView){requested={...requested,...treeView};treeView=null;treeOffset=0;}
   if(treeOffset){requested.distance=Number.isFinite(renderedDistance)?renderedDistance:requested.distance+treeOffset;treeOffset=0;}
   requested.distance=clamp(requested.distance+amount,context?5.5:8,context?24:64);revision++;
  },
  reset(){requested={yaw:context?cameraDefaults.interiorYaw:cameraDefaults.yaw,pitch:context?cameraDefaults.interiorPitch:cameraDefaults.pitch,distance:context?cameraDefaults.interiorDistance:cameraDefaults.distance};manualYaw=false;carouselManual=false;skiAuto=mode==='ski';treeOffset=0;treeView=null;revision++;},
  setContext(next){
   next=next||null;if(next===context)return;
   if(context)indoorViews.set(context,copy());else outside=copy();
   if(next){const saved=indoorViews.get(next);if(saved)restore(saved);else{requested={yaw:cameraDefaults.interiorYaw,pitch:cameraDefaults.interiorPitch,distance:cameraDefaults.interiorDistance};manualYaw=false;}}
   else if(outside){restore(outside);outside=null;}
   context=next;mode='';carouselManual=false;skiAuto=false;treeOffset=0;treeView=null;
  },
  setMode,
  beginTree(framing){if(!context){if(framing)treeView={yaw:framing.yaw,pitch:framing.pitch,distance:clamp(framing.distance,8,64)};else treeOffset=Math.min(3,requested.distance*.16);}},
  endTree(){treeOffset=0;treeView=null;},
  view({mode:next=mode,heading=0,renderedYaw=requested.yaw}={}){
   setMode(next,renderedYaw);
   Object.assign(resolved,requested,{distance:requested.distance+treeOffset,fov:cameraDefaults.fov,automaticYaw:mode==='ski'&&skiAuto});
   if(mode==='carousel'&&!carouselManual){resolved.distance=Math.max(24,requested.distance);resolved.pitch=Math.min(.16,requested.pitch);}
   if(treeView)Object.assign(resolved,treeView);
   if(resolved.automaticYaw&&Number.isFinite(heading))resolved.yaw=heading+Math.PI;
   return resolved;
  },
  snapshot(){return {...requested,fov:cameraDefaults.fov,context,manualYaw,revision,treeOffset};}
 };
}

export function smoothCameraAngle(current,wanted,dt,{automatic=false}={}){
 const step=angleDelta(wanted,current)*(1-Math.exp(-Math.max(0,dt)*9));
 return current+(automatic?clamp(step,-dt*1.6,dt*1.6):step);
}

export function followCameraHeight(current,wanted,dt,mode=''){
 if(!Number.isFinite(current))return wanted;
 const delta=wanted-current,deadZone=['lift','ferris','ski'].includes(mode)?.015:.08;
 if(Math.abs(delta)<=deadZone)return current;
 const rate=mode==='ski'?10:['lift','ferris'].includes(mode)?7:3;
 const step=(delta-Math.sign(delta)*deadZone)*(1-Math.exp(-Math.max(0,dt)*5));
 return current+clamp(step,-rate*dt,rate*dt);
}

export function cameraSubjectFocus(position,{groundY=position.y,mode='',view=null}={},out={}){
 const paired=mode==='ferris'||mode==='lift';
 out.x=paired&&Number.isFinite(view?.focus?.x)?view.focus.x:position.x;
 out.z=paired&&Number.isFinite(view?.focus?.z)?view.focus.z:position.z;
 out.y=(mode&&mode!=='summit'&&mode!=='ski'?position.y:groundY)+cameraDefaults.focusHeight;
 // The carousel's authored focus height cancels the horse's vertical bob only.
 if(mode==='carousel'&&Number.isFinite(view?.lookHeight))out.y=position.y+1.2+view.lookHeight;
 // A look-ahead focus can put the camera in front of the skier when terrain
 // retracts the viewing ray. Keep the rider centred and use yaw for direction.
 return out;
}

export function cameraOrbitFocus(subject,view,out={}){
 out.x=subject.x;out.z=subject.z;out.y=subject.y+Math.max(0,-Math.sin(view.pitch)*view.distance);return out;
}

export function cameraOrbitPosition(focus,view,out={}){
 const horizontal=Math.cos(view.pitch)*view.distance;
 out.x=focus.x+Math.sin(view.yaw)*horizontal;out.y=focus.y+Math.sin(view.pitch)*view.distance;out.z=focus.z+Math.cos(view.yaw)*horizontal;
 return out;
}

export function constrainCameraFocusToRoom(focus,room){
 if(!room)return focus;
 // Walkable avatar origins can be closer to walls than the camera's near plane.
 // A small inward focus margin leaves room for the ray without tilting it.
 focus.x=clamp(focus.x,room.x-room.rx+1.4,room.x+room.rx-1.4);
 focus.z=clamp(focus.z,room.z-room.rz+1.4,room.z+room.rz-1.4);
 focus.y=clamp(focus.y,(room.floor||0)+.65,room.ceiling-.7);return focus;
}

// Shorten the same viewing ray at room boundaries. Do not tilt the view or edit
// requested zoom when a low ceiling or wall requires less physical camera room.
export function constrainCameraToRoom(focus,position,room){
 if(!room)return position;
 const dx=position.x-focus.x,dy=position.y-focus.y,dz=position.z-focus.z;let scale=1;
 const lower={x:room.x-room.rx+1,y:(room.floor||0)+.55,z:room.z-room.rz+1},upper={x:room.x+room.rx-1,y:room.ceiling-.45,z:room.z+room.rz-1};
 for(const key of ['x','y','z']){const delta=position[key]-focus[key];if(delta>0)scale=Math.min(scale,(upper[key]-focus[key])/delta);else if(delta<0)scale=Math.min(scale,(lower[key]-focus[key])/delta);}
 scale=clamp(scale,0,1);
 // The observatory has a curved roof below its rectangular room ceiling near
 // the edge. Resolve that existing roof on the same ray before final clamping.
 if(room.id==='museum'){
  const aboveRoof=along=>{const r=Math.hypot(focus.x+dx*along-room.x,focus.z+dz*along-room.z);return focus.y+dy*along>5.5+Math.sqrt(Math.max(0,21.6**2-r*r));};
  if(aboveRoof(scale)){let low=0,high=scale;for(let i=0;i<16;i++){const mid=(low+high)/2;if(aboveRoof(mid))high=mid;else low=mid;}scale=low;}
 }
 position.x=focus.x+dx*scale;position.y=focus.y+dy*scale;position.z=focus.z+dz*scale;return position;
}

// Terrain can retract a camera, but never raises it into a new automatic pitch.
export function constrainCameraToTerrain(focus,position,heightAt,samples=10){
 const dx=position.x-focus.x,dy=position.y-focus.y,dz=position.z-focus.z,length=Math.hypot(dx,dy,dz),startClearance=clamp(focus.y-heightAt(focus.x,focus.z)-.05,.02,.6);let previous=0;
 // A low seated focus is allowed to begin below the full camera clearance.
 // Grow the margin gradually; otherwise even flat ground collapses a low view.
 const blocked=along=>focus.y+dy*along<heightAt(focus.x+dx*along,focus.z+dz*along)+Math.min(.6,startClearance+along*length*.04);
 for(let i=1;i<=samples;i++){
  const along=i/samples;
  if(blocked(along)){
   let low=previous,high=along;
   for(let j=0;j<5;j++){const middle=(low+high)/2;if(blocked(middle))high=middle;else low=middle;}
   position.x=focus.x+dx*low;position.y=focus.y+dy*low;position.z=focus.z+dz*low;break;
  }
  previous=along;
 }
 return position;
}
