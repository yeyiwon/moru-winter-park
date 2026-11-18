import * as T from './vendor/three.module.js';
let shared;
function resources(){
 if(shared)return shared;
 const parts=[];
 for(const side of [-1,1]){
  parts.push(new T.TorusGeometry(.155,.014,8,36).translate(side*.225,.075,.81));
  parts.push(new T.TubeGeometry(new T.CatmullRomCurve3([[side*.38,.12,.79],[side*.57,.13,.4],[side*.66,.04,-.1]].map(p=>new T.Vector3(...p))),16,.012,6));
 }
 parts.push(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-.07,.085,.82),new T.Vector3(0,.12,.84),new T.Vector3(.07,.085,.82)]),12,.012,6));
 const frame=new T.BufferGeometry();for(const key of ['position','normal','uv']){const values=[];for(const part of parts){const p=part.toNonIndexed();values.push(...p.attributes[key].array);p.dispose();}frame.setAttribute(key,new T.Float32BufferAttribute(values,key==='uv'?2:3));}parts.forEach(p=>p.dispose());
 shared={frame,white:new T.SphereGeometry(1,24,18),pupil:new T.SphereGeometry(1,20,14),rim:new T.MeshStandardMaterial({color:'#171b23',roughness:.65,metalness:.02}),sclera:new T.MeshStandardMaterial({color:'#fff9ec',roughness:.7}),ink:new T.MeshPhysicalMaterial({color:'#131b26',roughness:.28,clearcoat:.45})};
 Object.values(shared).forEach(r=>r.userData.shared=true);return shared;
}
export function createGooglyGlasses(parent){
 const r=resources(),root=new T.Group();root.name='googly-glasses';root.visible=false;parent.add(root);root.add(new T.Mesh(r.frame,r.rim));
 const whites=new T.InstancedMesh(r.white,r.sclera,2),pupils=new T.InstancedMesh(r.pupil,r.ink,2),m=new T.Object3D();pupils.instanceMatrix.setUsage(T.DynamicDrawUsage);pupils.frustumCulled=false;root.add(whites,pupils);
 for(let i=0;i<2;i++){m.position.set((i?1:-1)*.225,.075,.802);m.scale.set(.143,.143,.052);m.updateMatrix();whites.setMatrixAt(i,m.matrix);}whites.instanceMatrix.needsUpdate=true;
 let lastTime=0,lastYaw=0,x=0,y=-.024,vx=0,vy=0;
 return {root,update({time=0,yaw=0,walking=false,phase=0,still=false}){
  if(!root.visible){lastTime=0;return;}const dt=lastTime?Math.min(.035,Math.max(0,time-lastTime)):0,turn=lastTime?Math.atan2(Math.sin(yaw-lastYaw),Math.cos(yaw-lastYaw)):0;lastTime=time;lastYaw=yaw;
  const tx=still?0:Math.max(-.047,Math.min(.047,-turn*.45+(walking?Math.sin(phase)*.025:0))),ty=still?-.024:walking?-.02+Math.cos(phase*2)*.021:-.024;
  vx+=(tx-x)*85*dt;vy+=(ty-y)*85*dt;vx*=Math.exp(-dt*10);vy*=Math.exp(-dt*10);x+=vx*dt;y+=vy*dt;const len=Math.hypot(x,y);if(len>.062){x*=.062/len;y*=.062/len;}if(still){x=0;y=-.024;vx=vy=0;}
  for(let i=0;i<2;i++){m.position.set((i?1:-1)*.225+x,.075+y,.857);m.scale.set(.061,.068,.019);m.updateMatrix();pupils.setMatrixAt(i,m.matrix);}pupils.instanceMatrix.needsUpdate=true;
 }};
}
