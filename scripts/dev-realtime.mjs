// Isolated local preview: never points at the hosted database or production world.
import {Miniflare} from 'miniflare';
import {build} from 'esbuild';
import {spawn} from 'node:child_process';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'winter-preview-')),secret=crypto.randomUUID()+crypto.randomUUID();
const ports=[4189,4190],origins=ports.map(p=>'http://127.0.0.1:'+p);
await build({entryPoints:['realtime/worker.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:path.join(directory,'realtime.mjs')});
const mf=new Miniflare({rootPath:directory,modulesRoot:directory,modules:true,scriptPath:path.join(directory,'realtime.mjs'),compatibilityDate:'2026-07-01',durableObjects:{WORLD:{className:'WinterWorld',useSQLite:true}},bindings:{REALTIME_SECRET:secret,ALLOWED_ORIGINS:origins.join(',')},port:0,inspectorPort:0});
const url=await mf.ready,children=[];
// Start sequentially so local SQLite migration initialization cannot race.
for(const [index,port]of ports.entries()){
 const env={...process.env,PORT:String(port),LOCAL_DB_PATH:path.join(directory,'preview.sqlite'),REALTIME_URL:url.origin,REALTIME_SECRET:secret};
 delete env.LOCAL_OWNER_EMAIL;if(index)env.LOCAL_OWNER_EMAIL='qa-owner@example.invalid';
 const child=spawn(process.execPath,['scripts/dev-server.mjs'],{env,stdio:['ignore','pipe','inherit']});children.push(child);
 await new Promise((resolve,reject)=>{child.once('exit',()=>reject(Error('Preview failed')));child.stdout.on('data',data=>{process.stdout.write(data);if(String(data).includes('Local:'))resolve();});});
}
console.log('Isolated guest 4189 / owner fixture 4190; no hosted data is used.');
let stopping=false;async function stop(){if(stopping)return;stopping=true;await Promise.all(children.map(child=>new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGTERM');})));await mf.dispose();fs.rmSync(directory,{recursive:true,force:true});process.exit(0);}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
