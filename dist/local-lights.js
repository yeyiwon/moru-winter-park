import * as T from './vendor/three.module.js';
// Keep every lamp mesh, halo and snow reflection. Only the expensive real-time
// point-light calculations are pooled; a fixed count avoids shader recompiles.
export function createLocalLights(scene,{limit=6}={}){
 const sources=[],slots=[],point=new T.Vector3(),sphere=new T.Sphere(),frustum=new T.Frustum(),projection=new T.Matrix4();
 function register(root){root.traverse(light=>{if(light.isPointLight&&light.layers.isEnabled(0)&&!slots.some(s=>s.light===light)&&!sources.some(s=>s.light===light)){sources.push({light,mask:light.layers.mask,position:new T.Vector3(),score:0});light.layers.disable(0);}for(const lamp of light.userData.lampGlow||[]){if(lamp.theme==='fixed'||sources.some(s=>s.lamp===lamp))continue;sources.push({lamp,anchor:light,local:new T.Vector3(lamp.x||0,lamp.y,lamp.z||0),light:{color:lamp.color||new T.Color('#ffd5a1'),intensity:lamp.power||10,distance:lamp.range||10,decay:2,parent:light},position:new T.Vector3(),score:0});}});}
 function unregister(root){for(let i=sources.length-1;i>=0;i--){const source=sources[i];let p=source.light;while(p&&p!==root)p=p.parent;if(!p)continue;if(source.light.layers)source.light.layers.mask=source.mask;for(const slot of slots){if(slot.next===source)slot.next=null;if(slot.source===source){slot.source=null;slot.light.intensity=0;}}sources.splice(i,1);}}
 register(scene);
 for(let i=0;i<limit;i++){const light=new T.PointLight('#ffffff',0,1,2);light.name='pooled-local-light-'+i;scene.add(light);slots.push({light,source:null,next:null});}
 let elapsed=Infinity;
 function update(dt,camera,focus){
  elapsed+=dt;
  if(elapsed>=.2){
   elapsed=0;camera.updateMatrixWorld();frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
   const candidates=sources.filter(source=>{const light=source.light;for(let p=light;p;p=p.parent)if(p.visible===false)return false;if(light.intensity<=0)return false;if(source.lamp){source.position.copy(source.local).applyMatrix4(source.anchor.matrixWorld);light.intensity=(source.lamp.power||10)*(source.lamp.gain??1);}else source.position.setFromMatrixPosition(light.matrixWorld);const range=light.distance||80;sphere.set(source.position,range);if(!frustum.intersectsSphere(sphere))return false;const distance=source.position.distanceToSquared(focus);if(distance>(range+50)**2)return false;source.score=light.intensity/(4+distance)*(slots.some(slot=>slot.source===source)?1.15:1);return true;}).sort((a,b)=>b.score-a.score).slice(0,limit);
   for(const slot of slots)slot.next=candidates.includes(slot.source)?slot.source:null;
   for(const source of candidates)if(!slots.some(slot=>slot.next===source))slots.find(slot=>!slot.next).next=source;
  }
  for(const slot of slots){
   const light=slot.light;let visible=true;for(let p=slot.source?.light;p;p=p.parent)if(p.visible===false)visible=false;
   // A pooled light moves only after fading out. Persistent bulb/ground shaders
   // remain lit at every distance; this adds nearby surface detail without a pop.
   if(!visible)light.intensity=0;
   if(slot.source!==slot.next){light.intensity*=Math.exp(-Math.max(0,dt)*12);if(light.intensity>.025)continue;slot.source=slot.next;light.intensity=0;}
   const source=slot.source?.light;if(!source){light.intensity=0;continue;}
   if(slot.source.lamp)point.copy(slot.source.local).applyMatrix4(slot.source.anchor.matrixWorld);else point.setFromMatrixPosition(source.matrixWorld);
   light.position.copy(point);light.color.copy(source.color);light.intensity+=(source.intensity-light.intensity)*Math.min(1,Math.max(0,dt)*7);light.distance=source.distance;light.decay=source.decay;
  }
 }
 return{update,register,unregister,get sourceCount(){return sources.length;},get activeCount(){return slots.filter(slot=>slot.light.intensity>0).length;},dispose(){for(const source of sources)if(source.light.layers)source.light.layers.mask=source.mask;for(const slot of slots)scene.remove(slot.light);sources.length=0;}};
}
