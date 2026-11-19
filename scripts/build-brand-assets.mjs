/** Static silver/ice-blue identity. Production uses the committed exports. */
import {mkdir,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {BRAND} from '../dist/brand-config.js';
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
// Six separated rays remain readable at favicon size; no stacked curves.
function crystal(cx,cy,size,{dark=false,mono=false,small=false,id='crystal'}={}){
 const light=dark?'#eef7ff':'#dce9f2',mid=dark?'#bedbf1':silver,shade=dark?'#86bce7':blue;
 const outer=small?'M0 -62L10 -31 0 -10 -10 -31Z':'M0 -64L11 -31 0 -10 -11 -31Z';
 const defs=mono?'':`<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${light}"/><stop offset=".46" stop-color="${mid}"/><stop offset="1" stop-color="${shade}"/></linearGradient></defs>`;
 return defs+`<g data-symbol="snow-crystal" transform="translate(${cx} ${cy}) scale(${size/144})">`+Array.from({length:6},(_,i)=>`<g transform="rotate(${i*60})"><path d="${outer}" fill="${mono?blue:`url(#${id})`}"/>${mono?'':`<path d="M0 -64L0 -10 11 -31Z" fill="${shade}" opacity=".5"/><path d="M0 -64L-11 -31 0 -10" fill="none" stroke="${light}" stroke-width="${small?1.8:.85}" opacity=".9"/>`}</g>`).join('')+'</g>';
}
const background=(w,h,id)=>`<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#18344e"/><stop offset=".48" stop-color="#142c43"/><stop offset="1" stop-color="#0c1c30"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#${id})"/>`;
const stars=()=>'<g fill="#c7e3fa" opacity=".28"><circle cx="254" cy="143" r="1"/><circle cx="943" cy="178" r="1.1"/><circle cx="1006" cy="434" r=".8"/><circle cx="199" cy="446" r=".7"/><circle cx="835" cy="101" r=".65"/><circle cx="371" cy="506" r=".75"/></g>';
function social(word){return start(1200,630,`${word} silver and ice blue`)+background(1200,630,'sky')+stars()+crystal(600,264,152,{dark:true,id:'social-crystal'})+wordmark(word,600,396)+'</svg>';}
function icon(small=false,square=false){return start(600,600,`${BRAND.name} silver blue crystal icon`)+`<rect width="600" height="600" rx="${square?0:116}" fill="${white}"/>`+crystal(300,300,440,{small,id:'icon-crystal'})+'</svg>';}
const primary=start(144,144,`${BRAND.name} silver blue crystal`)+crystal(72,72,144)+'</svg>';
const compact=start(144,144,`${BRAND.name} compact crystal`)+crystal(72,72,144,{dark:true,small:true})+'</svg>';
const monochrome=start(144,144,`${BRAND.name} monochrome crystal`)+crystal(72,72,144,{mono:true})+'</svg>';
const files=new Map([['logo-primary.svg',primary],['logo-compact.svg',compact],['logo-monochrome.svg',monochrome],['favicon.svg',icon(true)],['icon.svg',icon()],['og-image.svg',social(BRAND.wordmark)]]);
for(const [name,body]of files)await writeFile(join(output,name),body+'\n');
if(!process.argv.includes('--svg-only')){
 const require=createRequire(import.meta.url);let sharp;
 try{sharp=require('sharp');}catch{sharp=require(require.resolve('sharp',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));}
 const exports=[['favicon-32.png',icon(true),32,32],['icon-192.png',icon(),192,192],['icon-512.png',icon(),512,512],['apple-touch-icon.png',icon(false,true),180,180],['og-image.png',social(BRAND.wordmark),1200,630]];
 for(const [name,body,w,h]of exports)await sharp(Buffer.from(body),{density:192}).resize(w,h).png({compressionLevel:9}).toFile(join(output,name));
}
await writeFile(join(output,'README.md'),`# Silver / ice-blue identity\n\n- Live wordmark: ${BRAND.wordmark}. The replacement name is still being reviewed.\n- Palette: cool white ${white}, silver ${silver}, ice blue ${ice}, steel blue ${blue}. No gold in brand assets.\n- Static symbol: six separated crystal rays, optimized for 24–32px. The loading tree keeps its original curve and animation.\n- Share image: 1200×630, winter-blue background, silver crystal and small uppercase text. No subtitle.\n- Wordmarks use outlined bundled Pretendard 500, so SVG and PNG are identical without external fonts.\n- Manual regeneration: node scripts/build-brand-assets.mjs. Committed assets are consumed by normal builds.\n`);
console.log(`Wrote silver/ice-blue assets to ${output}`);
