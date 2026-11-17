import * as T from './vendor/three.module.js';
import {skyAt} from './world-time.js';
export function createWinterSky(scene,hemi,sun,fill,world){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.strokeStyle='#ffffff';ctx.lineWidth=2.2;ctx.lineCap='round';ctx.lineJoin='round';ctx.translate(64,64);
 // Sixfold dendritic arms retain their silhouette while the finer barbs catch the light up close.
 for(let i=0;i<6;i++){ctx.save();ctx.rotate(i*Math.PI/3);ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(0,-52);for(const [y,w]of [[-19,10],[-31,12],[-42,8]]){for(const side of [-1,1]){ctx.moveTo(0,y);ctx.lineTo(side*w,y+w*.85);ctx.moveTo(side*w*.55,y+w*.47);ctx.lineTo(side*(w*.55+3.5),y+w*.47-1.2);}}ctx.moveTo(-4,-47);ctx.lineTo(0,-52);ctx.lineTo(4,-47);ctx.stroke();ctx.restore();}
 ctx.beginPath();for(let i=0;i<=6;i++){const a=i*Math.PI/3-Math.PI/2;i?ctx.lineTo(Math.cos(a)*10,Math.sin(a)*10):ctx.moveTo(Math.cos(a)*10,Math.sin(a)*10);}ctx.stroke();
 const texture=new T.CanvasTexture(canvas),count=420,positions=new Float32Array(count*3),sizes=new Float32Array(count),phases=new Float32Array(count),spins=new Float32Array(count);let seed=771;const rand=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};const seeds=[];for(let i=0;i<count;i++){const near=i%4===0;seeds.push({x:(rand()-.5)*(near?34:92),z:(rand()-.5)*(near?34:92),y:rand()*29,s:.35+rand()*.65,phase:rand()*6});sizes[i]=near?.24+rand()*.17:.1+rand()*.15;phases[i]=rand()*Math.PI*2;spins[i]=(rand()-.5)*.65;}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('flakeSize',new T.BufferAttribute(sizes,1));geometry.setAttribute('flakePhase',new T.BufferAttribute(phases,1));geometry.setAttribute('flakeSpin',new T.BufferAttribute(spins,1));
 const snowUniforms={flakeMap:{value:texture},time:{value:0},pixelRatio:{value:Math.min(2,window.devicePixelRatio||1)}};
 const snow=new T.Points(geometry,new T.ShaderMaterial({uniforms:snowUniforms,transparent:true,depthWrite:false,toneMapped:false,
  vertexShader:`attribute float flakeSize;attribute float flakePhase;attribute float flakeSpin;uniform float time;uniform float pixelRatio;varying float angle;varying float opacity;void main(){vec4 p=modelViewMatrix*vec4(position,1.);float d=-p.z;angle=flakePhase+time*flakeSpin;opacity=smoothstep(.7,2.,d)*(1.-smoothstep(48.,105.,d))*(.5+flakeSize*.45);gl_PointSize=clamp(flakeSize*310./max(1.,d),1.5,19.)*pixelRatio;gl_Position=projectionMatrix*p;}`,
  fragmentShader:`uniform sampler2D flakeMap;varying float angle;varying float opacity;void main(){float c=cos(angle),s=sin(angle);vec2 uv=mat2(c,-s,s,c)*(gl_PointCoord-.5)+.5;if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))discard;float alpha=texture2D(flakeMap,uv).a*opacity;if(alpha<.012)discard;gl_FragColor=vec4(.94,.98,1.,alpha);}`}));snow.name='winter-snow-crystals';snow.frustumCulled=false;scene.add(snow);
 // Geometry carries the long folds; opacity never breaks the ribbon into isolated columns.
 const auroraUniforms={time:{value:0},night:{value:0}};
 const aurora=new T.Group();aurora.name='winter-auroral-curtains';scene.add(aurora);
 for(const [layer,y,z,yaw]of [[0,161,-320,-.18],[1,190,-385,.23],[2,212,-455,-.34]]){
  const material=new T.ShaderMaterial({uniforms:{...auroraUniforms,layer:{value:layer}},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false,
   vertexShader:`uniform float time;uniform float layer;varying vec2 vUv;void main(){vUv=uv;float x=uv.x,t=time*.018+layer*2.31;vec3 p=position;
    float fold=sin(x*6.8+t)*18.+sin(x*13.1-t*.63)*7.;
    p.y+=fold+(uv.y-.5)*(sin(x*8.3+t*.8)*17.+sin(x*3.7-t)*12.);
    p.z+=sin(x*7.2+t*.64)*47.+sin(x*15.3-t*.37)*14.;
    p.x+=sin(x*5.1+t*.4)*uv.y*9.;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
   fragmentShader:`uniform float time;uniform float night;uniform float layer;varying vec2 vUv;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
    void main(){float t=time*.018;vec2 uv=vUv;float warp=noise(vec2(uv.x*7.+layer,t*.4))* .11;
     float h=uv.y-warp;float edge=smoothstep(0.,.12,uv.x)*(1.-smoothstep(.84,1.,uv.x));
     float curtain=smoothstep(.015,.13,h)*exp(-max(0.,h-.13)*4.2)*(1.-smoothstep(.62,.96,h));
     float flow=noise(vec2(uv.x*56.+noise(vec2(uv.x*8.,t))*2.5,h*3.-t));
     float threads=.78+.22*flow;float lower=exp(-pow((h-.13)*15.,2.));
     vec3 mint=vec3(.16,.57,.43),blue=vec3(.17,.31,.57),violet=vec3(.31,.22,.46);
     vec3 color=mix(mint,blue,smoothstep(.1,.68,h));color=mix(color,violet,smoothstep(.42,.87,h)*.48);
     float breath=.9+.1*sin(t*.6+layer);gl_FragColor=vec4(color,(curtain*.48+lower*.08)*threads*edge*night*breath/(1.+layer*.3));}`});
  const curtain=new T.Mesh(new T.PlaneGeometry(650,88-layer*9,160,24),material);curtain.position.set(0,y,z);curtain.rotation.y=yaw;curtain.frustumCulled=false;aurora.add(curtain);
 }
 const a=new T.Color(),b=new T.Color();let skyState=skyAt(12),hour=12,snowEnabled=true;
 try{snowEnabled=localStorage.getItem('winter-snow')!=='off';}catch{}const toggle=document.querySelector('#snow-enabled');if(toggle)toggle.checked=snowEnabled;
 const updateTime=detail=>{hour=detail.hour;skyState=skyAt(hour);};if(window.labWorldTime)updateTime(window.labWorldTime);window.addEventListener('lab:time',e=>updateTime(e.detail));document.querySelector('#snow-enabled')?.addEventListener('change',e=>{snowEnabled=e.target.checked;try{localStorage.setItem('winter-snow',snowEnabled?'on':'off');}catch{}});
 return{update(time,still,target,brightness=1){const {a:lo,b:hi,t}=skyState;const color=(x,y)=>a.set(x).lerp(b.set(y),t),night=hour>=20||hour<5?1:hour>=18?(hour-18)/2:hour<7?(7-hour)/2:0,top=color(lo.sky,hi.sky).clone().lerp(new T.Color('#071329'),night),horizon=color(lo.horizon,hi.horizon).clone().lerp(new T.Color('#192c45'),night);scene.background.copy(top);scene.fog.color.copy(horizon);hemi.intensity=T.MathUtils.lerp(lo.ambient,hi.ambient,t)*T.MathUtils.lerp(1,.34,night);hemi.color.set('#b3c6df');hemi.groundColor.set('#586a76');sun.color.copy(color(lo.sun,hi.sun));sun.intensity=T.MathUtils.lerp(lo.light,hi.light,t)*brightness*T.MathUtils.lerp(1,.24,night);fill.intensity=T.MathUtils.lerp(.22,.12,night);scene.environmentIntensity=T.MathUtils.lerp(.35,.15,night);fill.color.set('#ebc7a1');world.setSky?.(top,horizon,hour);auroraUniforms.night.value=night;auroraUniforms.time.value=still?0:time;aurora.position.set(target.x,0,target.z);aurora.visible=!window.labInterior&&night>.01;snow.visible=!window.labInterior&&snowEnabled;const clock=still?0:time;snowUniforms.time.value=clock;for(let i=0;i<count;i++){const f=seeds[i];positions[i*3]=target.x+f.x+Math.sin(clock*.15+f.phase)*1.8+Math.sin(clock*.43+f.phase)*.18;positions[i*3+1]=Math.max(0,target.y-2)+((f.y-clock*f.s)%29+29)%29;positions[i*3+2]=target.z+f.z+Math.cos(clock*.12+f.phase);}geometry.attributes.position.needsUpdate=true;}};
}
