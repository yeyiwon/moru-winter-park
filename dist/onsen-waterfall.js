import * as T from './vendor/three.module.js';

export const cascadeAnchors=[
 {top:[-19.2,2.83,136.04],bottom:[-19.4,1.46,135.5],width:1.3},
 {top:[-19.4,1.46,135.48],bottom:[-19.5,.04,134.55],width:1.65}
];
// UV.y increases DOWN the sheet; a constant phase travels toward larger UV.y.
export const cascadePhase=(down,time,speed=1)=>down-time*speed;
export function cascadePoint(a,down){const t=Math.max(0,Math.min(1,down));return a.top.map((v,i)=>v+(a.bottom[i]-v)*t+(i===2?Math.sin(t*Math.PI)*-.08:0));}
export function createOnsenWaterfall(parent){
 const root=new T.Group();root.name='onsen-waterfall';root.userData.keepGroup=true;parent.add(root);const time={value:0},layers=[];
 const sheet=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time},
  vertexShader:`uniform float time;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.z+=sin(uv.x*25.+uv.y*12.-time*3.)*.008*sin(uv.y*3.14159);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader:`uniform float time;varying vec2 vUv;void main(){float down=vUv.y;float flow=down-time*(1.25+.1*sin(vUv.x*17.));float fine=down-time*.85;
   float thread=pow(.5+.5*sin(vUv.x*63.+sin(flow*12.)*.7),3.);float strand=.5+.5*sin(vUv.x*119.+sin(fine*23.)*.35);float pulse=.6+.4*sin(flow*30.+vUv.x*7.);
   float edge=smoothstep(0.,.1,vUv.x)*(1.-smoothstep(.9,1.,vUv.x));float ends=smoothstep(0.,.035,down)*(1.-smoothstep(.94,1.,down));float alpha=edge*ends*(.08+thread*.24+strand*pulse*.14);vec3 color=mix(vec3(.24,.43,.48),vec3(.72,.86,.83),thread*.65+strand*.35);
   gl_FragColor=vec4(color,alpha);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
 for(const a of cascadeAnchors)for(let layer=0;layer<2;layer++){
  const positions=[],uv=[],index=[],rows=28,columns=12;
  for(let y=0;y<=rows;y++){const t=y/rows,p=cascadePoint(a,t);for(let x=0;x<=columns;x++){const u=x/columns;positions.push(p[0]+(u-.5)*a.width*(.9+t*.2),p[1],p[2]+Math.sin(u*Math.PI*4+t*5)*.018-layer*.025);uv.push(u,t);if(y<rows&&x<columns){const k=y*(columns+1)+x;index.push(k,k+1,k+columns+1,k+1,k+columns+2,k+columns+1);}}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();const m=new T.Mesh(g,sheet);m.name='downward-water-sheet';root.add(m);layers.push(m);
 }
 const pos=[],data=[];for(let i=0;i<84;i++){const a=cascadeAnchors[i%2],seed=((i*47)%83)/83;pos.push(...a.top);data.push(seed,a.top[1]-a.bottom[1],a.bottom[2]-a.top[2],a.width);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('aData',new T.Float32BufferAttribute(data,4));g.computeBoundingSphere();g.boundingSphere.radius+=3;
 const droplets=new T.Points(g,new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time},vertexShader:`uniform float time;attribute vec4 aData;varying float vAlpha;void main(){float life=fract(aData.x+time*(.65+aData.x*.22));float fall=life*.25+life*life*.75;vec3 p=position;p.x+=(aData.x-.5)*aData.w*.85;p.y-=fall*aData.y;p.z+=fall*aData.z-.03;vAlpha=sin(life*3.14159)*.33;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(24./max(1.,-mv.z),1.,4.);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying float vAlpha;void main(){vec2 p=(gl_PointCoord-.5)*2.;float a=exp(-dot(p,p)*3.)*(1.-smoothstep(.65,1.,length(p)));gl_FragColor=vec4(.78,.89,.86,a*vAlpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`}));droplets.name='falling-water-droplets';root.add(droplets);
 const sprayGeo=new T.BufferGeometry(),spray=[];for(let i=0;i<36;i++)spray.push((i*13%37)/37,(i*7%31)/31,(i*19%41)/41);sprayGeo.setAttribute('position',new T.Float32BufferAttribute(spray,3));
 const sprayMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time},vertexShader:`uniform float time;varying float vAlpha;void main(){float age=fract(position.x+time*.85);float angle=position.y*6.28318;float speed=.35+position.z*.5;vec3 p=vec3(-19.5+cos(angle)*speed*age,.06+(.65+position.z*.4)*age-1.05*age*age,134.55+sin(angle)*speed*age);p.y=max(.035,p.y);vAlpha=sin(age*3.14159)*.45;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(28./max(1.,-mv.z),1.,5.);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(.84,.89,.84,exp(-d*d*3.)*(1.-smoothstep(.7,1.,d))*vAlpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 const sprayPoints=new T.Points(sprayGeo,sprayMat);sprayPoints.frustumCulled=false;sprayPoints.name='cascade-impact-spray';root.add(sprayPoints);
 return{root,setQuality(q){layers.forEach((m,i)=>m.visible=q!=='low'||i%2===0);g.setDrawRange(0,q==='low'?24:q==='medium'?48:84);sprayGeo.setDrawRange(0,q==='low'?10:q==='medium'?22:36);},update(t,still=false){if(!still&&Number.isFinite(t))time.value=t;}};
}
