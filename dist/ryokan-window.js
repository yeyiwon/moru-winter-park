import * as T from './vendor/three.module.js';

// A shallow scenic box is deliberately self-contained: it cannot expose the outdoor world.
export function ryokanWindow(b,m,x,y,z,width,height,yaw=0,time={value:0}){
 const group=new T.Group();group.position.set(x,y,z);group.rotation.y=yaw;b.mesh(new T.PlaneGeometry(width,height),new T.ShaderMaterial({
  depthWrite:true,uniforms:{time,sceneOffset:{value:(z+10)/4}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec2 vUv;uniform float sceneOffset;uniform float time;
   float tree(vec2 p,vec2 base,float h){p-=base;float t=p.y/h;float w=(1.-t)*h*.32*(.75+.25*sin(t*40.));return step(0.,t)*step(t,1.)*(1.-smoothstep(w,w+.003,abs(p.x)));}
   float hash(float p){return fract(sin(p*127.1+311.7)*43758.5453);}
   void main(){vec2 p=vUv;p.x=(p.x+sceneOffset)*.5;vec3 col=mix(vec3(.38,.49,.56),vec3(.06,.14,.22),p.y);
    for(int layer=0;layer<3;layer++){float f=float(layer),ridge=.47-f*.065+.055*sin(p.x*(5.+f*2.)+f)+.025*sin(p.x*17.+f*2.);col=mix(col,vec3(.43,.55,.61)+f*.045,1.-smoothstep(ridge-.004,ridge+.004,p.y));}
    // World-indexed trees continue through every window, including offsets beyond one tile.
    for(int layer=0;layer<3;layer++){float f=float(layer),density=18.-f*4.,cell=floor(p.x*density);for(int i=-2;i<=2;i++){float n=cell+float(i),seed=hash(n+f*73.),x=(n+.2+seed*.6)/density,base=.25-f*.055+.025*sin(x*9.),h=.16+f*.065+hash(n*3.+f*19.)*.13;float mask=tree(p,vec2(x,base),h);col=mix(col,mix(vec3(.24,.37,.42),vec3(.065,.18,.19),f*.36),mask);float snow=tree(p+vec2(.003,.009),vec2(x,base),h)*mask;col=mix(col,vec3(.65,.74,.77),snow*(.37+.32*sin(p.y*145.+seed*4.)));}}
    float near=.12+.025*sin(p.x*9.)+.015*sin(p.x*21.);col=mix(col,vec3(.69,.77,.79),1.-smoothstep(near-.008,near+.008,p.y));float grain=fract(sin(dot(floor(p*450.),vec2(12.9898,78.233)))*43758.54);col+=(grain-.5)*.018;
    // Three snow depths drift continuously in the sealed scenic window.
    for(int layer=0;layer<3;layer++){float f=float(layer),scale=13.+f*9.;vec2 snowUV=vec2(vUv.x+sin(time*.12+vUv.y*4.+f)*.012,vUv.y+time*(.022+f*.008))*vec2(scale,scale*.7);vec2 cell=floor(snowUV),local=fract(snowUV)-.5;float seed=fract(sin(dot(cell,vec2(127.1,311.7))+sceneOffset+f*19.)*43758.5453);local.x+=sin(cell.y*4.+time*.5)*.2;float flake=exp(-dot(local,local)*(170.+f*60.))*step(.45,seed);col+=vec3(.45,.58,.66)*flake*(.35-f*.07);}
    float frost=pow(abs(vUv.x-.5)*2.,18.)*.11+pow(abs(vUv.y-.5)*2.,24.)*.07;col=mix(col,vec3(.52,.64,.7),frost);
    gl_FragColor=vec4(col,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`
 }),0,0,-.05,group);
 b.box(width+.18,.13,.24,m.endgrain,0,height/2,0,group);b.box(width+.18,.18,.45,m.lightWood,0,-height/2,.1,group);
 for(const xx of [-width/2,0,width/2])b.box(.09,height,.22,m.endgrain,xx,0,.05,group);
 for(const yy of [-height*.28,height*.28])b.box(width,.04,.12,m.lightWood,0,yy,.07,group);
 // Narrow reveal gives the view depth without a second scene or renderer.
 for(const xx of [-width/2,width/2])b.box(.18,height,.65,m.cedar,xx,0,-.2,group);
 return group;
}
