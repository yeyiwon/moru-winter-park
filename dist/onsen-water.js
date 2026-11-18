import * as T from './vendor/three.module.js';

const CAPACITY=8;
// No scene capture: depth/bed refraction and fixture reflections are local approximations.
export function createOnsenWater({lights=[],color='#477a76',basin=[0,0,100,100],impact=[10000,10000,0]}={}){
 const time={value:0},points=lights.map(p=>new T.Vector3(...p)).slice(0,4);while(points.length<4)points.push(new T.Vector3(0,-1000,0));
 const ripples=Array.from({length:CAPACITY},()=>new T.Vector4(0,0,-100,0)),directions=Array.from({length:CAPACITY},()=>new T.Vector2());let cursor=0,lastTime=0;
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time,tint:{value:new T.Color(color)},lights:{value:points},basin:{value:new T.Vector4(...basin)},impact:{value:new T.Vector3(...impact)},ripples:{value:ripples},directions:{value:directions},rippleCount:{value:CAPACITY},detail:{value:1}},
  vertexShader:`varying vec3 vWorld;varying vec3 vLocal;varying vec3 vBase;varying mat3 vLocalToWorld;void main(){vLocalToWorld=mat3(modelMatrix);vLocal=position;vBase=(modelMatrix*vec4(0.,0.,0.,1.)).xyz;vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
  fragmentShader:`uniform float time;uniform float detail;uniform vec3 tint;uniform vec3 lights[4];uniform vec4 basin;uniform vec3 impact;uniform vec4 ripples[8];uniform vec2 directions[8];uniform int rippleCount;varying vec3 vWorld;varying vec3 vLocal;varying vec3 vBase;varying mat3 vLocalToWorld;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
   void main(){
    vec2 p=vLocal.xz;float a=dot(p,vec2(1.8,.7))-time*.65,b=dot(p,vec2(-.8,2.4))+time*.48,c=dot(p,vec2(4.1,-2.9))-time*.82;
    vec2 gradient=vec2(1.8,.7)*cos(a)*.021+vec2(-.8,2.4)*cos(b)*.014+vec2(4.1,-2.9)*cos(c)*.003;
    gradient+=detail*vec2(sin(p.x*11.+p.y*4.+sin(b)-time*.9),cos(p.y*13.-p.x*6.+sin(a)+time*.7))*.009;
    float disturbance=0.;
    for(int i=0;i<8;i++){if(i>=rippleCount)break;float age=time-ripples[i].z;if(age<0.||age>3.6)continue;vec2 delta=p-ripples[i].xy;float d=length(delta),front=d-age*1.55;float envelope=exp(-front*front*7.)*exp(-age*.95)*ripples[i].w*smoothstep(0.,.1,age);float directional=1.+dot(delta/max(d,.01),directions[i])*.24;gradient+=delta/max(d,.1)*cos(front*13.)*envelope*.15*directional;disturbance+=envelope;}
    float fallDistance=length((p-impact.xy)*vec2(1.,1.3)),fallMask=exp(-fallDistance*1.6)*impact.z;
    gradient+=normalize(p-impact.xy+vec2(.001))*cos(fallDistance*13.-time*4.8)*fallMask*.06;
    vec3 n=normalize(vLocalToWorld*vec3(-gradient.x,1.,-gradient.y));vec3 view=normalize(cameraPosition-vWorld);float grazing=pow(1.-max(0.,dot(n,view)),5.),fresnel=.09+grazing*.84;
    float edge=length((p-basin.xy)/basin.zw),depth=.12+2.1*pow(max(0.,1.-edge),.45);
    vec2 refracted=p+gradient*(.4+depth*.8);float stone=noise(refracted*1.3)*.6+noise(refracted*3.1)*.4;
    float caustic=pow(max(0.,sin(dot(refracted,vec2(3.1,1.3))+sin(b)*.6)*cos(dot(refracted,vec2(-1.7,2.9))+sin(a)*.8)),8.);
    vec3 bed=mix(vec3(.23,.28,.24),vec3(.29,.34,.28),stone)+vec3(.16,.23,.18)*caustic*.35;
    vec3 transmission=exp(-vec3(.78,.34,.25)*depth*2.);vec3 water=bed*transmission+tint*(1.-transmission)*.58;
    vec3 reflection=reflect(-view,n),sky=mix(vec3(.045,.085,.14),vec3(.18,.26,.32),pow(1.-abs(reflection.y),3.));
    water=mix(water,sky,fresnel);float lamp=0.;
    for(int i=0;i<4;i++){vec3 delta=vLocalToWorld*lights[i]+vBase-vWorld;vec3 lightDir=normalize(delta);float alignment=max(0.,dot(reflection,lightDir));float highlight=pow(alignment,100.)*.6+pow(alignment,22.)*.16+pow(alignment,8.)*.045;lamp+=highlight/(1.+dot(delta,delta)*.006);}
    water+=vec3(1.,.73,.38)*lamp*(.5+fresnel*.9);
    float moon=pow(max(0.,dot(reflection,normalize(vec3(-.25,.55,.8)))),110.);water+=vec3(.38,.53,.63)*moon*.28;
    float shore=smoothstep(.94,.99,edge)*(1.-smoothstep(1.,1.035,edge));float foam=(shore*.17+fallMask*.23)*smoothstep(.35,.76,noise(p*8.+vec2(time*.13,-time*.2)));
    water=mix(water,vec3(.65,.73,.67),min(.35,foam+disturbance*.025));
    gl_FragColor=vec4(water,clamp(.52+depth*.22+fresnel*.2,.5,.94));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
 return{material,ripple(x,z,strength=.5,vx=0,vz=0){const count=material.uniforms.rippleCount.value;cursor%=count;ripples[cursor].set(x,z,lastTime,Math.min(1,Math.max(0,strength)));directions[cursor].set(vx,vz).clampLength(0,1);cursor=(cursor+1)%count;},
  setQuality(q){material.uniforms.detail.value=q==='low'?0:1;material.uniforms.rippleCount.value=q==='low'?4:CAPACITY;},
  update(t,still=false){if(!still&&Number.isFinite(t)){lastTime=t;time.value=t;}},
  clear(){ripples.forEach(r=>r.z=-100);},dispose(){material.dispose();}};
}
