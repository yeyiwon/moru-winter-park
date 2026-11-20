import fs from 'node:fs';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
const root=process.argv[2]||'web-dist',files=[];
function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())visit(full);else{const data=fs.readFileSync(full);files.push({name:path.relative(root,full),bytes:data.length,gzip:gzipSync(data).length});}}}
visit(root);const code=files.filter(f=>/\.(js|css)$/.test(f.name)),audio=files.filter(f=>f.name.startsWith('audio/')),sum=(list,key)=>list.reduce((n,f)=>n+f[key],0);
const totals={files:files.length,allBytes:sum(files,'bytes'),codeBytes:sum(code,'bytes'),codeGzipBytes:sum(code,'gzip'),audioBytes:sum(audio,'bytes'),coreBytes:sum(files.filter(f=>!f.name.startsWith('audio/show/')),'bytes'),showAudioBytes:sum(files.filter(f=>f.name.startsWith('audio/show/')),'bytes')};
// These are artifact regression ceilings, not a guarantee of any device's FPS.
// v57 adds the approved 74-second CC BY Trepak recording (1.75 MB AAC).
// Two user-supplied full MP3 recordings add 7.77 MiB to the catalog. All music is
// still on demand; the compressed code limit stays fixed.
const limits={coreBytes:36*1024**2,showAudioBytes:10*1024**2,codeGzipBytes:1250*1024};
for(const [key,limit]of Object.entries(limits))if(totals[key]>limit)throw Error(`${key}: ${totals[key]} > ${limit}`);
console.log(JSON.stringify({totals,limits,largest:files.sort((a,b)=>b.bytes-a.bytes).slice(0,8)},null,2));
