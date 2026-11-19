/** Static silver/ice-blue identity. Production uses the committed exports. */
import {mkdir,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {BRAND} from '../dist/brand-config.js';
import {loadingTreePath} from '../dist/luminous-loading.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'dist','brand');
await mkdir(output,{recursive:true});
const escape=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
const {white,silver,silverLight,ice,blue}=BRAND.colors;
const words=[BRAND.wordmark];
if(words.some(word=>word!==word.toUpperCase()))throw Error('Use uppercase wordmarks.');
const python=String.raw`
import sys,json,types,subprocess
s=json.load(sys.stdin)
try:
 import brotli
except ImportError:
 brotli=types.ModuleType('brotli')
 brotli.decompress=lambda data:subprocess.run([s['node'],'-e',"const z=require('node:zlib');let b=[];process.stdin.on('data',d=>b.push(d)).on('end',()=>process.stdout.write(z.brotliDecompressSync(Buffer.concat(b))));"],input=data,stdout=subprocess.PIPE,check=True).stdout
 sys.modules['brotli']=brotli
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
font=TTFont(s['font'])
if 'fvar' in font:font=instantiateVariableFont(font,{'wght':500})
glyphs=font.getGlyphSet();cmap=font.getBestCmap();result={}
for word in s['words']:
 data=[]
 for ch in word:
  name=cmap[ord(ch)];pen=SVGPathPen(glyphs);glyphs[name].draw(pen)
  data.append({'path':pen.getCommands(),'advance':font['hmtx'][name][0]})
 result[word]={'units':font['head'].unitsPerEm,'glyphs':data}
print(json.dumps(result))
`;
const exported=spawnSync(process.env.CODEX_PRIMARY_RUNTIME_PYTHON||'python3',['-c',python],{input:JSON.stringify({font:join(root,'dist/fonts/PretendardVariable.woff2'),words,node:process.execPath}),encoding:'utf8',maxBuffer:2*1024*1024});
if(exported.status!==0)throw Error(`Font export failed: ${exported.stderr||exported.error?.message}`);
const outlines=JSON.parse(exported.stdout);
const start=(w,h,label)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escape(label)}"><title>${escape(label)}</title>`;
function wordmark(word,cx,y,size=28,tracking=2.5,color=silverLight){
 const data=outlines[word],scale=size/data.units;
 const width=data.glyphs.reduce((n,g)=>n+g.advance*scale,0)+tracking*(data.glyphs.length-1);let x=cx-width/2;
 return `<g aria-label="${escape(word)}" fill="${color}">`+data.glyphs.map(g=>{const p=`<path d="${g.path}" transform="translate(${x.toFixed(3)} ${y}) scale(${scale} ${-scale})"/>`;x+=g.advance*scale+tracking;return p;}).join('')+'</g>';
}
// Use the exact completed loading path and its 600:540 proportions.
// Uniform scaling and small-size stroke weight never alter the curve geometry.
function tree(cx,cy,width,{mono=false,small=false,onWhite=false,strokeScale=1,id='tree'}={}){
 const colors=onWhite?[blue,'#7c9bb7',silver,'#7eaaca','#91b8d7',blue]:['#edf5ff','#a8d2f5','#e2edf7','#c8e4fa','#b6d1e7','#95bfe1'];
 const stops=[0,.28,.6,.78,.87,1].map((offset,i)=>`<stop offset="${offset}" stop-color="${colors[i]}"/>`).join('');
 const defs=mono?'':`<defs><linearGradient id="${id}-color" x1="0" y1="0" x2=".9" y2="1">${stops}</linearGradient><filter id="${id}-halo" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4.2"/></filter><filter id="${id}-soft" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="1.2"/></filter></defs>`;
 const curve=(weight,extra='')=>`<path d="${loadingTreePath()}" fill="none" stroke="${mono?blue:`url(#${id}-color)`}" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
 const strokes=mono?curve(12):curve((small?24:5)*strokeScale,`opacity=".48" filter="url(#${id}-halo)"`)+curve((small?18:2.2)*strokeScale,`opacity=".8" filter="url(#${id}-soft)"`)+curve((small?12:1.05)*strokeScale,'opacity=".96"');
 return defs+`<g data-symbol="loading-tree" transform="translate(${cx-width/2} ${cy-width*.45}) scale(${width/600})">${strokes}</g>`;
}
const background=(w,h,id)=>`<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#18344e"/><stop offset=".48" stop-color="#142c43"/><stop offset="1" stop-color="#0c1c30"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#${id})"/>`;
const stars=()=>'<g fill="#c7e3fa" opacity=".28"><circle cx="254" cy="143" r="1"/><circle cx="943" cy="178" r="1.1"/><circle cx="1006" cy="434" r=".8"/><circle cx="199" cy="446" r=".7"/><circle cx="835" cy="101" r=".65"/><circle cx="371" cy="506" r=".75"/></g>';
function social(word){return start(1200,630,`${word} silver and ice blue loading tree`)+background(1200,630,'sky')+stars()+tree(600,270,280,{strokeScale:2.1,id:'social-tree'})+wordmark(word,600,422)+'</svg>';}
function icon(small=false,square=false){return start(600,600,`${BRAND.name} silver blue loading tree icon`)+`<rect width="600" height="600" rx="${square?0:116}" fill="${white}"/>`+tree(300,300,520,{small,onWhite:true,strokeScale:small?1:3,id:'icon-tree'})+'</svg>';}
const primary=start(600,540,`${BRAND.name} original loading tree`)+tree(300,270,600)+'</svg>';
const compact=start(600,540,`${BRAND.name} compact loading tree`)+tree(300,270,600,{small:true})+'</svg>';
const monochrome=start(600,540,`${BRAND.name} monochrome loading tree`)+tree(300,270,600,{mono:true})+'</svg>';
const files=new Map([['logo-primary.svg',primary],['logo-compact.svg',compact],['logo-monochrome.svg',monochrome],['favicon.svg',icon(true)],['icon.svg',icon()],['og-image.svg',social(BRAND.wordmark)]]);
for(const [name,body]of files)await writeFile(join(output,name),body+'\n');
if(!process.argv.includes('--svg-only')){
 const require=createRequire(import.meta.url);let sharp;
 try{sharp=require('sharp');}catch{sharp=require(require.resolve('sharp',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));}
 const exports=[['favicon-32.png',icon(true),32,32],['icon-192.png',icon(),192,192],['icon-512.png',icon(),512,512],['apple-touch-icon.png',icon(false,true),180,180],['og-image.png',social(BRAND.wordmark),1200,630]];
 for(const [name,body,w,h]of exports)await sharp(Buffer.from(body),{density:192}).resize(w,h).png({compressionLevel:9}).toFile(join(output,name));
}
await writeFile(join(output,'README.md'),`# Silver / ice-blue identity\n\n- Live wordmark: ${BRAND.wordmark}. The name is confirmed by the user.\n- Palette: cool white ${white}, silver ${silver}, ice blue ${ice}, steel blue ${blue}. No gold in brand assets.\n- Static symbol: the exact loadingTreePath() curve, with original 600:540 proportions and uniform scaling. No added star or altered silhouette. Compact exports only adjust stroke weight for legibility.\n- Share image: 1200×630, winter-blue background, silver loading tree and small uppercase text. No subtitle.\n- Wordmarks use outlined bundled Pretendard 500, so SVG and PNG are identical without external fonts.\n- Manual regeneration: node scripts/build-brand-assets.mjs. Committed assets are consumed by normal builds.\n`);
console.log(`Wrote silver/ice-blue assets to ${output}`);
