import {decorationKinds} from './decorations.js';
import * as T from './vendor/three.module.js';

// The server kinds stay separate from the two shared finishes and their settings.
export function createTreeOrnamentMeshes(root){
 const capacity=160,kinds=decorationKinds;
 const jewel=new T.MeshPhysicalMaterial({color:'#ffffff',roughness:.27,metalness:.08,clearcoat:1,iridescence:.12,iridescenceIOR:1.32,emissive:'#ffffff',emissiveIntensity:.26});
 // Color the night-time emission as well as the diffuse enamel per instance.
 jewel.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )\n totalEmissiveRadiance *= vColor.rgb;\n#endif');};
 jewel.customProgramCacheKey=()=> 'ornament-tinted-emission-v27';
 const gold=new T.MeshStandardMaterial({color:'#ffe7b2',roughness:.25,metalness:.64,emissive:'#c78643',emissiveIntensity:.045});
 function joined(parts){
  const arrays={position:[],normal:[],uv:[]};
  for(const part of parts){const geo=part.index?part.toNonIndexed():part;if(!geo.attributes.normal)geo.computeVertexNormals();for(const name in arrays){const attribute=geo.attributes[name];if(attribute)for(const value of attribute.array)arrays[name].push(value);else for(let i=0;i<geo.attributes.position.count*2;i++)arrays[name].push(0);}if(geo!==part)geo.dispose();part.dispose();}
  const geo=new T.BufferGeometry();for(const name in arrays)geo.setAttribute(name,new T.Float32BufferAttribute(arrays[name],name==='uv'?2:3));geo.computeBoundingSphere();return geo;
 }
 function tube(points,radius=.014,segments=24){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,radius,5,false);}
 function hoop(radius,y,tubeRadius=.013){const geo=new T.TorusGeometry(radius,tubeRadius,5,32);geo.rotateX(Math.PI/2);geo.translate(0,y,0);return geo;}
 function hanger(y){return [new T.CylinderGeometry(.07,.1,.1,10).translate(0,y,0),new T.TorusGeometry(.085,.014,5,24).translate(0,y+.13,0)];}
 function faceted(geo){const out=geo.index?geo.toNonIndexed():geo;if(out!==geo)geo.dispose();out.computeVertexNormals();return out;}
 function extruded(shape,depth=.1,bevel=.035){const geo=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:14});geo.translate(0,0,-depth/2);return geo;}

 const ball=faceted(new T.IcosahedronGeometry(.43,1));ball.scale(1,1.1,1);
 const ballFrame=joined([...hanger(.5),hoop(.435,0)]);

 const starPositions=[],starUvs=[];
 for(let i=0;i<16;i++){
  const a=i*Math.PI/8+Math.PI/2,b=(i+1)*Math.PI/8+Math.PI/2,r=i%2?.17:i%4?.4:.61,s=(i+1)%2?.17:(i+1)%4?.4:.61;
  for(const face of [1,-1]){const points=face===1?[[0,0,.15],[Math.cos(a)*r,Math.sin(a)*r,.015],[Math.cos(b)*s,Math.sin(b)*s,.015]]:[[0,0,-.1],[Math.cos(b)*s,Math.sin(b)*s,.015],[Math.cos(a)*r,Math.sin(a)*r,.015]];for(const p of points){starPositions.push(...p);starUvs.push(p[0]+.5,p[1]+.5);}}
 }
 const star=new T.BufferGeometry();star.setAttribute('position',new T.Float32BufferAttribute(starPositions,3));star.setAttribute('uv',new T.Float32BufferAttribute(starUvs,2));star.computeVertexNormals();
 const starFrame=joined([...hanger(.64),new T.OctahedronGeometry(.105).translate(0,0,.18)]);

 // The inner profile and visible clapper make the bell hollow from below.
 const bellProfile=[[.36,-.34],[.33,-.28],[.245,-.08],[.22,.15],[.14,.3],[.05,.34],[.05,.27],[.1,.25],[.16,.12],[.19,-.08],[.28,-.27],[.3,-.3],[.36,-.34]].map(([x,y])=>new T.Vector2(x,y));
 const bell=new T.LatheGeometry(bellProfile,32);
 const bellFrame=joined([...hanger(.38),hoop(.35,-.32,.023),hoop(.225,.13,.012),new T.CylinderGeometry(.013,.013,.39,8).translate(0,-.13,0),new T.SphereGeometry(.087,14,10).translate(0,-.36,0)]);

 const loop=new T.Shape();loop.moveTo(-.045,.025);loop.bezierCurveTo(-.2,.24,-.45,.35,-.56,.24);loop.bezierCurveTo(-.65,.15,-.59,-.13,-.45,-.15);loop.bezierCurveTo(-.27,-.16,-.16,-.035,-.045,.025);loop.closePath();
 const tail=new T.Shape();tail.moveTo(-.035,-.035);tail.bezierCurveTo(-.13,-.14,-.14,-.42,-.29,-.55);tail.lineTo(-.15,-.48);tail.lineTo(-.055,-.58);tail.quadraticCurveTo(.025,-.3,.065,-.08);tail.closePath();
 const bowParts=[];
 for(const side of [-1,1]){const lobe=extruded(loop,.11,.04),ribbon=extruded(tail,.065,.022);if(side===1){lobe.rotateY(Math.PI);ribbon.rotateY(Math.PI);}lobe.rotateY(side*.12);ribbon.rotateY(side*.09);bowParts.push(lobe,ribbon);}
 bowParts.push(new T.SphereGeometry(.12,16,10).scale(.8,1.3,.95).translate(0,0,.07));const bow=joined(bowParts);
 const bowFrame=joined([...hanger(.2),tube([[-.075,.11,.12],[-.08,0,.16],[-.055,-.12,.1]],.012,12),tube([[.075,.11,.12],[.08,0,.16],[.055,-.12,.1]],.012,12),tube([[-.1,.025,.13],[-.29,.095,.12],[-.49,.09,.085]],.009,16),tube([[.1,.025,.13],[.29,.095,.12],[.49,.09,.085]],.009,16)]);

 const moonShape=new T.Shape(),moonRadius=.52,tipAngle=.7;moonShape.absarc(0,0,moonRadius,tipAngle,Math.PI*2-tipAngle,false);moonShape.quadraticCurveTo(-.18,0,Math.cos(tipAngle)*moonRadius,Math.sin(tipAngle)*moonRadius);moonShape.closePath();
 const moon=extruded(moonShape,.12,.038);
 const moonRim=Array.from({length:33},(_,i)=>{const a=tipAngle+(Math.PI*2-tipAngle*2)*i/32;return [Math.cos(a)*.544,Math.sin(a)*.544,.04];});
 const moonFrame=joined([...hanger(.54),tube(moonRim,.012,40),tube([[.4,.31,.06],[.4,.16,.06],[.4,.02,.06]],.009,8),new T.OctahedronGeometry(.08).scale(.65,1.3,.65).translate(.4,-.05,.06)]);

 const crystalPositions=[],crystalUvs=[],crystalIndices=[],rings=[[.4,.11,0],[.25,.23,Math.PI/6],[.08,.19,0],[-.7,0,0]];
 for(let row=0;row<rings.length;row++){const [y,r,offset]=rings[row];for(let j=0;j<6;j++){const a=j*Math.PI/3+offset;crystalPositions.push(Math.cos(a)*r,y,Math.sin(a)*r);crystalUvs.push(j/6,row/3);if(row<rings.length-1){const n=row*6+j,q=row*6+(j+1)%6;crystalIndices.push(n,q,n+6,q,q+6,n+6);}}}
 const crystal=new T.BufferGeometry();crystal.setAttribute('position',new T.Float32BufferAttribute(crystalPositions,3));crystal.setAttribute('uv',new T.Float32BufferAttribute(crystalUvs,2));crystal.setIndex(crystalIndices);const icicle=faceted(crystal);
 const icicleFrame=joined([...hanger(.45),hoop(.235,.25,.012)]);

 const envelope=new T.Shape();envelope.moveTo(-.42,-.27);envelope.lineTo(.42,-.27);envelope.quadraticCurveTo(.46,-.27,.46,-.23);envelope.lineTo(.46,.23);envelope.quadraticCurveTo(.46,.27,.42,.27);envelope.lineTo(-.42,.27);envelope.quadraticCurveTo(-.46,.27,-.46,.23);envelope.lineTo(-.46,-.23);envelope.quadraticCurveTo(-.46,-.27,-.42,-.27);envelope.closePath();
 const letter=extruded(envelope,.075,.015);
 const seal=new T.CylinderGeometry(.09,.09,.025,20);seal.rotateX(Math.PI/2);seal.translate(0,-.02,.085);
 const letterFrame=joined([...hanger(.31),tube([[-.43,.24,.065],[0,-.04,.085],[.43,.24,.065]],.011,16),tube([[-.43,-.24,.065],[-.17,-.02,.07]],.009,8),tube([[.43,-.24,.065],[.17,-.02,.07]],.009,8),seal,new T.TorusGeometry(.058,.008,4,20).translate(0,-.02,.102)]);
 const snowParts=[];function crystalArm(a,b,r){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av),g=new T.CylinderGeometry(r,r,d.length(),6);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()));g.translate(...av.add(bv).multiplyScalar(.5).toArray());return g;}
 for(let j=0;j<6;j++){const a=j*Math.PI/3+Math.PI/2,point=(r,side=0)=>[Math.cos(a)*r-Math.sin(a)*side,Math.sin(a)*r+Math.cos(a)*side,0];snowParts.push(crystalArm(point(.05),point(.56),.025));for(const r of [.25,.4])for(const sign of [-1,1])snowParts.push(crystalArm(point(r),point(r-.12,sign*.12),.017));snowParts.push(new T.OctahedronGeometry(.06).translate(...point(.56)));}
 const snowflake=joined(snowParts),snowflakeFrame=joined([...hanger(.63),new T.TorusGeometry(.115,.012,5,24),new T.OctahedronGeometry(.075).translate(0,0,.075)]);
 const heartShape=new T.Shape();heartShape.moveTo(0,-.49);heartShape.bezierCurveTo(-.18,-.32,-.63,.02,-.48,.32);heartShape.bezierCurveTo(-.37,.58,-.08,.5,0,.29);heartShape.bezierCurveTo(.08,.5,.37,.58,.48,.32);heartShape.bezierCurveTo(.63,.02,.18,-.32,0,-.49);heartShape.closePath();const heart=extruded(heartShape,.12,.045),heartFrame=joined(hanger(.55));
 const gift=new T.BoxGeometry(.74,.64,.58),giftFrame=joined([...hanger(.4),new T.BoxGeometry(.11,.69,.62),new T.BoxGeometry(.79,.1,.62),new T.TorusGeometry(.13,.035,7,24).scale(1,.65,1).translate(-.12,.4,0),new T.TorusGeometry(.13,.035,7,24).scale(1,.65,1).translate(.12,.4,0)]);
 const wreath=new T.TorusGeometry(.36,.12,10,40),wreathParts=[...hanger(.55)];for(let i=0;i<12;i++){const a=i*Math.PI/6;wreathParts.push(new T.OctahedronGeometry(.055).translate(Math.cos(a)*.37,Math.sin(a)*.37,.12));}const wreathFrame=joined(wreathParts),gem=faceted(new T.OctahedronGeometry(.5).scale(.75,1.22,.75)),gemFrame=joined(hanger(.65));
 const geometries={ball,star,bell,bow,moon,icicle,letter,snowflake,heart,gift,wreath,crystal:gem},settings={ball:ballFrame,star:starFrame,bell:bellFrame,bow:bowFrame,moon:moonFrame,icicle:icicleFrame,letter:letterFrame,snowflake:snowflakeFrame,heart:heartFrame,gift:giftFrame,wreath:wreathFrame,crystal:gemFrame},meshes={},frames={};
 for(const kind of kinds){meshes[kind]=new T.InstancedMesh(geometries[kind],jewel,capacity);frames[kind]=new T.InstancedMesh(settings[kind],gold,capacity);meshes[kind].instanceColor=new T.InstancedBufferAttribute(new Float32Array(capacity*3).fill(1),3);meshes[kind].instanceColor.setUsage(T.DynamicDrawUsage);for(const [object,name]of [[meshes[kind],'ornament'],[frames[kind],'setting']]){object.name=`tree-${name}-${kind}`;object.count=0;object.frustumCulled=false;object.castShadow=true;object.receiveShadow=true;object.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(object);}}

 // One small point cloud follows the supplied instance matrices; no extra render wiring.
 const positions=new Float32Array(capacity*3),colors=new Float32Array(capacity*3),alphas=new Float32Array(capacity),sparkGeometry=new T.BufferGeometry();
 sparkGeometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));sparkGeometry.setAttribute('color',new T.BufferAttribute(colors,3).setUsage(T.DynamicDrawUsage));sparkGeometry.setAttribute('alpha',new T.BufferAttribute(alphas,1).setUsage(T.DynamicDrawUsage));sparkGeometry.setDrawRange(0,0);
 const sparkleMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexColors:true,vertexShader:`attribute float alpha;varying vec3 vColor;varying float vAlpha;void main(){vColor=color;vAlpha=alpha;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(250./max(1.,-p.z),2.,18.);}`,fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){vec2 p=gl_PointCoord-.5;float core=exp(-dot(p,p)*70.);float rayX=pow(max(0.,1.-abs(p.x)*10.),2.)*pow(max(0.,1.-abs(p.y)*2.),3.);float rayY=pow(max(0.,1.-abs(p.y)*10.),2.)*pow(max(0.,1.-abs(p.x)*2.),3.);float a=clamp(core+(rayX+rayY)*.32,0.,1.)*vAlpha;if(a<.012)discard;gl_FragColor=vec4(vColor,a);}`});
 const sparkles=new T.Points(sparkGeometry,sparkleMaterial);sparkles.name='tree-ornament-sparkles';sparkles.frustumCulled=false;sparkles.visible=false;root.add(sparkles);
 // Small physical bulbs and two bounded pools of light illuminate branches and snow.
 const bulbMaterial=new T.MeshStandardMaterial({color:'#ffefd0',emissive:'#ffd291',emissiveIntensity:1.15,roughness:.28,metalness:.05}),bulbs=new T.InstancedMesh(new T.SphereGeometry(.052,8,6),bulbMaterial,900),bulbTransform=new T.Object3D();
 const arrivalTime={value:-100},arrivalPoint={value:new T.Vector3()},shimmerTime={value:0},shimmerMotion={value:1};bulbs.geometry.setAttribute('bulbPhase',new T.InstancedBufferAttribute(Float32Array.from({length:900},(_,i)=>i*2.399),1));bulbMaterial.onBeforeCompile=shader=>{shader.uniforms.arrivalTime=arrivalTime;shader.uniforms.arrivalPoint=arrivalPoint;shader.uniforms.shimmerTime=shimmerTime;shader.uniforms.shimmerMotion=shimmerMotion;shader.vertexShader='attribute float bulbPhase;varying float vBulbPhase;varying vec3 vBulbPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBulbPhase=bulbPhase;vBulbPosition=(instanceMatrix*vec4(position,1.)).xyz;');shader.fragmentShader='uniform float arrivalTime;uniform vec3 arrivalPoint;varying vec3 vBulbPosition;uniform float shimmerTime;uniform float shimmerMotion;varying float vBulbPhase;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=mix(1.,.8+.4*pow(max(0.,sin(shimmerTime*.9+vBulbPhase)),8.),shimmerMotion);totalEmissiveRadiance*=1.+exp(-distance(vBulbPosition,arrivalPoint)*.5)*exp(-max(0.,shimmerTime-arrivalTime)*3.)*1.8*shimmerMotion;');};bulbMaterial.customProgramCacheKey=()=> 'tree-bulb-shimmer-v31';bulbs.name='tree-warm-fairy-bulbs';
 for(let i=0;i<900;i++){const t=i/899,a=t*Math.PI*2*22.4+1.5,r=32*.29*(1-t*.94)+.16;bulbTransform.position.set(Math.cos(a)*r,2.3+t*32*.82,Math.sin(a)*r);bulbTransform.scale.setScalar(.86+(i%5)*.06);bulbTransform.updateMatrix();bulbs.setMatrixAt(i,bulbTransform.matrix);bulbs.setColorAt(i,new T.Color(i%9?'#ffe8b7':'#d8f3ff'));}root.add(bulbs);
 for(const [x,y,z,power,range]of [[0,6,1,130,25],[0,27.5,0,46,13]]){const light=new T.PointLight('#ffd4a0',power,range,2);light.position.set(x,y,z);root.add(light);}
 const groundShimmer=new T.Mesh(new T.CircleGeometry(11,64),new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float time;void main(){vec2 p=vUv-.5;float r=length(p),edge=smoothstep(.5,.17,r);float light=.76+.1*sin(p.x*17.+time*.2)*sin(p.y*15.);gl_FragColor=vec4(1.,.72,.35,edge*light*.11);}'}));groundShimmer.name='tree-light-on-snow';groundShimmer.rotation.x=-Math.PI/2;groundShimmer.position.y=.245;root.add(groundShimmer);
 const matrix=new T.Matrix4(),position=new T.Vector3(),color=new T.Color(),white=new T.Color('#fff7e9');
 function update(time=0,still=false){
  const t=still||!Number.isFinite(time)?0:time;bulbMaterial.emissiveIntensity=2.1+Math.sin(t*.55)*.12;groundShimmer.material.uniforms.time.value=t;jewel.emissiveIntensity=still?1.1:1.1+Math.sin(t*.55)*.1;let count=0;
  shimmerTime.value=t;shimmerMotion.value=still?0:1;
  for(let i=0;i<capacity&&count<capacity;i++)for(let k=0;k<kinds.length&&count<capacity;k++){
   const object=meshes[kinds[k]];if(i>=object.count)continue;const phase=i*2.399+k*1.1;object.getMatrixAt(i,matrix);position.set(Math.sin(phase+t*.18)*.16,.16+Math.cos(phase+t*.21)*.09,.48).applyMatrix4(matrix);position.toArray(positions,count*3);
   if(object.instanceColor)object.getColorAt(i,color);else color.set('#ffffff');color.lerp(white,.2).toArray(colors,count*3);alphas[count]=still?.52:.3+Math.pow((Math.sin(phase+t*.7)+1)*.5,2)*.45;count++;
  }
  sparkles.visible=count>0;sparkGeometry.setDrawRange(0,count);for(const attribute of Object.values(sparkGeometry.attributes))attribute.needsUpdate=true;
 }
 return{meshes,frames,update,celebrate(point){arrivalPoint.value.copy(point);arrivalTime.value=shimmerTime.value;}};
}
