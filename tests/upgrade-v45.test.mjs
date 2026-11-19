import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createLocalDatabase} from '../scripts/local-database.mjs';
test('published database upgrades through 0017 without changing visitors, wishes or journal',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'winter-upgrade-')),db=createLocalDatabase(path.join(dir,'upgrade.sqlite'));
 try{
  const files=fs.readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort();
  await db.query({schema:files.filter(n=>n<'0017').map(n=>fs.readFileSync('drizzle/'+n,'utf8')).join('\n')});
  await db.query({schema:`INSERT INTO visitors(id,room,name,color,accessory,x,z,yaw,seen,gesture,gesture_at) VALUES('saved','winter-plaza','기존 방문자','#0d172a','none',0,30,0,1000,'',0);
  INSERT INTO tree_decorations(id,room,author,kind,color,angle,height,created_at) VALUES('decoration','winter-plaza','saved','star','#ffe0a1',1,10,1000);
  INSERT INTO wishes(id,room,author,author_name,message,created_at) VALUES('wish','winter-plaza','saved','기존 방문자','보존할 소원',1000);
  INSERT INTO quiz_journal VALUES('saved','record','question','revision','{}',1,1,1,1,1000,1000,'attempt');`});
  const tables=['visitors','tree_decorations','wishes','quiz_journal'],before=[];for(const table of tables)before.push((await db.query({sql:'SELECT * FROM '+table,args:[]})).results);
  await db.query({schema:fs.readFileSync('drizzle/0017_dazzling_firelord.sql','utf8')});
  for(const [i,table]of tables.entries())assert.deepEqual((await db.query({sql:'SELECT * FROM '+table,args:[]})).results,before[i]);
  assert.equal((await db.query({sql:"SELECT COUNT(*) AS n FROM sqlite_master WHERE name IN ('owner_sessions','owner_login_codes','moderation_audit')",args:[]})).results[0].n,3);
 }finally{db.close();fs.rmSync(dir,{recursive:true,force:true});}
});
