import * as T from './vendor/three.module.js';
import {landforms,landRadius} from './world-layout.js';
// Snow caps and stratified cliffs share the same outlines used by movement and the map.
export function buildConnectedTerrain(scene){
 const root=new T.Group();root.name='floating-winter-archipelago';
 const snow=new T.MeshStandardMaterial({vertexColors:true,roughness:1}),rock=new T.MeshStandardMaterial({vertexColors:true,roughness:.94});
 for(const form of landforms){
  const n=96,rings=18,p=[],c=[],idx=[],white=new T.Color('#e5efee'),blue=new T.Color('#b9cdd7');
  for(let ring=0;ring<=rings;ring++)for(let i=0;i<=n;i++){
   const a=i/n*Math.PI*2,r=ring/rings,edge=landRadius(form,a);p.push(form.x+Math.cos(a)*form.rx*edge*r,.085-(r>.97?(r-.97)*1.8:0),form.z+Math.sin(a)*form.rz*edge*r);
   const color=white.clone().lerp(blue,.08+.12*r**6+.03*Math.sin(a*5));c.push(color.r,color.g,color.b);
  }
  const pools=[{x:-10,z:124,rx:9,rz:8},{x:-19,z:132,rx:5.4,rz:4.8}];
  if(form.id!=='alpine')for(let j=0;j<rings;j++)for(let i=0;i<n;i++){
   const a=j*(n+1)+i,b=a+1,d=a+n+1,e=d+1,x=(p[a*3]+p[e*3])/2,z=(p[a*3+2]+p[e*3+2])/2;
   if(pools.some(o=>((x-o.x)/o.rx)**2+((z-o.z)/o.rz)**2<1))continue;idx.push(a,b,d,b,e,d);
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('color',new T.Float32BufferAttribute(c,3));geo.setIndex(idx);geo.computeVertexNormals();const cap=new T.Mesh(geo,snow);cap.name='snow-cap-'+form.id;cap.receiveShadow=true;root.add(cap);
  const rp=[],rc=[],ri=[],levels=[0,.1,.28,.52,.75,1],radii=[1,1.01,.96,.79,.58,.28];
  for(let j=0;j<levels.length;j++)for(let i=0;i<=n;i++){
   const a=i/n*Math.PI*2,noise=Math.sin(a*7+form.phase)*.025+Math.sin(a*13)*.018,r=landRadius(form,a)*radii[j]+(j?noise:0),y=-.03-form.depth*levels[j]+(j?Math.sin(a*5+form.phase)*.8:0);
   rp.push(form.x+Math.cos(a)*form.rx*r,y,form.z+Math.sin(a)*form.rz*r);
   const shade=new T.Color(j<2?'#8297ac':j%2?'#344758':'#485b6a');shade.multiplyScalar(.88+.12*Math.sin(a*9));rc.push(shade.r,shade.g,shade.b);
   if(j<levels.length-1&&i<n){const k=j*(n+1)+i;ri.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1);}
  }
  const cliff=new T.BufferGeometry();cliff.setAttribute('position',new T.Float32BufferAttribute(rp,3));cliff.setAttribute('color',new T.Float32BufferAttribute(rc,3));cliff.setIndex(ri);cliff.computeVertexNormals();const wall=new T.Mesh(cliff,rock);wall.name='layered-cliff-'+form.id;root.add(wall);
 }
 scene.add(root);return root;
}
