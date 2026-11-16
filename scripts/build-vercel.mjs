import fs from 'node:fs';
import path from 'node:path';
const output='web-dist';fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output,{recursive:true});for(const entry of fs.readdirSync('dist')){if(['server','.openai'].includes(entry))continue;fs.cpSync(path.join('dist',entry),path.join(output,entry),{recursive:true});}
console.log('Built Vercel web assets.');
