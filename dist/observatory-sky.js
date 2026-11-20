import * as T from './vendor/three.module.js';
import {starCatalog,constellationCatalog} from './observatory-catalog.js';
import {serverNow} from './server-clock.js';
import {observatoryLayout} from './observatory-layout.js';
import {precessJ2000,equatorialVector,siderealDegrees,observatoryMeteor} from './observatory-astronomy.js';
const RAD=Math.PI/180,RADIUS=1000;
const noiseGLSL=`
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float cloud(vec3 p){float n=0.,a=.5;for(int i=0;i<4;i++){n+=a*noise(p);p=p*2.03+vec3(9.1,3.7,5.2);a*=.5;}return n;}`;
export function buildObservatorySky(parent,{now=serverNow,site=observatoryLayout.site}={}){
 const root=new T.Group();root.name='observatory-catalogue-sky';root.userData.keepGroup=true;root.matrixAutoUpdate=false;parent.add(root);
 const epoch=now(),positions=[],magnitudes=[],colors=[],seeds=[],byId=new Map();
 for(const [id,ra,dec,mag,bv]of starCatalog){const v=new T.Vector3(...equatorialVector(...precessJ2000(ra,dec,epoch))).multiplyScalar(RADIUS);byId.set(id,v);positions.push(...v);magnitudes.push(mag);seeds.push((id*0.61803398875)%1);const color=new T.Color(bv===null?'#e9edff':bv<0?'#b9d5ff':bv<.45?'#ecf3ff':bv<.9?'#fff2df':bv<1.4?'#ffdbb5':'#ffc194');colors.push(color.r,color.g,color.b);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('magnitude',new T.Float32BufferAttribute(magnitudes,1));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setAttribute('seed',new T.Float32BufferAttribute(seeds,1));
 const uniforms={time:{value:0},pixelRatio:{value:1},motion:{value:1}};
 const material=new T.ShaderMaterial({uniforms,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
 vertexShader:`attribute float magnitude,seed;uniform float time,pixelRatio,motion;varying vec3 vColor;varying float strength;void main(){vColor=color;float twinkle=seed>.91?1.+.07*sin(time*(.7+seed)+seed*99.)*motion:1.;strength=clamp(pow(2.512,-magnitude*.22),.24,1.)*twinkle;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=pixelRatio*clamp(7.8-magnitude*.85,2.,8.5);}`,
 fragmentShader:`varying vec3 vColor;varying float strength;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float core=exp(-d*d*6.);float halo=exp(-d*d*3.)*.18;gl_FragColor=vec4(vColor*1.5,(core+halo)*strength);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const stars=new T.Points(geometry,material);stars.name='observatory-real-stars';stars.frustumCulled=false;root.add(stars);
 // Unresolved galactic starlight is an artistic density layer, kept separate
 // from the identifiable HIP catalogue and never used by constellation lines.
 const hazePositions=[],hazeColors=[],pole=new T.Vector3(-.8676661,.4559838,-.1980764).normalize(),u=new T.Vector3().crossVectors(pole,new T.Vector3(0,1,0)).normalize(),v=new T.Vector3().crossVectors(pole,u),point=new T.Vector3();let seed=54027;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<18000;i++){const a=random()*Math.PI*2,b=Math.sqrt(-2*Math.log(Math.max(.0001,random())))*Math.cos(random()*Math.PI*2)*(.045+.04*Math.sin(a*2)**2);point.copy(u).multiplyScalar(Math.cos(a)*Math.cos(b)).addScaledVector(v,Math.sin(a)*Math.cos(b)).addScaledVector(pole,Math.sin(b)).multiplyScalar(RADIUS+1);hazePositions.push(...point);const light=.2+random()*.8;hazeColors.push(light*.66,light*.78,light);}
 const hazeGeometry=new T.BufferGeometry();hazeGeometry.setAttribute('position',new T.Float32BufferAttribute(hazePositions,3));hazeGeometry.setAttribute('color',new T.Float32BufferAttribute(hazeColors,3));
 const haze=new T.Points(hazeGeometry,new T.PointsMaterial({size:1.7,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.62,depthWrite:false,blending:T.AdditiveBlending}));haze.name='observatory-unresolved-starlight';haze.frustumCulled=false;root.add(haze);
 const cloudMaterial=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{time:uniforms.time},vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 direction;uniform float time;${noiseGLSL}
 void main(){vec3 d=normalize(direction);vec3 galacticPole=vec3(-.8676661,.4559838,-.1980764);float latitude=dot(d,galacticPole);float n=cloud(d*7.);float dust=cloud(d*38.+vec3(.0,.0,sin(time*.000072722)*.15));float width=.065+.12*n;float band=exp(-pow(latitude/width,2.));float lane=1.-smoothstep(.48,.7,dust)*.82;float halo=exp(-pow(latitude/.28,2.));float grain=.72+.28*noise(d*310.);vec3 base=vec3(.0025,.005,.013);vec3 galaxy=mix(vec3(.026,.067,.13),vec3(.11,.13,.17),n);vec3 gas=mix(vec3(.006,.012,.03),vec3(.023,.009,.026),noise(d*3.));gl_FragColor=vec4(base+galaxy*band*lane*(.28+n)*grain+gas*halo*n,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const clouds=new T.Mesh(new T.SphereGeometry(RADIUS+5,48,24),cloudMaterial);clouds.name='observatory-milky-way';clouds.renderOrder=-20;clouds.frustumCulled=false;root.add(clouds);
 const lines=constellationCatalog.map(spec=>{const p=[],center=new T.Vector3();for(const id of spec.stars)center.add(byId.get(id));center.normalize();for(const edge of spec.edges)for(const id of edge)p.push(...byId.get(id));const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));const m=new T.LineBasicMaterial({color:'#abc6df',transparent:true,opacity:0,depthWrite:false});const object=new T.LineSegments(g,m);object.name='observatory-constellation-'+spec.id;root.add(object);return{object,center,entered:null,seen:false};});
 const meteorGeometry=new T.BufferGeometry();meteorGeometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(18),3));meteorGeometry.setAttribute('color',new T.Float32BufferAttribute([0,0,0,.12,.18,.23,.12,.18,.23,.5,.65,.8,.5,.65,.8,1,1,1],3));
 const meteor=new T.LineSegments(meteorGeometry,new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}));meteor.name='observatory-meteor';meteor.frustumCulled=false;parent.add(meteor);
 const view=new T.Vector3(0,0,-1),localView=new T.Vector3(),rotation=new T.Matrix4(),inverse=new T.Matrix4();let disposed=false,lastUpdate=-Infinity;
 function setCamera(camera,pixelRatio=1){if(camera){camera.getWorldDirection(view);uniforms.pixelRatio.value=Math.min(2,pixelRatio);}}
 function update(_time,still=false){
  if(disposed)return false;for(let p=parent;p;p=p.parent)if(!p.visible)return false;
  const ms=now();if(ms-lastUpdate<33)return true;lastUpdate=ms;
  const lst=siderealDegrees(ms,site.longitude)*RAD,lat=site.latitude*RAD,s=Math.sin(lst),c=Math.cos(lst),sp=Math.sin(lat),cp=Math.cos(lat);
  rotation.set(-s,0,c,0,cp*c,sp,cp*s,0,sp*c,-cp,sp*s,0,0,0,0,1);root.matrix.copy(rotation);root.matrixWorldNeedsUpdate=true;
  uniforms.time.value=(ms%86400000)/1000;uniforms.motion.value=still?0:1;
  inverse.copy(rotation).invert();localView.copy(view).transformDirection(inverse);
  for(const line of lines){const looking=view.y>.05&&localView.dot(line.center)>.96;if(!looking){line.entered=null;line.seen=false;line.object.material.opacity=0;}else if(!line.seen){line.entered??=ms;const age=(ms-line.entered)/1000;line.object.material.opacity=age<.8?0:Math.min(1,(age-.8)/1.2)*Math.max(0,Math.min(1,(7-age)/2))*.24;if(age>7)line.seen=true;}line.object.visible=line.object.material.opacity>.001;}
  const m=observatoryMeteor(ms);meteor.visible=m.active&&!still;if(meteor.visible){const array=meteorGeometry.attributes.position.array;for(let i=0;i<6;i++){const t=[0,1/3,1/3,2/3,2/3,1][i],a=m.azimuth+(m.age/.9)*.32-(1-t)*.07,alt=m.altitude-(m.age/.9)*.12;array[i*3]=Math.sin(a)*Math.cos(alt)*990;array[i*3+1]=Math.sin(alt)*990;array[i*3+2]=-Math.cos(a)*Math.cos(alt)*990;}meteorGeometry.attributes.position.needsUpdate=true;meteor.material.opacity=m.brightness*Math.min(1,m.age/.12)*Math.min(1,(.9-m.age)/.25);}
  return true;
 }
 function setQuality(q){geometry.setDrawRange(0,q==='low'?1800:q==='medium'?3200:starCatalog.length);hazeGeometry.setDrawRange(0,q==='low'?5000:q==='medium'?10000:18000);}
 return {root,update,setCamera,setQuality,dispose(){disposed=true;},snapshot(){return {epoch,site:{...site},time:lastUpdate,stars:geometry.drawRange.count,meteor:observatoryMeteor(lastUpdate)};}};
}
