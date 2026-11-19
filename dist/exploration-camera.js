import * as T from './vendor/three.module.js';
import {treeLayout} from './tree-layout.js';
import {fireworkConfig} from './firework-score.js';
export const explorationView=Object.freeze({yaw:.2,pitch:Math.PI*25/180,distance:14,fov:50});
export function treeFraming(player,yaw,aspect,dockFraction=.25){
 const pitch=.12,fov=55,up=new T.Vector3(-Math.sin(yaw)*Math.sin(pitch),Math.cos(pitch),-Math.cos(yaw)*Math.sin(pitch));
 const outward=new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)),right=new T.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 const focus=new T.Vector3(treeLayout.x,0,treeLayout.z),half=Math.tan(fov*Math.PI/360),bottom=Math.max(.05,1-2*dockFraction),delta=new T.Vector3();
 // Use the tapered canopy, not a full-width box at the narrow tree tip.
 const points=[];for(const t of [0,.25,.5,.75,1])for(let i=0;i<12;i++){const radius=t===1?1.1:treeLayout.radius*(1-t*.94);points.push(new T.Vector3(treeLayout.x+Math.cos(i*Math.PI/6)*radius,t*(treeLayout.height+1),treeLayout.z+Math.sin(i*Math.PI/6)*radius));}
 points.push(new T.Vector3(player.x,player.y-.9,player.z),new T.Vector3(player.x,player.y+1,player.z));
 let distance=Infinity,bestHeight=12;
 // Shift framing vertically into the free viewport before increasing distance.
 for(let height=-8;height<=18;height+=.25){focus.y=height;let fit=20;for(const point of points){delta.subVectors(point,focus);const depth=delta.dot(outward),vertical=delta.dot(up);fit=Math.max(fit,depth+Math.abs(delta.dot(right))/(half*aspect*.9),depth+Math.abs(vertical)/(half*(vertical>=0?.9:bottom)));}if(fit<distance){distance=fit;bestHeight=height;}}
 focus.y=bestHeight;
 return{yaw,pitch,distance,fov,focus};
}
export function createExplorationCamera(camera,{clearance,surfaceHeight,constrainPosition,mobile=false,sensitivity=1}={}){
 const state={...explorationView,distance:mobile?16:14},goal={...state},focus=new T.Vector3(),aim=new T.Vector3(),desired=new T.Vector3(),look=new T.Vector3(),rider=new T.Vector3();
 let initialized=false,mode='',manual=false,restore=null,tree=null,treeRestore=null,watch=null;
 const snapshot=()=>({...goal});
 function restoreView(value){if(value)for(const key of Object.keys(state))if(Number.isFinite(value[key]))goal[key]=value[key];}
 function cancelWatch(restorePrevious=false){if(watch&&restorePrevious)restoreView(watch.previous);watch=null;}
 function userInput(){manual=true;tree=null;cancelWatch(false);}
 return{
  state,goal,focus,get yaw(){return state.yaw;},get watching(){return !!watch;},
  setSensitivity(value){sensitivity=T.MathUtils.clamp(value,.4,2);},
  orbit(dx,dy){userInput();goal.yaw-=T.MathUtils.clamp(dx,-160,160)*.003*sensitivity;goal.pitch=T.MathUtils.clamp(goal.pitch+T.MathUtils.clamp(dy,-160,160)*.0025*sensitivity,-1.3,1.18);},
  zoom(amount){userInput();goal.distance=T.MathUtils.clamp(goal.distance+amount,mode==='lift'?14:4,mode==='lift'?38:60);},
  place(player,{interior=false}={}){this.endTree(true);cancelWatch(true);if(restore)restoreView(restore);restore=null;mode='';manual=false;if(interior)goal.distance=9;else goal.distance=mobile?16:14;focus.set(player.x,player.y+.65,player.z);initialized=true;clearance?.reset();},
  beginTree(player,{dockFraction=.25,still=false}={}){if(treeRestore)return;cancelWatch(true);treeRestore=snapshot();if(still)return;tree=treeFraming(player,goal.yaw,camera.aspect,dockFraction);restoreView(tree);manual=false;},
  resizeTree(player,dockFraction){if(!tree)return;tree=treeFraming(player,goal.yaw,camera.aspect,dockFraction);restoreView(tree);},
  endTree(restorePrevious=true){tree=null;if(restorePrevious)restoreView(treeRestore);treeRestore=null;},
  watchShow(show,player){if(!show)return;this.endTree(true);cancelWatch(true);watch={id:show.id,previous:snapshot()};const dx=-player.x,dz=-84-player.z;goal.yaw=Math.atan2(-dx,-dz);goal.pitch=T.MathUtils.clamp(-Math.atan2(105-player.y,Math.hypot(dx,dz)),-1.3,-.12);goal.fov=55;manual=false;},
  update(dt,{player,groundY,ride=null,activity=null,interior=null,walking=false,occluders=[],show=null,now=0}={}){
   if(watch&&(!show||show.id!==watch.id||!['scheduled','playing'].includes(show.state)||now>=show.startsAt+fireworkConfig.duration*1000))cancelWatch(true);
   if(walking){tree=null;cancelWatch(false);}
   const nextMode=ride?.mode||activity?.kind||'';
   if(nextMode!==mode){
    if(!mode&&nextMode)restore=snapshot();
    if(mode&&!nextMode){restoreView(restore);restore=null;}
    mode=nextMode;manual=false;
    const view=ride?.view||activity;
    if(view){for(const key of ['yaw','pitch','distance','fov'])if(Number.isFinite(view[key]))goal[key]=view[key];}
    else if(mode==='summit'){goal.distance=18;goal.pitch=.4;}
    if(interior)goal.distance=Math.min(goal.distance,11);
   }
   const skiing=ride?.mode==='ski';
   if(skiing&&!manual&&!watch){goal.yaw=(ride.heading??ride.yaw)+Math.PI;goal.pitch=.48;goal.distance=13;goal.fov=52;}
   const height=ride?player.y:(groundY??player.y);
   aim.set(ride?.view?.focus?.x??player.x,height+.65+(activity?.lookHeight??ride?.view?.lookHeight??0),ride?.view?.focus?.z??player.z);
   if(skiing&&!manual&&!watch){const h=ride.heading??ride.yaw;aim.x+=Math.sin(h)*5;aim.z+=Math.cos(h)*5;}
   if(tree){aim.copy(tree.focus);}
   if(!initialized){focus.copy(aim);initialized=true;}
   const blend=1-Math.exp(-dt*6);focus.x+=(aim.x-focus.x)*blend;focus.z+=(aim.z-focus.z)*blend;focus.y+=(aim.y-focus.y)*(1-Math.exp(-dt*(ride?.mode==='lift'?6:4)));
   // Rotation settles promptly, independent of walking direction and frame rate.
   const response=1-Math.exp(-dt*18);state.yaw+=Math.atan2(Math.sin(goal.yaw-state.yaw),Math.cos(goal.yaw-state.yaw))*response;state.pitch+=(goal.pitch-state.pitch)*response;state.distance+=(goal.distance-state.distance)*(1-Math.exp(-dt*5));state.fov+=(goal.fov-state.fov)*(1-Math.exp(-dt*5));
   const horizontal=Math.cos(state.pitch)*state.distance;
   desired.set(focus.x+Math.sin(state.yaw)*horizontal,focus.y+Math.sin(state.pitch)*state.distance,focus.z+Math.cos(state.yaw)*horizontal);
   desired.y=Math.max(desired.y,surfaceHeight(desired.x,desired.z)+.9);camera.position.copy(desired);
   rider.set(player.x,height+.45,player.z);
   clearance?.update(camera,tree?focus:rider,occluders,dt,{mode:tree?'tree':interior||mode||'walk',near:tree?treeLayout.radius+1:.22,maxRecoverySpeed:tree?Infinity:6,minDistance:['lift','ferris','carousel'].includes(mode)?4:2.5});
   constrainPosition?.(camera.position);
   look.copy(focus);
   // Raising the view changes gaze, never places the camera below the ground.
   if(state.pitch<0)look.y=camera.position.y-Math.tan(state.pitch)*Math.hypot(camera.position.x-focus.x,camera.position.z-focus.z);
   camera.lookAt(look);if(Math.abs(camera.fov-state.fov)>.01){camera.fov=state.fov;camera.updateProjectionMatrix();}
  }
 };
}
