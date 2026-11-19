import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {productionAsset} from './production-assets.mjs';
const output='web-dist';fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output,{recursive:true});for(const entry of fs.readdirSync('dist')){if(['server','.openai'].includes(entry))continue;fs.cpSync(path.join('dist',entry),path.join(output,entry),{recursive:true});}
function optimize(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())optimize(file);else if(['.js','.css'].includes(path.extname(file)))fs.writeFileSync(file,productionAsset(fs.readFileSync(file,'utf8'),path.extname(file)));}}
optimize(output);console.log('Built Vercel web assets.');

fs.writeFileSync(path.join(output,'release.json'),JSON.stringify({revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()+(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()?'-dirty':''),apiOrigin:'https://bits-yeiwon-knowledge.expert-bass-1722.chatgpt.site'}));
