import {spaX,spaShift,alpineHeight} from './resort-layout.js';
import * as T from './vendor/three.module.js';
import {landforms,landRadius} from './world-layout.js';

// One outline drives the snow, rock skin, navigation boundary and map.
export function buildConnectedTerrain(scene){
 const root=new T.Group();root.name='floating-winter-archipelago';
 const snow=new T.MeshStandardMaterial({vertexColors:true,roughness:1}),rock=new T.MeshStandardMaterial({vertexColors:true,roughness:.94});
 for(const form of landforms){
  const n=form.id==='alpine'?320:128;
  const outline=Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2,r=landRadius(form,a);return new T.Vector2(form.x+Math.cos(a)*form.rx*r,-form.z-Math.sin(a)*form.rz*r);});
  if(form.id!=='alpine'){
   const shape=new T.Shape(outline);
   // Exact curved openings replace skipped polar cells, whose long edges left triangular gaps.
   if(form.id==='spa')for(const p of [{x:spaX+-10,z:124+spaShift,rx:7.9,rz:7},{x:spaX+-19,z:132+spaShift,rx:4.2,rz:3.7}]){
    const hole=new T.Path();hole.absellipse(p.x,-p.z,p.rx,p.rz,0,Math.PI*2,true);shape.holes.push(hole);
   }
   const geo=new T.ShapeGeometry(shape,48);geo.rotateX(-Math.PI/2);geo.translate(0,.085,0);
   const colors=[],white=new T.Color('#e5efee'),blue=new T.Color('#b9cdd7');for(let i=0;i<geo.attributes.position.count;i++){const p=geo.attributes.position,x=p.getX(i),z=p.getZ(i),c=white.clone().lerp(blue,.08+.04*Math.sin(x*.17+z*.1));colors.push(c.r,c.g,c.b);}geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
   const cap=new T.Mesh(geo,snow);cap.name='snow-cap-'+form.id;cap.receiveShadow=true;root.add(cap);
  }
  const positions=[],colors=[],indices=[],levels=[0,.045,.13,.28,.46,.65,.81,.94,1],radii=[1,1.006,.97,.89,.76,.59,.39,.17,.04];
  for(let j=0;j<levels.length;j++)for(let i=0;i<n;i++){
   const a=i/n*Math.PI*2,edge=landRadius(form,a),t=levels[j],noise=(Math.sin(a*7+form.phase)*.022+Math.sin(a*13-form.phase)*.012)*Math.sin(t*Math.PI),r=edge*radii[j]+noise;
   const x=form.x+Math.cos(a)*form.rx*r,z=form.z+Math.sin(a)*form.rz*r;
   const rim=form.id==='alpine'?alpineHeight(outline[i].x,-outline[i].y):.085;
   const y=rim*(1-t)**2-form.depth*t+Math.sin(a*5+form.phase)*.8*Math.sin(t*Math.PI);
   positions.push(x,y,z);const color=new T.Color(j===0?'#d8e6e8':j<3?'#8198aa':j%2?'#40596a':'#506b7a');color.multiplyScalar(.93+.07*Math.sin(a*9+form.phase));colors.push(color.r,color.g,color.b);
   if(j<levels.length-1){const k=j*n+i,next=j*n+(i+1)%n;indices.push(k,next,k+n,next,next+n,k+n);}
  }
  // Close the underside with a tapered off-centre tip; no open or flat cylindrical bottom.
  const tip=positions.length/3;positions.push(form.x+form.rx*.035,-form.depth*1.035,form.z-form.rz*.025);const c=new T.Color('#354d61');colors.push(c.r,c.g,c.b);for(let i=0;i<n;i++){const k=(levels.length-1)*n+i,next=(levels.length-1)*n+(i+1)%n;indices.push(k,next,tip);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();const cliff=new T.Mesh(geo,rock);cliff.name='layered-cliff-'+form.id;root.add(cliff);
 }
 scene.add(root);return root;
}
