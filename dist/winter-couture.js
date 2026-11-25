import * as T from './vendor/three.module.js';
import {dinoSuitMesh} from './dino-suit-mesh.js';

// Winter couture. Garments here are modelled assets: a low-poly mesh with its own UVs and maps baked
// from a detailed model. A worn garment is one mesh sharing geometry and material between every
// character, plus at most one child part on a spring, so wearing one costs two draw calls.

// ---------- dino hooded suit ----------
// The suit is a modelled asset, not built here: a low-poly garment with its own UVs whose folds,
// seams, stitching, quilting and contact shading were baked from a detailed mesh in Blender
// (see docs/dino-suit.md). This file only unpacks the mesh and gives it a short-pile material.
const FACE=new T.Vector3(0,.09,1).normalize(),FACE_UP=new T.Vector3().crossVectors(FACE,new T.Vector3(1,0,0)).normalize();
// Angular radius of the hood opening around the face; the same oval the asset was cut with.
function hoodOpening(alpha){const up=T.MathUtils.smoothstep(Math.sin(alpha),-.5,.5),rv=.335+.095*up;return 1/Math.sqrt((Math.cos(alpha)/.66)**2+(Math.sin(alpha)/rv)**2);}
const u16=text=>new Uint16Array(Uint8Array.from(atob(text),c=>c.charCodeAt(0)).buffer);
function unpack(part){
 const q=u16(part.position),position=new Float32Array(q.length),uvq=u16(part.uv),uv=new Float32Array(uvq.length);
 for(let i=0;i<q.length;i++){const k=i%3;position[i]=part.min[k]+q[i]/65535*(part.max[k]-part.min[k]);}
 for(let i=0;i<uvq.length;i++)uv[i]=uvq[i]/65535;
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(position,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setIndex(new T.BufferAttribute(u16(part.index),1));g.computeVertexNormals();g.computeBoundingSphere();return g;
}
// Short dense pile, lit the same way as Moru's own velvet body (broad sheen, a little self-light)
// so suit and character sit in one world: a fine nap under the baked folds and a restrained rim. The nap fades with distance so it never sparkles.
function plush(material,{rim='#f0f6e6',rimStrength=.1}={}){
 const rimColor=new T.Color(rim);
 material.onBeforeCompile=shader=>{
  shader.uniforms.coutureRim={value:rimColor};
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vPlushPos;').replace('#include <begin_vertex>','#include <begin_vertex>\nvPlushPos=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
uniform vec3 coutureRim;varying vec3 vPlushPos;
float plushHash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float plushNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(plushHash(i),plushHash(i+vec3(1,0,0)),f.x),mix(plushHash(i+vec3(0,1,0)),plushHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(plushHash(i+vec3(0,0,1)),plushHash(i+vec3(1,0,1)),f.x),mix(plushHash(i+vec3(0,1,1)),plushHash(i+vec3(1,1,1)),f.x),f.y),f.z);}`)
   .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
{float fine=1.-smoothstep(.25,.9,length(fwidth(vPlushPos))*190.);
float pile=plushNoise(vPlushPos*vec3(260.,95.,260.))*.55+plushNoise(vPlushPos*vec3(520.,210.,520.))*.45;
vec3 sx=dFdx(-vViewPosition),sy=dFdy(-vViewPosition),r1=cross(sy,normal),r2=cross(normal,sx);float det=dot(sx,r1);
normal=normalize(abs(det)*normal-sign(det)*(dFdx(pile)*r1+dFdy(pile)*r2)*.0016*fine);
diffuseColor.rgb*=mix(1.,.92+.16*pile,fine);}`)
   .replace('#include <opaque_fragment>',`outgoingLight+=coutureRim*pow(1.-abs(dot(normalize(vViewPosition),normal)),3.4)*${rimStrength.toFixed(3)};
#include <opaque_fragment>`);
 };
 material.customProgramCacheKey=()=>['plush',rim,rimStrength].join('|');material.userData.shared=true;return material;
}
const dinoMaterial=plush(new T.MeshPhysicalMaterial({color:'#8fa98b',roughness:1,emissive:'#000000',emissiveIntensity:.16,sheen:1,sheenColor:'#eaf3df',sheenRoughness:.78}));
// Node tests have no DOM: the geometry is always there, the two baked maps arrive in the browser.
if(typeof document!=='undefined'&&typeof document.createElementNS==='function'&&typeof navigator!=='undefined'){
 const load=(file,space,done)=>new T.TextureLoader().load(`./textures/${file}`,t=>{t.colorSpace=space;t.flipY=false;t.anisotropy=4;t.userData.shared=true;t.needsUpdate=true;done(t);dinoMaterial.needsUpdate=true;});
 load('dino-suit-color.webp',T.SRGBColorSpace,t=>{dinoMaterial.map=dinoMaterial.emissiveMap=t;dinoMaterial.color.set('#ffffff');dinoMaterial.emissive.set('#ffffff');});
 load('dino-suit-normal.webp',T.NoColorSpace,t=>{dinoMaterial.normalMap=t;dinoMaterial.normalMapType=T.ObjectSpaceNormalMap;});
}

