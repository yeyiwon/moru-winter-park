/** Manually bake the loader so image playback survives synchronous world setup. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {loadingTreePath} from '../dist/luminous-loading.js';

const require=createRequire(import.meta.url);
let sharp;
try{sharp=require('sharp');}catch{sharp=require(require.resolve('sharp',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));}
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist/brand'),width=360,height=324,frames=60,cycleMs=4150;
const curve=loadingTreePath();

// Arc-length samples keep the tip on the exact authored cubic path without
// depending on browser SVG methods or changing the original silhouette.
function sampleCurve(d){
 const tokens=d.match(/[MC]|-?\d+(?:\.\d+)?/g),points=[];let cursor=0,x=0,y=0,length=0;
 while(cursor<tokens.length){
  const command=tokens[cursor++];
  if(command==='M'){x=Number(tokens[cursor++]);y=Number(tokens[cursor++]);points.push({x,y,length});continue;}
  if(command!=='C')throw Error('The loading path must contain only M and C commands.');
  const values=tokens.slice(cursor,cursor+6).map(Number);cursor+=6;
  const [x1,y1,x2,y2,x3,y3]=values,origin={x,y};
  for(let step=1;step<=96;step++){
   const t=step/96,u=1-t,px=u*u*u*origin.x+3*u*u*t*x1+3*u*t*t*x2+t*t*t*x3,py=u*u*u*origin.y+3*u*u*t*y1+3*u*t*t*y2+t*t*t*y3;
   length+=Math.hypot(px-x,py-y);x=px;y=py;points.push({x,y,length});
  }
 }
 return{points,length};
}
const sampled=sampleCurve(curve);
function pointAt(progress){
 const distance=progress*sampled.length;let low=0,high=sampled.points.length-1;
 while(low<high){const mid=(low+high)>>1;if(sampled.points[mid].length<distance)low=mid+1;else high=mid;}
 const b=sampled.points[low],a=sampled.points[Math.max(0,low-1)],t=(distance-a.length)/(b.length-a.length||1);
 return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
}
const progressAt=seconds=>{const t=Math.min(1,Math.max(0,seconds/2.7));return t*t*(3-2*t);};
const fixed=n=>Number(n.toFixed(5));
function renderFrame(seconds,{still=false}={}){
 const phase=seconds%(cycleMs/1000),progress=still?1:progressAt(phase),opacity=still||phase<3.3?1:Math.max(0,1-(phase-3.3)/.65),tip=pointAt(progress);
 const colors=['#edf5ff','#a8d2f5','#e2edf7','#c8e4fa','#b6d1e7','#95bfe1'],offsets=[0,.28,.6,.78,.87,1];
 const line=(weight,extra)=>`<path d="${curve}" fill="none" stroke="url(#color)" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${fixed(sampled.length)}" stroke-dashoffset="${fixed((1-progress)*sampled.length)}" ${extra}/>`;
 let particles='';
 if(!still){
  const last=Math.floor(Math.min(phase,2.7)/.05);
  for(let back=0;back<28;back++){
   const spawn=last-back;if(spawn<1)break;const born=spawn*.05,age=phase-born;if(age<0||age>=1.3)continue;
   const i=(spawn-1)%28,p=pointAt(progressAt(born)),alpha=Math.sin(Math.min(1,age/.1)*Math.PI/2)*(1-age/1.3)*.72;
   particles+=`<circle cx="${fixed(p.x+Math.sin(i*8.1)*9*age)}" cy="${fixed(p.y+(4+i%6)*age)}" r="${.5+(i%4)*.22}" fill="${i%5?'#b9dcf6':'#e7f2ff'}" opacity="${fixed(alpha)}"/>`;
  }
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 600 540" color-interpolation="sRGB"><defs><linearGradient id="color" x1="0" y1="0" x2=".9" y2="1">${colors.map((color,i)=>`<stop offset="${offsets[i]}" stop-color="${color}"/>`).join('')}</linearGradient><filter id="halo" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="4.2"/></filter><filter id="soft" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="1.2"/></filter></defs><g opacity="${fixed(opacity)}">${line(5,'opacity=".48" filter="url(#halo)"')}${line(2.2,'opacity=".8" filter="url(#soft)"')}${line(1.05,'opacity=".96"')}${particles}${!still&&phase<=2.7?`<g transform="translate(${fixed(tip.x)} ${fixed(tip.y)})"><circle r="7" fill="#bedfff" filter="url(#halo)"/><circle r="2.5" fill="#f2f8ff"/></g>`:''}</g></svg>`;
}

await fs.mkdir(output,{recursive:true});
const raw=[];
for(let frame=0;frame<frames;frame++)raw.push(await sharp(Buffer.from(renderFrame(frame*cycleMs/frames/1000))).ensureAlpha().raw().toBuffer());
const delays=Array.from({length:frames},(_,i)=>Math.round((i+1)*cycleMs/frames)-Math.round(i*cycleMs/frames));
// Keep the alpha ramp lossless: it carries the thin ribbon and its faint halo.
await sharp(Buffer.concat(raw),{raw:{width,height:height*frames,channels:4,pageHeight:height}}).webp({quality:90,alphaQuality:100,smartSubsample:true,effort:4,loop:0,delay:delays}).toFile(path.join(output,'loading-tree-v59.webp'));
await sharp(Buffer.from(renderFrame(0,{still:true}))).webp({lossless:true,effort:6}).toFile(path.join(output,'loading-tree-still-v59.webp'));
await sharp(path.join(output,'logo-compact.svg')).resize(120,108).toColourspace('srgb').png({compressionLevel:9}).toFile(path.join(output,'logo-compact-v59.png'));

const artifacts=[];
for(const name of ['loading-tree-v59.webp','loading-tree-still-v59.webp','logo-compact-v59.png']){
 const file=path.join(output,name),body=await fs.readFile(file),meta=await sharp(body,{animated:true}).metadata();
 artifacts.push({path:'dist/brand/'+name,bytes:body.length,width:meta.width,height:meta.pageHeight||meta.height,frames:meta.pages||1,durationMs:meta.delay?.reduce((a,b)=>a+b,0)||0,space:meta.space,sha256:createHash('sha256').update(body).digest('hex')});
}
const report={curve,cycleMs,frameCount:frames,artifacts,totalBytes:artifacts.reduce((sum,item)=>sum+item.bytes,0)};
if(report.totalBytes>900000)throw Error('Loading brand assets exceed their 900 KB build limit.');
await fs.mkdir(path.join(root,'qa/platform-v59'),{recursive:true});
await fs.writeFile(path.join(root,'qa/platform-v59/loading-assets.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
