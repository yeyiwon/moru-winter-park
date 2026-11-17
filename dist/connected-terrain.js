import * as T from './vendor/three.module.js';
import {snowfieldDistance} from './world-layout.js';
import {alpineHeight} from './resort-layout.js';
// One low, continuous landform replaces the suspended pedestals between districts.
export function buildConnectedTerrain(scene){
 const p=[],colors=[],index=[],step=2,x0=-106,z0=-162,nx=124,nz=163;
 const white=new T.Color('#e4eeed'),shade=new T.Color('#bfccce');
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const x=x0+i*step,z=z0+j*step,d=snowfieldDistance(x,z),edge=Math.max(0,Math.min(1,(d+1)/6)),y=Math.hypot(x,z+260)<144?alpineHeight(x,z)-.006:.085-edge*edge*9;
  p.push(x,y,z);const c=white.clone().lerp(shade,edge*.8+.018*(1+Math.sin(x*.13)*Math.cos(z*.11)));colors.push(c.r,c.g,c.b);
 }
 const pools=[{x:-10,z:124,rx:9,rz:8},{x:-19,z:132,rx:5.4,rz:4.8}];
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
  const x=x0+(i+.5)*step,z=z0+(j+.5)*step;
  if(snowfieldDistance(x,z)>4||Math.hypot(x,z+260)<140||pools.some(o=>((x-o.x)/o.rx)**2+((z-o.z)/o.rz)**2<1))continue;
  const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;index.push(a,c,b,b,c,d);
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(index);geo.computeVertexNormals();
 const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:1}));mesh.name='connected-winter-landscape';mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
