import * as T from './vendor/three.module.js';

// Irregular layered crowns, rather than the sparse seven-spoke fir used before.
export function snowPine(b,m,x,z,height,seed=0){
 const crown=(radius,depth,phase,snow=false)=>{
  const p=[],index=[],segments=18,rings=4;
  for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,t=j/rings,r=Math.sin(t*Math.PI/2)*radius*(1+.13*Math.sin(a*5+phase)+.08*Math.sin(a*9-phase));p.push(Math.cos(a)*r,depth*(1-t*t)+(snow?.08:0)-(i%2&&!snow?.13:0)*t,Math.sin(a)*r);if(i<segments&&j<rings){const n=j*(segments+1)+i;index.push(n,n+1,n+segments+1,n+1,n+segments+2,n+segments+1);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(index);g.computeVertexNormals();return g;
 };
 b.tube([[x,0,z],[x+.12,height*.42,z-.1],[x-.08,height*.88,z+.08]],.105,m.wood,undefined,12);
 for(let tier=0;tier<6;tier++){
  const y=height*(.22+tier*.12),reach=height*(.24-tier*.028),branches=tier<4?4:3;
  for(let j=0;j<branches;j++){const a=j*Math.PI*2/branches+tier*2.399+seed,r=reach*(.7+.2*Math.sin(seed+j*4));const bx=x+Math.cos(a)*r,bz=z+Math.sin(a)*r;
   b.rod([x,y-.35,z],[bx,y,bz],.026,m.wood);
   b.mesh(crown(reach*.83,reach*.38,a),tier%2?m.green:m.sage,bx,y,bz);
   b.mesh(crown(reach*.76,reach*.34,a,true),m.snow,bx,y+.06,bz);
  }
 }
 b.mesh(crown(height*.12,height*.18,seed),m.green,x,height*.82,z);b.mesh(crown(height*.105,height*.17,seed,true),m.snow,x,height*.84,z);
}
