import * as T from './vendor/three.module.js';

// One reusable two-material mesh, rather than a draw call for every kernel.
export function createPopcornGeometry(){
 const bucket=new T.LatheGeometry([[0,-.17],[.12,-.17],[.17,.13],[.155,.14],[.108,-.15],[0,-.15]].map(p=>new T.Vector2(...p)),24);
 const cream=[new T.TorusGeometry(.164,.012,6,24).rotateX(Math.PI/2).translate(0,.135,0)];
 for(let i=0;i<8;i++){
  const a=i/8*Math.PI*2,points=[];
  for(const [r,y]of [[.121,-.165],[.169,.128]])for(const side of [-1,1])points.push(r*Math.sin(a+side*.085),y,r*Math.cos(a+side*.085));
  const stripe=new T.BufferGeometry();stripe.setAttribute('position',new T.Float32BufferAttribute(points,3));stripe.setIndex([0,2,1,1,2,3]);stripe.computeVertexNormals();stripe.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,0,1,1,1],2));cream.push(stripe);
 }
 for(let i=0;i<27;i++){
  const a=i*2.399,r=Math.sqrt((i+.5)/27)*.142,x=Math.sin(a)*r,z=Math.cos(a)*r,y=.14+(1-r/.16)*.055;
  cream.push(new T.SphereGeometry(.035,8,6).scale(1,1.15,.9).rotateZ(a).translate(x,y,z));
  if(i%3===0)cream.push(new T.SphereGeometry(.021,6,5).translate(x+.021,y+.018,z));
 }
 const geometry=new T.BufferGeometry(),arrays={position:[],normal:[],uv:[]};let count=0;
 for(const [material,parts]of [[0,[bucket]],[1,cream]]){const start=count;for(const part of parts){const source=part.index?part.toNonIndexed():part;for(const key in arrays)arrays[key].push(...source.attributes[key].array);count+=source.attributes.position.count;if(source!==part)source.dispose();part.dispose();}geometry.addGroup(start,count-start,material);}
 for(const [key,data]of Object.entries(arrays))geometry.setAttribute(key,new T.Float32BufferAttribute(data,key==='uv'?2:3));
 geometry.computeBoundingSphere();return geometry;
}
