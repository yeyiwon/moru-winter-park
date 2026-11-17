// A small, permanent fill keeps painted ride interiors readable at a distance.
// It uses each part's authored color and never adds lights or flattens the whole model.
export function addLandmarkNightFill(material,intensity=.12){
 if(!material.emissive)return material;
 material.emissive.copy(material.color);material.emissiveIntensity=intensity;
 material.userData.lightingTheme='fixed';
 if(material.vertexColors){material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\ntotalEmissiveRadiance *= vColor.rgb;\n#endif');};material.customProgramCacheKey=()=> 'landmark-night-fill-v1';}
 return material;
}
