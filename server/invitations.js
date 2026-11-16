const encoder=new TextEncoder();
export const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export async function passwordHash(password,salt){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:encoder.encode(salt),iterations:100000},key,256)));}
export async function isOwner(request,env){
 // Identity headers are supplied by Sites. Bind its site-scoped ID once, then use that ID.
 const userId=request.headers.get('oai-authenticated-user-id');if(!userId)return false;
 let row=await env.DB.prepare('SELECT user_id FROM space_owner WHERE id=?').bind('owner').first();
 if(!row&&env.OWNER_EMAIL&&request.headers.get('oai-authenticated-user-email')?.toLowerCase()===env.OWNER_EMAIL.toLowerCase()){
  await env.DB.prepare('INSERT INTO space_owner(id,user_id) VALUES(?,?) ON CONFLICT(id) DO NOTHING').bind('owner',userId).run();
  row=await env.DB.prepare('SELECT user_id FROM space_owner WHERE id=?').bind('owner').first();
 }
 return row?.user_id===userId;
}
export function constantEqual(a,b){let difference=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)difference|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return difference===0;}
