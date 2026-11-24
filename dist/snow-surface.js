// Shared snow shading for every walkable snow surface: soft wind-drift relief, a cool tint in the
// hollows and view-dependent crystal glints. It patches the existing MeshStandardMaterial, so
// lighting, shadows, fog and vertex colours keep working and no texture or extra pass is added.
// Only bright (snow-coloured) fragments are affected, which lets rock and forest share the material.
export function applySnowSurface(material,{relief=1,glint=1}={}){
 material.onBeforeCompile=shader=>{
  shader.uniforms.snowRelief={value:relief};shader.uniforms.snowGlint={value:glint};
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSnowWorld;').replace('#include <project_vertex>','#include <project_vertex>\nvSnowWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vSnowWorld;uniform float snowRelief;uniform float snowGlint;
float snowHash(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}
float snowNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(snowHash(i),snowHash(i+vec2(1.,0.)),f.x),mix(snowHash(i+vec2(0.,1.)),snowHash(i+vec2(1.,1.)),f.x),f.y);}
// Drifts are stretched along the prevailing wind so they read as wind-laid snow, not blotches.
float snowDrift(vec2 p){vec2 w=vec2(p.x*.82+p.y*.57,(p.y*.82-p.x*.57)*2.4);return snowNoise(w*.07)*.62+snowNoise(w*.23+17.)*.28+snowNoise(p*.9+41.)*.1;}
float snowMask=0.;float snowHeight=.5;float snowFade=1.;vec3 snowSky=vec3(0.);`)
  .replace('#include <color_fragment>',`#include <color_fragment>
snowMask=smoothstep(.5,.72,dot(diffuseColor.rgb,vec3(.3,.5,.2)));snowFade=1.-smoothstep(90.,260.,length(cameraPosition-vSnowWorld));
snowHeight=snowDrift(vSnowWorld.xz);
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*mix(vec3(.80,.87,.98),vec3(1.05,1.04,1.02),smoothstep(.28,.72,snowHeight)),snowMask*snowRelief*mix(.35,1.,snowFade));`)
  .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
{float e=.35;vec2 g=vec2(snowDrift(vSnowWorld.xz+vec2(e,0.))-snowHeight,snowDrift(vSnowWorld.xz+vec2(0.,e))-snowHeight)/e;
normal=normalize(normal-(viewMatrix*vec4(g.x,0.,g.y,0.)).xyz*1.9*snowMask*snowRelief*snowFade);}`)
  .replace('#include <opaque_fragment>',`{vec2 cell=vSnowWorld.xz*26.;vec2 id=floor(cell);float aa=1.-smoothstep(.35,1.1,max(fwidth(cell.x),fwidth(cell.y)));
float r=snowHash(id);vec3 facet=normalize(vec3(snowHash(id+7.3)-.5,.55,snowHash(id+13.7)-.5));vec3 toEye=normalize(cameraPosition-vSnowWorld);
float spark=pow(max(dot(facet,toEye),0.),90.)*step(.82,r)*smoothstep(.5,.15,length(fract(cell)-.5));
outgoingLight*=1.+spark*9.*aa*snowMask*snowGlint;}
// Cold skylight keyed to the slope gives distant snowfields their form at night instead of one flat silhouette.
{vec3 nw=normalize((vec4(normal,0.)*viewMatrix).xyz);snowSky=vec3(.05,.08,.155)*(.25+.75*max(dot(nw,normalize(vec3(-.35,.72,.58))),0.))*snowMask;outgoingLight+=snowSky;}
#include <opaque_fragment>`)
  // Haze hides far terrain; let moonlit slopes still read through it so the mountain keeps its shape.
  .replace('#include <fog_fragment>','#include <fog_fragment>\n#ifdef USE_FOG\ngl_FragColor.rgb+=snowSky*1.5*fogFactor;\n#endif');
 };
 material.customProgramCacheKey=()=>'snow-surface-3-'+relief+'-'+glint;
 return material;
}
