import * as T from './vendor/three.module.js';
import {summitFacilities,alpineHeight} from './resort-blueprint.js';

const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const frame=new T.Object3D(),up=new T.Vector3(0,1,0);
function mergeParts(parts){const plain=parts.map(g=>g.index?g.toNonIndexed():g),count=plain.reduce((n,g)=>n+g.attributes.position.count,0),out=new T.BufferGeometry();for(const [key,size] of [['position',3],['normal',3],['color',3]]){const values=new Float32Array(count*size);let at=0;for(const g of plain){if(g.attributes[key])values.set(g.attributes[key].array,at*size);else if(key==='color')values.fill(1,at*size,(at+g.attributes.position.count)*size);at+=g.attributes.position.count;}out.setAttribute(key,new T.BufferAttribute(values,size));}for(let i=0;i<parts.length;i++){if(plain[i]!==parts[i])plain[i].dispose();parts[i].dispose();}out.computeBoundingSphere();return out;}
function paint(g,fn){const p=g.attributes.position,colors=[];for(let i=0;i<p.count;i++){const c=fn(p.getX(i),p.getY(i),p.getZ(i),i);colors.push(c.r,c.g,c.b);}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));return g;}
function transform(g,position,rotation=[0,0,0],scale=[1,1,1]){frame.position.set(...position);frame.rotation.set(...rotation);frame.scale.set(...scale);frame.updateMatrix();return g.applyMatrix4(frame.matrix);}
function rod(a,b,r,segments=6){const first=new T.Vector3(...a),second=new T.Vector3(...b),direction=second.clone().sub(first),g=new T.CylinderGeometry(r,r,direction.length(),segments);frame.position.copy(first.add(second).multiplyScalar(.5));frame.quaternion.setFromUnitVectors(up,direction.normalize());frame.scale.set(1,1,1);frame.updateMatrix();return g.applyMatrix4(frame.matrix);}
function addMesh(parent,g,m,name){const mesh=new T.Mesh(g,m);mesh.name=name;mesh.castShadow=false;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function logGeometry(length,radius,seed){
 const position=[],indices=[],colors=[],rings=10,sides=24,brown=new T.Color('#3a261d'),charcoal=new T.Color('#15171a'),ash=new T.Color('#4b4440');
 for(let j=0;j<=rings;j++)for(let i=0;i<=sides;i++){const t=j/rings,a=i/sides*TAU,crease=.82+.09*Math.sin(a*9+seed)+.06*Math.sin(a*17+t*8),r=radius*crease*(1-.12*t)*(1+.055*Math.sin(t*13+seed)),x=Math.cos(a)*r,z=Math.sin(a)*r,y=(t-.5)*length;position.push(x,y,z);const c=brown.clone().lerp(charcoal,clamp(.4+.45*Math.sin(a*7+t*6+seed))).lerp(ash,.13*noise(i+seed));colors.push(c.r,c.g,c.b);if(j<rings&&i<sides){const k=j*(sides+1)+i;indices.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}}
 for(const j of [0,rings]){const middle=position.length/3;position.push(0,(j/rings-.5)*length,0);colors.push(brown.r,brown.g,brown.b);for(let i=0;i<sides;i++){const k=j*(sides+1)+i;if(j)indices.push(middle,k+1,k);else indices.push(middle,k,k+1);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(position,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function ringAtEnd(radius,y,seed){const pts=[];for(let i=0;i<=32;i++){const a=i/32*TAU,r=radius*(1+.055*Math.sin(a*5+seed));pts.push(new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r));}return new T.TubeGeometry(new T.CatmullRomCurve3(pts),32,.007,4,false);}
const flameVertex=`
attribute float aSeed;
uniform float uTime;
varying vec2 vUv;
varying float vSeed;
void main(){vUv=uv;vSeed=aSeed;vec3 p=position;float rise=uv.y*uv.y;p.x+=rise*(sin(uTime*2.4+aSeed+uv.y*8.)*.10+sin(uTime*4.1-aSeed+uv.y*13.)*.035);p.z+=rise*sin(uTime*1.8+aSeed*2.)*.07;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(p,1.);}`;
const flameFragment=`
uniform float uTime;
varying vec2 vUv;
varying float vSeed;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){return noise(p)*.55+noise(p*2.03)*.28+noise(p*4.09)*.13;}
void main(){
 float y=vUv.y,x=(vUv.x-.5)*2.;float flow=fbm(vec2(x*3.+vSeed,y*5.-uTime*1.8));
 float sway=sin(y*8.-uTime*3.+vSeed)*.22*y+(flow-.5)*.65*y;
 float width=pow(max(0.,1.-y),.82)*(.78+.20*sin(uTime*2.+vSeed))+.025;
 float edge=1.-abs(x-sway)/width;float torn=fbm(vec2(x*6.+vSeed*2.,y*9.-uTime*3.6));
 float flame=smoothstep(.02,.31,edge+(torn-.5)*.72)*(1.-smoothstep(.71,1.,y))*smoothstep(0.,.075,y);
 float core=pow(clamp(edge,0.,1.),2.)*(1.-y);vec3 orange=vec3(1.,.19,.025),gold=vec3(1.,.62,.13),cream=vec3(1.,.89,.54);
 vec3 color=mix(orange,gold,smoothstep(.15,.60,core));color=mix(color,cream,smoothstep(.56,.91,core));
 flame*=smoothstep(.12,.55,torn+core*.50);float alpha=flame*(.24+.43*core);if(alpha<.018)discard;gl_FragColor=vec4(color*1.25,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
const sparkVertex=`attribute float aSeed;uniform float uTime;varying float vLife;void main(){float t=fract(uTime*(.13+fract(aSeed*4.1)*.10)+aSeed);vLife=sin(t*3.14159);vec3 p=position;p.x+=sin(t*8.+aSeed*17.)*.25*t;p.z+=cos(t*6.+aSeed*11.)*.25*t;p.y+=t*(2.3+fract(aSeed*9.2)*1.5);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((12.+fract(aSeed*7.3)*12.)/max(1.,-mv.z),1.,3.2);}`;
const sparkFragment=`varying float vLife;void main(){float radius=length(gl_PointCoord-.5);if(radius>.5)discard;gl_FragColor=vec4(1.,.46,.08,(1.-smoothstep(.10,.50,radius))*vLife*.8);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

function buildFire(parent){
 const stop=summitFacilities.find(s=>s.id==='campfire');const campfire=new T.Group();campfire.name='summit-hearth';campfire.position.set(stop.model.x,alpineHeight(stop.model.x,stop.model.z),stop.model.z);campfire.userData={footprintRadius:1.65,flameHeight:2.75,dynamic:true};parent.add(campfire);
 const matte=new T.MeshStandardMaterial({vertexColors:true,roughness:.94,metalness:0}),dark=new T.MeshStandardMaterial({color:'#1a1b1d',roughness:.97}),grain=new T.MeshStandardMaterial({color:'#6a4b34',roughness:1}),iron=new T.MeshStandardMaterial({color:'#25292d',roughness:.64,metalness:.52}),ember=new T.MeshStandardMaterial({color:'#4b2417',emissive:'#f26c20',emissiveIntensity:.65,roughness:.95});
 const stones=[],logs=[],rings=[],cracks=[],coals=[],rim=new T.Color('#4e565a'),rimLight=new T.Color('#737c7e');
 addMesh(campfire,new T.CylinderGeometry(1.47,1.55,.12,48),dark,'hearth-ash-foundation').position.y=.06;
 for(let i=0;i<17;i++){const a=i/17*TAU,g=new T.IcosahedronGeometry(1,2);const p=g.attributes.position;for(let j=0;j<p.count;j++){const d=.94+noise(Math.round((p.getX(j)+1)*13+(p.getY(j)+1)*177+(p.getZ(j)+1)*913)+i*47)*.10;p.setXYZ(j,p.getX(j)*d,p.getY(j)*d,p.getZ(j)*d);}paint(g,(_,y)=>rim.clone().lerp(rimLight,clamp((y+1)*.42)));stones.push(transform(g,[Math.cos(a)*1.37,.24+noise(i)*.04,Math.sin(a)*1.37],[.06*Math.sin(i),-a,.06*Math.cos(i)],[.30,.24,.28]));}
 addMesh(campfire,mergeParts(stones),matte,'hearth-cut-basalt-ring');
 const bowl=new T.TorusGeometry(1.12,.035,6,64);addMesh(campfire,transform(bowl,[0,.34,0],[Math.PI/2,0,0]),iron,'hearth-iron-liner');
 for(let i=0;i<7;i++){const a=i*Math.PI/3.3,length=1.55+noise(i+9)*.36,radius=.12+noise(i+12)*.055,y=.28+i*.045,parts=[logGeometry(length,radius,i*1.9)];const ends=[];for(const side of [-1,1]){const disc=new T.CircleGeometry(radius*.87,24);disc.rotateX(side>0?-Math.PI/2:Math.PI/2);disc.translate(0,side*(length/2+.002),0);paint(disc,()=>new T.Color('#795739'));parts.push(disc);for(const r of [.28,.52,.73])ends.push(ringAtEnd(radius*r,side*(length/2+.005),i));for(let k=0;k<3;k++){const angle=k*2.3+i;cracks.push(transform(rod([Math.cos(angle)*radius*.25,side*(length/2+.008),Math.sin(angle)*radius*.25],[Math.cos(angle)*radius*.8,side*(length/2+.008),Math.sin(angle)*radius*.8],.009,4),[Math.sin(a)*.09,y,Math.cos(a)*.09],[Math.PI/2,0,a]));}}
  logs.push(transform(mergeParts(parts),[Math.sin(a)*.09,y,Math.cos(a)*.09],[Math.PI/2,0,a]));for(const g of ends)rings.push(transform(g,[Math.sin(a)*.09,y,Math.cos(a)*.09],[Math.PI/2,0,a]));
 }
 addMesh(campfire,mergeParts(logs),matte,'hearth-charred-split-logs');addMesh(campfire,mergeParts(rings),grain,'hearth-end-grain-rings');addMesh(campfire,mergeParts(cracks),dark,'hearth-end-grain-splits');
 for(let i=0;i<44;i++){const a=i*2.399,r=.96*Math.sqrt(noise(i+41)),g=new T.IcosahedronGeometry(.065+noise(i)*.055,0);coals.push(transform(g,[Math.cos(a)*r,.17+noise(i+7)*.08,Math.sin(a)*r],[i*.4,i*1.7,0],[1,.45,1]));}
 addMesh(campfire,mergeParts(coals),ember,'hearth-ember-bed');
 const uniforms={uTime:{value:0}},flameMaterial=new T.ShaderMaterial({uniforms,vertexShader:flameVertex,fragmentShader:flameFragment,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.NormalBlending,toneMapped:true});
 const tongueGeometry=new T.PlaneGeometry(1,1,10,18);tongueGeometry.translate(0,.5,0);const count=11,seeds=new Float32Array(count);for(let i=0;i<count;i++)seeds[i]=i*2.713;tongueGeometry.setAttribute('aSeed',new T.InstancedBufferAttribute(seeds,1));const flames=new T.InstancedMesh(tongueGeometry,flameMaterial,count);flames.name='hearth-translucent-flame-tongues';flames.frustumCulled=false;flames.renderOrder=3;for(let i=0;i<count;i++){const a=i*2.399,r=i<3?.08:.32;frame.position.set(Math.cos(a)*r,.28,Math.sin(a)*r);frame.rotation.set(0,a,0);frame.scale.set(.64+noise(i+9)*.46,.90+noise(i+3)*.95,1);frame.updateMatrix();flames.setMatrixAt(i,frame.matrix);}campfire.add(flames);
 const sparkGeometry=new T.BufferGeometry(),positions=[],sparkSeeds=[];for(let i=0;i<28;i++){const a=i*2.399,r=noise(i)*.42;positions.push(Math.cos(a)*r,.5,Math.sin(a)*r);sparkSeeds.push(noise(i+82));}sparkGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));sparkGeometry.setAttribute('aSeed',new T.Float32BufferAttribute(sparkSeeds,1));const sparks=new T.Points(sparkGeometry,new T.ShaderMaterial({uniforms,vertexShader:sparkVertex,fragmentShader:sparkFragment,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));sparks.name='hearth-rising-embers';sparks.frustumCulled=false;sparks.renderOrder=4;campfire.add(sparks);
 const light=new T.PointLight('#ffb46d',9,13,2);light.name='hearth-local-warmth';light.position.set(0,1.25,0);campfire.add(light);
 return{campfire,update(time,still){if(still)return;uniforms.uTime.value=time;light.intensity=8.8+Math.sin(time*7.1)*.7+Math.sin(time*12.7+.4)*.35;ember.emissiveIntensity=.62+Math.sin(time*3.3)*.07;}};
}

// The former backdrop occupied the new playable slopes; terrain and forest now
// come exclusively from mountain-terrain, while the original hearth is preserved.
export function buildResortScenery(scene){const root=new T.Group();root.name='resort-scenery';scene.add(root);const fire=buildFire(root);return{root,campfire:fire.campfire,update:fire.update};}
