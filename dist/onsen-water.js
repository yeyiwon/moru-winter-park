import * as T from './vendor/three.module.js';

const CAPACITY=8;
// No scene capture: depth/bed refraction and fixture reflections are local approximations.
export function createOnsenWater({lights=[],color='#477a76',basin=[0,0,100,100],impact=[10000,10000,0],rect=false,interior=false}={}){
 const time={value:0},points=lights.map(p=>new T.Vector3(...p)).slice(0,4);while(points.length<4)points.push(new T.Vector3(0,-1000,0));
 const ripples=Array.from({length:CAPACITY},()=>new T.Vector4(0,0,-100,0)),directions=Array.from({length:CAPACITY},()=>new T.Vector2());let cursor=0,lastTime=0;
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time,rect:{value:rect?1:0},interior:{value:interior?1:0},tint:{value:new T.Color(color)},lights:{value:points},basin:{value:new T.Vector4(...basin)},impact:{value:new T.Vector3(...impact)},ripples:{value:ripples},directions:{value:directions},rippleCount:{value:CAPACITY},detail:{value:1}},
  vertexShader:`varying vec3 vWorld;varying vec3 vLocal;varying vec3 vBase;varying mat3 vLocalToWorld;void main(){vLocalToWorld=mat3(modelMatrix);vLocal=position;vBase=(modelMatrix*vec4(0.,0.,0.,1.)).xyz;vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
  fragmentShader:`uniform float time;uniform float detail;uniform float rect;uniform float interior;uniform vec3 tint;uniform vec3 lights[4];uniform vec4 basin;uniform vec3 impact;uniform vec4 ripples[8];uniform vec2 directions[8];uniform int rippleCount;varying vec3 vWorld;varying vec3 vLocal;varying vec3 vBase;varying mat3 vLocalToWorld;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
   // Hessian of a seven-wave height field: brightness of refracted light is 1/|det(I+F*H)|, so the
   // bright lines sit where the mapping folds (validated in the shader playground before use here).
   vec3 waveHessian(vec2 p,float t){vec3 H=vec3(0.);for(int i=0;i<7;i++){float fi=float(i),a=fi*2.399963+.4,k=1.+fi*.618;vec2 d=vec2(cos(a),sin(a));H+=-.3*sin(dot(d,p)*k*6.2831+t*(.7+.31*fi)+fi*1.9)*vec3(d.x*d.x,d.y*d.y,d.x*d.y);}return H;}
   float focusGain(vec3 H,float F){float det=(1.+F*H.x)*(1.+F*H.y)-F*F*H.z*H.z;return 1./max(abs(det),.07);}
   void main(){
    vec2 p=vLocal.xz;float a=dot(p,vec2(1.8,.7))-time*.65,b=dot(p,vec2(-.8,2.4))+time*.48,c=dot(p,vec2(4.1,-2.9))-time*.82;
    vec2 gradient=vec2(1.8,.7)*cos(a)*.021+vec2(-.8,2.4)*cos(b)*.014+vec2(4.1,-2.9)*cos(c)*.003;
    gradient+=detail*vec2(sin(p.x*11.+p.y*4.+sin(b)-time*.9),cos(p.y*13.-p.x*6.+sin(a)+time*.7))*.009;
    float disturbance=0.;
    for(int i=0;i<8;i++){if(i>=rippleCount)break;float age=time-ripples[i].z;if(age<0.||age>3.6)continue;vec2 delta=p-ripples[i].xy;float d=length(delta),front=d-age*1.55;float envelope=exp(-front*front*7.)*exp(-age*.95)*ripples[i].w*smoothstep(0.,.1,age);float directional=1.+dot(delta/max(d,.01),directions[i])*.24;gradient+=delta/max(d,.1)*cos(front*13.)*envelope*.15*directional;disturbance+=envelope;}
    float fallDistance=length((p-impact.xy)*vec2(1.,1.3)),fallMask=exp(-fallDistance*1.6)*impact.z;
    gradient+=normalize(p-impact.xy+vec2(.001))*cos(fallDistance*13.-time*4.8)*fallMask*.06;
    vec3 n=normalize(vLocalToWorld*vec3(-gradient.x,1.,-gradient.y));vec3 view=normalize(cameraPosition-vWorld);float grazing=pow(1.-max(0.,dot(n,view)),5.),fresnel=.09+grazing*.84;
    vec2 basinUV=abs((p-basin.xy)/basin.zw);float rounded=length(max(basinUV-vec2(.87),0.))/.13;float edge=mix(length(basinUV),max(max(basinUV.x,basinUV.y),.87+rounded*.13),rect);if(rect>.5&&edge>1.)discard;float depth=.12+2.1*pow(max(0.,1.-edge),.45);
    vec3 water;vec3 reflection=reflect(-view,n);float alpha=clamp(.52+depth*.22+fresnel*.2,.5,.94);
    if(interior>.5){
     // Visual revision: an indoor basin. River stones on the bed seen through refraction with a little
     // parallax, caustics focused by the wave field, absorption with depth, and a reflection of the
     // room (shoji band, dark timber ceiling, aquarium glow) instead of an outdoor sky.
     vec2 q=p+gradient*(.5+depth*.9)-view.xz/max(view.y,.3)*depth*.1;
     vec2 cell=floor(q*6.2),local=fract(q*6.2);float nearest=9.,second=9.,id=0.;
     for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 o=vec2(float(i),float(j)),r=o+vec2(hash(cell+o),hash(cell+o+17.3))*.8+.1-local;float d=dot(r,r);if(d<nearest){second=nearest;nearest=d;id=hash(cell+o+5.1);}else if(d<second)second=d;}
     float pebble=smoothstep(0.,.3,sqrt(second)-sqrt(nearest));   // soft joints: stones seen through water, not a tile pattern
     vec3 bed=mix(vec3(.1,.11,.105),mix(vec3(.15,.16,.15),vec3(.24,.23,.2),id),pebble)*(.85+.15*noise(q*17.));
     float deep=mix(.3,1.6,smoothstep(0.,.3,1.-edge));   // flat-bottomed basin that steps down just inside the rim
     vec3 hess=waveHessian(q*1.05,time*.75);float focus=1.25*deep;
     vec3 light=vec3(focusGain(hess,focus*.95),focusGain(hess,focus),focusGain(hess,focus*1.05));light=max(light-1.15,0.);light=light/(1.+.4*light);
     bed+=bed*vec3(1.,.88,.68)*light*.8;
     vec3 through=exp(-vec3(1.5,.55,.5)*deep);
     water=bed*through+(tint*.9+vec3(.02,.075,.072))*(1.-through);   // slightly milky mineral water
     float up=clamp(reflection.y,0.,1.);
     vec3 room=mix(vec3(.34,.275,.19),vec3(.07,.05,.035),smoothstep(.1,.7,up));
     room+=vec3(.08,.3,.34)*pow(max(0.,dot(normalize(reflection.xz+vec2(1e-4)),vec2(0.,-1.))),3.)*(1.-up);
     float mirror=.025+grazing*.9;
     water=mix(water,room,mirror);
     float glint=0.;
     for(int i=0;i<4;i++){vec3 delta=vLocalToWorld*lights[i]+vBase-vWorld;float alignment=max(0.,dot(reflection,normalize(delta)));glint+=(pow(alignment,2600.)*3.+pow(alignment,26.)*.01)/(1.+dot(delta,delta)*.006);}
     water+=vec3(1.,.78,.46)*glint;
     float lip=smoothstep(.95,.995,edge);
     water=water*(1.-.5*lip)+vec3(.95,.84,.62)*smoothstep(.984,.998,edge)*.07;
     water=mix(water,vec3(.6,.68,.64),min(.3,disturbance*.03));
     alpha=.97;
    }else{
    vec2 refracted=p+gradient*(.4+depth*.8);float stone=noise(refracted*1.3)*.6+noise(refracted*3.1)*.4;
    float caustic=pow(max(0.,sin(dot(refracted,vec2(3.1,1.3))+sin(b)*.6)*cos(dot(refracted,vec2(-1.7,2.9))+sin(a)*.8)),8.);
    vec3 bed=mix(vec3(.23,.28,.24),vec3(.29,.34,.28),stone)+vec3(.16,.23,.18)*caustic*.35;
    vec3 transmission=exp(-vec3(.78,.34,.25)*depth*2.);water=bed*transmission+tint*(1.-transmission)*.58;
    vec3 sky=mix(vec3(.045,.085,.14),vec3(.18,.26,.32),pow(1.-abs(reflection.y),3.));
    water=mix(water,sky,fresnel);float lamp=0.;
    for(int i=0;i<4;i++){vec3 delta=vLocalToWorld*lights[i]+vBase-vWorld;vec3 lightDir=normalize(delta);float alignment=max(0.,dot(reflection,lightDir));float highlight=pow(alignment,100.)*.6+pow(alignment,22.)*.16+pow(alignment,8.)*.045;lamp+=highlight/(1.+dot(delta,delta)*.006);}
    water+=vec3(1.,.73,.38)*lamp*(.5+fresnel*.9);
    float moon=pow(max(0.,dot(reflection,normalize(vec3(-.25,.55,.8)))),110.);water+=vec3(.38,.53,.63)*moon*.28;
    float shore=smoothstep(.94,.99,edge)*(1.-smoothstep(1.,1.035,edge));float foam=(shore*mix(.17,.035,rect)+fallMask*.23)*smoothstep(.35,.76,noise(p*8.+vec2(time*.13,-time*.2)));
    water=mix(water,vec3(.65,.73,.67),min(.35,foam+disturbance*.025));
    }
    gl_FragColor=vec4(water,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
 return{material,ripple(x,z,strength=.5,vx=0,vz=0){const count=material.uniforms.rippleCount.value;cursor%=count;ripples[cursor].set(x,z,lastTime,Math.min(1,Math.max(0,strength)));directions[cursor].set(vx,vz).clampLength(0,1);cursor=(cursor+1)%count;},
  setQuality(q){material.uniforms.detail.value=q==='low'?0:1;material.uniforms.rippleCount.value=q==='low'?4:CAPACITY;},
  update(t,still=false){if(!still&&Number.isFinite(t)){lastTime=t;time.value=t;}},
  clear(){ripples.forEach(r=>r.z=-100);},dispose(){material.dispose();}};
}
