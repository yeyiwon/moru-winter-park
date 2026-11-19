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
float projectionPattern(float mode,vec3 p,float t){
 vec2 frost=p.xy*.72;float crystal=1.;
 for(int i=0;i<3;i++){float a=float(i)*1.047198;crystal=min(crystal,abs(sin(dot(frost,vec2(cos(a),sin(a)))+t*.13)));}
 float ice=(1.-smoothstep(.025,.095,crystal))*(.35+.65*pow(.5+.5*sin(p.y*.22-t*.55),3.));
 float arch=exp(-abs(length(vec2(p.x,(p.y-7.3)*1.1))-4.6)*6.)*smoothstep(6.8,7.4,p.y);
 arch+=exp(-abs(abs(p.x)-4.65)*8.)*(1.-smoothstep(7.1,7.8,p.y));
 float flow=arch*(.4+.6*pow(.5+.5*sin(p.y*.6+abs(p.x)*.3-t*1.8),5.));
 float aurora=pow(.5+.5*sin(p.y*.32+p.x*.2+sin(p.z*.4+t*.3)*1.1-t*.55),6.);
 float spiral=pow(.5+.5*sin(atan(p.z+5.,p.x+.00001)*3.+p.y*.6-t*1.7),18.);
 vec2 cell=floor(p.xy*.6);vec2 st=fract(p.xy*.6)-.5;float hash=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);
 float stars=exp(-dot(st,st)*100.)*pow(.5+.5*sin(t*1.7+hash*30.),8.);
 if(mode<.5)return ice;if(mode<1.5)return flow+.14*ice;if(mode<2.5)return aurora+.12*flow;if(mode<3.5)return spiral+.3*flow;return stars+flow*.35+aurora*.15;
}
vec3 castleProjection(float finish){
 float t=mix(showTime,5.,showCalm),r=floor(vShowRegion+.5);
 vec3 tint=showPalette[0];if(mod(r,3.)>.5)tint=showPalette[1];if(mod(r,3.)>1.5)tint=showPalette[2];
 float pattern=mix(projectionPattern(showPreviousMode,showP,t),projectionPattern(showMode,showP,t),showMix);
 float breathe=.85+.15*sin(t*.6+r*.9),level=showRegions[int(r)];
 // Low base illumination preserves stone shadows; the moving detail carries the colour.
 float energy=(.065+pattern*.52)*level*breathe;
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
 // Low quality retains symmetrical ground beams and timed lasers. Additional
 // window/rear fixtures fill the composition without adding dynamic lights.
 const order=[0,1,2,3,4,5,8,9,12,13,22,23,10,11,6,7,14,15,16,17,18,19,20,21];
 for(const [id,index]of order.entries()){
  const e=castleBeamEmitters[index];
  for(let cross=0;cross<4;cross++){const base=positions.length/3;for(const [u,v]of [[-1,0],[1,0],[-1,1],[1,1]]){
   positions.push(u,v,cross);uvs.push(u,v);origins.push(...e.position);directions.push(...e.direction);designs.push(id,castleBeamGroups.indexOf(e.group),e.laser?1:0,e.width);extents.push(e.length);
  }indices.push(base,base+1,base+2,base+1,base+3,base+2);}
 }
 const g=new T.BufferGeometry();for(const [name,data,size]of [['position',positions,3],['uv',uvs,2],['origin',origins,3],['direction',directions,3],['design',designs,4],['extent',extents,1]])g.setAttribute(name,new T.Float32BufferAttribute(data,size));g.setIndex(indices);
 const beamUniforms={...uniforms,count:{value:24}};
 const material=new T.ShaderMaterial({uniforms:beamUniforms,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:true,
 vertexShader:`attribute float extent;attribute vec3 origin;attribute vec3 direction;attribute vec4 design;uniform float showTime;uniform float showCalm;uniform float count;uniform float showSweep;uniform float showGroups[6];varying vec2 vUv;varying float strength;varying float laser;varying float group;void main(){
 vUv=uv;laser=design.z;group=design.y;float t=mix(showTime,5.,showCalm),side=sign(origin.x);
 vec3 aim=direction;aim.x+=side*sin(t*.16+group*.8)*showSweep*.48;aim.z+=cos(t*.12+group*.6)*showSweep*.25;aim=normalize(aim);
 vec3 across=normalize(cross(aim,vec3(0.,0.,1.))),other=cross(aim,across);
 float width=.04+uv.y*design.w,length=extent;
 vec3 p=origin+aim*(uv.y*length)+(across*cos(position.z*.785398)+other*sin(position.z*.785398))*uv.x*width;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);strength=design.x<count?showGroups[int(group)]:0.;
 }`,
 fragmentShader:`uniform float showPower;uniform float showTime;uniform float showCalm;uniform vec3 showPalette[3];uniform float showBeat;uniform float showBeatOffset;uniform float showLaser;varying vec2 vUv;varying float strength;varying float laser;varying float group;void main(){
 float core=mix(exp(-vUv.x*vUv.x*4.)*.075,exp(-abs(vUv.x)*11.)*.55,laser),fade=(1.-smoothstep(.3,1.,vUv.y))*smoothstep(0.,.015,vUv.y);
 float beat=1.-smoothstep(.06,.24,fract((showTime-showBeatOffset)*showBeat)),pulse=mix(.55+.45*pow(.5+.5*sin(showTime*.45+group*1.3),2.),beat*showLaser,laser);
 pulse=mix(pulse,laser>.5?0.:.38,showCalm);
 vec3 tint=mix(showPalette[0],showPalette[2],mod(group,2.)*.7);
 float alpha=core*fade*strength*showPower*pulse;if(alpha<.002)discard;gl_FragColor=vec4(tint*1.6,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 const beams=new T.Mesh(g,material);beams.name='castle-laser-fan';beams.frustumCulled=false;root.add(beams);
 // Architectural projection supplies surface sparkle without free-floating ground orbs.
 beams.position.x=castleLayout.x;
 return{root,uniforms,update(age,{active=false,still=false,quality='high',musicId,duration=74}={}){
  root.visible=active;uniforms.showTime.value=Math.max(0,age);uniforms.showPower.value=active?showEnvelope(age,duration)*(still?.45:1):0;uniforms.showCalm.value=still?1:0;
  if(!active)return;
  const track=showTrack(musicId),{cue,previous,mix,index,previousIndex:prevIndex}=sampleCastleCue(age,state,musicId);
  for(let i=0;i<3;i++)uniforms.showPalette.value[i].copy(palettes[prevIndex][i]).lerp(palettes[index][i],mix);
  for(let i=0;i<10;i++)uniforms.showRegions.value[i]=blend(previous.regions[i],cue.regions[i],mix);
  for(let i=0;i<6;i++)uniforms.showGroups.value[i]=blend(previous.beams.groups.includes(castleBeamGroups[i])?1:0,cue.beams.groups.includes(castleBeamGroups[i])?1:0,mix);
  uniforms.showMode.value=castleProjectionModes.indexOf(cue.projection);uniforms.showPreviousMode.value=castleProjectionModes.indexOf(previous.projection);uniforms.showMix.value=mix;
  uniforms.showBeat.value=(track?.bpm??cue.beat.bpm)/60;uniforms.showBeatOffset.value=track?.offset??cue.beat.offset;uniforms.showLaser.value=blend(previous.beams.laser,cue.beams.laser,mix);uniforms.showSweep.value=blend(previous.beams.sweep,cue.beams.sweep,mix);
  const tier=cue.quality[quality]||castleShowQuality.medium;beamUniforms.count.value=tier.beams;
 },dispose(){restores.forEach(fn=>fn());g.dispose();material.dispose();root.removeFromParent();}};
}
