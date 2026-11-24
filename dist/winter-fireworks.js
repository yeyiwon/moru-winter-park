import * as T from './vendor/three.module.js';
import {createFireworkScore,fireworkConfig,fireworkRandom,fireworkPatterns} from './firework-score.js';
import {fireworkShapes} from './firework-shapes.js';
import {createCastleShow} from './castle-show.js';
export const fireworkTrailSamples=6;
const SPARKS=360,TAILS=fireworkTrailSamples,SLOTS=24;
export function createWinterFireworks(parent,{light=null}={}){
 const capacity=SPARKS*TAILS*SLOTS,geometry=new T.BufferGeometry(),arrays={position:new Float32Array(capacity*3),velocity:new Float32Array(capacity*3),timing:new Float32Array(capacity*4),design:new Float32Array(capacity*4),launch:new Float32Array(capacity*3),color:new Float32Array(capacity*3),spark:new Float32Array(capacity),arc:new Float32Array(capacity)};
 for(const [name,array]of Object.entries(arrays))geometry.setAttribute(name,new T.BufferAttribute(array,['spark','arc'].includes(name)?1:['timing','design'].includes(name)?4:3).setUsage(T.DynamicDrawUsage));
 const uniforms={clock:{value:0},reduced:{value:0},pixelRatio:{value:1},glow:{value:2.1}};
 const material=new T.ShaderMaterial({uniforms,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:true,
 vertexShader:`attribute vec3 velocity;attribute vec4 timing;attribute vec4 design;attribute vec3 launch;attribute float spark;attribute float arc;uniform float clock;uniform float reduced;uniform float pixelRatio;uniform float glow;varying vec3 tint;varying float alpha;
 void main(){float age=clock-timing.x-timing.y;float flight=timing.z;float kind=design.x;vec3 p=position;alpha=0.;tint=color;float size=1.;
 if(arc!=0.&&age>=0.&&age<flight){if(spark<30.){float lag=spark*.018+timing.y*.5;float u=clamp((clock-timing.x-lag)/flight,0.,1.);p=mix(launch,position,u);p.y+=arc>0.?4.*arc*u*(1.-u):(position.y-launch.y)*u*(1.-u);
 alpha=smoothstep(0.,.025,u)*exp(-lag*4.);size=mix(2.8,.7,clamp(lag/.65,0.,1.));tint=mix(color,vec3(1.,.96,.85),.5);}}
 else if(kind>9.5&&kind<10.5&&age>=0.&&age<flight){if(spark<18.){float lag=spark*.022;float u=clamp((age-lag)/flight,0.,1.);p=mix(launch,position,vec3(u,2.*u-u*u,u));alpha=smoothstep(0.,.02,u)*exp(-lag*6.);tint=mix(color,vec3(1.),.6);size=mix(2.6,.65,spark/18.);}}
 else if(age>=0.&&age<flight&&spark<1.5){float u=age/flight;p=mix(launch,position,vec3(u,2.*u-u*u,u));p.x+=sin(u*3.141593)*design.w*8.;p.z+=sin(u*3.141593)*3.;alpha=.85*exp(-timing.y*2.4);tint=mix(color,vec3(1.,.94,.8),.65);size=kind>5.5&&kind<6.5?3.:2.1;}
 else if(age>=flight+timing.w&&age<flight+design.z){
 // Streak length is a property of the shell type: chrysanthemum, willow and double shells draw long tails, peony stays a clean dot.
 float trail=kind<.5?1.9:kind>1.5&&kind<2.5?2.6:kind>7.5&&kind<8.5?1.7:kind>3.5&&kind<4.5?1.5:1.;float shellRand=fract(sin(timing.x*12.9898)*43758.5453);float t=age-flight-timing.w-timing.y*(trail-1.);float dragRate=kind>1.5&&kind<2.5?.28:.48;float drag=(1.-exp(-t*dragRate))/dragRate;float gravity=kind>1.5&&kind<2.5?1.:1.6;p+=velocity*(drag+(kind>7.5?timing.w*.9:timing.w*.58));p.y-=gravity*t*t;if(kind>6.5&&kind<7.5)p.y-=4.5*t*t;p.x+=design.w*t+sin(t*.8+spark*.1)*t*.1;
 if(kind>8.5&&kind<9.5){p=position+velocity*(1.-exp(-t*2.4));p.y-=max(0.,t-2.)*.8;}
 if(kind>10.5&&kind<11.5){float angle=timing.w*5.8*design.w+mod(spark,3.)*2.094395+t*.7*design.w;float wheelAge=clock-timing.x-flight;float bloom=smoothstep(0.,3.5,wheelAge);float radius=1.2+4.*bloom+(11.+6.*bloom)*t;p=position+vec3(cos(angle)*radius,sin(angle)*radius,velocity.z*t);p.y-=t*t*.7;}
 float fade=1.-smoothstep(design.z*.42,design.z,t);float twinkle=.72+.28*pow(.5+.5*sin(t*17.+spark*7.1-timing.y*12.),3.);if(kind>3.5&&kind<4.5)twinkle=.4+.6*pow(.5+.5*sin(t*19.+spark*11.7),4.);alpha=smoothstep(0.,.04,t)*fade*twinkle*exp(-timing.y*15./trail);size=mix(2.1,.6,clamp(timing.y/.13,0.,1.));float lifeU=clamp(t/design.z,0.,1.);vec3 base=color;
 // About half of the peony, ring and double shells change colour together in mid-air.
 if(((kind>.5&&kind<1.5)||(kind>2.5&&kind<3.5)||(kind>7.5&&kind<8.5))&&shellRand>.5)base=mix(color,color.brg*1.08+.04,smoothstep(.36,.5,lifeU));
 tint=mix(base,vec3(1.,.82,.46),smoothstep(1.,design.z,t)*(kind>1.5&&kind<2.5?.65:kind<.5?.42:.06));tint=mix(tint,vec3(1.,.96,.86),exp(-t*6.)*.85);
 // Chrysanthemum and glitter shells end in a crackle. Never strobes when flashes are reduced.
 if((kind<.5||(kind>3.5&&kind<4.5))&&reduced<.5){float late=smoothstep(.5,.62,lifeU),pop=step(.42,fract(sin(spark*91.7+floor(clock*22.)*7.31)*43758.5453));alpha*=mix(1.,.25+pop*1.5,late);tint=mix(tint,vec3(1.,.95,.8),pop*.22*late);}if(spark<.5&&t<.1){p=position;size=4.;alpha*=1.-reduced;}}
 // Tail endpoints die with their heads: no long shower after the burst.
 alpha*=1.-smoothstep(design.z*.55,design.z,clock-timing.x-flight);
 if(kind>10.5&&kind<11.5&&age>=flight+timing.w){float t=age-flight-timing.w;alpha*=1.-smoothstep(.8,1.65,t);}
 // Every letter uses one clock, one lifetime and one opacity. No staggered
 // partial letter death: a quick burst opens the whole phrase, then scatters it.
 if(kind>9.5&&kind<10.5&&age>=flight){float t=clock-timing.x-flight;float opening=1.-pow(1.-clamp(t/.55,0.,1.),3.);p=position+velocity*opening;float spread=max(0.,t-.65);float fall=max(0.,t-.45);float angle=spark*2.399963;p+=vec3(cos(angle)*(5.+mod(spark,7.)),sin(angle)*1.8,sin(spark*1.7)*3.)*spread;p.y-=4.8*fall*fall;alpha=smoothstep(0.,.08,t)*(1.-smoothstep(.9,design.z,t));tint=color;size=2.;}
 alpha*=mix(1.,.38,reduced);vec4 eye=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*eye;gl_PointSize=clamp(420.*pixelRatio*design.y/max(1.,-eye.z),1.4,5.8*pixelRatio)*size*glow;if(alpha<.001)gl_Position=vec4(2.,2.,2.,1.);}`,
 fragmentShader:`uniform float glow;varying vec3 tint;varying float alpha;void main(){float r=length(gl_PointCoord-.5)*2.,q=r*glow;float core=exp(-q*q*11.),a=(core+exp(-q*q*3.)*.32+exp(-r*r*4.2)*.16*(glow-1.))*(1.-smoothstep(.72,1.,r))*alpha;if(a<.006)discard;gl_FragColor=vec4(mix(tint,vec3(1.,.97,.9),core*.55*step(1.01,glow))*2.,a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 const points=new T.Points(geometry,material);points.name='winter-firework-shells';points.frustumCulled=false;points.visible=false;geometry.setDrawRange(0,0);parent.add(points);
 const castle=createCastleShow(parent);
 const flashColor=new T.Color(),white=new T.Color('#fff4dc'),tint=new T.Color(),contrast=new T.Color();let show=null,score=[],shellColors=[],previousAge=null,quality='high',active=false,key='',preparedSeed=0,packedAge=-Infinity,nextPackAt=-Infinity,packedCount=0;
 function prepare(seed,musicId){score=createFireworkScore(seed,musicId);shellColors=score.map(s=>new T.Color(s.color));preparedSeed=seed;key='';}
 function pack(age,count){
  // Particle motion stays on the GPU. Revisit the score only at a shell birth,
  // expiry, quality change or clock seek, rather than allocating lists at 60 Hz.
  if(key&&count===packedCount&&age>=packedAge&&age<nextPackAt)return;
  packedAge=age;packedCount=count;nextPackAt=Infinity;
  const visible=[];for(let i=0;i<score.length;i++){const s=score[i],end=s.at+s.flight+Math.max(s.life,6)+.15;if(age<s.at)nextPackAt=Math.min(nextPackAt,s.at);else if(age<end){visible.push(i);nextPackAt=Math.min(nextPackAt,end);}}
  const next=visible.join(',')+':'+count;if(next===key)return;key=next;let n=0;
  for(const index of visible.slice(-SLOTS)){
   const shell=score[index],random=fireworkRandom((preparedSeed+Math.imul(index+1,2654435761))>>>0);
   const shape=fireworkShapes[shell.pattern],shellCount=shape?Math.max(216,shape.length):count;
   // Each shell picks one of three looks from its index and the shared seed, so every viewer sees the same variety.
   const variant=(index*7+(preparedSeed>>>4))%3;contrast.copy(shellColors[index]).offsetHSL(.42,0,.06);
   for(let spark=0;spark<shellCount;spark++){
    const sample=(spark*73)%SPARKS,a=sample*2.399963,y=1-2*(sample+.5)/SPARKS,r=Math.sqrt(1-y*y),speed=(19+random()*5)*shell.size;let vx=Math.cos(a)*r,vy=y,vz=Math.sin(a)*r;
    if(shell.pattern==='ring'||shell.pattern==='star'){const theta=sample/SPARKS*Math.PI*2,ring=shell.pattern==='star'?.68+.38*Math.cos(theta*5):(sample%2?.85:1.12);vx=Math.cos(theta)*ring;vy=Math.sin(theta)*Math.cos(shell.tilt)*ring;vz=Math.sin(theta)*Math.sin(shell.tilt)*ring+(shell.pattern==='star'?(random()-.5)*.38:0);}
    if(shell.pattern==='willow')vy=Math.abs(vy)*.42+.12;
    if(shell.pattern==='fountain'){vx*=.5;vz*=.45;vy=.6+random()*.85;}
    if(shell.pattern==='comet'){vx*=.18;vy*=.18;vz*=.18;}
    if(shell.pattern==='wheel'){vx=vy=0;vz=(random()-.5)*.06;}
    if(shell.pattern==='double'&&spark%3===0){vx*=.65;vy*=.65;vz*=.65;}
    if(shell.pattern==='peony'){const radius=spark%4===0?.48+random()*.12:.85+random()*.15;vx*=radius;vy*=radius;vz*=radius;}
    // Palm: the sparks gather into ten fronds that streak outwards at different speeds.
    if(shell.pattern==='chrysanthemum'&&variant===2){const arm=sample%10,ay=1-2*(arm+.5)/10,ar=Math.sqrt(1-ay*ay),aa=arm*2.399963+shell.tilt,reach=.5+.65*((sample*37)%100)/100;vx=(Math.cos(aa)*ar+vx*.05)*reach;vy=(ay+vy*.05)*reach;vz=(Math.sin(aa)*ar+vz*.05)*reach;}
    // Saturn: a tilted ring around a small coloured core.
    const core=shell.pattern==='ring'&&variant===1&&spark%3===0;if(core){vx=Math.cos(a)*r*.4;vy=y*.4;vz=Math.sin(a)*r*.4;}
    if(shape){const point=shape[Math.floor(spark/shellCount*shape.length)];vx=point[0];vy=point[1];vz=0;}
    const life=shell.pattern==='message'?shell.life:shell.life*(.88+random()*.12);tint.copy(shellColors[index]).lerp(white,shell.pattern==='wheel'&&spark%3===0?.72:spark%11===0?.28:0);
    if(core||(shell.pattern==='double'&&spark%3===0)||(shell.pattern==='peony'&&variant===1&&spark%4===0))tint.copy(contrast);else if(shell.pattern==='peony'&&variant===2&&spark%4===0)tint.set('#ffd98a');
    for(let tail=0;tail<(shell.pattern==='message'?1:TAILS);tail++,n++){
     const k=n*3,j=n*4;arrays.position[k]=shell.x;arrays.position[k+1]=shell.y+shell.height;arrays.position[k+2]=shell.z;arrays.launch[k]=shell.launchX;arrays.launch[k+1]=shell.y;arrays.launch[k+2]=shell.launchZ;const shapeSpeed=shape?(shell.pattern==='message'?25:19)*shell.size:speed;arrays.velocity[k]=vx*shapeSpeed;arrays.velocity[k+1]=vy*shapeSpeed;arrays.velocity[k+2]=vz*shapeSpeed;arrays.timing[j]=shell.at;arrays.timing[j+1]=tail*(shell.pattern==='willow'?.032:.022);arrays.timing[j+2]=shell.flight;arrays.timing[j+3]=shell.pattern==='wheel'?sample/SPARKS*3.5:shell.pattern==='heart'?spark/shellCount*.65:shell.pattern==='fountain'?random()*.9:shell.pattern==='double'&&spark%3===0?.65:shell.pattern==='glitter'&&spark%3===0?.55:0;arrays.design[j]=fireworkPatterns.indexOf(shell.pattern);arrays.design[j+1]=.8+random()*.45;arrays.design[j+2]=life;arrays.design[j+3]=shell.wind;arrays.color[k]=tint.r;arrays.color[k+1]=tint.g;arrays.color[k+2]=tint.b;arrays.spark[n]=spark;arrays.arc[n]=shell.arcHeight||(shell.fan?-1:0);
    }
   }
  }
  for(const a of Object.values(geometry.attributes)){a.clearUpdateRanges();a.addUpdateRange(0,n*a.itemSize);a.needsUpdate=true;}geometry.setDrawRange(0,n);
 }
 function setShow(next){
  if(!next){show=null;previousAge=null;return;}
  if(show){if(next.id===show.id&&((next.revision||1)<(show.revision||1)||show.state==='stopped'&&(next.revision||1)<=(show.revision||1)))return;if(next.id!==show.id&&next.startsAt<=show.startsAt)return;}
  if(next.id!==show?.id){prepare(next.seed,next.musicId);previousAge=null;}show=next;
 }
 function update(now,{still=false,reduceFlash=false,interior=false,listener=null,pixelRatio=1}={}){
  const age=show?(now-show.startsAt)/1000:-1,duration=show?.endsAt===undefined?fireworkConfig.duration:(show.endsAt-show.startsAt)/1000;active=!!show&&['scheduled','playing'].includes(show.state)&&age>=0&&age<duration&&!interior;
  const soften=still||reduceFlash;points.visible=active;castle.update(age,{active,still:soften,quality,musicId:show?.musicId,duration});
  if(!active){geometry.setDrawRange(0,0);key='';previousAge=age;return;}
  uniforms.clock.value=age;uniforms.reduced.value=soften?1:0;uniforms.pixelRatio.value=Math.min(2,pixelRatio);pack(age,soften?48:quality==='low'?96:quality==='medium'?216:360);
  if(light&&!soften&&listener){let weight=0;flashColor.setRGB(0,0,0);for(let i=0;i<score.length;i++){const shell=score[i],t=age-shell.at-shell.flight;if(t<0||t>1.5)continue;const distance=Math.hypot(listener.x-shell.x,listener.y-shell.y-shell.height,listener.z-shell.z),energy=Math.sin(Math.min(1,t/.16)*Math.PI/2)*Math.exp(-t*3.5)*.25/(1+(distance/230)**2);weight+=energy;flashColor.r+=shellColors[i].r*energy;flashColor.g+=shellColors[i].g*energy;flashColor.b+=shellColors[i].b*energy;}if(weight>0){flashColor.multiplyScalar(1/weight);light.color.lerp(flashColor,Math.min(.4,weight));light.intensity+=Math.min(.3,weight);}}
  if(listener&&previousAge!==null&&age>=previousAge&&age-previousAge<.5&&!soften)for(const shell of score){if(age<shell.at||previousAge>shell.at+shell.flight+3)continue;const distance=Math.hypot(listener.x-shell.x,listener.y-(shell.y+shell.height),listener.z-shell.z),delay=distance/343,gain=.6/(1+(distance/100)**2);if(distance>450)continue;const burst=shell.at+shell.flight+delay,glitter=burst+1.6;if(previousAge<shell.at&&age>=shell.at)globalThis.window?.labAudio?.effect('firework-launch',{gain});if(previousAge<burst&&age>=burst)globalThis.window?.labAudio?.effect('firework-burst',{gain});if(previousAge<glitter&&age>=glitter)globalThis.window?.labAudio?.effect('firework-glitter',{gain});}
  previousAge=age;
 }
 return{root:points,castle,setShow,update,setQuality(q){quality=q;key='';uniforms.glow.value=q==='low'?1:2.1;},get active(){return active;},dispose(){geometry.dispose();material.dispose();castle.dispose();points.removeFromParent();show=null;score=[];}};
}
