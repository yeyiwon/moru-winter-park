import * as T from './vendor/three.module.js';
// Keep every lamp mesh, halo and snow reflection. Only the expensive real-time
// point-light calculations are pooled; a fixed count avoids shader recompiles.
export function createLocalLights(scene,{limit=6}={}){
 const sources=[],slots=[],point=new T.Vector3(),sphere=new T.Sphere(),frustum=new T.Frustum(),projection=new T.Matrix4();
 function register(root){root.traverse(light=>{if(light.isPointLight&&light.layers.isEnabled(0)&&!slots.some(s=>s.light===light)&&!sources.some(s=>s.light===light)){sources.push({light,mask:light.layers.mask,position:new T.Vector3(),score:0});light.layers.disable(0);}});}
 function unregister(root){for(let i=sources.length-1;i>=0;i--){const source=sources[i];let p=source.light;while(p&&p!==root)p=p.parent;if(!p)continue;source.light.layers.mask=source.mask;for(const slot of slots)if(slot.source===source){slot.source=null;slot.light.intensity=0;}sources.splice(i,1);}}
 register(scene);
 for(let i=0;i<limit;i++){const light=new T.PointLight('#ffffff',0,1,2);light.name='pooled-local-light-'+i;scene.add(light);slots.push({light,source:null});}
 let elapsed=Infinity;
 function update(dt,camera,focus){
  elapsed+=dt;
  if(elapsed>=.2){
   elapsed=0;camera.updateMatrixWorld();frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
   const candidates=sources.filter(source=>{const light=source.light;for(let p=light;p;p=p.parent)if(!p.visible)return false;if(light.intensity<=0)return false;source.position.setFromMatrixPosition(light.matrixWorld);const range=light.distance||80;sphere.set(source.position,range);if(!frustum.intersectsSphere(sphere))return false;const distance=source.position.distanceToSquared(focus);if(distance>(range+50)**2)return false;source.score=light.intensity/(4+distance)*(slots.some(slot=>slot.source===source)?1.15:1);return true;}).sort((a,b)=>b.score-a.score).slice(0,limit);
   for(const slot of slots)if(!candidates.includes(slot.source))slot.source=null;
   for(const source of candidates)if(!slots.some(slot=>slot.source===source))slots.find(slot=>!slot.source).source=source;
  }
  for(const slot of slots){const light=slot.light,source=slot.source?.light;if(!source){light.intensity=0;continue;}point.setFromMatrixPosition(source.matrixWorld);light.position.copy(point);light.color.copy(source.color);light.intensity=source.intensity;light.distance=source.distance;light.decay=source.decay;}
 }
 return{update,register,unregister,get sourceCount(){return sources.length;},get activeCount(){return slots.filter(slot=>slot.light.intensity>0).length;},dispose(){for(const source of sources)source.light.layers.mask=source.mask;for(const slot of slots)scene.remove(slot.light);sources.length=0;}};
}
