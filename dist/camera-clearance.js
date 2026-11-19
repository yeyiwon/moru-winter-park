import * as T from './vendor/three.module.js';
import {nearestCameraSurface} from './camera-raycast.js';
// Sweep the near-plane footprint, rather than a single point, through actual scene meshes.
export function createCameraClearance(){
 const ray=new T.Raycaster(),direction=new T.Vector3(),right=new T.Vector3(),up=new T.Vector3(0,1,0),origin=new T.Vector3(),end=new T.Vector3(),box=new T.Box3();
 const boxes=new WeakMap(),faded=new Map();let safeDistance=0,lastMode='',tick=0,limit=Infinity;
 function visible(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;}
 function restore(o,record){o.material=record.original;for(const m of record.clones)m.dispose();faded.delete(o);}
 function update(camera,focus,objects,dt,{mode='',near=.22,minDistance=2.5,maxRecoverySpeed=Infinity}={}){
  const desired=camera.position.clone(),length=desired.distanceTo(focus);if(length<.01)return;
  direction.subVectors(desired,focus).normalize();right.crossVectors(direction,up).normalize();
  const changed=lastMode!==mode;lastMode=mode;
  if(changed||tick++%3===0){
   limit=length;const obscuring=new Set();ray.near=near;ray.far=length+.35;
   const candidates=objects.filter(o=>{if(!visible(o)||o.userData.cameraIgnore)return false;let local;if(o.isInstancedMesh){if(!o.boundingBox)o.computeBoundingBox();local=o.boundingBox;}else{local=boxes.get(o.geometry);if(!local){o.geometry.computeBoundingBox();local=o.geometry.boundingBox?.clone();if(local)boxes.set(o.geometry,local);}}if(!local)return false;box.copy(local).applyMatrix4(o.matrixWorld).expandByScalar(.3);return box.distanceToPoint(focus)<length&&box.max.y>focus.y-.8;});
   for(const [side,height]of [[0,0],[-.28,0],[.28,0],[0,.22]]){
    origin.copy(focus).addScaledVector(right,side);origin.y+=height;ray.set(origin,direction);
    for(const hit of candidates.map(o=>nearestCameraSurface(o,ray)).filter(Boolean).sort((a,b)=>a.distance-b.distance)){
     if(hit.distance>length+.25)break;
     const o=hit.object,materials=Array.isArray(o.material)?o.material:[o.material];
     if(materials.every(m=>m.isShaderMaterial||m.opacity<.05))continue;
     // Only tagged cabin panels and lift supports dissolve; shared scene materials stay untouched.
     if((o.userData.ferrisCameraFade||o.userData.rideCameraFade&&(!o.userData.cameraFadeMode||o.userData.cameraFadeMode===mode))&&(mode==='lift'||hit.distance<minDistance+1.2)){obscuring.add(o);continue;}
     limit=Math.min(limit,Math.max(.8,hit.distance-.42));break;
    }
   }
   for(const o of obscuring)if(!faded.has(o)){const original=o.material,clones=(Array.isArray(original)?original:[original]).map(m=>{const clone=m.clone();clone.transparent=true;clone.depthWrite=false;return clone;});o.material=Array.isArray(original)?clones:clones[0];faded.set(o,{original,clones,target:.16});}
   for(const [o,r]of faded)r.target=obscuring.has(o)?.16:1;
  }
  // Retreat quickly at contact, ease back out after the obstruction clears.
  if(!safeDistance||changed)safeDistance=Math.min(length,limit);
  const goal=Math.min(length,limit),blend=1-Math.exp(-Math.max(0,dt)*(goal<safeDistance?30:3.2));const change=(goal-safeDistance)*blend;safeDistance+=change>0?Math.min(change,maxRecoverySpeed*Math.max(0,dt)):change;
  // Never leave the near plane behind the wall while interpolation catches up.
  safeDistance=Math.min(safeDistance,limit);end.copy(focus).addScaledVector(direction,Math.max(.8,safeDistance));camera.position.copy(end);
  for(const [o,r]of faded){for(const m of r.clones)m.opacity+=(r.target-m.opacity)*(1-Math.exp(-dt*9));if(r.target===1&&r.clones.every(m=>m.opacity>.995))restore(o,r);}
 }
 return{update,reset(){safeDistance=0;limit=Infinity;lastMode='';for(const [o,r]of faded)restore(o,r);},get fadedCount(){return faded.size;}};
}
