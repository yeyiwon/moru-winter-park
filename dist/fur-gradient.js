import {Color} from './vendor/three.module.js';
// Dye is evaluated in character-local space, so it follows turns and poses.
// Uniform changes preserve compiled shaders and the existing fibre instances.
export function createFurGradient(materials){
 const uniforms={furDyeTop:{value:new Color()},furDyeBottom:{value:new Color()},furDyeEnabled:{value:0}};
 for(const material of materials){
  material.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,uniforms);
   shader.vertexShader='varying float vFurDye;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    vec4 dyePosition=vec4(transformed,1.0);
    #ifdef USE_INSTANCING
     dyePosition=instanceMatrix*dyePosition;
    #endif
    vFurDye=smoothstep(-0.60,0.62,dyePosition.y);`);
   shader.fragmentShader='uniform vec3 furDyeTop;\nuniform vec3 furDyeBottom;\nuniform float furDyeEnabled;\nvarying float vFurDye;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`if(furDyeEnabled>0.5)diffuseColor.rgb=mix(furDyeBottom,furDyeTop,vFurDye);
    #include <color_fragment>`).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
    if(furDyeEnabled>0.5)totalEmissiveRadiance=mix(furDyeBottom,furDyeTop,vFurDye)*0.16;`);
  };
  material.customProgramCacheKey=()=>'winter-fur-dye-v1';
 }
 return {update(bottom,top){uniforms.furDyeBottom.value.set(bottom);uniforms.furDyeTop.value.set(top||bottom);uniforms.furDyeEnabled.value=top?1:0;}};
}
