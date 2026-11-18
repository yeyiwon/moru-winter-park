import * as T from './vendor/three.module.js';
import {makeBuilder,materials} from './architecture-kit.js';

// Flush fittings, fixed GPU beams and dust; nearby surface light uses the existing pool.
export function createPlazaUplights(root,fixtures,{name='plaza',color='#ffdfab',dustCount=160,strength=1,beamWidth=1.35}={}){
 const b=makeBuilder(root),m=materials(),tint=new T.Color(color),time={value:0},gain={value:strength};
 const geometry=new T.PlaneGeometry(2,1,1,8);geometry.translate(0,.5,0);
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false,uniforms:{time,gain,tint:{value:tint}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.x*=.045+uv.y*1.9;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(p,1.);}',
  fragmentShader:'uniform float time;uniform float gain;uniform vec3 tint;varying vec2 vUv;void main(){float side=pow(max(0.,1.-abs(vUv.x*2.-1.)),1.75);float fade=(1.-smoothstep(.45,1.,vUv.y))*smoothstep(0.,.025,vUv.y);float silk=.72+.18*sin(vUv.y*11.-time*.75+vUv.x*7.)+.10*sin(vUv.x*23.+vUv.y*6.-time*.38);gl_FragColor=vec4(tint,side*fade*silk*.23*gain);}'});
 const beams=new T.InstancedMesh(geometry,material,fixtures.length*3),dummy=new T.Object3D(),up=new T.Vector3(0,1,0),direction=new T.Vector3();beams.name=name+'-rising-light';beams.userData.cameraIgnore=true;
 const lens=m.lamp.clone();lens.color.copy(tint);const positions=[],vectors=[],seeds=[];
 for(let i=0;i<fixtures.length;i++){
  const {x,z,target}=fixtures[i],y=.14;
  b.ring(.23,.025,m.brass,x,y,z);b.oval(lens,x,y,z,.18,.012,.18);
  (root.userData.lampGlow||=[]).push({x,y:y+.03,z,floor:.145,radius:3.1,power:32*strength,range:22,color,theme:'fixed',surfaceLight:true});
  direction.set(target[0]-x,target[1]-y,target[2]-z);const length=direction.length();direction.normalize();
  for(let side=0;side<3;side++){dummy.position.set(x,y+.02,z);dummy.quaternion.setFromUnitVectors(up,direction);dummy.rotateY(side*Math.PI/3);dummy.scale.set(beamWidth,length,1);dummy.updateMatrix();beams.setMatrixAt(i*3+side,dummy.matrix);}
 }
 beams.computeBoundingSphere();root.add(beams);
 for(let i=0;i<dustCount;i++){const f=fixtures[i%fixtures.length];positions.push(f.x,.17,f.z);vectors.push(f.target[0]-f.x,f.target[1]-.17,f.target[2]-f.z);seeds.push(i*.618%1);}
 const particles=new T.BufferGeometry();particles.setAttribute('position',new T.Float32BufferAttribute(positions,3));particles.setAttribute('travel',new T.Float32BufferAttribute(vectors,3));particles.setAttribute('seed',new T.Float32BufferAttribute(seeds,1));
 const dust=new T.Points(particles,new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,uniforms:{time,gain,tint:{value:tint}},
  vertexShader:'uniform float time;attribute float seed;attribute vec3 travel;varying float alpha;void main(){float age=fract(seed+time*.055);vec3 p=position+travel*age;p.x+=sin(seed*74.+time*.3)*age*.65;p.z+=cos(seed*39.+time*.25)*age*.65;alpha=sin(age*3.14159)*(.4+.6*pow(.5+.5*sin(time+seed*80.),6.));vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(70./max(1.,-mv.z),1.,4.);}',
  fragmentShader:'uniform float gain;uniform vec3 tint;varying float alpha;void main(){vec2 p=(gl_PointCoord-.5)*2.;float r=dot(p,p);gl_FragColor=vec4(tint,exp(-r*5.)*(1.-smoothstep(.7,1.,sqrt(r)))*alpha*gain);}'}));
 dust.name=name+'-rising-sparkles';dust.frustumCulled=false;dust.userData.cameraIgnore=true;root.add(dust);
 return{update(t,still){time.value=still?0:t;},setQuality(q){gain.value=strength*(q==='low'?.75:1);particles.setDrawRange(0,Math.ceil(dustCount*(q==='low'?.3:q==='medium'?.6:1)));}};
}
