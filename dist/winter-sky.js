import {lunarPhase} from './lunar-phase.js';
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
 const snow=new T.Points(geometry,new T.ShaderMaterial({uniforms:snowUniforms,transparent:true,depthWrite:false,toneMapped:true,
  vertexShader:`attribute float flakeSize;attribute float flakePhase;attribute float flakeSpin;uniform float time;uniform float pixelRatio;varying float angle;varying float opacity;void main(){vec4 p=modelViewMatrix*vec4(position,1.);float d=-p.z;angle=flakePhase+time*flakeSpin;opacity=smoothstep(.7,2.,d)*(1.-smoothstep(48.,105.,d))*(.5+flakeSize*.45);gl_PointSize=clamp(flakeSize*310./max(1.,d),1.5,19.)*pixelRatio;gl_Position=projectionMatrix*p;}`,
  fragmentShader:`uniform sampler2D flakeMap;varying float angle;varying float opacity;void main(){float c=cos(angle),s=sin(angle);vec2 uv=mat2(c,-s,s,c)*(gl_PointCoord-.5)+.5;if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))discard;float alpha=texture2D(flakeMap,uv).a*opacity;if(alpha<.012)discard;gl_FragColor=vec4(.94,.98,1.,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`}));snow.name='winter-snow-crystals';snow.frustumCulled=false;scene.add(snow);
 // Curved remote curtains use one shared clock. Their lower hem carries the light;
 // fine field-aligned rays dissolve upward without covering the whole sky.
 const auroraUniforms={time:{value:0},night:{value:0},detail:{value:1}};
 const aurora=new T.Group();aurora.name='winter-auroral-curtains';scene.add(aurora);aurora.scale.setScalar(8);
 for(const [layer,x,y,z,yaw]of [[0,45,236,-680,-.15],[1,-100,310,-835,.18],[2,125,310,945,Math.PI-.22]]){
  const material=new T.ShaderMaterial({uniforms:{...auroraUniforms,layer:{value:layer}},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.NormalBlending,toneMapped:true,
   vertexShader:`uniform float time;uniform float layer;varying vec2 vUv;varying float vDepth;void main(){vUv=uv;float u=uv.x,t=time*.032,phase=layer*2.37;vec3 p=position;p.y+=(sin(u*8.+phase+t*.7)-sin(u*8.+phase))*4.8;p.z+=(sin(u*10.+phase+t*.6)-sin(u*10.+phase))*6.;p.z+=uv.y*sin(u*19.+phase+t*.45)*2.4;vec4 eye=modelViewMatrix*vec4(p,1.);vDepth=-eye.z;gl_Position=projectionMatrix*eye;gl_Position.z=gl_Position.w*.99995;}`,
   fragmentShader:`uniform float time;uniform float night;uniform float layer;uniform float detail;varying vec2 vUv;varying float vDepth;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
    void main(){float t=time*.024,phase=layer*2.37;vec2 uv=vUv;
     float drift=noise(vec2(uv.x*4.7+phase,t*.21));
     float warp=(drift-.5)*.12+sin(uv.x*13.+phase+t*.16)*.022;float h=uv.y-warp;
     float edge=smoothstep(0.,.18,uv.x)*(1.-smoothstep(.77,1.,uv.x));
     float height=.54+.30*noise(vec2(uv.x*11.+phase,t*.18));
     float envelope=smoothstep(.015,.13,h)*exp(-max(0.,h-.10)*4.8)*(1.-smoothstep(height*.65,height,h));
     float flow=uv.x+(noise(vec2(uv.x*7.+phase,t*.22))-.5)*.035;
     float broad=.42+.58*noise(vec2(flow*18.+phase,t*.12));
     float fine=.65+.35*noise(vec2(flow*370.+phase,h*.8-t*.3));
     if(detail>.5)fine*=.75+.25*noise(vec2(flow*823.+phase,h*1.7-t*.18));
     float fold=.55+.45*pow(.5+.5*sin(flow*44.+drift*8.+phase),2.);
     vec3 color=mix(vec3(.08,.57,.34),vec3(.39,.83,.63),broad*.5);
     color=mix(color,vec3(.18,.47,.64),smoothstep(.15,.55,h)*.72);
     color=mix(color,vec3(.49,.36,.65),smoothstep(.39,.75,h)*.45);
     float meshFade=smoothstep(0.,.12,uv.y)*(1.-smoothstep(.82,1.,uv.y));
     float alpha=envelope*meshFade*broad*fine*fold*edge*night*pow(.69,layer)*.94*smoothstep(180.,400.,vDepth);
     if(alpha<.002)discard;gl_FragColor=vec4(color,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
  const curtain=new T.Mesh(createAuroraCurtainGeometry(layer),material);curtain.name='winter-aurora-sheet-'+layer;curtain.position.set(x,y,z);curtain.rotation.y=yaw;curtain.frustumCulled=false;aurora.add(curtain);
 }
 const detailedMoon=createDetailedMoon();detailedMoon.scale.setScalar(8);scene.add(detailedMoon);const legacyCelestial=scene.getObjectByName('quiet-sun-moon');
 let quality=(globalThis.innerWidth||1024)<650?'medium':'high';try{quality=localStorage.getItem('winter-vfx-quality')||quality;}catch{}
 const setQuality=value=>{quality=['high','medium','low'].includes(value)?value:'medium';auroraUniforms.detail.value=quality==='low'?0:1;aurora.children.forEach((sheet,index)=>sheet.visible=quality!=='low'||index!==1);};setQuality(quality);document.querySelector('#vfx-quality')?.addEventListener('change',e=>setQuality(e.target.value));
 const a=new T.Color(),b=new T.Color(),top=new T.Color(),horizon=new T.Color(),nightTop=new T.Color('#040b1a'),nightHorizon=new T.Color('#122038');let skyState=skyAt(12),hour=12,snowEnabled=true;
 try{snowEnabled=localStorage.getItem('winter-snow')!=='off';}catch{}const toggle=document.querySelector('#snow-enabled');if(toggle)toggle.checked=snowEnabled;
 const updateTime=detail=>{hour=detail.hour;skyState=skyAt(hour);detailedMoon.userData.setDate(Date.now());};if(window.labWorldTime)updateTime(window.labWorldTime);window.addEventListener('lab:time',e=>updateTime(e.detail));document.querySelector('#snow-enabled')?.addEventListener('change',e=>{snowEnabled=e.target.checked;try{localStorage.setItem('winter-snow',snowEnabled?'on':'off');}catch{}});
 return{setQuality,update(time,still,target,brightness=1,exteriorPass=false,eye=target){const {a:lo,b:hi,t}=skyState;const color=(x,y)=>a.set(x).lerp(b.set(y),t),night=hour>=20||hour<5?1:hour>=18?(hour-18)/2:hour<7?(7-hour)/2:0,skyEye=eye;top.copy(color(lo.sky,hi.sky)).lerp(nightTop,night);horizon.copy(color(lo.horizon,hi.horizon)).lerp(nightHorizon,night);scene.background.copy(top);scene.fog.color.copy(horizon);hemi.intensity=T.MathUtils.lerp(lo.ambient,hi.ambient,t)*T.MathUtils.lerp(1,.45,night);hemi.color.set('#b3c6df');hemi.groundColor.set('#586a76');sun.color.copy(color(lo.sun,hi.sun));sun.intensity=T.MathUtils.lerp(lo.light,hi.light,t)*brightness*T.MathUtils.lerp(1,.24,night);fill.intensity=T.MathUtils.lerp(.22,.12,night);scene.environmentIntensity=T.MathUtils.lerp(.35,.21,night);fill.color.set('#ebc7a1');world.setSky?.(top,horizon,hour);auroraUniforms.night.value=night;auroraUniforms.time.value=still?0:time;aurora.position.copy(skyEye);aurora.visible=(!window.labInterior||exteriorPass)&&night>.01;detailedMoon.visible=(!window.labInterior||exteriorPass)&&night>.01;detailedMoon.position.set(skyEye.x-928,skyEye.y+1136,skyEye.z-2608);detailedMoon.material.uniforms.night.value=night;detailedMoon.lookAt(skyEye.x,skyEye.y,skyEye.z);if(legacyCelestial)legacyCelestial.visible=night<.02;snow.visible=(!window.labInterior||exteriorPass)&&snowEnabled;const clock=time;snowUniforms.time.value=still?0:clock;for(let i=0;i<count;i++){const f=seeds[i];positions[i*3]=target.x+f.x+(still?0:Math.sin(clock*.15+f.phase)*1.8+Math.sin(clock*.43+f.phase)*.18);positions[i*3+1]=Math.max(0,target.y-2)+((f.y-clock*f.s)%29+29)%29;positions[i*3+2]=target.z+f.z+(still?0:Math.cos(clock*.12+f.phase));}geometry.attributes.position.needsUpdate=true;}};
}

// Monotonic horizontal rows cannot double back into bright overlapping columns.
export function createAuroraCurtainGeometry(layer=0){
 const width=[590,470,390][layer]||390,heightBase=[126,111,92][layer]||92,geometry=new T.PlaneGeometry(width,1,96,12),p=geometry.attributes.position,uv=geometry.attributes.uv,phase=layer*2.37;
 for(let i=0;i<p.count;i++){const u=uv.getX(i),v=uv.getY(i),hem=Math.sin(u*5.6+phase)*25+Math.sin(u*12.1+phase*.4)*9,height=heightBase+Math.sin(u*7.7+phase)*7;p.setXYZ(i,(u-.5)*width,hem+v*height,Math.sin(u*4.3+phase)*44+Math.sin(u*11.5+phase)*13+v*Math.sin(u*6.3)*3);}
 geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}

export function createMoonSurfaceTexture(width=512,height=256){
 const data=new Uint8Array(width*height*4),craters=[];let seed=61583;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 for(let i=0;i<56;i++){const y=random()*1.8-.9,a=random()*Math.PI*2,r=Math.sqrt(1-y*y);craters.push({x:Math.cos(a)*r,y,z:Math.sin(a)*r,r:.026+Math.pow(random(),2)*.22});}
 const maria=[[-.4,.2,.88,.38],[-.05,.3,.95,.28],[.35,.13,.93,.22],[.12,-.15,.98,.31],[-.43,-.15,.87,.25],[.7,.33,-.63,.38],[-.1,.4,-.9,.29]];
 for(let row=0;row<height;row++)for(let col=0;col<width;col++){
  const phi=col/(width-1)*Math.PI*2,theta=(1-row/(height-1))*Math.PI,x=-Math.cos(phi)*Math.sin(theta),y=Math.cos(theta),z=Math.sin(phi)*Math.sin(theta);
  const broad=(Math.sin(x*13+y*9+z*11)+Math.sin(x*31-y*19+z*17))*.5,grain=Math.sin(x*153+y*103-z*131)*Math.sin(x*83-y*197+z*127);let shade=.66+broad*.035+grain*.012,relief=.5+grain*.018;
  for(const [mx,my,mz,r]of maria){const d=(x-mx)**2+(y-my)**2+(z-mz)**2;shade-=Math.exp(-d/(r*r))*.135;}
  for(const c of craters){const d=Math.sqrt((x-c.x)**2+(y-c.y)**2+(z-c.z)**2)/c.r;if(d>1.7)continue;const bowl=Math.max(0,1-d*d),rim=Math.exp(-(((d-.97)*10)**2));relief-=bowl*.105;relief+=rim*.065;shade-=bowl*.055;shade+=rim*.085;}
  const i=(row*width+col)*4;data[i]=Math.round(Math.max(0,Math.min(1,shade))*255);data[i+1]=Math.round(Math.max(0,Math.min(1,relief))*255);data[i+2]=0;data[i+3]=255;
 }
 const texture=new T.DataTexture(data,width,height,T.RGBAFormat);texture.wrapS=T.RepeatWrapping;texture.wrapT=T.ClampToEdgeWrapping;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;texture.name='procedural-lunar-maria-and-craters';return texture;
}

export function createDetailedMoon({loadTexture=typeof document!=='undefined',date=Date.now()}={}){
 const texture=createMoonSurfaceTexture(),material=new T.ShaderMaterial({uniforms:{surface:{value:texture},observed:{value:0},night:{value:1},lightDirection:{value:new T.Vector3()}},transparent:true,depthWrite:false,toneMapped:true,
  vertexShader:`varying vec2 vUv;varying vec3 vNormal;void main(){vUv=uv;vNormal=normalMatrix*normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w*.99994;}`,
  fragmentShader:`uniform sampler2D surface;uniform float observed;uniform float night;uniform vec3 lightDirection;varying vec2 vUv;varying vec3 vNormal;
   void main(){vec2 uv=vec2(fract(vUv.x-.25*observed),vUv.y);vec3 detail=texture2D(surface,uv).rgb;vec3 n=normalize(vNormal);float cosine=dot(n,normalize(lightDirection));float terminator=smoothstep(-.018,.025,cosine),lit=terminator*(.5+.5*sqrt(max(0.,cosine)));vec3 stone=mix(vec3(detail.r)*vec3(.88,.9,.93),detail,observed);vec3 color=stone*(.018+lit*.94);gl_FragColor=vec4(color,night);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 const moon=new T.Mesh(new T.SphereGeometry(6.8,64,40),material);moon.name='detailed-winter-moon';moon.position.set(-116,142,-326);moon.frustumCulled=false;
 let image=null,disposed=false;
 moon.userData.setDate=value=>{const state=lunarPhase(value),z=state.fraction*2-1,x=Math.sqrt(Math.max(0,1-z*z))*(state.phase<.5?1:-1);material.uniforms.lightDirection.value.set(x,0,z);moon.userData.lunarPhase=state;};
 moon.userData.setDate(date);moon.userData.surfaceSource='procedural-fallback';
 if(loadTexture){image=new T.TextureLoader().load('./textures/moon-lroc.jpg',loaded=>{if(disposed){loaded.dispose();return;}loaded.colorSpace=T.SRGBColorSpace;loaded.wrapS=T.RepeatWrapping;material.uniforms.surface.value=loaded;material.uniforms.observed.value=1;moon.userData.surfaceSource='NASA-LROC';},undefined,()=>{moon.userData.surfaceSource='procedural-fallback';});}
 moon.userData.dispose=()=>{disposed=true;moon.geometry.dispose();material.dispose();texture.dispose();image?.dispose();};return moon;
}
