import * as T from './vendor/three.module.js';

// Every branch writes into one field, so junctions are a union rather than stacked strips.
export function createSnowPaths({root,snow,heightAt=()=>.09,contains=()=>true,deferBuild=false}){
 const samples=[],field=new Map(),step=.45;
 root.userData.snowPathSamples=samples;
 const material=new T.MeshStandardMaterial({color:snow.color.clone().lerp(new T.Color('#9eafad'),.72),roughness:1,metalness:0,transparent:true,opacity:.38,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,vertexColors:true});
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float trailAlpha; varying float vTrailAlpha; varying vec2 vTrailXZ;').replace('#include <begin_vertex>','#include <begin_vertex>\nvTrailAlpha=trailAlpha; vTrailXZ=position.xz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vTrailAlpha; varying vec2 vTrailXZ;').replace('#include <alphamap_fragment>','#include <alphamap_fragment>\nfloat grain=fract(sin(dot(floor(vTrailXZ*42.0),vec2(12.9898,78.233)))*43758.5453); diffuseColor.a*=vTrailAlpha*(.94+.06*grain);');
 };
 material.customProgramCacheKey=()=> 'compacted-snow-trail-v1';
 const walk=new T.Mesh(new T.BufferGeometry(),material);walk.name='compacted-snow-path';walk.userData.snowTrail=true;walk.receiveShadow=true;walk.renderOrder=1;root.add(walk);
 const key=(x,z)=>`${x}/${z}`;
 function stamp(a,b,r){
  const feather=.65,reach=r+feather+.16,dx=b.x-a.x,dz=b.z-a.z,len2=dx*dx+dz*dz;
  for(let iz=Math.floor((Math.min(a.z,b.z)-reach)/step);iz<=Math.ceil((Math.max(a.z,b.z)+reach)/step);iz++)for(let ix=Math.floor((Math.min(a.x,b.x)-reach)/step);ix<=Math.ceil((Math.max(a.x,b.x)+reach)/step);ix++){
   const x=ix*step,z=iz*step,t=len2?Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/len2)):0;
   const distance=Math.hypot(x-a.x-dx*t,z-a.z-dz*t),edge=r+.09*Math.sin(x*1.7+z*.7)+.05*Math.sin(z*2.3-x*.4);
   const f=Math.max(0,Math.min(1,(edge+feather-distance)/feather));if(f<=0)continue;
   if(!contains(x,z))continue;
   const alpha=f*f*(3-2*f),k=key(ix,iz),old=field.get(k);if(!old||alpha>old.alpha)field.set(k,{ix,iz,alpha});
  }
 }
 function rebuild(){
  const cells=new Set();for(const v of field.values())for(const [dx,dz]of [[0,0],[-1,0],[0,-1],[-1,-1]])cells.add(key(v.ix+dx,v.iz+dz));
  const pos=[],colors=[],alpha=[],uv=[],index=[],vertices=new Map();
  function vertex(ix,iz){const k=key(ix,iz);if(vertices.has(k))return vertices.get(k);const id=vertices.size,x=ix*step,z=iz*step;vertices.set(k,id);pos.push(x,heightAt(x,z)+.012,z);alpha.push(field.get(k)?.alpha||0);const tone=.98+.02*Math.sin(x*.71+z*.43)*Math.sin(z*.93-x*.17);colors.push(tone,tone,tone);uv.push(x*.1,z*.1);return id;}
  for(const cell of cells){const [ix,iz]=cell.split('/').map(Number);if(![[0,0],[1,0],[0,1],[1,1]].every(([dx,dz])=>contains((ix+dx)*step,(iz+dz)*step)))continue;const a=vertex(ix,iz),b=vertex(ix+1,iz),c=vertex(ix,iz+1),d=vertex(ix+1,iz+1);index.push(a,c,b,b,c,d);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setAttribute('trailAlpha',new T.Float32BufferAttribute(alpha,1));geometry.setIndex(index);geometry.computeVertexNormals();geometry.computeBoundingSphere();walk.geometry.dispose();walk.geometry=geometry;
 }
 function pave(points,width=2.6){
  const clean=points.filter((p,i)=>!i||Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1])>.02);if(clean.length<2)return;
  const curve=new T.CatmullRomCurve3(clean.map(([x,z])=>new T.Vector3(x,0,z))),length=curve.getLength(),count=Math.max(1,Math.ceil(length/.7));let previous=curve.getPointAt(0);
  samples.push({x:previous.x,z:previous.z,r:width/2+.12});
  for(let i=1;i<=count;i++){const p=curve.getPointAt(i/count);stamp(previous,p,width/2);samples.push({x:p.x,z:p.z,r:width/2+.12});previous=p;}
  if(!deferBuild)rebuild();return curve;
 }
 pave.flush=rebuild;return pave;
}
