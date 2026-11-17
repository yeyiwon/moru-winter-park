import fs from 'node:fs';import path from 'node:path';
import * as T from '../dist/vendor/three.module.js';import {createYukata,createSnowfolk} from '../dist/winter-costumes.js';
const out=path.resolve(process.argv[2]||'qa/asset-review');fs.mkdirSync(out,{recursive:true});
const scene=new T.Group(),vendor=createSnowfolk(),moru=new T.Group();vendor.position.x=1.15;moru.position.set(-1.25,.86,0);scene.add(vendor,moru);moru.add(createYukata());
const ivory=new T.MeshStandardMaterial({color:'#f4eee5',roughness:1}),black=new T.MeshStandardMaterial({color:'#242831',roughness:.35});
function orb(mat,x,y,z,sx,sy,sz){const m=new T.Mesh(new T.SphereGeometry(1,40,28),mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);moru.add(m);}
orb(ivory,0,0,0,.74,.74,.674);for(const side of [-1,1]){orb(black,side*.205,.075,.663,.068,.094,.046);orb(ivory,side*.27,-.74,.14,.18,.12,.25);}
scene.updateMatrixWorld(true);const records=[];scene.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,m=o.material;records.push({name:o.name||'costume-part',visible:true,positions:Array.from(g.attributes.position.array),indices:g.index?Array.from(g.index.array):null,matrix:o.matrixWorld.toArray(),material:{color:m.color?.toArray()||[1,1,1],emissive:m.emissive?.toArray()||[0,0,0],emissiveIntensity:m.emissiveIntensity||0,roughness:m.roughness??.5,metalness:m.metalness||0,opacity:m.transparent?m.opacity:1,shader:false}});});
fs.writeFileSync(path.join(out,'winter-costumes-interior.json'),JSON.stringify({id:'winter-costumes',records}));console.log(records.length,'costume meshes exported');