// ---------- assembly ----------
// How much of its natural length a fur fibre keeps under the chosen garments: everything outside
// the hood opening lies flat under the suit.
export function coutureTuck(chosen){
 if(!chosen.includes('dino-hood'))return null;
 return p=>{const l=Math.hypot(p.x,p.y,p.z)||1,d=(p.x*FACE.x+p.y*FACE.y+p.z*FACE.z)/l,rho=Math.acos(Math.max(-1,Math.min(1,d))),alpha=Math.atan2((p.x*FACE_UP.x+p.y*FACE_UP.y+p.z*FACE_UP.z)/l,p.x/l);return rho>hoodOpening(alpha)-.05?.12:1;};
}
export const coutureIDs=['dino-hood'];
let shared=null;
const build=()=>shared||(shared={suit:unpack(dinoSuitMesh.suit),tail:unpack(dinoSuitMesh.tail)});
function settle(s,tx,tz,dt,stiff=60,damp=6){s.vx+=((tx-s.x)*stiff-s.vx*damp)*dt;s.vz+=((tz-s.z)*stiff-s.vz*damp)*dt;s.x+=s.vx*dt;s.z+=s.vz*dt;}
export function createCouture(){
 const geometry=build(),suit=new T.Mesh(geometry.suit,dinoMaterial);suit.name='dino-hood';suit.visible=false;suit.castShadow=true;
 const tail=new T.Mesh(geometry.tail,dinoMaterial);tail.name='dino-tail';tail.castShadow=true;tail.position.set(0,-.4,-.54);suit.add(tail);
 const items={'dino-hood':suit},wag={x:0,z:0,vx:0,vz:0};let lastTime=null,lastYaw=0;
 return {
  items,meshes:[suit],
  // A bath hides the suit and the ryokan robe replaces it.
  select(chosen,hidden=false,robed=false){suit.visible=!hidden&&!robed&&chosen.includes('dino-hood');},
  // The tail lags behind a walk, swings out of a turn and streams back in ski wind.
  pose({time=0,walking=false,phase=0,still=false,yaw=0,mode=''}={}){
   const dt=lastTime===null?0:Math.min(.05,Math.max(0,time-lastTime));lastTime=time;
   let turn=yaw-lastYaw;lastYaw=yaw;turn=Math.atan2(Math.sin(turn),Math.cos(turn));const spin=dt>0?T.MathUtils.clamp(turn/dt,-4,4):0,wind=mode==='ski'?1:mode==='lift'?.5:0;
   if(still)wag.x=wag.z=wag.vx=wag.vz=0;else settle(wag,(walking?.12:0)+wind*.2,-spin*.16+(walking?Math.sin(phase)*.2:Math.sin(time*1.3)*.05),dt);
   tail.rotation.set(-wag.x,wag.z,0);
  },
 };
}
