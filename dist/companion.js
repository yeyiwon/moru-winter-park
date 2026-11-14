import * as THREE from './vendor/three.module.js';

export function createCompanion(){
  const group=new THREE.Group(),shape=new THREE.Group();group.add(shape);
  // A small plush capsule. The coat is random short pile, with no combed bands.
  let seed=5921;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const cloth=document.createElement('canvas');cloth.width=cloth.height=256;const ctx=cloth.getContext('2d'),pixels=ctx.createImageData(256,256);
  for(let i=0;i<pixels.data.length;i+=4){const v=195+random()*50;pixels.data.set([v,v,v,255],i);}ctx.putImageData(pixels,0,0);const nap=new THREE.CanvasTexture(cloth);nap.wrapS=nap.wrapT=THREE.RepeatWrapping;nap.repeat.set(7,7);
  const material=new THREE.MeshPhysicalMaterial({color:'#eee3ed',roughness:1,metalness:0,sheen:.55,sheenRoughness:1,sheenColor:'#eee4ec',bumpMap:nap,bumpScale:.006});
  const sphere=new THREE.SphereGeometry(1,32,24);
  const add=(mat,x,y,z,sx,sy=sx,sz=sx,parent=shape)=>{const m=new THREE.Mesh(sphere,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.64,.34,12,48),material);torso.scale.set(1.03,1,.9);torso.castShadow=true;torso.receiveShadow=true;shape.add(torso);
  const positions=[],indices=[],segments=3,sides=3;
  for(let j=0;j<=segments;j++)for(let k=0;k<sides;k++){
    const t=j/segments,a=k/sides*Math.PI*2,r=.0029*(1-t)+.00035;
    positions.push(Math.cos(a)*r+.012*t*t,t*.065,Math.sin(a)*r);
    if(j<segments){const v=j*sides+k,w=j*sides+(k+1)%sides;indices.push(v,w,v+sides,w,w+sides,v+sides);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const fiberMaterial=new THREE.MeshStandardMaterial({color:'#eee3ed',roughness:1,metalness:0});
  const count=innerWidth<650?3000:4800,fur=new THREE.InstancedMesh(geometry,fiberMaterial,count);fur.castShadow=false;fur.receiveShadow=false;fur.frustumCulled=false;shape.add(fur);
  const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),fibres=[];
  for(let i=0;i<count;i++){
    const angle=random()*Math.PI*2,y=random()*2-1,r=Math.sqrt(1-y*y),v=new THREE.Vector3(r*Math.cos(angle),y,r*Math.sin(angle));
    let position=new THREE.Vector3(v.x*.64*1.03,v.y*.64+Math.sign(v.y)*.17,v.z*.64*.9);
    if(random()<.21){v.set(Math.cos(angle),0,Math.sin(angle));position.set(v.x*.64*1.03,(random()-.5)*.34,v.z*.64*.9);}
    fibres.push({v,position,twist:random()*Math.PI*2,length:.45+random()*.55});
  }
  function groom(length){for(let i=0;i<count;i++){const f=fibres[i],face=f.position.z>.49&&Math.abs(f.position.x)<.4&&f.position.y>-.16&&f.position.y<.38;dummy.position.copy(f.position);dummy.quaternion.setFromUnitVectors(up,f.v);dummy.rotateY(f.twist);dummy.scale.set(1,face?.18:f.length*(.7+length*.35),1);dummy.updateMatrix();fur.setMatrixAt(i,dummy.matrix);}fur.instanceMatrix.needsUpdate=true;}
  const eyes=[],feet=[];
  const eyeMaterial=new THREE.MeshPhysicalMaterial({color:'#10131c',roughness:.2,clearcoat:.6,clearcoatRoughness:.12});
  const shine=new THREE.MeshBasicMaterial({color:'#ffffff'});
  for(const side of [-1,1]){
    const eye=add(eyeMaterial,side*.205,.075,.575,.084,.126,.055);eyes.push(eye);
    add(shine,-.22,.32,.87,.2,.16,.12,eye);add(shine,.32,-.21,.91,.07,.07,.06,eye);
    feet.push(add(material,side*.28,-.73,.13,.17,.13,.2));
  }
  const tuft=add(material,.035,.77,-.04,.105,.13,.08);tuft.rotation.z=-.35;
  const accessories=new THREE.Group();shape.add(accessories);
  const gold=new THREE.MeshStandardMaterial({color:'#f0cc91',metalness:.7,roughness:.25});
  const starShape=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.09:.21;i?starShape.lineTo(Math.cos(a)*r,Math.sin(a)*r):starShape.moveTo(Math.cos(a)*r,Math.sin(a)*r);}starShape.closePath();
  const star=new THREE.Mesh(new THREE.ExtrudeGeometry(starShape,{depth:.04,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:3}),gold);star.position.set(.39,.59,.43);star.rotation.set(-.1,.2,-.2);accessories.add(star);
  const ribbon=new THREE.Group();ribbon.position.set(-.29,.7,.29);ribbon.rotation.z=.2;accessories.add(ribbon);
  const satin=new THREE.MeshPhysicalMaterial({color:'#b8a1e7',roughness:.55,sheen:1,sheenColor:'#ebd7ff'});
  for(const side of [-1,1]){const loop=add(satin,side*.145,0,0,.16,.11,.065,ribbon);loop.rotation.z=side*.4;}add(satin,0,0,.045,.065,.075,.06,ribbon);
  let lastLength=-1;
  function customize(options){
    material.color.set(options.fur);fiberMaterial.color.set(options.fur);
    const length=options.fluff/100;if(lastLength!==length){groom(length);lastLength=length;}
    shape.scale.set(1+(options.roundness-50)*.002,1-(options.roundness-50)*.0012,1);
    star.visible=options.accessory==='star';ribbon.visible=options.accessory==='ribbon';
  }
  customize({fur:'#eee3ed',fluff:100,roundness:50,accessory:'none'});
  return {group,eyes,feet,customize};
}
