import * as T from './vendor/three.module.js';
import {castleLayout} from './castle-layout.js';

const budgets={high:1,medium:.55,low:.23};
const TAU=Math.PI*2;
export function createCastleAtmosphere(parent,towers){
 const root=new T.Group();root.name='winter-palace-illumination';root.userData={dynamic:true,keepGroup:true};parent.add(root);
 const time={value:0},approach={value:0},motion={value:1},geometries=[],materials=[],ribbons=[],ribbonSources=[];let quality='high',disposed=false;
 const sheen=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false,vertexColors:true,uniforms:{time,motion},vertexShader:`
  uniform float time;attribute vec3 aEffect;varying vec2 vUv;varying vec3 vColor;varying vec3 vEffect;varying vec3 vN;varying vec3 vEye;
  void main(){vec3 p=position;vEffect=aEffect;vUv=uv;vColor=color;
   if(aEffect.y<.5){p+=normal*sin(uv.x*14.-time*.28+aEffect.x)*aEffect.z;}
   vec4 mv=modelViewMatrix*vec4(p,1.);vN=normalize(normalMatrix*normal);vEye=-mv.xyz;gl_Position=projectionMatrix*mv;
  }`,fragmentShader:`
  uniform float time;uniform float motion;varying vec2 vUv;varying vec3 vColor;varying vec3 vEffect;varying vec3 vN;varying vec3 vEye;
  void main(){float sweep=pow(.5+.5*sin(vUv.x*9.-time*.35+vEffect.x),5.);float edge=pow(1.-abs(dot(normalize(vN),normalize(vEye))),2.);
   float alpha;if(vEffect.y>.5){float shimmer=.5+.5*sin(vEye.y*.16+time*.36+vEffect.x);alpha=.28+.35*edge+.1*shimmer*motion;}
   else{float ends=smoothstep(0.,.07,vUv.x)*(1.-smoothstep(.9,1.,vUv.x));float band=pow(max(0.,sin(vUv.y*3.14159)),2.);alpha=ends*band*(.12+sweep*.34);}
   gl_FragColor=vec4(vColor*(.82+.18*edge),alpha);
  }`});materials.push(sheen);
 function attach(geometry,material,name,points=false){geometries.push(geometry);const object=points?new T.Points(geometry,material):new T.Mesh(geometry,material);object.name=name;object.userData.cameraIgnore=true;object.castShadow=false;object.receiveShadow=false;root.add(object);return object;}
 function effects(g,phase,kind,amplitude,color){const n=g.attributes.position.count,a=[],colors=[],c=new T.Color(color);for(let i=0;i<n;i++){a.push(phase,kind,amplitude);colors.push(c.r,c.g,c.b);}g.setAttribute('aEffect',new T.Float32BufferAttribute(a,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));return g;}
 function ribbon(points,width,phase,color){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),positions=[],uv=[],indices=[],steps=64;
  for(let i=0;i<=steps;i++){const u=i/steps,p=curve.getPoint(u),tangent=curve.getTangent(u),side=new T.Vector3(0,1,0).cross(tangent).normalize();if(side.lengthSq()<.01)side.set(1,0,0);for(const s of [-1,1]){const q=p.clone().addScaledVector(side,s*width/2);positions.push(q.x,q.y,q.z);uv.push(u,(s+1)/2);}if(i<steps){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();effects(g,phase,0,.06,color);ribbonSources.push(g);
 }
 // The central spire gets a pair of restrained spirals; side spires receive one.
 const crystalGeometries=[];
 towers.forEach((t,i)=>{
  const tip=t.base+t.height+t.roof,crystal=new T.OctahedronGeometry(t.central?.64:.38,0).scale(.65,t.central?1.42:1.5,.65).translate(t.x,tip+.62,t.z);
  // OctahedronGeometry supplies UVs; each crystal receives a staggered shimmer phase.
  effects(crystal,i*1.83,1,0,i%2?'#d3e8eb':'#bddfed');crystalGeometries.push(crystal);
  if(t.central||i<5){const points=Array.from({length:26},(_,j)=>{const u=j/25,a=u*TAU*1.15+i;return[t.x+Math.cos(a)*(t.central?1.9:1.1)*(1-u*.3),tip-3.8+u*4.1,t.z+Math.sin(a)*(t.central?1.9:1.1)*(1-u*.3)];});ribbon(points,t.central?.32:.18,i*1.7,'#b9deeb');}
 });
 // Crystals share a draw call; their facets retain individual normals.
 const merged=new T.BufferGeometry();for(const name of ['position','normal','uv','color','aEffect']){const size=name==='uv'?2:3,arrays=crystalGeometries.map(g=>g.attributes[name].array),data=new Float32Array(arrays.reduce((sum,a)=>sum+a.length,0));let offset=0;for(const a of arrays){data.set(a,offset);offset+=a.length;}merged.setAttribute(name,new T.BufferAttribute(data,size));}crystalGeometries.forEach(g=>g.dispose());merged.computeBoundingSphere();attach(merged,sheen,'palace-shimmer-crystals');
 // A travelling highlight hugs the rooflines rather than filling the castle with a glow filter.
 for(const side of [-1,1])ribbon([[side*4.7,13.02,1.48],[side*8,13.15,1.48],[side*11.6,13.02,1.48],[side*14,17,0],[side*15,20,-1]],.26,side+4,'#f1d5a2');
 for(const z of [.28,-9.28])ribbon([[-4.7,.5,z],[-4.7,7.4,z],[-3.7,10,z],[0,11.85,z],[3.7,10,z],[4.7,7.4,z],[4.7,.5,z]],.19,z+9,'#f5ddb3');

 // Preserve each strand's UVs and animation phase while drawing one mesh per quality tier.
 for(const [tier,indices]of [[0,[0,7,8]],[1,[1,2,3,4]],[2,[5,6]]]){
  const sources=indices.map(i=>ribbonSources[i]),g=new T.BufferGeometry();
  for(const name of ['position','normal','uv','color','aEffect']){const size=name==='uv'?2:3,arrays=sources.map(source=>source.attributes[name].array),values=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));let offset=0;for(const a of arrays){values.set(a,offset);offset+=a.length;}g.setAttribute(name,new T.BufferAttribute(values,size));}
  const elements=[];let vertexOffset=0;for(const source of sources){for(const index of source.index.array)elements.push(index+vertexOffset);vertexOffset+=source.attributes.position.count;}g.setIndex(elements);g.computeBoundingSphere();g.boundingSphere.radius+=.2;
  const mesh=attach(g,sheen,'palace-flowing-ribbon-tier-'+tier);mesh.userData.strandCount=sources.length;ribbons.push(mesh);
 }
 ribbonSources.forEach(g=>g.dispose());

 let seed=9182;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 const capacity=280,positions=[],data=[],colors=[];
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
   vAlpha=(.22+.78*sin(life*3.14159))*(.3+.7*pow(.5+.5*sin(time*.65+aData.x*43.),5.));vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(aData.z*370./max(1.,-mv.z),1.2,aData.y>1.5?48.:6.);gl_Position=projectionMatrix*mv;
  }`,fragmentShader:`varying vec3 vColor;varying float vAlpha;varying float vKind;void main(){vec2 p=(gl_PointCoord-.5)*2.;float d=dot(p,p),core=exp(-d*26.),rays=exp(-abs(p.x)*20.-abs(p.y)*3.)+exp(-abs(p.y)*20.-abs(p.x)*3.);float alpha=(core+rays*.22)*(1.-smoothstep(.7,1.,sqrt(d)));if(vKind>1.5)alpha=exp(-d*3.)*(1.-smoothstep(.6,1.,sqrt(d)))*.055;gl_FragColor=vec4(vColor,alpha*vAlpha*.65);}`});materials.push(particleMaterial);const particles=attach(particleGeometry,particleMaterial,'palace-star-dust',true);

 // Warm pools stay on the snow at both ends of the arcade, never in the camera's eye line.
 const pools=new T.BufferGeometry(),poolPositions=[],poolUv=[],poolIndex=[];
 for(const z of [1.8,-10.5]){const offset=poolPositions.length/3;for(const [x,dz]of [[-1,-1],[1,-1],[-1,1],[1,1]]){poolPositions.push(x*5.8,.108,z+dz*4.6);poolUv.push((x+1)/2,(dz+1)/2);}poolIndex.push(offset,offset+2,offset+1,offset+1,offset+2,offset+3);}
 pools.setAttribute('position',new T.Float32BufferAttribute(poolPositions,3));pools.setAttribute('uv',new T.Float32BufferAttribute(poolUv,2));pools.setIndex(poolIndex);
 const poolMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,uniforms:{time,approach},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time;uniform float approach;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float falloff=exp(-dot(p,p)*2.8)*(1.-smoothstep(.6,1.,length(p)));float tracery=.8+.2*sin(p.x*17.+sin(p.y*9.)*.35);gl_FragColor=vec4(.96,.76,.44,falloff*tracery*(.11+approach*.08));}`});materials.push(poolMaterial);attach(pools,poolMaterial,'palace-arch-light-reflections');
 const lights=[1.5,-10].map(z=>{const light=new T.PointLight('#f5d3a0',12,15,2);light.position.set(0,5.6,z);root.add(light);return light;});
 function setQuality(value){quality=Object.hasOwn(budgets,value)?value:'medium';particles.geometry.setDrawRange(0,Math.floor(capacity*budgets[quality]));ribbons.forEach((mesh,i)=>mesh.visible=i<=({high:2,medium:1,low:0})[quality]);lights.forEach(l=>l.visible=quality!=='low');}
 function update(t,still=false,{quality:nextQuality,player}={}){if(disposed)return false;if(nextQuality&&nextQuality!==quality)setQuality(nextQuality);for(let p=root;p;p=p.parent)if(!p.visible)return false;if(!still&&Number.isFinite(t))time.value=t;motion.value=still?0:1;
  const near=player&&Number.isFinite(player.x+player.z)?Math.max(0,1-Math.hypot(player.x-castleLayout.x,player.z-(castleLayout.z+2))/14):0;approach.value+=((still?0:near)-approach.value)*.08;lights.forEach(l=>l.intensity=12+approach.value*6);return true;
 }
 function dispose(){if(disposed)return;disposed=true;geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.removeFromParent();}
 setQuality('high');return{root,update,setQuality,dispose,get quality(){return quality;},get time(){return time.value;},get particleCount(){return particles.geometry.drawRange.count;}};
}
