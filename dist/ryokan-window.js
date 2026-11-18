import * as T from './vendor/three.module.js';

// A shallow scenic box is deliberately self-contained: it cannot expose the outdoor world.
export function ryokanWindow(b,m,x,y,z,width,height,yaw=0){
 const group=new T.Group();group.position.set(x,y,z);group.rotation.y=yaw;b.mesh(new T.PlaneGeometry(width,height),new T.ShaderMaterial({
  depthWrite:true,uniforms:{sceneOffset:{value:(z+10)/4}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec2 vUv;uniform float sceneOffset;
   float tree(vec2 p,vec2 base,float h){p-=base;float t=p.y/h;float w=(1.-t)*h*.32*(.75+.25*sin(t*40.));return step(0.,t)*step(t,1.)*(1.-smoothstep(w,w+.003,abs(p.x)));}
   void main(){vec2 p=vUv;p.x=(p.x+sceneOffset)*.5;vec3 col=mix(vec3(.42,.54,.6),vec3(.06,.14,.22),p.y);float ridge=.45+.08*sin(p.x*8.)+.12*abs(sin(p.x*13.+.4));if(p.y<ridge)col=vec3(.56,.65,.68);float near=.25+.06*sin(p.x*9.);if(p.y<near)col=vec3(.73,.79,.77);for(int i=0;i<13;i++){float f=float(i),x=fract(f*.618+.12),h=.18+fract(f*.37)*.36;float mask=tree(p,vec2(x,.14),h);col=mix(col,vec3(.12,.25,.26),mask*.9);float snow=tree(p+vec2(0.,.018),vec2(x,.14),h)*mask;col=mix(col,vec3(.67,.76,.77),snow*(.45+.35*sin(p.y*120.)));}float grain=fract(sin(dot(floor(p*450.),vec2(12.9898,78.233)))*43758.54);col+=(grain-.5)*.025;gl_FragColor=vec4(col,1.);
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
