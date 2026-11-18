import * as T from './vendor/three.module.js';

// Local water coordinates keep reflected fixtures aligned when the island moves.
export function createOnsenWater({lights=[],color='#588b82'}={}){
 const time={value:0},points=lights.map(p=>new T.Vector3(...p)).slice(0,4);while(points.length<4)points.push(new T.Vector3(0,-1000,0));
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time,tint:{value:new T.Color(color)},lights:{value:points}},
  vertexShader:`uniform float time;varying vec3 vWorld;varying vec3 vLocal;varying vec3 vBase;void main(){vec3 p=position;p.y+=sin(p.x*1.7+p.z*.9-time*.42)*.009+sin(p.z*2.6-p.x*.8+time*.31)*.006;vLocal=p;vBase=(modelMatrix*vec4(0.,0.,0.,1.)).xyz;vWorld=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
  fragmentShader:`uniform float time;uniform vec3 tint;uniform vec3 lights[4];varying vec3 vWorld;varying vec3 vLocal;varying vec3 vBase;
   void main(){vec2 p=vLocal.xz;float a=p.x*1.7+p.y*.9-time*.42,b=p.y*2.6-p.x*.8+time*.31;
    vec3 n=normalize(vec3(-cos(a)*.035+cos(b)*.02,1.,-cos(a)*.02-cos(b)*.035));
    vec3 view=normalize(cameraPosition-vWorld);float fresnel=pow(1.-max(0.,dot(n,view)),4.);vec3 reflection=reflect(-view,n);float lamp=0.;
    for(int i=0;i<4;i++){vec3 delta=lights[i]+vBase-vWorld;lamp+=pow(max(0.,dot(reflection,normalize(delta))),90.)/(1.+dot(delta,delta)*.012);}
    float caustic=pow(max(0.,sin(p.x*3.+sin(p.y*1.8+time*.2))*cos(p.y*2.2+sin(p.x*1.5-time*.17))),12.);
    vec3 water=mix(tint*.76,vec3(.18,.31,.37),fresnel*.72)+vec3(.14,.20,.17)*caustic*.22;
    water+=vec3(1.,.68,.3)*lamp*.6;gl_FragColor=vec4(water,.74+fresnel*.22);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
 return{material,update(t,still=false){if(!still&&Number.isFinite(t))time.value=t;}};
}
