import {sampleCastleLight} from './castle-lighting.js';
import {showTrack} from './show-tracks.js';
import * as T from './vendor/three.module.js';
import {castleLayout} from './castle-layout.js';
import {showEnvelope} from './firework-score.js';
import {castleShowCues,castleProjectionModes,castleBeamGroups,castleBeamEmitters,castleShowQuality,sampleCastleCue} from './castle-show-score.js';

// Region IDs survive the existing four architectural batches. Patterns are
// shaded on the actual surface, so they cannot project through the open gate.
const projection=`
uniform float showTime;uniform float showPower;uniform float showCalm;
uniform vec3 showPalette[3];uniform float showRegions[10];uniform float showMode;uniform float showPreviousMode;uniform float showMix;
varying vec3 showP;varying float vShowRegion;
float icePattern(vec3 p,float t){
 vec2 frost=p.xy*.72;float crystal=1.;
 for(int i=0;i<3;i++){float a=float(i)*1.047198;crystal=min(crystal,abs(sin(dot(frost,vec2(cos(a),sin(a)))+t*.13)));}
 return (1.-smoothstep(.025,.095,crystal))*(.35+.65*pow(.5+.5*sin(p.y*.22-t*.55),3.));
}
float archPattern(vec3 p,float t){
 float arch=exp(-abs(length(vec2(p.x,(p.y-7.3)*1.1))-4.6)*6.)*smoothstep(6.8,7.4,p.y);
 arch+=exp(-abs(abs(p.x)-4.65)*8.)*(1.-smoothstep(7.1,7.8,p.y));
 return arch*(.4+.6*pow(.5+.5*sin(p.y*.6+abs(p.x)*.3-t*1.8),5.));
}
float projectionPattern(float mode,vec3 p,float t){
 if(mode<.5)return icePattern(p,t);
 float flow=archPattern(p,t);
 if(mode<1.5)return flow+.14*icePattern(p,t);
 if(mode>2.5&&mode<3.5)return pow(.5+.5*sin(atan(p.z+5.,p.x+.00001)*3.+p.y*.6-t*1.7),18.)+.3*flow;
 float aurora=pow(.5+.5*sin(p.y*.32+p.x*.2+sin(p.z*.4+t*.3)*1.1-t*.55),6.);
 if(mode<2.5)return aurora+.12*flow;
 vec2 cell=floor(p.xy*.6),st=fract(p.xy*.6)-.5;float hash=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);
 return (exp(-dot(st,st)*90.)+exp(-abs(st.x)*55.-abs(st.y)*9.)*.3+exp(-abs(st.y)*55.-abs(st.x)*9.)*.3)*(.55+.45*pow(.5+.5*sin(t*1.7+hash*30.),4.))+flow*.18;
}
vec3 castleProjection(float finish){
 if(showPower<.0001)return vec3(0.);
 float t=mix(showTime,5.,showCalm),r=floor(vShowRegion+.5);
 vec3 tint=showPalette[0];if(mod(r,3.)>.5)tint=showPalette[1];if(mod(r,3.)>1.5)tint=showPalette[2];
 float pattern=projectionPattern(showMode,showP,t);if(showMix<.999)pattern=mix(projectionPattern(showPreviousMode,showP,t),pattern,showMix);
 float breathe=.85+.15*sin(t*.6+r*.9),level=showRegions[int(r)];
 // Low base illumination preserves stone shadows; the moving detail carries the colour.
 float sweep=pow(.5+.5*sin(showP.y*.48-abs(showP.x)*.2-t*1.3),18.);
 float fleck=pow(.5+.5*sin(showP.x*8.+showP.y*13.+showP.z*7.),24.)*pow(.5+.5*sin(t*2.+showP.y*.7),8.);
 float energy=(.1+pattern*.84+sweep*.2+fleck*.25)*level*breathe;
 tint=mix(tint,showPalette[2],sweep*.5);
 if(r>4.5&&r<5.5)energy=(.16+.14*sin(t*.7+showP.y*.25))*level;
 if(finish>1.5)energy*=1.25;
 return tint*energy*showPower*1.7;
}`;
const blend=(a,b,t)=>a+(b-a)*t;
export function createCastleShow(scene){
 const uniforms={showTime:{value:0},showPower:{value:0},showCalm:{value:0},showPalette:{value:[new T.Color(),new T.Color(),new T.Color()]},showRegions:{value:new Float32Array(10)},showMode:{value:0},showPreviousMode:{value:0},showMix:{value:1},showBeat:{value:2},showBeatOffset:{value:0},showLaser:{value:0},showSweep:{value:0},showGroups:{value:new Float32Array(6)}};
 const castle=scene.getObjectByName('winter-palace'),restores=[],state={},palettes=castleShowCues.map(c=>c.palette.map(hex=>new T.Color(hex)));
 if(castle)castle.traverse(o=>{
  if(!/^winter-palace-(stone|metal|roof|light)$/.test(o.name))return;
  const material=o.material,finish=o.name.endsWith('light')?2:o.name.endsWith('roof')?1:0;
  const vertexHeader='attribute float showRegion;varying float vShowRegion;varying vec3 showP;\n';
  if(material.isShaderMaterial){
   const before={vertex:material.vertexShader,fragment:material.fragmentShader,toneMapped:material.toneMapped,uniforms:{...material.uniforms}};material.toneMapped=true;Object.assign(material.uniforms,uniforms);
   material.vertexShader=vertexHeader+material.vertexShader.replace('void main(){','void main(){showP=position;vShowRegion=showRegion;');
   material.fragmentShader=projection+'\n'+material.fragmentShader.replace('#include <tonemapping_fragment>',`gl_FragColor.rgb=gl_FragColor.rgb*(1.-showPower*.2)+castleProjection(${finish}.);\n#include <tonemapping_fragment>`);
   restores.push(()=>{material.vertexShader=before.vertex;material.fragmentShader=before.fragment;material.toneMapped=before.toneMapped;material.uniforms=before.uniforms;material.needsUpdate=true;});
  }else{
   const before=material.onBeforeCompile,key=material.customProgramCacheKey,cacheKey=key.call(material);
   material.onBeforeCompile=function(shader,...args){before?.call(this,shader,...args);Object.assign(shader.uniforms,uniforms);shader.vertexShader=vertexHeader+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nshowP=position;vShowRegion=showRegion;');shader.fragmentShader=projection+'\n'+shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>\ntotalEmissiveRadiance+=castleProjection(${finish}.);diffuseColor.rgb*=1.-showPower*.12;`);};
   material.customProgramCacheKey=()=>cacheKey+'-winter-castle-show-regions-2';restores.push(()=>{material.onBeforeCompile=before;material.customProgramCacheKey=key;material.needsUpdate=true;});
  }material.needsUpdate=true;
 });
 const root=new T.Group();root.name='castle-performance';root.visible=false;scene.add(root);
 const positions=[],uvs=[],origins=[],directions=[],designs=[],extents=[],indices=[];
 // Low quality retains symmetrical broad ground beams and timed accents. Additional
 // window/rear fixtures fill the composition without adding dynamic lights.
 const order=[0,1,2,3,4,5,8,9,12,13,22,23,10,11,6,7,14,15,16,17,18,19,20,21];
 for(const [id,index]of order.entries()){
  const e=castleBeamEmitters[index];
  for(let cross=0;cross<1;cross++){const base=positions.length/3;for(const [u,v]of [[-1,0],[1,0],[-1,1],[1,1]]){
   positions.push(u,v,cross);uvs.push(u,v);origins.push(...e.position);directions.push(...e.direction);designs.push(id,castleBeamGroups.indexOf(e.group),e.accent?1:0,e.width);extents.push(e.length);
  }indices.push(base,base+1,base+2,base+1,base+3,base+2);}
 }
 const g=new T.BufferGeometry();for(const [name,data,size]of [['position',positions,3],['uv',uvs,2],['origin',origins,3],['direction',directions,3],['design',designs,4],['extent',extents,1]])g.setAttribute(name,new T.Float32BufferAttribute(data,size));g.setIndex(indices);
 const beamDirections=Array.from({length:24},()=>new T.Vector4()),beamSpreads=new Float32Array(24),lightState={},lightOptions={};
 const beamUniforms={...uniforms,count:{value:24},beamDirections:{value:beamDirections},beamSpreads:{value:beamSpreads}};
 const material=new T.ShaderMaterial({uniforms:beamUniforms,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:true,
 vertexShader:`attribute float extent;attribute vec3 origin;attribute vec4 design;uniform float count;uniform vec4 beamDirections[24];uniform float beamSpreads[24];uniform float showGroups[6];varying vec2 vUv;varying float strength;varying float laser;varying float group;varying float fan;varying float viewDistance;void main(){
 vUv=uv;laser=design.z;group=design.y;int index=int(design.x);vec4 beam=beamDirections[index];vec3 aim=beam.xyz,eye=cameraPosition-(modelMatrix*vec4(origin,1.)).xyz;
 vec3 across=cross(aim,normalize(eye));if(length(across)<.01)across=cross(aim,vec3(0.,0.,1.));across=normalize(across);
 fan=(group==1.||group==3.)?1.:0.;float width=.12+uv.y*design.w*beamSpreads[index];
 vec3 p=origin+aim*(uv.y*extent)+across*uv.x*width;vec4 mv=modelViewMatrix*vec4(p,1.);viewDistance=length(mv.xyz);
 gl_Position=projectionMatrix*mv;strength=design.x<count?showGroups[int(group)]*beam.w:0.;
 }`,
 fragmentShader:`uniform float showPower;uniform vec3 showPalette[3];varying vec2 vUv;varying float strength;varying float laser;varying float group;varying float fan;varying float viewDistance;void main(){
 float feather=1.-smoothstep(.45,1.,abs(vUv.x));float soft=exp(-vUv.x*vUv.x*3.5)*feather*.13;
 // Interpolated UVs may exceed one by an ulp at the far edge. A negative
 // fractional power becomes NaN and contaminates HDR bloom with black blocks.
 float ribbon=exp(-vUv.x*vUv.x*2.8)*feather*(.12+.025*cos(vUv.x*9.));float core=mix(soft,ribbon*.65,fan)*mix(1.,1.1,laser),fade=pow(clamp(1.-vUv.y,0.,1.),1.6)*smoothstep(0.,.065,vUv.y)*(1.-smoothstep(.65,.98,vUv.y));
 float attenuation=1./(1.+pow(viewDistance/420.,2.));vec3 tint=mix(showPalette[2],mix(showPalette[0],showPalette[1],mod(group,2.)*.7),smoothstep(.05,.85,vUv.y));
 float alpha=core*fade*strength*showPower*attenuation*.4;if(!(alpha>.001))discard;gl_FragColor=vec4(tint*mix(1.4,2.2,laser),alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 // Physical ground fixtures anchor the beams; one shared geometry/material batch.
 const fixtureGeo=new T.CylinderGeometry(.3,.42,.35,8),fixtureMat=new T.MeshStandardMaterial({color:'#263442',roughness:.75});
 const groundFixtures=castleBeamEmitters.filter(e=>!e.laser),fixtures=new T.InstancedMesh(fixtureGeo,fixtureMat,groundFixtures.length),dummy=new T.Object3D();
 groundFixtures.forEach((e,i)=>{dummy.position.set(e.position[0]+castleLayout.x,e.position[1]-.1,e.position[2]);dummy.updateMatrix();fixtures.setMatrixAt(i,dummy.matrix);});fixtures.name='show-ground-fixtures';root.add(fixtures);
 const beams=new T.Mesh(g,material);beams.name='castle-laser-fan';beams.frustumCulled=false;root.add(beams);
 // Two real, shadow-free washes illuminate the stone and nearby architecture.
 // Keep the light count visible even at zero intensity between shows. Hiding them
 // under the effects root recompiles every lit material when a show starts/stops.
 const washes=[-1,1].map(side=>{const lamp=new T.SpotLight('#bddfff',0,85,.56,.85,1.7);lamp.name='castle-surface-wash';lamp.position.set(castleLayout.x+side*22,1.6,8);lamp.target.position.set(castleLayout.x+side*7,19,-17);lamp.castShadow=false;scene.add(lamp,lamp.target);return lamp;});
 // Architectural projection supplies surface sparkle without free-floating ground orbs.
 beams.position.x=castleLayout.x;
 return{root,uniforms,update(age,{active=false,still=false,quality='high',musicId,duration=74}={}){
  root.visible=active;uniforms.showTime.value=Math.max(0,age);uniforms.showPower.value=active?showEnvelope(age,duration)*(still?.45:1):0;uniforms.showCalm.value=still?1:0;
  for(const lamp of washes)lamp.intensity=0;
  if(!active)return;
  const track=showTrack(musicId),{cue,previous,mix,index,previousIndex:prevIndex}=sampleCastleCue(age,state,musicId);
  for(let i=0;i<3;i++)uniforms.showPalette.value[i].copy(palettes[prevIndex][i]).lerp(palettes[index][i],mix);
  for(let i=0;i<10;i++)uniforms.showRegions.value[i]=blend(previous.regions[i],cue.regions[i],mix);
  for(let i=0;i<6;i++)uniforms.showGroups.value[i]=blend(previous.beams.groups.includes(castleBeamGroups[i])?1:0,cue.beams.groups.includes(castleBeamGroups[i])?1:0,mix);
  uniforms.showMode.value=castleProjectionModes.indexOf(cue.projection);uniforms.showPreviousMode.value=castleProjectionModes.indexOf(previous.projection);uniforms.showMix.value=mix;
  uniforms.showBeat.value=(track?.bpm??cue.beat.bpm)/60;uniforms.showBeatOffset.value=track?.offset??cue.beat.offset;uniforms.showLaser.value=blend(previous.beams.laser,cue.beams.laser,mix);uniforms.showSweep.value=blend(previous.beams.sweep,cue.beams.sweep,mix);
  const tier=cue.quality[quality]||castleShowQuality.medium;beamUniforms.count.value=tier.beams;
  lightOptions.bpm=track?.bpm??cue.beat.bpm;lightOptions.offset=track?.offset??cue.beat.offset;lightOptions.sweep=uniforms.showSweep.value;lightOptions.laser=uniforms.showLaser.value;lightOptions.calm=still;lightOptions.finale=cue.id==='luminous-finale';lightOptions.afterglow=!!track?.sections.find(s=>age>=s.start&&age<s.end)?.afterglow;
  for(let i=0;i<order.length;i++){sampleCastleLight(age,castleBeamEmitters[order[i]],lightOptions,lightState);beamDirections[i].set(lightState.x,lightState.y,lightState.z,lightState.level);beamSpreads[i]=lightState.spread;}

  for(let i=0;i<washes.length;i++){const lamp=washes[i];lamp.color.copy(uniforms.showPalette.value[i]);lamp.intensity=lightOptions.afterglow?0:uniforms.showPower.value*(still?18:75+45*Math.sin(age*.6+i)**2)*(quality==='low'?.6:1);lamp.target.position.y=19+(still?0:Math.sin(age*.21+i)*5);}
 },dispose(){restores.forEach(fn=>fn());g.dispose();material.dispose();fixtureGeo.dispose();fixtureMat.dispose();washes.forEach(l=>{l.removeFromParent();l.target.removeFromParent();l.dispose();});root.removeFromParent();}};
}
