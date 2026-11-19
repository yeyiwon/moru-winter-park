import {buildRevision} from './build-revision.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {productionAsset,releaseServiceWorker,stampReleaseHTML} from './production-assets.mjs';
const output='web-dist';fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output,{recursive:true});for(const entry of fs.readdirSync('dist')){if(['server','.openai'].includes(entry))continue;fs.cpSync(path.join('dist',entry),path.join(output,entry),{recursive:true});}
function optimize(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())optimize(file);else if(entry.name!=='sw.js'&&['.js','.css'].includes(path.extname(file)))fs.writeFileSync(file,productionAsset(fs.readFileSync(file,'utf8'),path.extname(file)));}}
optimize(output);
const files=Object.fromEntries(fs.readdirSync(output,{recursive:true}).filter(name=>!name.endsWith('.m4a')&&fs.statSync(path.join(output,name)).isFile()).map(name=>['/'+name,fs.readFileSync(path.join(output,name))]));
const worker=releaseServiceWorker(fs.readFileSync(path.join(output,'sw.js'),'utf8'),files);
fs.writeFileSync(path.join(output,'index.html'),stampReleaseHTML(fs.readFileSync(path.join(output,'index.html'),'utf8'),worker));
fs.writeFileSync(path.join(output,'sw.js'),productionAsset(worker,'.js'));
console.log('Built Vercel web assets.');

fs.writeFileSync(path.join(output,'release.json'),JSON.stringify({revision:buildRevision(),apiOrigin:'https://bits-yeiwon-knowledge.expert-bass-1722.chatgpt.site'}));
