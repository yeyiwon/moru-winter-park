import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
let count=0;for(const dir of ['dist','server','api','realtime','scripts']){for(const file of fs.readdirSync(dir,{recursive:true})){const p=path.join(dir,file);if(!/\.(js|mjs)$/.test(p)||p.startsWith('dist/server/')||p.startsWith('dist/vendor/'))continue;execFileSync(process.execPath,['--check',p],{stdio:'pipe'});count++;}}
console.log('Syntax checked '+count+' JavaScript modules');
