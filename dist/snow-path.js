import * as T from './vendor/three.module.js';

// Shallow, rounded stones sit in the snow rather than forming a coloured sheet above it.
export function createSnowPaths({root,stone,snow,heightAt=()=>.09}){
 const occupied=new Map(),snowMarks=new Set(),samples=[];
 root.userData.snowPathSamples=samples;
 const shape=new T.Shape(),r=.12;
 shape.moveTo(-.5+r,-.5);shape.lineTo(.5-r,-.5);shape.quadraticCurveTo(.5,-.5,.5,-.5+r);shape.lineTo(.5,.5-r);shape.quadraticCurveTo(.5,.5,.5-r,.5);shape.lineTo(-.5+r,.5);shape.quadraticCurveTo(-.5,.5,-.5,.5-r);shape.lineTo(-.5,-.5+r);shape.quadraticCurveTo(-.5,-.5,-.5+r,-.5);
 const slab=new T.ExtrudeGeometry(shape,{depth:.11,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:1,steps:1,curveSegments:2});slab.rotateX(-Math.PI/2);
 const drift=new T.SphereGeometry(1,8,4);
 function nearby(x,z){const gx=Math.floor(x),gz=Math.floor(z);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const p of occupied.get(`${gx+dx}/${gz+dz}`)||[])if(Math.hypot(x-p.x,z-p.z)<.73)return true;return false;}
 function stoneAt(x,z,yaw,w,l,phase){if(nearby(x,z))return;const key=`${Math.floor(x)}/${Math.floor(z)}`;if(!occupied.has(key))occupied.set(key,[]);occupied.get(key).push({x,z});const m=new T.Mesh(slab,stone[Math.abs(phase)%stone.length]);m.position.set(x,heightAt(x,z)-.12,z);m.rotation.y=yaw+Math.sin(x*3.7+z)*.025;m.scale.set(w,1,l);m.receiveShadow=true;m.castShadow=true;root.add(m);}
 return function pave(points,width=2.6){
  const clean=points.filter((p,i)=>!i||Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1])>.02);if(clean.length<2)return;
  const curve=new T.CatmullRomCurve3(clean.map(([x,z])=>new T.Vector3(x,0,z))),length=curve.getLength(),cols=Math.max(2,Math.round(width/.85)),cw=width/cols,rows=Math.max(1,Math.ceil(length/.94));
  for(let i=0;i<=rows;i++){const t=Math.min(1,i/rows),p=curve.getPointAt(t),d=curve.getTangentAt(t),yaw=Math.atan2(d.x,d.z);samples.push({x:p.x,z:p.z,r:width/2+.12});
   for(let j=0;j<cols;j++){const along=Math.min(length,Math.max(0,i/rows*length+(j%2?.22:-.22))),q=curve.getPointAt(along/length),v=curve.getTangentAt(along/length),offset=(j-(cols-1)/2)*cw;stoneAt(q.x+v.z*offset,q.z-v.x*offset,yaw,cw-.045,.86+(Math.sin(i*2.9+j)*.035),i+j);}
   if(i%3===0)for(const side of [-1,1]){const x=p.x+d.z*side*(width/2+.12),z=p.z-d.x*side*(width/2+.12),key=`${Math.round(x/2)}/${Math.round(z/2)}`;if(snowMarks.has(key))continue;snowMarks.add(key);const bank=new T.Mesh(drift,snow);bank.position.set(x,heightAt(x,z)-.025,z);bank.scale.set(.22+.06*Math.sin(i),.12,.8+.15*Math.cos(i));bank.rotation.y=yaw;bank.receiveShadow=true;root.add(bank);}
  }
  return curve;
 };
}
