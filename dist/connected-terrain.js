import {spaToWorld} from './spa-transform.js';
import {alpineHeight,alpineShift} from './resort-layout.js';
import {mountainBounds,mountainHalfWidth} from './mountain-layout.js';
import * as T from './vendor/three.module.js';
import {applySnowSurface} from './snow-surface.js';
import {landforms,landRadius,landPoint} from './world-layout.js';

// One outline drives the snow, rock skin, navigation boundary and map.
export function buildConnectedTerrain(scene){
 const root=new T.Group();root.name='floating-winter-archipelago';
 const snow=applySnowSurface(new T.MeshStandardMaterial({vertexColors:true,roughness:1})),rock=new T.MeshStandardMaterial({vertexColors:true,roughness:.94});
 for(const form of landforms){
  // Polar samples from the mountain centre undersample the narrow base 2.5km away.
  // Follow each actual boundary in 10m steps so the rock rim meets the snow there.
  const steps=Math.ceil((mountainBounds.maxZ-mountainBounds.minZ)/10);
  const outline=form.id==='alpine'?Array.from({length:steps*2},(_,i)=>{const side=i<steps?1:-1,t=i<steps?i/steps:(2*steps-i)/steps,z=mountainBounds.minZ+t*(mountainBounds.maxZ-mountainBounds.minZ);return new T.Vector2(side*mountainHalfWidth(z),-z-alpineShift);}):Array.from({length:128},(_,i)=>{const p=landPoint(form,i/128*Math.PI*2);return new T.Vector2(p.x,-p.z);});
  const n=outline.length;
  if(form.id!=='alpine'){
   const shape=new T.Shape(outline);
   // Exact curved openings replace skipped polar cells, whose long edges left triangular gaps.
   if(form.id==='spa')for(const p of [{x:-10,z:124,rx:7.9,rz:7},{x:-19,z:132,rx:4.2,rz:3.7}]){
    const points=Array.from({length:96},(_,i)=>{const a=-i/96*Math.PI*2,q=spaToWorld({x:p.x+Math.cos(a)*p.rx,z:p.z+Math.sin(a)*p.rz});return new T.Vector2(q.x,-q.z);});shape.holes.push(new T.Path(points));
   }
   const geo=new T.ShapeGeometry(shape,48);geo.rotateX(-Math.PI/2);geo.translate(0,.085,0);
   const colors=[],white=new T.Color('#e5efee'),blue=new T.Color('#b9cdd7');for(let i=0;i<geo.attributes.position.count;i++){const p=geo.attributes.position,x=p.getX(i),z=p.getZ(i),c=white.clone().lerp(blue,.08+.04*Math.sin(x*.17+z*.1));colors.push(c.r,c.g,c.b);}geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
   const cap=new T.Mesh(geo,snow);cap.name='snow-cap-'+form.id;cap.receiveShadow=true;root.add(cap);
  }
  const positions=[],colors=[],indices=[],levels=[0,.045,.13,.28,.46,.65,.81,.94,1],radii=[1,1.006,.97,.89,.76,.59,.39,.17,.04];
  for(let j=0;j<levels.length;j++)for(let i=0;i<n;i++){
   const a=i/n*Math.PI*2,edge=landRadius(form,a),t=levels[j],noise=(Math.sin(a*7+form.phase)*.022+Math.sin(a*13-form.phase)*.012)*Math.sin(t*Math.PI),r=edge*(form.id==='alpine'&&j===1?1.0006:radii[j])+noise*(form.id==='alpine'?.035:1);
   const {x,z}=form.id==='alpine'?{x:form.x+(outline[i].x-form.x)*(j===1?1.0006:radii[j]),z:form.z+(-outline[i].y-form.z)*(j===1?1.0006:radii[j])}:landPoint(form,a,r);
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
