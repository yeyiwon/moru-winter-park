import * as THREE from './vendor/three.module.js';

// Sculpted surfaces share a small palette so the world can batch their opaque geometry.
export function createAuroraLandmarks(api){
  const {mesh,ball,cylinder,box,rod,torus,M,glowMap}=api;
  const brass=M('#c9ab76',.28,.72),pearl=M('#f1dfeb',.24,.32),rose=M('#efb7d3',.3,.22),aqua=M('#b3e9df',.22,.26),lilac=M('#bca9eb',.28,.26);
  for(const material of [pearl,rose,aqua,lilac])material.side=THREE.DoubleSide;
  const light=new THREE.MeshStandardMaterial({color:'#fff0d3',emissive:'#ffd6ab',emissiveIntensity:.8,roughness:.23,metalness:.1});
  const glass=new THREE.MeshPhysicalMaterial({color:'#e3e6ff',roughness:.13,metalness:.16,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false,clearcoat:1,iridescence:.8,iridescenceIOR:1.3});
  const sparkMaterial=new THREE.PointsMaterial({color:'#ffdfef',size:.065,map:glowMap,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending});
  const sparks=[];

  function surface(width,height,depth){
    const positions=[],normals=[],uv=[],indices=[],across=10,along=24;
    for(let j=0;j<=along;j++)for(let i=0;i<=across;i++){
      const t=j/along,u=i/across*2-1,w=Math.pow(Math.sin(Math.PI*t),.8);
      positions.push(width*u*w,height*t,depth*Math.sin(Math.PI*t)*(1-.45*u*u));
      normals.push(0,0,1);uv.push(i/across,t);
      if(i<across&&j<along){const k=j*(across+1)+i;indices.push(k,k+1,k+across+1,k+1,k+across+2,k+across+1);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
  }
  function curve(parent,points,radius,material=brass){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),32,radius,6,false),material,0,0,0,parent);}
  function horizontalRing(parent,r,y,material=brass,tube=.035){const ring=torus(r,tube,material,0,y,0,parent);ring.rotation.x=-Math.PI/2;return ring;}
  function starGeometry(radius,depth=.08){
    const shape=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?radius*.46:radius;i?shape.lineTo(Math.cos(a)*r,Math.sin(a)*r):shape.moveTo(Math.cos(a)*r,Math.sin(a)*r);}shape.closePath();return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:2});
  }
  function sparkleCloud(parent,radius,height,count){
    const p=[];for(let i=0;i<count;i++){const a=i*2.39996,r=radius*Math.sqrt((i+.5)/count);p.push(Math.cos(a)*r,.6+(Math.sin(i*9.3)*.5+.5)*height,Math.sin(a)*r);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));const cloud=new THREE.Points(geometry,sparkMaterial);parent.add(cloud);sparks.push(cloud);
  }
  function lantern(parent,x,y,z){
    const crystal=mesh(new THREE.OctahedronGeometry(.17,0),aqua,x,y,z,parent);crystal.scale.y=1.7;
    const collar=torus(.17,.016,brass,x,y,z,parent);collar.rotation.x=Math.PI/2;
    ball(light,x,y+.32,z,.055,parent);
  }
  function blossom(parent,x,y,z,size,material=rose){
    const bloom=new THREE.Group();bloom.position.set(x,y,z);parent.add(bloom);
    for(let j=0;j<7;j++){const petal=mesh(surface(size*.34,size*.9,size*.24),material,0,0,0,bloom);petal.rotation.set(.85,j*Math.PI*2/7,0,'YXZ');}
    ball(light,0,.16*size,0,.13*size,bloom);
    return bloom;
  }
  function bench(parent,x,z,yaw){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=yaw;parent.add(g);
    for(const side of [-1,1]){cylinder(.08,.15,.5,brass,side*1.05,.28,0,g,12);curve(g,[[side*1.05,.5,.3],[side*1.2,.8,.15],[side*1.05,1.05,-.35]],.04);}
    box(2.6,.18,.85,pearl,0,.58,0,g);box(2.45,.48,.16,rose,0,.95,-.36,g);
    for(let i=-4;i<=4;i++)box(.018,.31,.02,brass,i*.25,.96,-.265,g);
  }

  function quiz(parent){
    parent.name='quiz-pavilion';
    cylinder(6.8,6.9,.1,pearl,0,.025,0,parent,80);
    for(const r of [5.85,6.65])horizontalRing(parent,r,.09,brass,.023);
    // The floor remains flush; the tall constellation frames the square behind the arrival.
    for(let j=0;j<12;j++){const a=j*Math.PI/6;const inlay=mesh(starGeometry(.17,.008),j%2?aqua:lilac,Math.cos(a)*6.22,.087,Math.sin(a)*6.22,parent);inlay.rotation.x=-Math.PI/2;}
    const portal=new THREE.Group();portal.position.set(0,0,4.2);parent.add(portal);
    for(let band=0;band<3;band++){
      const r=4.55-band*.35,points=[];
      for(let j=0;j<=48;j++){const a=j/48*Math.PI;points.push([Math.cos(a)*r,2.6+Math.sin(a)*r,band*.12]);}
      curve(portal,points,band===0?.095:.045,band===1?light:brass);
      for(const side of [-1,1])rod([side*r,.12,band*.12],[side*r,2.6,band*.12],band===0?.095:.045,band===1?light:brass,portal);
    }
    for(const side of [-1,1]){
      cylinder(.63,.75,.18,pearl,side*4.55,.14,0,portal,32);
      cylinder(.3,.48,1.4,lilac,side*4.55,.9,0,portal,8);
      for(let j=0;j<4;j++){const a=j*Math.PI/2;rod([side*4.55+Math.cos(a)*.31,.3,Math.sin(a)*.31],[side*4.55+Math.cos(a)*.23,1.6,Math.sin(a)*.23],.025,brass,portal);}
      blossom(portal,side*4.55,1.55,0,.75,rose);
    }
    const crown=mesh(starGeometry(.8,.16),light,0,7.35,.16,portal);crown.name='quiz-star-crown';
    const starRing=torus(1.1,.025,brass,0,7.35,.1,portal);starRing.rotation.z=.2;
    for(let i=0;i<7;i++){const x=-2.7+i*.9,top=2.6+Math.sqrt(4.2*4.2-x*x),y=4.15+Math.sin(i*1.7)*.45;rod([x,top,.18],[x,y,.18],.012,brass,portal);const s=mesh(starGeometry(.15+i%2*.07,.025),i%2?rose:aqua,x,y,.18,portal);s.rotation.z=i*.5;}
    for(const [x,z] of [[-7.8,-2.8],[7.8,-2.8]]){
      const obelisk=new THREE.Group();obelisk.position.set(x,0,z);parent.add(obelisk);
      cylinder(.72,.85,.14,pearl,0,.1,0,obelisk,32);cylinder(.26,.39,2.2,aqua,0,1.25,0,obelisk,8);
      const jewel=mesh(new THREE.OctahedronGeometry(.55),lilac,0,2.95,0,obelisk);jewel.scale.y=1.3;
      for(const r of [.7,.82]){const orbit=torus(r,.018,brass,0,2.95,0,obelisk);orbit.rotation.set(.9,r*2,.2);}
      ball(light,0,3.8,0,.09,obelisk);
    }
    for(const [x,z,yaw] of [[-7,5,Math.PI/3],[7,5,-Math.PI/3]])bench(parent,x,z,yaw);
    sparkleCloud(parent,6.4,6,62);
  }

  function conservatory(parent){
    parent.name='aurora-conservatory';
    cylinder(4.7,4.85,.18,pearl,0,.12,0,parent,72);horizontalRing(parent,4.6,.225);
    // One glazing mesh keeps the two walk-through doorways open and limits transparent draws.
    const positions=[],uv=[],indices=[];
    function patch(phiStart,phiLength,thetaStart,thetaLength,cols,rows){const base=positions.length/3;for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){const p=phiStart+col/cols*phiLength,t=thetaStart+row/rows*thetaLength;positions.push(-4.7*Math.cos(p)*Math.sin(t),.3+6.016*Math.cos(t),4.7*Math.sin(p)*Math.sin(t));uv.push(col/cols,row/rows);if(col<cols&&row<rows){const k=base+row*(cols+1)+col;indices.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1);}}}
    patch(0,Math.PI*2,0,1.08,48,16);for(let panel=0;panel<12;panel++)if(![2,3,8,9].includes(panel))patch(panel*Math.PI/6,Math.PI/6,1.08,Math.PI/2-1.08,6,6);
    const glazing=new THREE.BufferGeometry();glazing.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));glazing.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));glazing.setIndex(indices);glazing.computeVertexNormals();mesh(glazing,glass,0,0,0,parent);
    for(let j=0;j<4;j++){const a=j*Math.PI/4+Math.PI/8,points=[];for(let k=0;k<=40;k++){const t=k/40*Math.PI;points.push([Math.cos(t)*4.72*Math.cos(a),.3+Math.sin(t)*6.03,Math.cos(t)*4.72*Math.sin(a)]);}curve(parent,points,.042);}
    horizontalRing(parent,4.12,3.2,brass,.025);horizontalRing(parent,2.45,5.45,brass,.025);
    cylinder(2.4,2.55,.16,aqua,0,.3,0,parent,64);
    for(const r of [1.85,2.25])horizontalRing(parent,r,.39,light,.013);
    const heart=new THREE.Group();heart.position.y=.4;parent.add(heart);
    for(let i=0;i<11;i++){const a=i*Math.PI*2/11,leaf=mesh(surface(.55,2.25,.55),i%2?rose:pearl,0,0,0,heart);leaf.rotation.set(1.08,a,0,'YXZ');}
    const stems=[[[0,0,0],[-.5,1.5,.15],[-1.1,2.5,.3],[-.65,3.6,.25]],[[0,0,0],[.55,1.6,-.2],[.7,2.9,-.6],[.2,4.2,-.5]],[[0,0,0],[.4,1.4,.6],[1.1,2.4,.6],[1.35,3.2,.3]]];
    for(let i=0;i<stems.length;i++){curve(heart,stems[i],.045);const tip=stems[i].at(-1);blossom(heart,...tip,.8,i%2?aqua:rose);}
    for(let j=0;j<9;j++){const a=j*2.4,y=.85+j*.3,x=Math.sin(a)*.52,z=Math.cos(a)*.5;const leaf=mesh(surface(.24,.9,.2),j%2?aqua:lilac,x,y,z,heart);leaf.rotation.set(.75,a,.45);}
    for(let j=0;j<12;j++){const a=j*Math.PI/6,r=2.8,x=Math.cos(a)*r,z=Math.sin(a)*r;const end=3.1+Math.sin(j*2)*.45;curve(parent,[[x*.6,5.85,z*.6],[x,4.9,z],[x,end,z]],.012);lantern(parent,x,end,z);}
    const crown=mesh(starGeometry(.42,.07),light,0,6.55,0,parent);crown.rotation.y=.4;
    for(const side of [-1,1]){bench(parent,side*9,.4,-side*Math.PI/2);for(let j=0;j<3;j++){const x=side*(5.6+j*.7),z=2.4+Math.sin(j)*.7;curve(parent,[[x,.1,z],[x+.15,.8,z],[x,1.1+j*.15,z]],.023);blossom(parent,x,1.1+j*.15,z,.45+j*.08,j%2?aqua:rose);}}
    sparkleCloud(parent,4.15,5.7,74);
  }

  return {quiz,conservatory,update(t){light.emissiveIntensity=.73+Math.sin(t*.7)*.09;for(let i=0;i<sparks.length;i++)sparks[i].rotation.y=Math.sin(t*.035+i)*.045;}};
}
