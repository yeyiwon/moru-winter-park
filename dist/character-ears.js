import * as THREE from './vendor/three.module.js';
const cache=new Map();
 function paddedEar(outline,center,depth,bend){
  const contour=outline.getSpacedPoints(64),radii=[.16,.32,.46,.58,.64,.72,.84,.94,1],positions=[],uv=[],indices=[],geometry=new THREE.BufferGeometry(),faces=[];
  function vertex(x,y,z,u,v){const p=bend?bend(x,y,z):[x,y,z];positions.push(...p);uv.push(u,v);return positions.length/3-1;}
  for(const front of [true,false]){
   const start=vertex(center[0],center[1],depth*(front?.06:-.74),.5,.5),rings=[];
   for(const radius of radii){const ring=[];for(let i=0;i<64;i++){const point=contour[i],x=center[0]+(point.x-center[0])*radius,y=center[1]+(point.y-center[1])*radius,bulge=Math.sqrt(1-radius*radius),z=depth*(front?.055+.78*Math.exp(-(((radius-.76)/.22)**2)):-.7*bulge-.04);ring.push(vertex(x,y,z,.5+(i/64-.5)*radius,radius));}rings.push(ring);}
   let begin=indices.length;for(let i=0;i<64;i++){const next=(i+1)%64;front?indices.push(start,rings[0][i],rings[0][next]):indices.push(start,rings[0][next],rings[0][i]);}geometry.addGroup(begin,indices.length-begin,front?1:0);
   for(let row=1;row<rings.length;row++){begin=indices.length;const inner=rings[row-1],outer=rings[row];for(let i=0;i<64;i++){const next=(i+1)%64;front?indices.push(inner[i],outer[i],outer[next],inner[i],outer[next],inner[next]):indices.push(inner[i],outer[next],outer[i],inner[i],inner[next],outer[next]);}geometry.addGroup(begin,indices.length-begin,front&&radii[row]<=.58?1:0);}
   faces.push(rings.at(-1));
  }
  const seam=indices.length;for(let i=0;i<64;i++){const next=(i+1)%64;indices.push(faces[0][i],faces[1][i],faces[1][next],faces[0][i],faces[1][next],faces[0][next]);}geometry.addGroup(seam,indices.length-seam,0);
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
 }
 function earGeometry(kind){
  const pieces=[],transform=new THREE.Object3D();
  function part(geometry,position,scale=[1,1,1],angle=0){transform.position.set(...position);transform.scale.set(...scale);transform.rotation.set(0,0,angle);transform.updateMatrix();geometry.applyMatrix4(transform.matrix);pieces.push(geometry);}
  for(const side of kind!=='bear-ears'?[-1]:[-1,1]){
   const outline=new THREE.Shape();
   if(kind==='bunny-ears'){
    outline.moveTo(0,-.025);outline.bezierCurveTo(.15,-.025,.20,.10,.19,.32);outline.bezierCurveTo(.185,.64,.125,.90,0,.90);outline.bezierCurveTo(-.125,.90,-.185,.64,-.19,.32);outline.bezierCurveTo(-.20,.10,-.15,-.025,0,-.025);
    const curl=(x,y,z)=>{const t=Math.max(0,(y-.62)/.325);return [x+side*y*y*.026,y-(.065*t*t),z+(.08*t*t)];};
    part(paddedEar(outline,[0,.38],.19,curl),[side*.32,.565,-.01],[1,.9,1],-side*.12);
    part(new THREE.SphereGeometry(1,20,14),[side*.32,.59,-.01],[.18,.11,.14]);
   }else if(kind==='cat-ears'){
    outline.moveTo(-.255,.015);outline.quadraticCurveTo(0,-.055,.255,.015);outline.bezierCurveTo(.277,.15,.153,.41,.045,.555);outline.quadraticCurveTo(0,.61,-.045,.555);outline.bezierCurveTo(-.153,.41,-.277,.15,-.255,.015);
    part(paddedEar(outline,[0,.235],.20,(x,y,z)=>[x,y,z-y*y*.18]),[side*.425,.535,-.015],[1,1,1],-side*.22);
    part(new THREE.SphereGeometry(1,20,14),[side*.425,.57,-.02],[.235,.105,.15],-side*.22);
   }else{
    outline.absellipse(0,.215,.225,.228,0,Math.PI*2,false);
    part(paddedEar(outline,[0,.215],.155),[side*.49,.63,-.045],[1,1,1],-side*.18);
    part(new THREE.SphereGeometry(1,20,14),[side*.49,.68,-.02],[.162,.065,.1]);
   }
  }
  if(kind!=='bear-ears')for(const left of [...pieces]){
   const right=left.clone().scale(-1,1,1),index=right.index;
   // A mirrored transform reverses winding; restore front-facing triangles.
   for(let i=0;i<index.count;i+=3){const a=index.getX(i);index.setX(i,index.getX(i+2));index.setX(i+2,a);}right.computeVertexNormals();pieces.push(right);
  }
  const arrays={position:[],normal:[],uv:[]},merged=new THREE.BufferGeometry();let offset=0;
  // Consolidate each material into one draw group, including every padded attachment.
  for(const material of [0,1]){const begin=offset;for(const geometry of pieces){const g=geometry.index?geometry.toNonIndexed():geometry,groups=g.groups.length?g.groups:[{start:0,count:g.attributes.position.count,materialIndex:0}];for(const section of groups){if(section.materialIndex!==material)continue;for(const name in arrays){const attribute=g.attributes[name],size=attribute.itemSize;arrays[name].push(...attribute.array.slice(section.start*size,(section.start+section.count)*size));}offset+=section.count;}if(g!==geometry)g.dispose();}merged.addGroup(begin,offset-begin,material);}
  pieces.forEach(geometry=>geometry.dispose());for(const [name,values]of Object.entries(arrays))merged.setAttribute(name,new THREE.Float32BufferAttribute(values,name==='uv'?2:3));merged.computeBoundingBox();merged.computeBoundingSphere();return merged;
 }

export function getEarGeometries(){return Object.fromEntries(['bunny-ears','cat-ears','bear-ears'].map(kind=>{if(!cache.has(kind)){const geometry=earGeometry(kind);geometry.userData.shared=true;cache.set(kind,geometry);}return[kind,cache.get(kind)];}));}
