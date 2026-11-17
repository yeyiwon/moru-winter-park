import * as T from './vendor/three.module.js';
import {castleLayout} from './castle-layout.js';

const budgets={high:1,medium:.6,low:.25};
const TAU=Math.PI*2;
export function createCastleAtmosphere(parent,towers){
 const root=new T.Group();root.name='winter-palace-illumination';root.userData={dynamic:true,keepGroup:true};parent.add(root);
 const time={value:0},approach={value:0},motion={value:1},geometries=[],materials=[];let quality='high',disposed=false;
 const sheen=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false,vertexColors:true,uniforms:{time,motion},vertexShader:`
  uniform float time;attribute vec3 aEffect;varying vec2 vUv;varying vec3 vColor;varying vec3 vEffect;varying vec3 vN;varying vec3 vEye;
  void main(){vec3 p=position;vEffect=aEffect;vUv=uv;vColor=color;
   if(aEffect.y<.5){p+=normal*sin(uv.x*14.-time*.28+aEffect.x)*aEffect.z;p.y+=sin(uv.x*20.-time*.25+aEffect.x)*aEffect.z*.8;p+=normal*sin(uv.x*27.-time*.9+aEffect.x)*(uv.y-.5)*.13;}
   vec4 mv=modelViewMatrix*vec4(p,1.);vN=normalize(normalMatrix*normal);vEye=-mv.xyz;gl_Position=projectionMatrix*mv;
  }`,fragmentShader:`
  uniform float time;uniform float motion;varying vec2 vUv;varying vec3 vColor;varying vec3 vEffect;varying vec3 vN;varying vec3 vEye;
  void main(){float sweep=pow(.5+.5*sin(vUv.x*9.-time*.35+vEffect.x),5.);float edge=pow(1.-abs(dot(normalize(vN),normalize(vEye))),2.);
   float alpha;if(vEffect.y>.5){float shimmer=.5+.5*sin(vEye.y*.16+time*.36+vEffect.x);alpha=.28+.35*edge+.1*shimmer*motion;}
   else{float ends=smoothstep(0.,.07,vUv.x)*(1.-smoothstep(.9,1.,vUv.x));float band=pow(max(0.,sin(vUv.y*3.14159)),2.);float fold=.5+.5*sin(vUv.x*10.-time*.28+vEffect.x);float sheen=pow(fold,5.);alpha=ends*band*(.16+.29*sheen);}
   float glimmer=pow(.5+.5*sin(time*.55+vEffect.x*2.1),12.);vec3 enchanted=mix(vColor,vec3(.96,.86,.66),glimmer*.17);gl_FragColor=vec4(enchanted*(1.28+.46*edge+glimmer*.18),alpha);
  }`});materials.push(sheen);
 function attach(geometry,material,name,points=false){geometries.push(geometry);const object=points?new T.Points(geometry,material):new T.Mesh(geometry,material);object.name=name;object.userData.cameraIgnore=true;object.castShadow=false;object.receiveShadow=false;root.add(object);return object;}
 function effects(g,phase,kind,amplitude,color){const n=g.attributes.position.count,a=[],colors=[],c=new T.Color(color);for(let i=0;i<n;i++){a.push(phase,kind,amplitude);colors.push(c.r,c.g,c.b);}g.setAttribute('aEffect',new T.Float32BufferAttribute(a,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));return g;}
 // Each major spire receives its own phase, so the illumination travels across the silhouette.
 const crystalGeometries=[];
 towers.forEach((t,i)=>{
  const tip=t.base+t.height+t.roof,crystal=new T.OctahedronGeometry(t.central?.64:.38,0).scale(.65,t.central?1.42:1.5,.65).translate(t.x,tip+.62,t.z);
  // OctahedronGeometry supplies UVs; each crystal receives a staggered shimmer phase.
  effects(crystal,i*1.83,1,0,i%2?'#d3e8eb':'#bddfed');crystalGeometries.push(crystal);

 });
 // Crystals share a draw call; their facets retain individual normals.
 const merged=new T.BufferGeometry();for(const name of ['position','normal','uv','color','aEffect']){const size=name==='uv'?2:3,arrays=crystalGeometries.map(g=>g.attributes[name].array),data=new Float32Array(arrays.reduce((sum,a)=>sum+a.length,0));let offset=0;for(const a of arrays){data.set(a,offset);offset+=a.length;}merged.setAttribute(name,new T.BufferAttribute(data,size));}crystalGeometries.forEach(g=>g.dispose());merged.computeBoundingSphere();attach(merged,sheen,'palace-shimmer-crystals');
 let seed=9182;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 const capacity=760,positions=[],data=[],colors=[];
 for(let i=0;i<capacity;i++){
  const t=towers[i%towers.length],mist=i%11===0,nearSpire=!mist&&i%3!==0,side=i%2?-1:1,angle=random()*TAU;
  // Keep the path and a visitor's face clear: particles stay low beside it or high overhead.
  positions.push(nearSpire?t.x+Math.cos(angle)*(1+random()*2):side*(7+random()*11),nearSpire?t.base+t.height+t.roof-4+random()*3:.3+random()*.8,nearSpire?t.z+Math.sin(angle)*(1+random()*2):-4+random()*13);
  data.push(random(),mist?2:nearSpire?1:0,mist?1.7:.06+random()*.06);const c=new T.Color(i%4?'#c8e6ed':'#ffe1b0');colors.push(c.r,c.g,c.b);
 }
 const particleGeometry=new T.BufferGeometry();particleGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));particleGeometry.setAttribute('aData',new T.Float32BufferAttribute(data,3));particleGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));particleGeometry.computeBoundingSphere();particleGeometry.boundingSphere.radius+=2;
 const particleMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,blending:T.AdditiveBlending,toneMapped:false,uniforms:{time,motion},vertexShader:`
  uniform float time;uniform float motion;attribute vec3 aData;varying vec3 vColor;varying float vAlpha;varying float vKind;
  void main(){float life=fract(aData.x+time*.026);vec3 p=position;vKind=aData.y;p.y+=life*(aData.y>.5&&aData.y<1.5?2.:.6);p.x+=sin(time*.2+aData.x*17.)*.3;p.z+=cos(time*.15+aData.x*23.)*.25;vColor=color;
   vAlpha=(.22+.78*sin(life*3.14159))*(.3+.7*pow(.5+.5*sin(time*.65+aData.x*43.),5.));vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(aData.z*460./max(1.,-mv.z),1.2,aData.y>1.5?48.:10.);gl_Position=projectionMatrix*mv;
  }`,fragmentShader:`varying vec3 vColor;varying float vAlpha;varying float vKind;void main(){vec2 p=(gl_PointCoord-.5)*2.;float d=dot(p,p),core=exp(-d*26.),rays=exp(-abs(p.x)*20.-abs(p.y)*3.)+exp(-abs(p.y)*20.-abs(p.x)*3.);float alpha=(core+rays*.32)*(1.-smoothstep(.7,1.,sqrt(d)));if(vKind>1.5)alpha=exp(-d*3.)*(1.-smoothstep(.6,1.,sqrt(d)))*.055;gl_FragColor=vec4(vColor,alpha*vAlpha*1.3);}`});materials.push(particleMaterial);const particles=attach(particleGeometry,particleMaterial,'palace-star-dust',true);

 // Warm pools stay on the snow at both ends of the arcade, never in the camera's eye line.
 const pools=new T.BufferGeometry(),poolPositions=[],poolUv=[],poolIndex=[];
 for(const z of [1.8,-10.5]){const offset=poolPositions.length/3;for(const [x,dz]of [[-1,-1],[1,-1],[-1,1],[1,1]]){poolPositions.push(x*5.8,.108,z+dz*4.6);poolUv.push((x+1)/2,(dz+1)/2);}poolIndex.push(offset,offset+2,offset+1,offset+1,offset+2,offset+3);}
 pools.setAttribute('position',new T.Float32BufferAttribute(poolPositions,3));pools.setAttribute('uv',new T.Float32BufferAttribute(poolUv,2));pools.setIndex(poolIndex);
 const poolMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,uniforms:{time,approach},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time;uniform float approach;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float falloff=exp(-dot(p,p)*2.8)*(1.-smoothstep(.6,1.,length(p)));float tracery=.8+.2*sin(p.x*17.+sin(p.y*9.)*.35);gl_FragColor=vec4(.96,.76,.44,falloff*tracery*(.11+approach*.08));}`});materials.push(poolMaterial);attach(pools,poolMaterial,'palace-arch-light-reflections');
 const lights=[1.5,-10].map(z=>{const light=new T.PointLight('#f5d3a0',12,15,2);light.position.set(0,5.6,z);root.add(light);return light;});
 function setQuality(value){quality=Object.hasOwn(budgets,value)?value:'medium';particles.geometry.setDrawRange(0,Math.floor(capacity*budgets[quality]));lights.forEach(l=>l.visible=quality!=='low');}
 function update(t,still=false,{quality:nextQuality,player}={}){if(disposed)return false;if(nextQuality&&nextQuality!==quality)setQuality(nextQuality);for(let p=root;p;p=p.parent)if(!p.visible)return false;if(!still&&Number.isFinite(t))time.value=t;motion.value=still?0:1;
  const near=player&&Number.isFinite(player.x+player.z)?Math.max(0,1-Math.hypot(player.x-castleLayout.x,player.z-(castleLayout.z+2))/14):0;approach.value+=((still?0:near)-approach.value)*.08;lights.forEach(l=>l.intensity=12+approach.value*6);return true;
 }
 function dispose(){if(disposed)return;disposed=true;geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.removeFromParent();}
 setQuality('high');return{root,update,setQuality,dispose,get quality(){return quality;},get time(){return time.value;},get particleCount(){return particles.geometry.drawRange.count;}};
}
