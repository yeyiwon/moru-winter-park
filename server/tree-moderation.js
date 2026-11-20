import {digest} from './invitations.js';
export async function decorationRevision(rows){return (await digest(rows.map(r=>r.id).sort().join('|'))).slice(0,24);}
export async function clearDecorations(DB,self,body,now){
 const rows=(await DB.prepare('SELECT * FROM tree_decorations WHERE room=? ORDER BY created_at,id').bind(self.room).all()).results||[];
 if(!rows.length||body.count!==rows.length||body.revision!==await decorationRevision(rows)||body.confirmation!==`장식 ${rows.length}개 삭제`)return {status:409,error:'장식 목록이 변경됐습니다. 수량을 다시 확인해 주세요.'};
 const backupId=crypto.randomUUID();
 // Snapshot only the confirmed decorations. Concurrent new ornaments and all
 // wish text survive; failure after this insert leaves a recoverable backup.
 await DB.prepare('INSERT INTO decoration_backups(id,room,actor,payload,created_at) VALUES(?,?,?,?,?)').bind(backupId,self.room,self.id,JSON.stringify(rows),now).run();
 const result=await DB.prepare("DELETE FROM tree_decorations WHERE room=? AND id IN (SELECT json_extract(value,'$.id') FROM json_each((SELECT payload FROM decoration_backups WHERE id=?)))").bind(self.room,backupId).run();
 return {ok:true,backupId,removed:result.meta?.changes||0};
}
