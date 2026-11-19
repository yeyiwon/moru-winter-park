import * as T from './vendor/three.module.js';
import {createFireworkScore,fireworkConfig,fireworkRandom,fireworkPatterns} from './firework-score.js';
import {createCastleShow} from './castle-show.js';
export const fireworkTrailSamples=6;
const SPARKS=360,TAILS=fireworkTrailSamples,SLOTS=18;
export function createWinterFireworks(parent,{light=null}={}){
 const capacity=SPARKS*TAILS*SLOTS,geometry=new T.BufferGeometry(),arrays={position:new Float32Array(capacity*3),velocity:new Float32Array(capacity*3),timing:new Float32Array(capacity*4),design:new Float32Array(capacity*4),launch:new Float32Array(capacity*3),color:new Float32Array(capacity*3),spark:new Float32Array(capacity)};
 for(const [name,array]of Object.entries(arrays))geometry.setAttribute(name,new T.BufferAttribute(array,name==='spark'?1:['timing','design'].includes(name)?4:3).setUsage(T.DynamicDrawUsage));
 const uniforms={clock:{value:0},reduced:{value:0},pixelRatio:{value:1}};
 const material=new T.ShaderMaterial({uniforms,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:true,
 vertexShader:`attribute vec3 velocity;attribute vec4 timing;attribute vec4 design;attribute vec3 launch;attribute float spark;uniform float clock;uniform float reduced;uniform float pixelRatio;varying vec3 tint;varying float alpha;
 void main(){float age=clock-timing.x-timing.y;float flight=timing.z;float kind=design.x;vec3 p=position;alpha=0.;tint=color;float size=1.;
 if(age>=0.&&age<flight&&spark<1.5){float u=age/flight;p=mix(launch,position,vec3(u,2.*u-u*u,u));alpha=.85*exp(-timing.y*2.4);tint=mix(color,vec3(1.,.94,.8),.65);size=2.1;}
 else if(age>=flight+timing.w&&age<flight+design.z){float t=age-flight-timing.w;float dragRate=kind>1.5&&kind<2.5?.28:.48;float drag=(1.-exp(-t*dragRate))/dragRate;float gravity=kind>1.5&&kind<2.5?1.:1.6;p+=velocity*(drag+timing.w*.58);p.y-=gravity*t*t;p.x+=design.w*t+sin(t*.8+spark*.1)*t*.1;
 float fade=1.-smoothstep(design.z*.42,design.z,t);float twinkle=.72+.28*pow(.5+.5*sin(t*17.+spark*7.1-timing.y*12.),3.);if(kind>3.5&&kind<4.5)twinkle=.4+.6*pow(.5+.5*sin(t*19.+spark*11.7),4.);alpha=smoothstep(0.,.04,t)*fade*twinkle*exp(-timing.y*15.);size=mix(2.1,.6,clamp(timing.y/.13,0.,1.));tint=mix(color,vec3(1.,.82,.46),smoothstep(1.,design.z,t)*(kind>1.5&&kind<2.5?.65:.16));if(spark<.5&&t<.1){p=position;size=4.;alpha*=1.-reduced;}}
 // Tail endpoints die with their heads: no long shower after the burst.
 alpha*=1.-smoothstep(design.z*.55,design.z,clock-timing.x-flight);
 alpha*=mix(1.,.38,reduced);vec4 eye=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*eye;gl_PointSize=clamp(420.*pixelRatio*design.y/max(1.,-eye.z),1.4,5.8*pixelRatio)*size;if(alpha<.001)gl_Position=vec4(2.,2.,2.,1.);}`,
 fragmentShader:`varying vec3 tint;varying float alpha;void main(){float r=length(gl_PointCoord-.5)*2.;float a=(exp(-r*r*11.)+exp(-r*r*3.)*.32)*(1.-smoothstep(.72,1.,r))*alpha;if(a<.008)discard;gl_FragColor=vec4(tint*2.,a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 const points=new T.Points(geometry,material);points.name='winter-firework-shells';points.frustumCulled=false;points.visible=false;geometry.setDrawRange(0,0);parent.add(points);
 const castle=createCastleShow(parent),smokeGeo=new T.BufferGeometry(),smokeCount=SLOTS*6,smokePosition=new Float32Array(smokeCount*3),smokeData=new Float32Array(smokeCount*4),smokeColor=new Float32Array(smokeCount*3);
 smokeGeo.setAttribute('position',new T.BufferAttribute(smokePosition,3));smokeGeo.setAttribute('life',new T.BufferAttribute(smokeData,4));smokeGeo.setAttribute('color',new T.BufferAttribute(smokeColor,3));
 const smokeMat=new T.ShaderMaterial({uniforms,vertexColors:true,transparent:true,depthWrite:false,toneMapped:true,
 vertexShader:`attribute vec4 life;uniform float clock;uniform float reduced;uniform float pixelRatio;varying float alpha;varying vec3 tint;void main(){float t=clock-life.x;vec3 p=position+vec3(t*1.9+sin(t*.5+life.w)*1.5,t*.75,0.);vec4 eye=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*eye;gl_PointSize=clamp((life.z+max(0.,t)*1.7)*400.*pixelRatio/max(1.,-eye.z),1.,100.);alpha=smoothstep(0.,.5,t)*(1.-smoothstep(2.,life.y,t))*.085*(1.-reduced*.65);tint=mix(vec3(.17,.21,.29),color,.26);if(t<0.||t>life.y)gl_Position=vec4(2.,2.,2.,1.);}`,
 fragmentShader:`varying float alpha;varying vec3 tint;void main(){vec2 p=gl_PointCoord-.5;float a=exp(-dot(p,p)*16.)*(1.-smoothstep(.32,.5,length(p)))*alpha;if(a<.002)discard;gl_FragColor=vec4(tint,a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 const smoke=new T.Points(smokeGeo,smokeMat);smoke.name='firework-drifting-smoke';smoke.frustumCulled=false;smoke.visible=false;parent.add(smoke);
 const flashColor=new T.Color(),white=new T.Color('#fff4dc'),tint=new T.Color();let show=null,score=[],shellColors=[],previousAge=null,quality='high',active=false,key='',preparedSeed=0;
 function prepare(seed,musicId){score=createFireworkScore(seed,musicId);shellColors=score.map(s=>new T.Color(s.color));preparedSeed=seed;key='';}
 function pack(age,count){
  const visible=[];for(let i=0;i<score.length;i++){const s=score[i];if(age>=s.at&&age<s.at+s.flight+Math.max(s.life,6)+.15)visible.push(i);}
  const next=visible.join(',')+':'+count;if(next===key)return;key=next;let n=0,sn=0;
  for(const index of visible.slice(-SLOTS)){
   const shell=score[index],random=fireworkRandom((preparedSeed+Math.imul(index+1,2654435761))>>>0);
   for(let spark=0;spark<count;spark++){
    const sample=(spark*73)%SPARKS,a=sample*2.399963,y=1-2*(sample+.5)/SPARKS,r=Math.sqrt(1-y*y),speed=(19+random()*5)*shell.size;let vx=Math.cos(a)*r,vy=y,vz=Math.sin(a)*r;
    if(shell.pattern==='ring'||shell.pattern==='star'){const theta=sample/SPARKS*Math.PI*2,ring=shell.pattern==='star'?.68+.38*Math.cos(theta*5):(sample%2?.85:1.12);vx=Math.cos(theta)*ring;vy=Math.sin(theta)*Math.cos(shell.tilt)*ring;vz=Math.sin(theta)*Math.sin(shell.tilt)*ring+(shell.pattern==='star'?(random()-.5)*.38:0);}
    if(shell.pattern==='willow')vy=Math.abs(vy)*.42+.12;
    if(shell.pattern==='peony'){const radius=spark%4===0?.48+random()*.12:.85+random()*.15;vx*=radius;vy*=radius;vz*=radius;}
    const life=shell.life*(.88+random()*.12);tint.copy(shellColors[index]).lerp(white,spark%7===0?.48:0);
    for(let tail=0;tail<TAILS;tail++,n++){
     const k=n*3,j=n*4;arrays.position[k]=shell.x;arrays.position[k+1]=shell.y+shell.height;arrays.position[k+2]=shell.z;arrays.launch[k]=shell.launchX;arrays.launch[k+1]=shell.y;arrays.launch[k+2]=shell.launchZ;arrays.velocity[k]=vx*speed;arrays.velocity[k+1]=vy*speed;arrays.velocity[k+2]=vz*speed;arrays.timing[j]=shell.at;arrays.timing[j+1]=tail*(shell.pattern==='willow'?.032:.022);arrays.timing[j+2]=shell.flight;arrays.timing[j+3]=shell.pattern==='glitter'&&spark%3===0?.55:0;arrays.design[j]=fireworkPatterns.indexOf(shell.pattern);arrays.design[j+1]=.8+random()*.45;arrays.design[j+2]=life;arrays.design[j+3]=shell.wind;arrays.color[k]=tint.r;arrays.color[k+1]=tint.g;arrays.color[k+2]=tint.b;arrays.spark[n]=spark;
    }
   }
   for(let puff=0;puff<6&&sn<smokeCount;puff++,sn++){const launch=puff<3,u=(puff+1)/4;smokePosition.set([launch?shell.launchX+(shell.x-shell.launchX)*u:shell.x+(puff-4)*7,launch?shell.y+shell.height*u:shell.y+shell.height,shell.z],sn*3);smokeData.set([shell.at+(launch?shell.flight*u:shell.flight),6,launch?3:10,index+puff],sn*4);smokeColor.set(shellColors[index].toArray(),sn*3);}
  }
  for(const a of Object.values(geometry.attributes)){a.clearUpdateRanges();a.addUpdateRange(0,n*a.itemSize);a.needsUpdate=true;}geometry.setDrawRange(0,n);
  for(const a of Object.values(smokeGeo.attributes))a.needsUpdate=true;smokeGeo.setDrawRange(0,quality==='low'?Math.ceil(sn/2):sn);
 }
 function setShow(next){
  if(!next){show=null;previousAge=null;return;}
  if(show){if(next.id===show.id&&((next.revision||1)<(show.revision||1)||show.state==='stopped'&&(next.revision||1)<=(show.revision||1)))return;if(next.id!==show.id&&next.startsAt<=show.startsAt)return;}
  if(next.id!==show?.id){prepare(next.seed,next.musicId);previousAge=null;}show=next;
 }
 function update(now,{still=false,reduceFlash=false,interior=false,listener=null,pixelRatio=1}={}){
  const age=show?(now-show.startsAt)/1000:-1,duration=show?.endsAt===undefined?fireworkConfig.duration:(show.endsAt-show.startsAt)/1000;active=!!show&&['scheduled','playing'].includes(show.state)&&age>=0&&age<duration&&!interior;
  const soften=still||reduceFlash;points.visible=smoke.visible=active;castle.update(age,{active,still:soften,quality,musicId:show?.musicId,duration});globalThis.window?.labAudio?.show?.(!interior?show:null,now);
  if(!active){geometry.setDrawRange(0,0);smokeGeo.setDrawRange(0,0);key='';previousAge=age;return;}
  uniforms.clock.value=age;uniforms.reduced.value=soften?1:0;uniforms.pixelRatio.value=Math.min(2,pixelRatio);pack(age,soften?48:quality==='low'?96:quality==='medium'?216:360);
  if(light&&!soften&&listener){let weight=0;flashColor.setRGB(0,0,0);for(let i=0;i<score.length;i++){const shell=score[i],t=age-shell.at-shell.flight;if(t<0||t>1.5)continue;const distance=Math.hypot(listener.x-shell.x,listener.y-shell.y-shell.height,listener.z-shell.z),energy=Math.sin(Math.min(1,t/.16)*Math.PI/2)*Math.exp(-t*3.5)*.25/(1+(distance/230)**2);weight+=energy;flashColor.r+=shellColors[i].r*energy;flashColor.g+=shellColors[i].g*energy;flashColor.b+=shellColors[i].b*energy;}if(weight>0){flashColor.multiplyScalar(1/weight);light.color.lerp(flashColor,Math.min(.4,weight));light.intensity+=Math.min(.3,weight);}}
  if(listener&&previousAge!==null&&age>=previousAge&&age-previousAge<.5&&!soften)for(const shell of score){const distance=Math.hypot(listener.x-shell.x,listener.y-(shell.y+shell.height),listener.z-shell.z),delay=distance/343,gain=.6/(1+(distance/100)**2);if(distance>450)continue;for(const [at,kind]of [[shell.at,'firework-launch'],[shell.at+shell.flight+delay,'firework-burst'],[shell.at+shell.flight+delay+1.6,'firework-glitter']])if(previousAge<at&&age>=at)globalThis.window?.labAudio?.effect(kind,{gain});}
  previousAge=age;
 }
 return{root:points,castle,smoke,setShow,update,setQuality(q){quality=q;key='';},get active(){return active;},dispose(){geometry.dispose();material.dispose();smokeGeo.dispose();smokeMat.dispose();smoke.removeFromParent();castle.dispose();points.removeFromParent();show=null;score=[];}};
}
