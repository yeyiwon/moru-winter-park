import * as T from './vendor/three.module.js';

// A fixed pool serves entry/exit splashes. Walking emits bounded wave uniforms only.
export function createOnsenResponse(parent,waters){
 const count=32,g=new T.BufferGeometry(),origin=new T.Float32BufferAttribute(new Float32Array(count*4),4),velocity=new T.Float32BufferAttribute(new Float32Array(count*3),3);
 g.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(count*3),3));g.setAttribute('aOrigin',origin);g.setAttribute('aVelocity',velocity);
 for(let i=0;i<count;i++)origin.setW(i,-100);
 const time={value:0},m=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time},vertexShader:`uniform float time;attribute vec4 aOrigin;attribute vec3 aVelocity;varying float vAlpha;void main(){float age=time-aOrigin.w;vec3 p=aOrigin.xyz+aVelocity*max(0.,age);p.y-=2.8*max(0.,age)*max(0.,age);vAlpha=age>=0.&&age<.7&&p.y>.015?(1.-age/.7)*.55:0.;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(22./max(1.,-mv.z),1.,4.);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(.78,.88,.85,exp(-d*d*3.)*(1.-smoothstep(.6,1.,d))*vAlpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 const droplets=new T.Points(g,m);droplets.name='onsen-entry-exit-droplets';droplets.frustumCulled=false;droplets.visible=false;parent.add(droplets);
 let last=null,lastEmission=0,lastSplash=-100,cursor=0,quality='high';
 function splash(p,t){lastSplash=t;for(let i=0,n=quality==='low'?6:12;i<n;i++){const a=i/n*Math.PI*2,s=.4+(i%3)*.1;origin.setXYZW(cursor,p.x,.045,p.z,t);velocity.setXYZ(cursor,Math.cos(a)*s,.8+(i%4)*.12,Math.sin(a)*s);cursor=(cursor+1)%count;}origin.needsUpdate=velocity.needsUpdate=true;}
 return{root:droplets,setQuality(q){quality=q;},update(t,still,p){if(still)return;time.value=t;droplets.visible=t-lastSplash<.75;
  const found=p?.mode==='bath'&&p.y<.8?waters.find(w=>((p.x-w.basin.x)/w.basin.rx)**2+((p.z-w.basin.z)/w.basin.rz)**2<.93):null;
  if(last&&p&&Math.hypot(p.x-last.x,p.z-last.z)>8){last.water.clear();last=null;}
  if(found&&(!last||last.water!==found.water)){found.water.ripple(p.x,p.z,.8);splash(p,t);lastEmission=t;}
  else if(found&&last&&t-lastEmission>.24){const dx=p.x-last.x,dz=p.z-last.z,d=Math.hypot(dx,dz);if(d>.09){found.water.ripple(p.x,p.z,Math.min(.65,.25+d),dx/Math.max(.01,d),dz/Math.max(.01,d));lastEmission=t;}}
  if(last&&!found){last.water.ripple(last.x,last.z,.6);splash(last,t);last=null;}
  if(found&&(!last||t===lastEmission))last={x:p.x,z:p.z,water:found.water};
 },dispose(){g.dispose();m.dispose();droplets.removeFromParent();}};
}
