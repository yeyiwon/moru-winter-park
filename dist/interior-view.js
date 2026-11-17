import * as T from './vendor/three.module.js';
import {interiorRooms} from './interior-layout.js';
import {museumLayout,conservatoryLayout} from './district-layout.js';
const anchors={ryokan:{x:12,z:86,yaw:Math.PI,scale:.55,rx:6.4,rz:6},museum:{...museumLayout,yaw:0,scale:.67},conservatory:{...conservatoryLayout,yaw:0,scale:.77}};
export function outdoorViewPosition(id,position){const room=interiorRooms[id],a=anchors[id];if(!room||!a)return null;const x=(position.x-room.x)*a.scale,z=(position.z-room.z)*a.scale,c=Math.cos(a.yaw),s=Math.sin(a.yaw);return{x:a.x+x*c+z*s,y:Math.max(1.5,position.y*a.scale),z:a.z+z*c-x*s};}
// A throttled second pass of the existing scene, not another renderer or a static backdrop.
export function createInteriorView({renderer,scene,interiors,exteriorNodes,exteriorVisibility,sky,world,lights}){
 let target=null,active=null,next=0,quality='medium';const camera=new T.PerspectiveCamera(),turn=new T.Quaternion(),axis=new T.Vector3(0,1,0),direction=new T.Vector3(),plane=new T.Plane();
 const uniforms={viewMap:{value:null}},material=new T.ShaderMaterial({uniforms,side:T.DoubleSide,depthWrite:true,vertexShader:'varying vec4 clipPosition;void main(){clipPosition=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=clipPosition;}',fragmentShader:`uniform sampler2D viewMap;varying vec4 clipPosition;void main(){vec2 uv=clipPosition.xy/clipPosition.w*.5+.5;gl_FragColor=vec4(texture2D(viewMap,clamp(uv,0.,1.)).rgb,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});material.name='live-outdoor-window';
 const windowMeshes=new Map(),stats={passes:0,width:0,height:0};
 function restore(){for(const [mesh,original]of windowMeshes)mesh.material=original;windowMeshes.clear();}
 function release(){restore();target?.dispose();target=null;uniforms.viewMap.value=null;active=null;}
 function render(id,mainCamera,time,still,brightness){
  if(!id){if(active)release();return;}
  const room=interiors.rooms[id];if(!room)return;
  if(active!==id){release();active=id;next=0;room.root.traverse(o=>{if(o.isMesh&&o.material.userData?.exteriorWindow){windowMeshes.set(o,o.material);o.material=material;}});}
  if(time<next||!windowMeshes.size)return;next=time+(quality==='low'?.25:.125);
  let visible=false;for(const mesh of windowMeshes.keys()){let node=mesh;while(node&&node.visible)node=node.parent;if(!node){visible=true;break;}}if(!visible)return;
  const width=quality==='low'?384:quality==='high'?896:640,height=Math.round(width/mainCamera.aspect);
  if(!target||target.width!==width||target.height!==height){target?.dispose();target=new T.WebGLRenderTarget(width,height,{depthBuffer:true,stencilBuffer:false});uniforms.viewMap.value=target.texture;stats.width=width;stats.height=height;}
  const anchor=anchors[id],p=outdoorViewPosition(id,mainCamera.position);camera.copy(mainCamera);camera.position.set(p.x,p.y,p.z);turn.setFromAxisAngle(axis,anchor.yaw);camera.quaternion.premultiply(turn);camera.updateMatrixWorld();
  const saved=scene.children.map(o=>[o,o.visible]),background=scene.background.clone(),fog=scene.fog.clone(),environmentIntensity=scene.environmentIntensity,oldTarget=renderer.getRenderTarget(),clipping=renderer.clippingPlanes,shadow=renderer.shadowMap.needsUpdate,lightState=lights.map(l=>[l,l.intensity,l.color.clone(),l.position.clone()]);
  try{
   for(const o of scene.children)o.visible=exteriorNodes.includes(o)?exteriorVisibility.get(o)??true:lights.includes(o)||o.type==='Object3D';
   interiors.root.visible=false;world.update(time,still);sky.update(time,still,new T.Vector3(anchor.x,0,anchor.z),brightness,true);
   // Keep the outside facade from filling the entire window from the virtual interior camera.
   camera.getWorldDirection(direction);const planar=Math.hypot(direction.x,direction.z),extent=Math.max(anchor.rx,anchor.rz)+2;
   if(planar>.12){const point=new T.Vector3(anchor.x,0,anchor.z).addScaledVector(new T.Vector3(direction.x,0,direction.z).normalize(),extent);plane.setFromNormalAndCoplanarPoint(new T.Vector3(direction.x,0,direction.z).normalize(),point);renderer.clippingPlanes=[plane];}
   renderer.shadowMap.needsUpdate=false;renderer.setRenderTarget(target);renderer.render(scene,camera);stats.passes++;
  }finally{
   renderer.setRenderTarget(oldTarget);renderer.clippingPlanes=clipping;renderer.shadowMap.needsUpdate=shadow;
   for(const [node,visible]of saved)node.visible=visible;scene.background.copy(background);scene.fog.color.copy(fog.color);scene.fog.near=fog.near;scene.fog.far=fog.far;scene.environmentIntensity=environmentIntensity;
   for(const [l,intensity,color,position]of lightState){l.intensity=intensity;l.color.copy(color);l.position.copy(position);}
  }
 }
 return{render,stats,setQuality(q){quality=q;},dispose(){release();material.dispose();}};
}
