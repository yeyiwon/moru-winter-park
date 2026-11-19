import * as T from './vendor/three.module.js';
import {alpineHeight,alpineShift} from './resort-layout.js';

import {mountainDistance} from './mountain-layout.js';

const TRACK_LIMIT=1536,POWDER_LIMIT=144,LIFETIME=12,SPACING=.42;
const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));

export function createSkiTrails(scene){
  // Cross sections carry a raised snow lip; terrain heights are sampled for every segment.
  const positions=[],uv=[],indices=[],cross=[-1,-.76,-.48,0,.48,.76,1];
  for(let row=0;row<2;row++)for(let i=0;i<cross.length;i++){
    positions.push(cross[i],0,row);uv.push((cross[i]+1)/2,row);
    if(row===0&&i<cross.length-1)indices.push(i,i+1,i+7,i+1,i+8,i+7);
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
  const heights=new T.InstancedBufferAttribute(new Float32Array(TRACK_LIMIT*4),4),births=new T.InstancedBufferAttribute(new Float32Array(TRACK_LIMIT).fill(-99),1),strengths=new T.InstancedBufferAttribute(new Float32Array(TRACK_LIMIT),1);
  for(const [name,attribute] of [['trackHeights',heights],['trackBirth',births],['trackStrength',strengths]]){attribute.setUsage(T.DynamicDrawUsage);geometry.setAttribute(name,attribute);}
  const uniforms={time:{value:0}};
  const material=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,
    vertexShader:`attribute vec4 trackHeights;attribute float trackBirth;attribute float trackStrength;varying vec2 coord;varying float age;varying float strength;uniform float time;
      void main(){coord=uv;age=time-trackBirth;strength=trackStrength;vec4 p=instanceMatrix*vec4(position,1.);float edge=abs(uv.x-.5)*2.;float lip=exp(-pow((edge-.76)*12.,2.))*.024;p.y=mix(mix(trackHeights.x,trackHeights.y,uv.x),mix(trackHeights.z,trackHeights.w,uv.x),uv.y)+.016+lip;gl_Position=projectionMatrix*modelViewMatrix*p;}`,
    fragmentShader:`varying vec2 coord;varying float age;varying float strength;
      void main(){if(age<0.||age>=12.)discard;float edge=abs(coord.x-.5)*2.;float inside=1.-smoothstep(.48,.8,edge);float lip=exp(-pow((edge-.77)*14.,2.));float cut=1.-smoothstep(.86,1.,edge);float end=smoothstep(0.,.022,coord.y)*(1.-smoothstep(.978,1.,coord.y));float fade=1.-smoothstep(3.,12.,age);float grain=.94+.06*sin(coord.y*39.+coord.x*63.);vec3 snow=mix(vec3(.78,.86,.91),vec3(.48,.61,.7),inside*.75);snow=mix(snow,vec3(.98,.99,1.),lip*.9);float alpha=(.12+inside*.15+lip*.24)*cut*end*fade*strength*grain;gl_FragColor=vec4(snow,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
  const tracks=new T.InstancedMesh(geometry,material,TRACK_LIMIT);tracks.name='temporary-ski-tracks';tracks.frustumCulled=false;tracks.instanceMatrix.setUsage(T.DynamicDrawUsage);tracks.visible=false;scene.add(tracks);
  const powderGeometry=new T.PlaneGeometry(1,1),powderAlpha=new T.InstancedBufferAttribute(new Float32Array(POWDER_LIMIT),1);powderGeometry.setAttribute('powderAlpha',powderAlpha);
  const powderMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,
    vertexShader:`attribute float powderAlpha;varying vec2 coord;varying float opacity;void main(){coord=uv;opacity=powderAlpha;vec4 center=modelViewMatrix*instanceMatrix*vec4(0.,0.,0.,1.);float size=length(instanceMatrix[0].xyz);center.xy+=position.xy*size;gl_Position=projectionMatrix*center;}`,
    fragmentShader:`varying vec2 coord;varying float opacity;void main(){vec2 p=(coord-.5)*2.;float r=dot(p,p);float soft=exp(-r*3.5)*(1.-smoothstep(.55,1.,r));float fleck=.83+.17*sin(p.x*19.+sin(p.y*12.)*2.);gl_FragColor=vec4(.9,.96,1.,soft*opacity*fleck);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
  const powder=new T.InstancedMesh(powderGeometry,powderMaterial,POWDER_LIMIT);powder.name='ski-turn-powder';powder.frustumCulled=false;powder.visible=false;powder.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(powder);
  const particles=Array.from({length:POWDER_LIMIT},()=>({age:2,life:1,x:0,y:0,z:0,vx:0,vy:0,vz:0,radius:0}));
  const matrix=new T.Matrix4(),right=new T.Vector3(),forward=new T.Vector3(),up=new T.Vector3(0,1,0),scale=new T.Vector3();
  let previous=null,trackCursor=0,powderCursor=0,emission=0,trackCount=0,powderCount=0,lastTime=0,seed=193;
  const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
  const onSnow=(x,z)=>mountainDistance(x,z-alpineShift)<-1;

  function stamp(a,b,offset,width,strength,time){
    const length=Math.hypot(b.x-a.x,b.z-a.z);if(length<.015)return;
    const ax=a.x+Math.cos(a.yaw)*offset,az=a.z-Math.sin(a.yaw)*offset,bx=b.x+Math.cos(b.yaw)*offset,bz=b.z-Math.sin(b.yaw)*offset;
    const trackLength=Math.hypot(bx-ax,bz-az),angle=Math.atan2(bx-ax,bz-az),ux=Math.cos(angle),uz=-Math.sin(angle);
    right.set(ux,0,uz);forward.set(Math.sin(angle),0,Math.cos(angle));matrix.makeBasis(right,up,forward);scale.set(width/2,1,trackLength+.02);matrix.scale(scale);matrix.setPosition(ax,0,az);tracks.setMatrixAt(trackCursor,matrix);
    const half=width/2;heights.setXYZW(trackCursor,alpineHeight(ax-ux*half,az-uz*half),alpineHeight(ax+ux*half,az+uz*half),alpineHeight(bx-ux*half,bz-uz*half),alpineHeight(bx+ux*half,bz+uz*half));births.setX(trackCursor,time);strengths.setX(trackCursor,strength);trackCursor=(trackCursor+1)%TRACK_LIMIT;
  }
  function emit(state,board){
    const p=particles[powderCursor];powderCursor=(powderCursor+1)%POWDER_LIMIT;
    const side=Math.abs(state.lean)>.12?Math.sign(state.lean):(random()<.5?-1:1),rx=Math.cos(state.yaw),rz=-Math.sin(state.yaw),fx=Math.sin(state.yaw),fz=Math.cos(state.yaw),spread=side*(board?.34:.3),kick=.5+Math.abs(state.lean)*1.7+(state.brake?1.6:0);
    p.age=0;p.life=.48+random()*.55;p.x=state.x+rx*spread-fx*.3;p.z=state.z+rz*spread-fz*.3;p.y=alpineHeight(p.x,p.z)+.06;
    p.vx=rx*side*kick*(.5+random())-fx*state.speed*.1;p.vz=rz*side*kick*(.5+random())-fz*state.speed*.1;p.vy=.7+random()*.9+kick*.22;p.radius=.16+random()*.25;
  }
  function reset(){previous=null;emission=0;}
  return {
    get state(){return {trackCount,powderCount,trackCapacity:TRACK_LIMIT,powderCapacity:POWDER_LIMIT};},
    update(input){
      const {x,z,yaw=0,time=0,active=false,still=false}=input,dt=clamp(Number.isFinite(input.dt)?input.dt:0,0,.1),speed=clamp(input.speed||0,0,30),lean=clamp(input.lean||0,-1,1),gear=input.gear==='board'||input.gear==='snowboard'?'board':'ski';
      if(time<lastTime){births.array.fill(-99);births.needsUpdate=true;for(const p of particles)p.age=p.life;reset();}lastTime=time;uniforms.time.value=time;
      const riding=active&&!still&&!(input.air>0)&&Number.isFinite(x)&&Number.isFinite(z)&&Number.isFinite(yaw)&&speed>.8&&onSnow(x,z);
      if(!riding)reset();
      else {
        const next={x,z,yaw,gear},distance=previous?Math.hypot(x-previous.x,z-previous.z):0;
        if(!previous||previous.gear!==gear||distance>Math.max(3,speed*dt*3+1.2))previous=next;
        else if(distance>=SPACING){
          const count=Math.floor(distance/SPACING),delta=Math.atan2(Math.sin(yaw-previous.yaw),Math.cos(yaw-previous.yaw)),start=previous;let a=start;
          for(let j=1;j<=count;j++){const t=j*SPACING/distance,b={x:start.x+(x-start.x)*t,z:start.z+(z-start.z)*t,yaw:start.yaw+delta*t,gear};if(gear==='board')stamp(a,b,0,.62,.9+Math.abs(lean)*.2,time);else for(const side of [-1,1])stamp(a,b,side*.27,.17,.85+Math.abs(lean)*.25,time);a=b;}
          previous=a;tracks.instanceMatrix.needsUpdate=true;heights.needsUpdate=true;births.needsUpdate=true;strengths.needsUpdate=true;
        }
        const intensity=Math.max(0,Math.abs(lean)-.12)+(input.brake?.85:0);emission+=intensity*Math.min(1,speed/8)*dt*58;
        for(let count=Math.min(12,Math.floor(emission));count>0;count--){emit({x,z,yaw,speed,lean,brake:input.brake},gear==='board');emission--;}
      }
      trackCount=0;for(let i=0;i<TRACK_LIMIT;i++)if(births.getX(i)>=0&&time-births.getX(i)<LIFETIME)trackCount++;tracks.visible=trackCount>0;
      powderCount=0;
      for(let i=0;i<POWDER_LIMIT;i++){
        const p=particles[i];p.age+=dt;if(p.age>=p.life||still){powderAlpha.setX(i,0);continue;}
        p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vy-=3.5*dt;p.vx*=Math.exp(-dt*1.4);p.vz*=Math.exp(-dt*1.4);
        const life=p.age/p.life,radius=p.radius*(1+life*1.7);matrix.makeScale(radius,radius,radius);matrix.setPosition(p.x,p.y,p.z);powder.setMatrixAt(i,matrix);powderAlpha.setX(i,.54*(1-life)**1.5);powderCount++;
      }
      powder.visible=powderCount>0;powder.instanceMatrix.needsUpdate=true;powderAlpha.needsUpdate=true;
    }
  };
}
