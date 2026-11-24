import * as T from './vendor/three.module.js';

// The footbath rim was four
// long strips with egg-shaped rocks pressed into the sides, which read as a box on
// the floor. Individual coping stones with a real chamfer and a bed of river stones
// keep the same footprint, rim height (0.60) and water level (0.50), so seating,
// collision and the water shader's basin rectangle are unchanged.
const rnd=i=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v);};

function copingBlock(b,material,width,height,depth,x,top,z,yaw){
 const s=.02,hw=width/2-s,hd=depth/2-s,shape=new T.Shape();
 shape.moveTo(-hw,-hd);shape.lineTo(hw,-hd);shape.lineTo(hw,hd);shape.lineTo(-hw,hd);shape.closePath();
 const geometry=new T.ExtrudeGeometry(shape,{depth:height-2*s,bevelEnabled:true,bevelSize:s,bevelThickness:s,bevelSegments:1,steps:1});
 geometry.translate(0,0,s);geometry.rotateX(-Math.PI/2);
 const block=b.mesh(geometry,material,x,top-height,z);block.rotation.y=yaw;return block;
}

// Splits a run into stones of slightly different lengths with a narrow mortar gap.
function course(count,length,seed,place){
 const joint=.012,weights=Array.from({length:count},(_,i)=>.9+.22*rnd(seed+i)),sum=weights.reduce((a,v)=>a+v,0);
 let at=-length/2;
 weights.forEach((weight,i)=>{const size=(length-joint*(count-1))*weight/sum;place(at+size/2,size,i);at+=size+joint;});
}

export function buildFootbathMasonry(b,m,bath){
 const top=.6,x0=bath.x,z0=bath.z,vary=(seed,amount)=>amount*(rnd(seed)-.5);
 for(const side of [-1,1]){
  course(9,9.15,side*11,(centre,size,i)=>copingBlock(b,m.stone,size,.22+vary(side*31+i,.008),.45+vary(side*17+i,.012),x0+centre,top+vary(side*7+i,.006),z0+side*2.1,vary(side*3+i,.008)));
  course(4,3.75,side*13,(centre,size,i)=>copingBlock(b,m.stone,.45+vary(side*23+i,.012),.22+vary(side*41+i,.008),size,x0+side*4.35,top+vary(side*5+i,.006),z0+centre,vary(side*9+i,.008)));
 }
 // River stones in loose groups at the corners and along the long sides soften the junction with the
 // floor. Kept to 25 low-segment stones: together with the coping this replaces the old rim and rocks
 // for about +800 triangles, inside the ryokan's 180,000-triangle test budget.
 const pebble=new T.SphereGeometry(1,10,6);let n=0;
 const stone=(x,z,scale)=>{n++;const s=(.15+.05*rnd(n*1.7))*scale,rock=b.mesh(pebble,n%3?m.stone:m.darkStone,x,.09+s*.3,z);rock.scale.set(s*(1+.45*rnd(n+.3)),s*.52,s*(.75+.4*rnd(n+.7)));rock.rotation.y=rnd(n+.9)*6.283;};
 const group=[[.1,.14,1.3],[-.3,.22,.85],[.32,-.1,.7],[-.04,.46,.55]];
 for(const sx of [-1,1])for(const sz of [-1,1])for(const [dx,dz,scale]of group)stone(x0+sx*(4.62+dx*.6),z0+sz*(2.36+dz*.6),scale);
 for(const [cx,sz]of [[-1.7,1],[1.9,1],[.5,-1]])for(const [dx,dz,scale]of group.slice(0,3))stone(x0+cx+dx*1.1,z0+sz*(2.44+Math.abs(dz)*.5),scale*.9);
}
