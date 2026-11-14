import * as THREE from './vendor/three.module.js';

export function createCompanion(){
  const group=new THREE.Group(),shape=new THREE.Group();group.add(shape);
  const material=new THREE.MeshPhysicalMaterial({color:'#eee3ed',roughness:.88,sheen:1,sheenRoughness:.85,sheenColor:'#fff0ff'});
  const sphere=new THREE.SphereGeometry(1,32,24);
  const add=(mat,x,y,z,sx,sy= sx,sz=sx,parent=shape)=>{const m=new THREE.Mesh(sphere,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  add(material,0,0,0,.82,.78,.71);
  // Curved, tapered fibres keep a soft silhouette instead of a spiky cone coat.
  const positions=[],colors=[],indices=[],segments=5,sides=3;
  for(let j=0;j<=segments;j++)for(let k=0;k<sides;k++){
    const t=j/segments,a=k/sides*Math.PI*2,r=.009*(1-t)+.0006;
    positions.push(Math.cos(a)*r+.045*t*t,t*.21,Math.sin(a)*r+.025*t*t);
    const c=.72+.28*t;colors.push(c,c,c);
    if(j<segments){const v=j*sides+k,w=j*sides+(k+1)%sides;indices.push(v,w,v+sides,w,w+sides,v+sides);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const fiberMaterial=material.clone();fiberMaterial.vertexColors=true;fiberMaterial.side=THREE.DoubleSide;
  const count=innerWidth<650?6200:10500,fur=new THREE.InstancedMesh(geometry,fiberMaterial,count);fur.castShadow=false;fur.receiveShadow=true;fur.frustumCulled=false;shape.add(fur);
  const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),normals=[],lengths=[];
  for(let i=0;i<count;i++){
    const y=1-2*(i+.5)/count,a=i*2.39996323,r=Math.sqrt(1-y*y),v=new THREE.Vector3(r*Math.cos(a),y,r*Math.sin(a));
    normals.push(v);lengths.push(.65+((i*73)%101)/101*.8);
    fur.setColorAt(i,new THREE.Color().setScalar(.87+((i*31)%83)/83*.13));
  }
  function groom(length){for(let i=0;i<count;i++){const v=normals[i],face=v.z>.72&&Math.abs(v.x)<.48&&v.y>-.27&&v.y<.38;dummy.position.set(v.x*.82,v.y*.78,v.z*.71);dummy.quaternion.setFromUnitVectors(up,v);dummy.rotateY(i*1.7);dummy.scale.set(1,face?.24:length*lengths[i],1);dummy.updateMatrix();fur.setMatrixAt(i,dummy.matrix);}fur.instanceMatrix.needsUpdate=true;}
  const eyes=[],feet=[];
  const eyeMaterial=new THREE.MeshPhysicalMaterial({color:'#10131c',roughness:.08,clearcoat:1,clearcoatRoughness:.05});
  const shine=new THREE.MeshBasicMaterial({color:'#ffffff'});
  for(const side of [-1,1]){
    const eye=add(eyeMaterial,side*.24,.09,.703,.095,.138,.065);eyes.push(eye);
    add(shine,-.22,.32,.87,.2,.16,.12,eye);add(shine,.32,-.21,.91,.07,.07,.06,eye);
    feet.push(add(material,side*.36,-.7,.15,.22,.14,.26));
  }
  const tuft=add(material,.02,.78,-.07,.11,.2,.1);tuft.rotation.z=-.3;
  const accessories=new THREE.Group();shape.add(accessories);
  const gold=new THREE.MeshStandardMaterial({color:'#f0cc91',metalness:.7,roughness:.25});
  const starShape=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.09:.21;i?starShape.lineTo(Math.cos(a)*r,Math.sin(a)*r):starShape.moveTo(Math.cos(a)*r,Math.sin(a)*r);}starShape.closePath();
  const star=new THREE.Mesh(new THREE.ExtrudeGeometry(starShape,{depth:.04,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:3}),gold);star.position.set(.51,.59,.51);star.rotation.set(-.1,.2,-.2);accessories.add(star);
  const ribbon=new THREE.Group();ribbon.position.set(-.35,.72,.3);ribbon.rotation.z=.2;accessories.add(ribbon);
  const satin=new THREE.MeshPhysicalMaterial({color:'#b8a1e7',roughness:.55,sheen:1,sheenColor:'#ebd7ff'});
  for(const side of [-1,1]){const loop=add(satin,side*.145,0,0,.16,.11,.065,ribbon);loop.rotation.z=side*.4;}add(satin,0,0,.045,.065,.075,.06,ribbon);
  let lastLength=-1;
  function customize(options){
    material.color.set(options.fur);fiberMaterial.color.set(options.fur);
    const length=options.fluff/100;if(lastLength!==length){groom(length);lastLength=length;}
    shape.scale.set(1+(options.roundness-50)*.003,1-(options.roundness-50)*.002,1);
    star.visible=options.accessory==='star';ribbon.visible=options.accessory==='ribbon';
  }
  customize({fur:'#eee3ed',fluff:100,roundness:50,accessory:'none'});
  return {group,eyes,feet,customize};
}
