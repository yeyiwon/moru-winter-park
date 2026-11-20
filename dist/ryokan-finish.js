// World-space grain survives batching; no texture downloads or per-frame CPU work.
export function ryokanFinish(material,kind='wood'){
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vRyokanFinish;').replace('#include <begin_vertex>','#include <begin_vertex>\nvRyokanFinish=(modelMatrix*vec4(position,1.)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 vRyokanFinish;
   float rfHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
   float rfNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(rfHash(i),rfHash(i+vec3(1,0,0)),f.x),mix(rfHash(i+vec3(0,1,0)),rfHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(rfHash(i+vec3(0,0,1)),rfHash(i+vec3(1,0,1)),f.x),mix(rfHash(i+vec3(0,1,1)),rfHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
  `).replace('#include <color_fragment>',`#include <color_fragment>
   vec3 rp=vRyokanFinish;
   ${kind==='paper'?`float fiber=rfNoise(rp*vec3(110.,16.,83.))*.6+rfNoise(rp*vec3(19.,130.,31.))*.4;diffuseColor.rgb*=.88+.18*fiber;`:kind==='plaster'?`float lime=rfNoise(rp*11.)*.65+rfNoise(rp*70.)*.35;diffuseColor.rgb*=.9+.14*lime;`:kind==='tatami'?`float weave=sin(rp.x*210.)*sin(rp.z*103.);float straw=rfNoise(rp*vec3(46.,1.,4.));diffuseColor.rgb*=.88+.04*weave+.16*straw;`:kind==='wood'?`float grain=sin(rp.x*77.+sin(rp.z*.7+rp.y*.2)*4.+rfNoise(rp*1.8)*5.);float pore=rfNoise(rp*vec3(35.,3.,4.));diffuseColor.rgb*=.94+.025*grain+.08*pore;`:`float stone=rfNoise(rp*2.)*.55+rfNoise(rp*9.)*.3+rfNoise(rp*36.)*.15;diffuseColor.rgb*=.76+stone*.4;`}
  `);
 };
 material.customProgramCacheKey=()=>`ryokan-${kind}-v57`;
 return material;
}
