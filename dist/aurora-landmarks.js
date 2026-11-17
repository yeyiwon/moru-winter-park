import * as THREE from './vendor/three.module.js';

// Sculpted surfaces share a small palette so the world can batch their opaque geometry.
export function createAuroraLandmarks(api){
  const {mesh,ball,cylinder,box,rod,torus,M,glowMap}=api;
  const brass=M('#c9ab76',.28,.72),pearl=M('#f1dfeb',.24,.32),rose=M('#efb7d3',.3,.22),aqua=M('#b3e9df',.22,.26),lilac=M('#bca9eb',.28,.26);
  for(const material of [pearl,rose,aqua,lilac])material.side=THREE.DoubleSide;
  const light=new THREE.MeshStandardMaterial({color:'#fff0d3',emissive:'#ffd6ab',emissiveIntensity:.8,roughness:.23,metalness:.1});
  const glass=new THREE.MeshPhysicalMaterial({color:'#e3e6ff',roughness:.13,metalness:.16,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false,clearcoat:1,iridescence:.8,iridescenceIOR:1.3});
  const sparkMaterial=new THREE.PointsMaterial({color:'#ffdfef',size:.065,map:glowMap,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending});
  const sparks=[],dynamic=[],waterUniforms=[],vapor=[];

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
  const opalProfile=[[.12,-.23],[.2,-.14],[.225,.02],[.19,.2],[.11,.27]].map(([r,y])=>new THREE.Vector2(r,y));
  const opalGeometry=new THREE.LatheGeometry(opalProfile,20);
  function lantern(g,x,y,z,scale=1){
      const lamp=new THREE.Group();lamp.position.set(x,y,z);lamp.scale.setScalar(scale);g.add(lamp);mesh(opalGeometry,light,0,0,0,lamp);
      for(let j=0;j<6;j++){const a=j*Math.PI/3;curve(lamp,opalProfile.map(p=>[Math.cos(a)*(p.x+.014),p.y,Math.sin(a)*(p.x+.014)]),.012,brass);}
      for(const [r,yy]of [[.145,-.21],[.23,.02],[.15,.245]])horizontalRing(lamp,r,yy,brass,.013);
      cylinder(.05,.22,.12,brass,0,.3,0,lamp,12);cylinder(.12,.04,.07,brass,0,-.27,0,lamp,12);ball(pearl,0,-.33,0,.04,lamp);
      const hook=torus(.075,.012,brass,0,.415,0,lamp);hook.scale.y=1.2;
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
    for(let i=-4;i<=4;i++){box(.018,.31,.02,brass,i*.25,.96,-.265,g);if(i%2===0){const scroll=torus(.095,.012,brass,i*.25,.96,-.245,g);scroll.scale.y=1.15;}}
    for(const side of [-1,1]){const cushion=ball(side<0?aqua:lilac,side*.61,.72,.035,.34,g);cushion.scale.set(1,.23,.83);const curl=torus(.12,.018,brass,side*1.12,.78,.02,g);curl.rotation.y=Math.PI/2;}
    curve(g,[[-1.15,1.21,-.37],[0,1.28,-.38],[1.15,1.21,-.37]],.024);
  }

  function quiz(parent){
    parent.name='quiz-pavilion';
    const pearl=M('#ecedf0',.34,.2),lilac=M('#223b61',.32,.3),rose=M('#713e50',.4,.25);
    const quizGlow=new THREE.MeshStandardMaterial({color:'#ffe6b8',emissive:'#ffd59a',emissiveIntensity:3.4,roughness:.22});
    // Lights follow the existing architecture, leaving the arrival and exhibits clear.
    for(let i=0;i<56;i++){const a=i/55*Math.PI,x=Math.cos(a)*4.56,y=2.6+Math.sin(a)*4.56;ball(quizGlow,x,y,4.38,.055,parent);}
    for(let i=0;i<40;i++){const a=i/40*Math.PI*2;ball(quizGlow,Math.cos(a)*6.6,.15,Math.sin(a)*6.6,.035,parent);}
    const constellations=[[-3.3,8.2,3.9],[-1.9,8.7,4.1],[-.4,8.45,4],[1.25,9.1,4.15],[3.2,8.4,3.95]];
    for(let i=0;i<constellations.length;i++){const [x,y,z]=constellations[i];mesh(starGeometry(.12+i%2*.06,.035),quizGlow,x,y,z,parent);if(i)rod(constellations[i-1],constellations[i],.012,brass,parent);}
    for(const side of [-1,1]){const lamp=new THREE.PointLight('#ffd59a',16,13,2);lamp.position.set(side*4.6,3.6,3.5);parent.add(lamp);}

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

    }
    for(const [x,z,yaw] of [[-7,5,Math.PI/3],[7,5,-Math.PI/3]])bench(parent,x,z,yaw);
    // The arch carries separate jewel clasps, leafwork and inset light beads.
    const filigreeLeaf=surface(.065,.31,.045);
    for(let j=0;j<=18;j++){const a=j*Math.PI/18,x=Math.cos(a)*4.55,y=2.6+Math.sin(a)*4.55;
      const clasp=mesh(new THREE.OctahedronGeometry(.095),j%2?rose:aqua,x,y,.1,portal);clasp.scale.set(.7,1.35,.55);clasp.rotation.z=a-Math.PI/2;
      for(const side of [-1,1]){const leaf=mesh(filigreeLeaf,brass,x+Math.cos(a)*.05,y+Math.sin(a)*.05,.03,portal);leaf.rotation.z=a-Math.PI/2+side*.6;}
      if(j%2===1)ball(light,Math.cos(a)*4.35,2.6+Math.sin(a)*4.35,.2,.045,portal);
    }
    for(const side of [-1,1])for(let j=0;j<8;j++){const a=j*Math.PI/4;rod([side*4.55+Math.cos(a)*.31,.38,Math.sin(a)*.31],[side*4.55+Math.cos(a)*.25,1.45,Math.sin(a)*.25],.013,pearl,portal);}
    for(const side of [-1,1]){for(const [r,y]of [[.39,.34],[.3,1.42],[.35,1.55]]){const ring=torus(r,.02,brass,side*4.55,y,0,portal);ring.rotation.x=Math.PI/2;}}
    for(const tilt of [-.55,.55]){const halo=torus(1.04,.014,brass,0,7.35,.1,portal);halo.rotation.y=tilt;}
    for(let j=0;j<5;j++){const a=j*Math.PI*2/5;const gem=ball(pearl,Math.cos(a)*1.04,7.35+Math.sin(a)*1.04,.12,.045,portal);gem.scale.set(.8,1.25,.6);}
    for(const side of [-1,1]){
      const x=side*5.4,z=-5.2;cylinder(.28,.35,.12,pearl,x,.16,z,parent,24);cylinder(.065,.1,1.75,brass,x,1.06,z,parent,12);const band=torus(.12,.02,rose,x,.4,z,parent);band.rotation.x=Math.PI/2;
      curve(parent,[[x,1.93,z],[x+side*.05,2.28,z],[x+side*.38,2.32,z],[x+side*.43,2.17,z]],.024);lantern(parent,x+side*.43,1.75,z,.9);
      const base=torus(.22,.02,brass,x,.25,z,parent);base.rotation.x=Math.PI/2;
    }
    // Cabinet exhibits share the existing obelisk footprints, keeping the central route open.
    const walnut=M('#6c4e47',.8,.04),pages=M('#e9dcc6',.98,0);
    for(const side of [-1,1]){
      const g=new THREE.Group();g.name=side<0?'quiz-natural-history-cabinet':'quiz-orrery-cabinet';g.position.set(side*7.8,0,-2.8);parent.add(g);
      cylinder(.59,.64,.14,walnut,0,2.15,0,g,32);cylinder(.61,.61,.035,brass,0,2.24,0,g,32);
      const enclosure=mesh(new THREE.CylinderGeometry(.58,.58,1.3,24,1,true),glass,0,2.91,0,g);enclosure.name='quiz-exhibit-glazing';
      mesh(new THREE.SphereGeometry(.58,24,12,0,Math.PI*2,0,Math.PI/2),glass,0,3.56,0,g);ball(brass,0,4.17,0,.06,g);
      for(let j=0;j<4;j++){const a=j*Math.PI/2;rod([Math.cos(a)*.59,2.24,Math.sin(a)*.59],[Math.cos(a)*.59,3.58,Math.sin(a)*.59],.018,brass,g);}
      if(side<0){
        const shell=mesh(new THREE.TorusGeometry(.26,.09,8,32,Math.PI*1.78),pearl,0,2.92,0,g);shell.rotation.x=.35;
        for(let j=0;j<12;j++){const a=j*.47,r=.1+j*.012;curve(g,[[Math.cos(a)*r,2.92+Math.sin(a)*r,.03],[Math.cos(a+.16)*r,2.92+Math.sin(a+.16)*r,.13],[Math.cos(a+.31)*r,2.92+Math.sin(a+.31)*r,.03]],.009,brass);}
      }else{
        const orbit=new THREE.Group();orbit.name='quiz-mechanical-orrery';orbit.position.y=2.94;orbit.userData.speed=.16;g.add(orbit);dynamic.push(orbit);ball(light,0,0,0,.13,orbit);
        for(let j=0;j<3;j++){const r=.24+j*.12,ring=torus(r,.009,brass,0,0,0,orbit);ring.rotation.set(Math.PI/2,.15*j,j*.2);const a=j*2.3;ball([aqua,rose,lilac][j],Math.cos(a)*r,Math.sin(a)*r*.2,Math.sin(a)*r,.055+j*.015,orbit);rod([0,-.3,0],[Math.cos(a)*r,Math.sin(a)*r*.2,Math.sin(a)*r],.009,brass,orbit);}
      }
      const plaque=box(.51,.15,.025,brass,0,2.12,.6,g);plaque.rotation.x=-.25;
      for(let i=0;i<4;i++)box(.055,.006,.004,walnut,-.13+i*.085,2.13,.62,g);
    }
    // Open books show curved page blocks and gilded bindings instead of flat boxes.
    for(const side of [-1,1]){const g=new THREE.Group();g.position.set(side*4.55,.32,4.2);g.rotation.y=side*.18;parent.add(g);
      for(const sign of [-1,1]){const sheet=new THREE.Shape();sheet.moveTo(0,0);sheet.quadraticCurveTo(sign*.27,.11,sign*.5,.04);sheet.lineTo(sign*.5,.68);sheet.quadraticCurveTo(sign*.25,.75,0,.65);sheet.closePath();const book=mesh(new THREE.ExtrudeGeometry(sheet,{depth:.08,bevelEnabled:true,bevelSize:.015,bevelThickness:.012,bevelSegments:2}),pages,0,1.45,.45,g);book.rotation.x=-1.1;for(let j=0;j<5;j++)curve(g,[[sign*.06,1.52+j*.06,.5],[sign*.27,1.56+j*.06,.5],[sign*.44,1.54+j*.06,.5]],.0035,walnut);}
    }
    sparkleCloud(parent,6.4,6,62);
  }

  return {quiz,dynamic,update(t){light.emissiveIntensity=.73+Math.sin(t*.7)*.09;for(let i=0;i<sparks.length;i++)sparks[i].rotation.y=Math.sin(t*.035+i)*.045;for(const u of waterUniforms)u.time.value=t;for(const v of vapor){const p=(t*.065+v.phase)%1;v.object.position.set(v.x+Math.sin(t*.1+v.phase)*.3,.45+p*2.1,v.z);v.object.material.opacity=Math.sin(p*Math.PI)*.12;}for(const o of dynamic)o.rotation.y=t*(o.userData.speed||.1);}};
}
