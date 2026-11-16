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
    sparkleCloud(parent,6.4,6,62);
  }

  function conservatory(parent){
    parent.name='aurora-conservatory';
    const leafDark=M('#609b83',.88,0),leafLight=M('#a0cdb0',.86,0),cedar=M('#c6a58a',.84,0);leafDark.side=leafLight.side=THREE.DoubleSide;
    const leafPositions=[],leafUvs=[],leafIndices=[];
    for(let j=0;j<=8;j++)for(let i=0;i<3;i++){const t=j/8,s=i-1;leafPositions.push(s*Math.sin(t*Math.PI)*.085,t*.45,Math.sin(t*Math.PI)*(.06+(1-Math.abs(s))*.025));leafUvs.push(i/2,t);if(j<8&&i<2){const k=j*3+i;leafIndices.push(k,k+1,k+3,k+1,k+4,k+3);}}
    const blade=new THREE.BufferGeometry();blade.setAttribute('position',new THREE.Float32BufferAttribute(leafPositions,3));blade.setAttribute('uv',new THREE.Float32BufferAttribute(leafUvs,2));blade.setIndex(leafIndices);blade.computeVertexNormals();
    function glazedPot(x,y,z,r=.4){
      const profile=[[r*.6,0],[r*.75,.05],[r*.92,.12],[r,.45],[r*1.08,.49],[r*1.08,.54],[r*.88,.54],[r*.88,.46],[0,.46]].map(([xx,yy])=>new THREE.Vector2(xx,yy));mesh(new THREE.LatheGeometry(profile,24),pearl,x,y,z,parent);
      for(const yy of [.08,.5]){const ring=torus(r*(yy<.2?.75:1.075),.016,brass,x,y+yy,z,parent);ring.rotation.x=Math.PI/2;}
      cylinder(r*.86,r*.86,.015,cedar,x,y+.475,z,parent,24);
    }
    function fern(g,x,y,z,size=1){
      for(let j=0;j<7;j++){const a=j*2.399,dx=Math.cos(a),dz=Math.sin(a),h=(.55+j%3*.08)*size;curve(g,[[x,y,z],[x+dx*.22*size,y+h,z+dz*.22*size],[x+dx*.6*size,y+h*.55,z+dz*.6*size]],.008*size,leafDark);
        for(let k=0;k<3;k++)for(const side of [-1,1]){const u=.35+k*.22,leaf=mesh(blade,j%2?leafDark:leafLight,x+dx*.6*u*size,y+Math.sin(u*Math.PI*.85)*h,z+dz*.6*u*size,g);leaf.scale.setScalar(size*(.68-k*.12));leaf.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(dx*.35-dz*side*.7,.24-k*.12,dz*.35+dx*side*.7).normalize());}}
    }
    function gardenBench(x,z,yaw){
      const seat=new THREE.Group();seat.position.set(x,0,z);seat.rotation.y=yaw;parent.add(seat);
      for(const side of [-1,1]){curve(seat,[[side*.97,.08,.32],[side*1.06,.57,.27],[side*1.16,.78,.02],[side*1.04,.82,-.36]],.045);curve(seat,[[side*.97,.08,-.3],[side*.97,.6,-.3],[side*.97,1.15,-.4]],.045);ball(pearl,side*.97,1.2,-.4,.065,seat);}
      for(let j=0;j<5;j++)box(2.45,.095,.125,cedar,0,.56,-.28+j*.14,seat);
      for(const y of [.84,1.13])curve(seat,[[-1.08,y,-.39],[0,y+.05,-.42],[1.08,y,-.39]],.028);
      for(let j=-3;j<=3;j++){const curl=torus(.115,.014,brass,j*.29,.99,-.4,seat);curl.scale.set(.82,1.15,1);rod([j*.29,.82,-.4],[j*.29,1.16,-.4],.011,brass,seat);}
      const cushion=ball(rose,.64,.65,.02,.35,seat);cushion.scale.set(1,.22,.8);const cushion2=ball(aqua,-.64,.65,.02,.35,seat);cushion2.scale.set(1,.22,.8);
    }
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
    for(let j=0;j<12;j++){const a=j*Math.PI/6,r=2.6,x=Math.cos(a)*r,z=Math.sin(a)*r;const end=3.1+Math.sin(j*2)*.45;curve(parent,[[x*.6,5.85,z*.6],[x,4.9,z],[x,end+.43,z]],.012);lantern(parent,x,end,z,.9);}
    const crown=mesh(starGeometry(.42,.07),light,0,6.55,0,parent);crown.rotation.y=.4;
    for(const side of [-1,1]){gardenBench(side*9,.4,-side*Math.PI/2);for(let j=0;j<3;j++){const x=side*(5.8+j*1.05),z=2.4+Math.sin(j)*.7;glazedPot(x,.12,z,.34+j*.035);fern(parent,x,.65,z,.65);curve(parent,[[x,.65,z],[x+.15,1.05,z],[x,1.35+j*.15,z]],.018);blossom(parent,x,1.35+j*.15,z,.4+j*.055,j%2?aqua:rose);}}
    // Lattice lanterns and botanical displays sit beyond the dome, away from both doors.
    for(const x of [-5.8,5.8])for(const z of [-5.8,5.8]){cylinder(.24,.3,.14,pearl,x,.17,z,parent,20);cylinder(.055,.09,2.35,brass,x,1.35,z,parent,12);const collar=torus(.12,.018,brass,x,.4,z,parent);collar.rotation.x=Math.PI/2;curve(parent,[[x,2.52,z],[x+.1,2.82,z],[x+.43,2.76,z],[x+.45,2.58,z]],.025);lantern(parent,x+.45,2.17,z,1);}
    const display=new THREE.Group();display.position.set(-6.7,0,-2.8);parent.add(display);
    box(2.5,.13,1.05,cedar,0,.89,0,display);box(2.35,.08,.82,cedar,0,.34,0,display);
    for(const x of [-1.05,1.05])for(const z of [-.36,.36]){cylinder(.035,.06,.8,brass,x,.47,z,display,10);ball(pearl,x,.08,z,.065,display);}
    for(const x of [-.61,.61]){
      cylinder(.38,.42,.08,pearl,x,1,0,display,32);const rim=torus(.385,.018,brass,x,1.05,0,display);rim.rotation.x=Math.PI/2;
      mesh(new THREE.CylinderGeometry(.35,.35,.42,24,1,true),glass,x,1.28,0,display);mesh(new THREE.SphereGeometry(.35,24,12,0,Math.PI*2,0,Math.PI/2),glass,x,1.49,0,display);ball(brass,x,1.86,0,.045,display);fern(display,x,1.07,0,.34);
      const plaque=box(.32,.12,.025,brass,x,1.03,.4,display);plaque.rotation.x=-.22;
    }
    const can=mesh(new THREE.LatheGeometry([[.13,0],[.2,.04],[.2,.3],[.16,.35],[.12,.35],[.12,.3],[0,.29]].map(([x,y])=>new THREE.Vector2(x,y)),20),aqua,0,.38,0,display);can.rotation.y=.15;
    curve(display,[[.17,.48,0],[.4,.62,0],[.5,.73,0]],.035,aqua);const handle=torus(.16,.025,brass,-.19,.58,0,display);handle.scale.y=1.1;const spout=mesh(new THREE.CylinderGeometry(.065,.045,.055,12),brass,.5,.75,0,display);spout.rotation.z=-.4;
    sparkleCloud(parent,4.15,5.7,74);
  }

  return {quiz,conservatory,update(t){light.emissiveIntensity=.73+Math.sin(t*.7)*.09;for(let i=0;i<sparks.length;i++)sparks[i].rotation.y=Math.sin(t*.035+i)*.045;}};
}
