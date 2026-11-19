import {createLivePreview} from './live-preview.mjs';
import {assetResponse} from '../server/static-response.js';
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {handleAPI} from '../server/api.js';
import {createLocalDatabase} from './local-database.mjs';
if(fs.existsSync('.env.local'))process.loadEnvFile('.env.local');
const dbPath=path.resolve(process.env.LOCAL_DB_PATH||'.winter-build/local.sqlite');fs.mkdirSync('.winter-build',{recursive:true});
const database=createLocalDatabase(dbPath),query=input=>database.query(input);
// Existing local databases receive incremental migrations without deleting visitor data.
await query({sql:'CREATE TABLE IF NOT EXISTS __local_migrations (name TEXT PRIMARY KEY)',args:[]});
for(const name of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort()){
 if((await query({sql:'SELECT name FROM __local_migrations WHERE name=?',args:[name]})).results.length)continue;
 for(const sql of fs.readFileSync('drizzle/'+name,'utf8').split('--> statement-breakpoint')){if(!sql.trim())continue;try{await query({sql,args:[]});}catch(error){if(!/already exists|duplicate column name/.test(error.message))throw error;}}
 await query({sql:'INSERT INTO __local_migrations(name) VALUES (?)',args:[name]});
}
const port=Number(process.env.PORT)||4173,staticDir=process.env.PREVIEW_STATIC_DIR||'dist';
const live=process.env.LIVE_RELOAD==='1'?createLivePreview(staticDir):null;
const DB={prepare(sql){return{bind(...args){return{async run(){return query({sql,args})},async all(){return query({sql,args})},async first(){return(await query({sql,args})).results[0]||null}}}}}};
const types={'.js':'text/javascript','.json':'application/json','.css':'text/css','.html':'text/html','.m4a':'audio/mp4','.woff2':'font/woff2','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
http.createServer(async(req,res)=>{if(live?.handle(req,res))return;try{const origin='http://127.0.0.1:'+port,chunks=[];for await(const chunk of req)chunks.push(chunk);const request=new Request(origin+req.url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});if(process.env.LOCAL_OWNER_EMAIL){request.headers.set('oai-authenticated-user-id','local-owner');request.headers.set('oai-authenticated-user-email',process.env.LOCAL_OWNER_EMAIL);}let result=await handleAPI(request,{DB,REALTIME_URL:process.env.REALTIME_URL,REALTIME_SECRET:process.env.REALTIME_SECRET,OWNER_EMAIL:process.env.LOCAL_OWNER_EMAIL,OPENAI_API_KEY:process.env.OPENAI_API_KEY,OPENAI_MODEL:process.env.OPENAI_MODEL,CRON_SECRET:process.env.CRON_SECRET});if(!result){const pathname=decodeURIComponent(new URL(request.url).pathname);const file=path.resolve(staticDir,'.'+(['/','/admin','/admin/'].includes(pathname)?'/index.html':pathname));if(!file.startsWith(path.resolve(staticDir)+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())result=new Response('Not found',{status:404});else result=assetResponse(request,{type:types[path.extname(file)]||'text/plain',binary:['.m4a','.woff2','.jpg','.jpeg','.png','.webp'].includes(path.extname(file)),body:live&&path.extname(file)==='.html'?live.inject(fs.readFileSync(file,'utf8')):fs.readFileSync(file,['.m4a','.woff2','.jpg','.jpeg','.png','.webp'].includes(path.extname(file))?'base64':'utf8')});}res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));}catch{res.writeHead(500);res.end('Local request failed');}}).listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port));

process.on('SIGTERM',()=>{live?.close();database.close();process.exit(0);});
