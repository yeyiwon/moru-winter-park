import * as T from './vendor/three.module.js';
import {createFireworkScore,fireworkConfig,fireworkRandom,fireworkPatterns} from './firework-score.js';
export const fireworkTrailSamples=12;
const SPARKS=240,TAILS=fireworkTrailSamples,SHELLS=26;
export function createWinterFireworks(parent){
 const capacity=SPARKS*TAILS*SHELLS,geometry=new T.BufferGeometry(),arrays={position:new Float32Array(capacity*3),velocity:new Float32Array(capacity*3),timing:new Float32Array(capacity*4),design:new Float32Array(capacity*4),color:new Float32Array(capacity*3),spark:new Float32Array(capacity)};
 for(const [name,array]of Object.entries(arrays))geometry.setAttribute(name,new T.BufferAttribute(array,name==='spark'?1:['timing','design'].includes(name)?4:3));
 const uniforms={clock:{value:0},reduced:{value:0},pixelRatio:{value:1}};
 const material=new T.ShaderMaterial({uniforms,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,
 vertexShader:`attribute vec3 velocity;attribute vec4 timing;attribute vec4 design;attribute float spark;uniform float clock;uniform float reduced;uniform float pixelRatio;varying vec3 tint;varying float alpha;
 void main(){float age=clock-timing.x-timing.y;float flight=timing.z;float kind=design.x;vec3 p=position;alpha=0.;tint=color;float size=1.;
 if(age>=0.&&age<flight&&spark<.5){float u=age/flight;p.y+=timing.w*(2.*u-u*u);p.x+=sin(u*3.14159)*1.25;alpha=.9*exp(-timing.y*2.2);tint=mix(color,vec3(1.,.94,.8),.65);}
 else if(age>=flight&&age<flight+design.z){float t=age-flight;float dragRate=kind>1.5&&kind<2.5?.19:.46;float drag=(1.-exp(-t*dragRate))/dragRate;float gravity=kind>1.5&&kind<2.5?1.15:1.8;p+=velocity*drag;p.y+=timing.w-gravity*t*t;p.x+=design.w*t+sin(t*.8+spark*.1)*t*.1;
 float fade=1.-smoothstep(design.z*.42,design.z,t);float twinkle=.68+.32*pow(.5+.5*sin(t*17.+spark*7.1-timing.y*12.),3.);if(kind>3.5)twinkle=.32+.68*pow(.5+.5*sin(t*19.+spark*11.7),4.);alpha=smoothstep(0.,.06,t)*fade*twinkle*exp(-timing.y*2.5);size=mix(1.,.48,clamp(timing.y/.85,0.,1.));tint=mix(color,vec3(1.,.82,.46),smoothstep(1.,design.z,t)*(kind>1.5&&kind<2.5?.75:.22));if(spark<.5&&t<.12){p=position+vec3(0.,timing.w,0.);size=5.;alpha*=1.-reduced;}}
 alpha*=mix(1.,.32,reduced);vec4 eye=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*eye;gl_PointSize=clamp(470.*pixelRatio*design.y/max(1.,-eye.z),1.2,5.*pixelRatio)*size;if(alpha<.001)gl_Position=vec4(2.,2.,2.,1.);}`,
 fragmentShader:`varying vec3 tint;varying float alpha;void main(){float r=length(gl_PointCoord-.5)*2.;float a=(exp(-r*r*15.)+exp(-r*r*4.)*.32)*(1.-smoothstep(.72,1.,r))*alpha;if(a<.008)discard;gl_FragColor=vec4(tint*2.1,a);}`});
 const points=new T.Points(geometry,material);points.name='winter-firework-shells';points.frustumCulled=false;points.visible=false;geometry.setDrawRange(0,0);parent.add(points);
 let show=null,score=[],previousAge=null,quality='high',active=false;
 function prepare(seed){
  score=createFireworkScore(seed);const random=fireworkRandom(seed),colors=score.map(s=>new T.Color(s.color));let n=0;
  for(let spark=0;spark<SPARKS;spark++)for(let j=0;j<score.length;j++){
   const shell=score[j],sample=(spark*73)%SPARKS,a=sample*2.399963,y=1-2*(sample+.5)/SPARKS,r=Math.sqrt(1-y*y),speed=(19+random()*5)*shell.size;
   let vx=Math.cos(a)*r,vy=y,vz=Math.sin(a)*r;
   if(shell.pattern==='ring'){const theta=sample/SPARKS*Math.PI*2,ring=sample%2?.85:1.12;vx=Math.cos(theta)*ring;vy=Math.sin(theta)*Math.cos(shell.tilt)*ring;vz=Math.sin(theta)*Math.sin(shell.tilt)*ring;}
   if(shell.pattern==='willow')vy=Math.abs(vy)*.55+.18;
   if(shell.pattern==='peony'){const radius=.85+random()*.15;vx*=radius;vy*=radius;vz*=radius;}
   const tint=colors[j].clone().lerp(new T.Color('#fff4dc'),spark%7===0?.48:0);
   for(let tail=0;tail<TAILS;tail++,n++){
    arrays.position.set([shell.x,shell.y,shell.z],n*3);arrays.velocity.set([vx*speed,vy*speed,vz*speed],n*3);arrays.timing.set([shell.at,tail*(shell.pattern==='willow'?.085:.065),shell.flight,shell.height],n*4);arrays.design.set([fireworkPatterns.indexOf(shell.pattern),.8+random()*.45,shell.life,shell.wind],n*4);arrays.color.set([tint.r,tint.g,tint.b],n*3);arrays.spark[n]=spark;
   }
  }
  for(const attribute of Object.values(geometry.attributes))attribute.needsUpdate=true;
 }
 function setShow(next){if(!next){show=null;previousAge=null;return;}if(next.id!==show?.id){prepare(next.seed);previousAge=null;}show=next;}
 function update(now,{still=false,reduceFlash=false,interior=false,listener=null,pixelRatio=1}={}){
  const age=show?(now-show.startsAt)/1000:-1;active=!!show&&['scheduled','playing'].includes(show.state)&&age>=0&&age<fireworkConfig.duration&&!interior;
  points.visible=active;if(!active){geometry.setDrawRange(0,0);previousAge=age;return;}
  const soften=still||reduceFlash;uniforms.clock.value=age;uniforms.reduced.value=soften?1:0;uniforms.pixelRatio.value=Math.min(2,pixelRatio);
  const count=soften?48:quality==='low'?72:quality==='medium'?144:240;geometry.setDrawRange(0,count*SHELLS*TAILS);
  // Crossing events, not timers: seeking/late joining never replays a backlog of sounds.
  if(listener&&previousAge!==null&&age>=previousAge&&age-previousAge<.5&&!soften)for(const shell of score){
   const distance=Math.hypot(listener.x-shell.x,listener.y-(shell.y+shell.height),listener.z-shell.z),delay=distance/343,gain=.65/(1+(distance/100)**2);
   if(distance>450)continue;
   for(const [at,kind]of [[shell.at,'firework-launch'],[shell.at+shell.flight+delay,'firework-burst'],[shell.at+shell.flight+delay+1.6,'firework-glitter']])if(previousAge<at&&age>=at)window.labAudio?.effect(kind,{gain});
  }
  previousAge=age;
 }
 return{root:points,setShow,update,setQuality(q){quality=q;},get active(){return active;},dispose(){geometry.dispose();material.dispose();points.removeFromParent();show=null;score=[];}};
}
