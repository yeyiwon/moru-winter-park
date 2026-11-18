import * as THREE from './vendor/three.module.js';

// A closed, softly inflated shape keeps the symbols readable without a sharp
// extruded rim. Built once per companion; animation only changes its transform.
export function createClayEye(kind){
 const outline=new THREE.Shape();
 if(kind==='heart'){
  outline.moveTo(0,-.95);
  outline.bezierCurveTo(-.22,-.84,-1,-.29,-1,.28);
  outline.bezierCurveTo(-1,.94,-.36,1.13,0,.57);
  outline.bezierCurveTo(.36,1.13,1,.94,1,.28);
  outline.bezierCurveTo(1,-.29,.22,-.84,0,-.95);
 }else{
  const points=Array.from({length:10},(_,i)=>{const a=Math.PI/2+i*Math.PI/5,r=i%2?.51:1;return new THREE.Vector2(Math.cos(a)*r,Math.sin(a)*r);});
  points.forEach((point,i)=>{
   const entry=point.clone().lerp(points[(i+9)%10],.2),exit=point.clone().lerp(points[(i+1)%10],.2);
   i?outline.lineTo(entry.x,entry.y):outline.moveTo(entry.x,entry.y);
   outline.quadraticCurveTo(point.x,point.y,exit.x,exit.y);
  });
 }
 outline.closePath();
 const contour=outline.getSpacedPoints(80).slice(0,-1);
 if(THREE.ShapeUtils.isClockWise(contour))contour.reverse();
 const bounds=new THREE.Box2().setFromPoints(contour),center=bounds.getCenter(new THREE.Vector2()),scale=.27/bounds.getSize(new THREE.Vector2()).x;
 contour.forEach(point=>point.sub(center).multiplyScalar(scale));
 const positions=[],indices=[],edges=[];
 const vertex=(x,y,z)=>{positions.push(x,y,z);return positions.length/3-1;};
 for(const front of [true,false]){
  const z=radius=>(front?1:-1)*(.005+.027*Math.sqrt(1-radius*radius));
  const pole=vertex(0,0,z(0)),rings=[];
  for(const radius of [.15,.3,.45,.6,.73,.84,.92,.97,1])rings.push(contour.map(p=>vertex(p.x*radius,p.y*radius,z(radius))));
  for(let i=0;i<contour.length;i++){
   const next=(i+1)%contour.length;
   const face=(a,b,c)=>front?indices.push(a,b,c):indices.push(a,c,b);
   face(pole,rings[0][i],rings[0][next]);
   for(let row=1;row<rings.length;row++){
    face(rings[row-1][i],rings[row][i],rings[row][next]);
    face(rings[row-1][i],rings[row][next],rings[row-1][next]);
   }
  }
  edges.push(rings.at(-1));
 }
 for(let i=0;i<contour.length;i++){
  const next=(i+1)%contour.length;
  indices.push(edges[0][i],edges[1][i],edges[1][next],edges[0][i],edges[1][next],edges[0][next]);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);
 geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 return geometry;
}
