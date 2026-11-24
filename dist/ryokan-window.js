import * as T from './vendor/three.module.js';

// A shallow scenic box is deliberately self-contained: it cannot expose the outdoor world.
export function ryokanWindow(b,m,x,y,z,width,height,yaw=0,time={value:0}){
 // Visual revision: the view used to be one flat painting on the pane. It is now traced per pixel from
 // the eye through the glass into a small analytic scene (snow field, four rows of conifers, two
 // ridges, blue-hour sky), so it shifts with the camera like a real exterior and thins out with
 // distance. Still one quad, no second scene or render target, and still sealed from the outdoor world.
 const group=new T.Group();group.position.set(x,y,z);group.rotation.y=yaw;b.mesh(new T.PlaneGeometry(width,height),new T.ShaderMaterial({
  depthWrite:true,uniforms:{time,along:{value:Math.sin(yaw)>0?-z:z+90},sill:{value:-y-.25}},
  vertexShader:'varying vec2 vUv;varying vec3 vEye;varying vec3 vRay;void main(){vUv=uv;vEye=(inverse(modelMatrix)*vec4(cameraPosition,1.)).xyz;vRay=position-vEye;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec2 vUv;varying vec3 vEye;varying vec3 vRay;uniform float along;uniform float sill;uniform float time;
   float hash(float p){return fract(sin(p*127.1+311.7)*43758.5453);}
   float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash2(i),hash2(i+vec2(1.,0.)),f.x),mix(hash2(i+vec2(0.,1.)),hash2(i+1.),f.x),f.y);}
   // x: coverage, y: share of it that carries snow. q.y is height above the tree's foot.
   vec2 conifer(vec2 q,float h,float seed,float soft){
    float t=q.y/h;if(t<0.||t>1.)return vec2(0.);
    float tiers=6.+floor(seed*4.),saw=fract(t*tiers);
    float w=h*.17*(1.-t)*(1.-.34*saw)+h*.008;w*=1.+.09*sin(q.y*7.+seed*40.);
    float body=1.-smoothstep(w-soft,w+soft,abs(q.x)),trunk=step(t,.07)*(1.-smoothstep(h*.012,h*.012+soft,abs(q.x)));
    float snow=smoothstep(.6,.2,saw)*smoothstep(.3,.8,abs(q.x)/max(w,.001))*.9+.2*smoothstep(.8,1.,t);
    return vec2(max(body,trunk),clamp(snow,0.,1.)*body);
   }
   void main(){
    vec3 d=normalize(vRay),eye=vEye;d.z=min(d.z,-.02);
    float slope=d.y/length(d.xz),u=d.x/-d.z+along/380.;
    vec3 haze=vec3(.2,.28,.48);
    // blue-hour sky, a low moon glow and a few stars
    vec3 col=mix(haze*1.25,vec3(.018,.032,.095),pow(clamp(slope*1.9,0.,1.),.55));
    vec3 moonDir=normalize(vec3(.42,.36,-1.));float moon=max(0.,dot(d,moonDir));col+=vec3(.62,.7,.9)*(smoothstep(.9992,.9996,moon)*.9+pow(moon,90.)*.16+pow(moon,9.)*.05);
    vec2 starCell=floor(vec2(u,slope)*90.);col+=vec3(.7,.8,1.)*step(.994,hash2(starCell))*smoothstep(.12,.4,slope)*.35;
    // two ridges; the far one keeps its snow, the near one is dark forest
    float far=.15+.05*sin(u*2.3+1.)+.03*sin(u*5.7)+.012*sin(u*13.),near=.075+.035*sin(u*3.1+2.)+.02*sin(u*7.9+.5)+.006*sin(u*31.);
    vec3 farCol=mix(vec3(.2,.27,.44),vec3(.44,.52,.72),smoothstep(-.02,.05,slope-far+.05+.02*noise(vec2(u*40.,slope*90.))));
    col=mix(col,mix(farCol,haze,.45),1.-smoothstep(far-.004,far+.004,slope));
    col=mix(col,mix(vec3(.07,.11,.2),haze,.28),1.-smoothstep(near-.003,near+.003,slope));
    // snow field: real ground plane, so it recedes with perspective
    if(d.y<0.){
     float t=(sill-eye.y)/d.y;vec3 P=eye+d*t;vec2 g=vec2(P.x+along,P.z);
     float drift=noise(g*.22)*.6+noise(g*.9)*.3+noise(g*4.)*.1;
     vec3 snow=mix(vec3(.19,.26,.45),vec3(.36,.45,.67),drift);
     snow+=vec3(.5,.6,.85)*pow(max(0.,dot(reflect(d,vec3(0.,1.,0.)),moonDir)),24.)*.25;
     snow=mix(snow,vec3(.3,.25,.2),smoothstep(-.55,-.2,P.z));
     col=mix(snow,haze,1.-exp(-t*.013));
    }
    // four rows of conifers standing on that ground, farthest first
    for(int layer=3;layer>=0;layer--){
     float f=float(layer),D=10.+f*f*3.6,t=(-D-eye.z)/d.z;vec3 P=eye+d*t;float X=P.x+along,spacing=3.+f*1.2,cell=floor(X/spacing);
     float ground=sill+.5*sin(X*.07+f*2.1),soft=.02+t*.0016;
     for(int i=-1;i<=1;i++){float n=cell+float(i),seed=hash(n+f*73.);if(seed<.16)continue;float h=(5.+5.5*hash(n*3.+f*19.))*(1.+.1*f),x=(n+.2+seed*.6)*spacing;
      vec2 tree=conifer(vec2(X-x,P.y-ground),h,seed,soft);
      vec3 needles=mix(vec3(.022,.05,.07),vec3(.34,.43,.66),tree.y);
      col=mix(col,mix(needles,haze,1.-exp(-D*.015)),tree.x);
      // a few lit cabin windows far back in the trees answer the warm room
      if(layer==3&&seed>.9){vec2 lamp=vec2(X-x-spacing*.4,P.y-ground-1.6);col+=vec3(1.,.62,.28)*exp(-dot(lamp,lamp)*5.)*.9;}}
    }
    // falling snow at three depths; the nearest flakes are the largest and fastest
    for(int layer=0;layer<3;layer++){float f=float(layer),D=1.4+f*f*2.2,t=(-D-eye.z)/d.z;vec3 P=eye+d*t;
     vec2 s=vec2(P.x+along+sin(time*.3+P.y*.8+f)*.14,P.y+time*(.6-f*.1))*(2.4+f*.3);vec2 c=floor(s),l=fract(s)-.5;float seed=hash2(c+f*19.);
     l+=(vec2(hash2(c+3.1),hash2(c+7.7))-.5)*.55;float r=.05-.012*f;col+=vec3(.6,.7,.9)*(1.-smoothstep(r*.35,r,length(l)))*step(.4,seed)*(.42-f*.09);}
    float frost=pow(abs(vUv.x-.5)*2.,18.)*.14+pow(abs(vUv.y-.5)*2.,24.)*.1;col=mix(col,vec3(.56,.66,.8),frost);
    gl_FragColor=vec4(col*1.08,1.);
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
