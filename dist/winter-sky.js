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
 // Long, non-overlapping curtain folds retain a dark sky between the layers.
 // Reference: https://science.nasa.gov/image-article/apod-2015-may-4-an-unexpected-aurora-over-norway/
 const auroraUniforms={time:{value:0},night:{value:0}};
 const aurora=new T.Group();aurora.name='winter-auroral-curtains';scene.add(aurora);
 for(const [layer,y,z,yaw]of [[0,134,-390,-.12],[1,186,-490,.23],[2,232,-580,-.27]]){
  const material=new T.ShaderMaterial({uniforms:{...auroraUniforms,layer:{value:layer}},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.NormalBlending,toneMapped:false,
   vertexShader:`uniform float time;uniform float layer;varying vec2 vUv;void main(){vUv=uv;float x=uv.x,t=time*.012,phase=layer*2.37;vec3 p=position;
    // The high-frequency crease is in depth only; the sheet cannot double back in X.
    p.x+=(sin(x*4.3+phase+t*.34)-sin(x*4.3+phase))*5.;
    p.y+=(sin(x*5.4+phase+t*.29)-sin(x*5.4+phase))*7.;
    p.y+=uv.y*(sin(x*8.7-phase+t*.21)-sin(x*8.7-phase))*4.;
    p.z+=(sin(x*6.1+phase+t*.37)-sin(x*6.1+phase))*13.;
    p.z+=(sin(x*13.4-phase-t*.24)-sin(x*13.4-phase))*4.;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
   fragmentShader:`uniform float time;uniform float night;uniform float layer;varying vec2 vUv;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
    void main(){float t=time*.012;vec2 uv=vUv;float phase=layer*2.37;
     float flow=noise(vec2(uv.x*6.7+phase,t*.28));
     float edge=smoothstep(0.,.13,uv.x)*(1.-smoothstep(.84,1.,uv.x));
     float lower=.025+noise(vec2(uv.x*23.+phase,t*.14))*.024,h=uv.y-lower;
     float onset=smoothstep(-.018,.055,h),reach=.69+noise(vec2(uv.x*9.+phase,t*.19))*.26;
     float veil=onset*exp(-max(h,0.)*2.65)*(1.-smoothstep(reach*.65,reach,h));
     float streak=uv.x*470.+flow*5.+h*sin(uv.x*7.+phase)*.65;
     float fine=noise(vec2(streak,h*2.4-t*.35)),fine2=noise(vec2(streak*1.73+phase,h*4.1+t*.2));
     // Fine, continuous threads modulate a connected curtain, not separated columns.
     float rays=.64+.24*fine+.12*fine2;
     float body=.78+.22*noise(vec2(uv.x*17.+phase,t*.17+h*.65));
     float hem=exp(-pow((h-.075)*14.,2.));
     vec3 green=vec3(.25,.66,.48),mint=vec3(.53,.80,.67),blue=vec3(.23,.43,.59);
     vec3 color=mix(green,mint,hem*.43);color=mix(color,blue,smoothstep(.18,.75,h)*.65);
     color=mix(color,vec3(.36,.32,.51),smoothstep(.5,.91,h)*.18);
     float alpha=(veil*.48+hem*.14)*rays*body*edge*night/(1.+layer*.65);
     if(alpha<.001)discard;gl_FragColor=vec4(color,alpha);}`});
  const curtain=new T.Mesh(createAuroraCurtainGeometry(layer),material);curtain.name='winter-aurora-sheet-'+layer;curtain.position.set(0,y,z);curtain.rotation.y=yaw;curtain.frustumCulled=false;aurora.add(curtain);
 }
 let quality=(globalThis.innerWidth||1024)<650?'medium':'high';try{quality=localStorage.getItem('winter-vfx-quality')||quality;}catch{}
 const setQuality=value=>{quality=['high','medium','low'].includes(value)?value:'medium';aurora.children.forEach((sheet,index)=>sheet.visible=index<(quality==='high'?3:quality==='medium'?2:1));};setQuality(quality);document.querySelector('#vfx-quality')?.addEventListener('change',e=>setQuality(e.target.value));
 const a=new T.Color(),b=new T.Color();let skyState=skyAt(12),hour=12,snowEnabled=true;
 try{snowEnabled=localStorage.getItem('winter-snow')!=='off';}catch{}const toggle=document.querySelector('#snow-enabled');if(toggle)toggle.checked=snowEnabled;
 const updateTime=detail=>{hour=detail.hour;skyState=skyAt(hour);};if(window.labWorldTime)updateTime(window.labWorldTime);window.addEventListener('lab:time',e=>updateTime(e.detail));document.querySelector('#snow-enabled')?.addEventListener('change',e=>{snowEnabled=e.target.checked;try{localStorage.setItem('winter-snow',snowEnabled?'on':'off');}catch{}});
 return{setQuality,update(time,still,target,brightness=1){const {a:lo,b:hi,t}=skyState;const color=(x,y)=>a.set(x).lerp(b.set(y),t),night=hour>=20||hour<5?1:hour>=18?(hour-18)/2:hour<7?(7-hour)/2:0,top=color(lo.sky,hi.sky).clone().lerp(new T.Color('#071329'),night),horizon=color(lo.horizon,hi.horizon).clone().lerp(new T.Color('#192c45'),night);scene.background.copy(top);scene.fog.color.copy(horizon);hemi.intensity=T.MathUtils.lerp(lo.ambient,hi.ambient,t)*T.MathUtils.lerp(1,.34,night);hemi.color.set('#b3c6df');hemi.groundColor.set('#586a76');sun.color.copy(color(lo.sun,hi.sun));sun.intensity=T.MathUtils.lerp(lo.light,hi.light,t)*brightness*T.MathUtils.lerp(1,.24,night);fill.intensity=T.MathUtils.lerp(.22,.12,night);scene.environmentIntensity=T.MathUtils.lerp(.35,.15,night);fill.color.set('#ebc7a1');world.setSky?.(top,horizon,hour);auroraUniforms.night.value=night;auroraUniforms.time.value=still?0:time;aurora.position.set(target.x,0,target.z);aurora.visible=!window.labInterior&&night>.01;snow.visible=!window.labInterior&&snowEnabled;const clock=still?0:time;snowUniforms.time.value=clock;for(let i=0;i<count;i++){const f=seeds[i];positions[i*3]=target.x+f.x+Math.sin(clock*.15+f.phase)*1.8+Math.sin(clock*.43+f.phase)*.18;positions[i*3+1]=Math.max(0,target.y-2)+((f.y-clock*f.s)%29+29)%29;positions[i*3+2]=target.z+f.z+Math.cos(clock*.12+f.phase);}geometry.attributes.position.needsUpdate=true;}};
}

// The actual mesh is curved before shader animation. A monotonic horizontal span
// prevents doubled triangles and the additive bright pillars they previously produced.
export function createAuroraCurtainGeometry(layer=0){
 const geometry=new T.PlaneGeometry(980,1,224,16),p=geometry.attributes.position,uv=geometry.attributes.uv,phase=layer*2.37;
 for(let i=0;i<p.count;i++){
  const u=uv.getX(i),v=uv.getY(i),hem=Math.sin(u*5.6+phase)*18+Math.sin(u*11.1+phase*.4)*11;
  const height=60+Math.sin(u*7.7+phase)*14+Math.sin(u*13.3-phase)*6;
  p.setXYZ(i,(u-.5)*980,hem+v*height,Math.sin(u*4.3+phase)*50+Math.sin(u*12.5+phase)*18+v*Math.sin(u*6.3)*6);
 }
 geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
