import * as T from './vendor/three.module.js';

const density={high:1,medium:.62,low:.28};
const vertex=`uniform vec3 sourceOrigin;varying vec2 vUv;varying vec3 vWorld;varying vec3 vOrigin;
void main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vOrigin=(modelMatrix*vec4(-sourceOrigin,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*world;}`;

// These small, authored layers share one clock. They stay attached to water,
// planting or overhead architecture, leaving the visitor's eye level clear.
export function createRetreatAtmosphere(parent,{name='retreat',waters=[],vapour=[],fireflies=[],ribbons=[],lamps=[]}={}){
 const root=new T.Group();root.name=name+'-atmosphere';root.userData.keepGroup=true;parent.add(root);
 const time={value:0},motion={value:1},particles=[],ribbonMeshes=[],materials=[],geometries=[];
 let quality='high',disposed=false;
 const material=options=>{const m=new T.ShaderMaterial({transparent:true,depthWrite:false,...options});materials.push(m);return m;};
 const attach=(geometry,mat,label,points=false)=>{geometries.push(geometry);const object=points?new T.Points(geometry,mat):new T.Mesh(geometry,mat);object.name=name+'-'+label;object.castShadow=false;object.receiveShadow=false;root.add(object);return object;};
 let seed=17031;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 for(const water of waters){
  const {x,y,z,rx,rz,rect=false,warm=true}=water;
  const lamps=(water.lights||[]).slice(0,4).map(p=>new T.Vector3(...p));while(lamps.length<4)lamps.push(new T.Vector3(10000,10000,10000));
  const mat=material({uniforms:{time,sourceOrigin:{value:new T.Vector3(x,y,z)},rect:{value:rect?1:0},warm:{value:warm?1:0},lightPoints:{value:lamps},lightCount:{value:Math.min(water.lights?.length||0,4)}},vertexShader:vertex,fragmentShader:`
   varying vec2 vUv;varying vec3 vWorld;varying vec3 vOrigin;uniform float time;uniform float rect;uniform float warm;uniform vec3 lightPoints[4];uniform int lightCount;
   void main(){
    vec2 p=(vUv-.5)*2.;float edge=mix(length(p),max(abs(p.x),abs(p.y)),rect);
    float mask=1.-smoothstep(.88,1.,edge);if(mask<.001)discard;
    float wave=sin(vWorld.x*3.1+vWorld.z*1.7-time*.7)+sin(vWorld.z*5.2-vWorld.x*.9+time*.53);
    vec3 n=normalize(vec3(sin(vWorld.x*3.1+time*.7)*.038,1.,cos(vWorld.z*4.8-time*.53)*.045));
    vec3 eye=normalize(cameraPosition-vWorld),reflected=reflect(-eye,n);float highlight=0.;
    for(int i=0;i<4;i++){if(i>=lightCount)break;vec3 l=lightPoints[i]+vOrigin;highlight+=pow(max(0.,dot(reflected,normalize(l-vWorld))),65.);}
    float ripples=pow(max(0.,sin(length(p*vec2(1.,1.1)-vec2(.25,-.1))*43.-time*.8+wave*.2)),24.);
    float caustic=pow(max(0.,sin(vWorld.x*2.5+wave*.8)*sin(vWorld.z*2.8-wave*.4)),9.);
    float shimmer=(.5+.5*sin(vWorld.z*16.+wave*1.7))*highlight;
    vec3 cool=mix(vec3(.40,.72,.67),vec3(.57,.74,.60),warm),gold=mix(vec3(.66,.90,.84),vec3(1.,.74,.37),warm);
    gl_FragColor=vec4(mix(cool,gold,min(1.,highlight)),mask*(.035+caustic*.055+ripples*.07+shimmer*.45));
   }`});
  const geometry=new T.PlaneGeometry(rx*2,rz*2);geometry.rotateX(-Math.PI/2);const surface=attach(geometry,mat,'water-reflection');surface.position.set(x,y,z);surface.userData.waterFootprint={x,z,rx,rz,rect};
 }
 if(vapour.length){
  const pos=[],data=[];for(let i=0;i<Math.max(...vapour.map(s=>s.count||12));i++)for(const source of vapour){if(i>=(source.count||12))continue;const a=random()*Math.PI*2,r=Math.sqrt(random())*.8;pos.push(source.x+Math.cos(a)*(source.rx||.25)*r,source.y,source.z+Math.sin(a)*(source.rz||.25)*r);data.push(random(),source.rise||1.6,source.size||1,source.opacity??.12);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('aData',new T.Float32BufferAttribute(data,4));g.computeBoundingSphere();g.boundingSphere.radius+=4;
  const mat=material({uniforms:{time,motion},vertexShader:`uniform float time;uniform float motion;attribute vec4 aData;varying float vLife;varying float vAlpha;varying float vSeed;
   void main(){vLife=fract(aData.x+time*.065);vAlpha=aData.w;vSeed=aData.x;vec3 p=position;p.y+=.08+vLife*aData.y;p.x+=sin(time*.27+aData.x*17.)*vLife*.28;p.z+=cos(time*.19+aData.x*21.)*vLife*.2;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(aData.z*(.55+vLife*.9)*270./max(1.,-mv.z),1.,65.);gl_Position=projectionMatrix*mv;}`,
   fragmentShader:`varying float vLife;varying float vAlpha;varying float vSeed;
   void main(){vec2 p=(gl_PointCoord-.5)*2.;p.x+=sin(p.y*4.+vSeed*9.)*.12;float d=dot(p*vec2(1.,.85),p*vec2(1.,.85));float a=exp(-d*4.)*(1.-smoothstep(.55,1.,d))*sin(vLife*3.14159)*vAlpha;gl_FragColor=vec4(.98,.93,.82,a);}`});
  const object=attach(g,mat,'water-vapour',true);particles.push({object,count:pos.length/3});
 }
 if(fireflies.length){
  const pos=[],data=[],colors=[];for(let i=0;i<Math.max(...fireflies.map(s=>s.count||12));i++)for(const source of fireflies){if(i>=(source.count||12))continue;const a=random()*Math.PI*2,r=Math.sqrt(random()),c=new T.Color(source.color||'#e7d69b');pos.push(source.x+Math.cos(a)*source.rx*r,(source.y??1)+random()*(source.height||2),source.z+Math.sin(a)*source.rz*r);data.push(random()*Math.PI*2,.7+random()*.7,source.size||.09);colors.push(c.r,c.g,c.b);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('aData',new T.Float32BufferAttribute(data,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeBoundingSphere();g.boundingSphere.radius+=1;
  const mat=material({vertexColors:true,blending:T.AdditiveBlending,toneMapped:false,uniforms:{time,motion},vertexShader:`uniform float time;uniform float motion;attribute vec3 aData;varying float vGlow;varying vec3 vColor;
   void main(){vec3 p=position;p.x+=sin(time*.22+aData.x)*.45;p.z+=cos(time*.18+aData.x)*.35;p.y+=sin(time*.41+aData.x)*.18;vGlow=mix(.32,.2+.8*pow(.5+.5*sin(time*aData.y+aData.x),3.),motion);vColor=color;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(aData.z*340./max(1.,-mv.z),1.5,8.);gl_Position=projectionMatrix*mv;}`,
   fragmentShader:`varying float vGlow;varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5)*2.;float a=(exp(-d*d*5.)*.7+exp(-d*d*35.)*.3)*(1.-smoothstep(.75,1.,d));gl_FragColor=vec4(vColor,a*vGlow*.7);}`});
  const object=attach(g,mat,'garden-fireflies',true);particles.push({object,count:pos.length/3});
 }
 for(let strand=0;strand<ribbons.length;strand++){
  const source=ribbons[strand],positions=[],uv=[],indices=[],steps=80;
  for(let i=0;i<=steps;i++){const t=i/steps,a=(t-.5)*Math.PI,x=(t-.5)*source.width,z=Math.sin(a*1.5+strand)*1.8;for(const side of [-1,1]){positions.push(x,Math.cos(a)*.8+side*source.height/2,z);uv.push(t,(side+1)/2);}if(i<steps){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeBoundingSphere();g.boundingSphere.radius+=1.5;
  const mat=material({side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false,uniforms:{time,phase:{value:strand*1.7},tint:{value:new T.Color(source.color||'#80cdb5')}},vertexShader:`uniform float time;uniform float phase;varying vec2 vUv;
   void main(){vUv=uv;vec3 p=position;p.y+=sin(p.x*.27+time*.17+phase)*.65;p.z+=sin(p.x*.36-time*.13+phase)*.8;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
   fragmentShader:`uniform float time;uniform float phase;uniform vec3 tint;varying vec2 vUv;
   void main(){float end=smoothstep(0.,.12,vUv.x)*(1.-smoothstep(.82,1.,vUv.x));float veil=pow(max(0.,sin(vUv.y*3.14159)),1.7);float fold=.45+.55*pow(.5+.5*sin(vUv.x*150.+sin(vUv.x*27.+phase)*2.-time*.12),3.);float hem=exp(-pow((vUv.y-.18)*25.,2.))*.45;vec3 color=mix(tint,vec3(.56,.54,.81),vUv.y*.45);gl_FragColor=vec4(color,end*(veil*fold*.24+hem*.12));}`});
  const object=attach(g,mat,'aurora-ribbon-'+strand);object.position.set(source.x,source.y,source.z);object.rotation.y=source.yaw||0;ribbonMeshes.push(object);
 }
 if(lamps.length){
  const positions=[],uv=[],colors=[],indices=[];for(const source of lamps){const k=positions.length/3,c=new T.Color(source.color||'#f4b96f');for(const [dx,dz]of [[-1,-1],[1,-1],[-1,1],[1,1]]){positions.push(source.x+dx*source.rx,source.y,source.z+dz*source.rz);uv.push((dx+1)/2,(dz+1)/2);colors.push(c.r,c.g,c.b);}indices.push(k,k+2,k+1,k+1,k+2,k+3);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);
  const mat=material({vertexColors:true,blending:T.AdditiveBlending,vertexShader:`varying vec2 vUv;varying vec3 vColor;void main(){vUv=uv;vColor=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;varying vec3 vColor;void main(){vec2 p=(vUv-.5)*2.;float radial=exp(-dot(p,p)*3.)*(1.-smoothstep(.65,1.,length(p)));float lattice=.75+.25*smoothstep(.2,.7,abs(sin(p.x*15.)));gl_FragColor=vec4(vColor,radial*lattice*.17);}`});attach(g,mat,'lantern-light-pools');
 }
 function setQuality(value){quality=Object.hasOwn(density,value)?value:'medium';for(const {object,count}of particles)object.geometry.setDrawRange(0,Math.max(1,Math.floor(count*density[quality])));for(let i=0;i<ribbonMeshes.length;i++)ribbonMeshes[i].visible=quality!=='low'||i===0;}
 function update(value,still=false,nextQuality){if(disposed)return false;if(nextQuality&&nextQuality!==quality)setQuality(nextQuality);for(let p=root;p;p=p.parent)if(!p.visible)return false;motion.value=still?0:1;if(!still&&Number.isFinite(value))time.value=value;return true;}
 function dispose(){if(disposed)return;disposed=true;geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.removeFromParent();}
 return{root,update,setQuality,dispose,get quality(){return quality;},get time(){return time.value;}};
}
