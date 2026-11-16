import * as T from './vendor/three.module.js';
import {islands,surfaceHeight} from './world-layout.js';
export function createFootprints(scene){
 const limit=40,geometry=new T.PlaneGeometry(1,1),fade=new T.InstancedBufferAttribute(new Float32Array(limit),1);geometry.setAttribute('footFade',fade);
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,vertexShader:'attribute float footFade; varying float opacity; varying vec2 coord; void main(){opacity=footFade;coord=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}',fragmentShader:'varying float opacity; varying vec2 coord; void main(){float edge=1.0-smoothstep(.60,1.0,length((coord-.5)*2.0));gl_FragColor=vec4(.25,.33,.39,opacity*edge);}',toneMapped:false});
 const marks=new T.InstancedMesh(geometry,material,limit);marks.name='temporary-snow-footprints';marks.frustumCulled=false;scene.add(marks);
 const stamps=Array.from({length:limit},()=>-99),matrix=new T.Object3D(),paths=[];scene.traverse(o=>{if(o.userData.snowPathSamples)paths.push(...o.userData.snowPathSamples);});let cursor=0,side=1,distance=0;
 function snowy(x,z){return islands.some(i=>Math.hypot(x-i.x,z-i.z)<i.r-2)&&!(x>2&&x<22&&z>116&&z<134)&&!paths.some(p=>Math.hypot(x-p.x,z-p.z)<p.r);}
 return{update(time){let visible=false;for(let i=0;i<limit;i++){const age=time-stamps[i];fade.setX(i,age<7?.27*(1-Math.max(0,(age-2)/5)):0);visible||=age<7;}fade.needsUpdate=true;marks.visible=visible;},walk(x,z,yaw,travel,time){distance+=travel;if(distance<.65)return;distance%=.65;side=-side;const px=x+Math.cos(yaw)*side*.21,pz=z-Math.sin(yaw)*side*.21;if(!snowy(px,pz))return;matrix.position.set(px,surfaceHeight(px,pz)+.018,pz);matrix.rotation.set(-Math.PI/2,0,-yaw+side*.07);matrix.scale.set(.25,.43,1);matrix.updateMatrix();marks.setMatrixAt(cursor,matrix.matrix);stamps[cursor]=time;cursor=(cursor+1)%limit;marks.instanceMatrix.needsUpdate=true;}};
}
