import * as T from './vendor/three.module.js';
// Only explicitly tagged outdoor fixtures participate. Character paint, sky,
// landmark windows, tree ornaments and the ryokan retain their own art direction.
export function createLightingThemeManager(scene){
 const colors=new Set(),gains=[],seen=new Set(),current=new T.Color('#ffd5a1'),target=current.clone();let intensity=1,targetIntensity=1,settled=false;
 scene.traverse(object=>{
  for(const lamp of object.userData.lampGlow||[]){lamp.color=new T.Color(lamp.color||'#ffd5a1');if(lamp.theme==='fixed')continue;colors.add(lamp.color);gains.push(value=>lamp.gain=value);}
  if(object.isPointLight&&object.userData.lightingTheme==='personal'){colors.add(object.color);const power=object.intensity;gains.push(value=>object.intensity=power*value);}
  for(const material of object.material?(Array.isArray(object.material)?object.material:[object.material]):[]){if(seen.has(material)||material.userData.lightingTheme!=='personal')continue;seen.add(material);
   if(material.color)colors.add(material.color);if(material.emissive){colors.add(material.emissive);const base=material.emissiveIntensity;gains.push(value=>material.emissiveIntensity=base*value);}if(material.uniforms?.lightingColor)colors.add(material.uniforms.lightingColor.value);
   if(material.uniforms?.lightingGain)gains.push(value=>material.uniforms.lightingGain.value=value);
  }
 });
 function apply(){for(const color of colors)color.copy(current);for(const set of gains)set(intensity);}
 return{set(color,brightness=1){target.set(color);targetIntensity=T.MathUtils.clamp(brightness,.55,1.5);settled=false;},update(dt){if(settled)return;const factor=1-Math.exp(-Math.min(.1,Math.max(0,dt))*7);current.lerp(target,factor);intensity+=(targetIntensity-intensity)*factor;if(Math.abs(current.r-target.r)+Math.abs(current.g-target.g)+Math.abs(current.b-target.b)<.0003&&Math.abs(intensity-targetIntensity)<.0003){current.copy(target);intensity=targetIntensity;settled=true;}apply();},get count(){return colors.size;},get color(){return current;}};
}
