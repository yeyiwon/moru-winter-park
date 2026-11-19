import {worldCapacity} from './realtime.js';
import {ownerSession} from './owner-auth.js';
import {rateLimit,json} from './community-api.js';
import {invitationToken,publicRoom,spaceURL} from '../dist/space-links.js';
import {validateNickname} from '../dist/nickname.js';
const encoder=new TextEncoder();
export const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export const digest=async value=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))));
export const sessionToken=request=>/(?:^|;\s*)winter_session=([a-f0-9]{64})(?:;|$)/.exec(request.headers.get('cookie')||'')?.[1];
export async function isOwner(request,env){
 // Identity headers are supplied by Sites. Bind its site-scoped ID once, then use that ID.
 const userId=request.headers.get('oai-authenticated-user-id');if(!userId)return ownerSession(request,env);
 let row=await env.DB.prepare('SELECT user_id FROM space_owner WHERE id=?').bind('owner').first();
 if(!row&&env.OWNER_EMAIL&&request.headers.get('oai-authenticated-user-email')?.toLowerCase()===env.OWNER_EMAIL.toLowerCase()){
  await env.DB.prepare('INSERT INTO space_owner(id,user_id) VALUES(?,?) ON CONFLICT(id) DO NOTHING').bind('owner',userId).run();
  row=await env.DB.prepare('SELECT user_id FROM space_owner WHERE id=?').bind('owner').first();
 }
 return row?.user_id===userId;
}
export async function validInvitation(DB,token,now){
 if(!invitationToken(token))return null;
 return DB.prepare('SELECT id,created_at AS createdAt,expires_at AS expiresAt FROM world_invites WHERE token_hash=? AND revoked_at IS NULL AND expires_at>?').bind(await digest(token),now).first();
}
export async function sessionInfo(request,env,now,owner){
 const secret=sessionToken(request);if(!secret)return{self:null,valid:false,blocked:false};
 const id=await digest(secret),self=await env.DB.prepare('SELECT v.*,i.expires_at AS inviteExpires,i.revoked_at AS inviteRevoked,b.id AS blocked FROM visitors v LEFT JOIN world_invites i ON i.id=v.invite_id LEFT JOIN visitor_blocks b ON b.id=v.id WHERE v.id=?').bind(id).first();
 const blocked=!!(self?self.blocked:await env.DB.prepare('SELECT id FROM visitor_blocks WHERE id=?').bind(id).first());
 let valid=!!self&&!blocked&&self.room===publicRoom&&self.admitted_at>0&&self.kicked_at===0&&self.seen>now-2592000000;
 if(valid)valid=self.auth_type==='owner'?(owner??await isOwner(request,env)):self.auth_type==='public'||self.auth_type==='invite'&&self.inviteExpires>now&&self.inviteRevoked==null;
 return{self,id,valid,blocked};
}
export function publicSession(self){return{id:self.id,name:self.name,room:publicRoom,region:self.region,color:self.color,colorTop:self.color_top,accessory:self.accessory,fluff:self.fluff,roundness:self.roundness,x:self.x,y:self.y,z:self.z,yaw:self.yaw};}
export async function invitationAPI(request,env,now){
 const path=new URL(request.url).pathname;if(!['/api/invite','/api/invite-check'].includes(path))return null;
 if(path==='/api/invite-check'){
  if(request.method!=='POST')return json({error:'지원하지 않는 요청입니다.'},405);
  if(!await rateLimit(env.DB,'invite-check:'+await digest(request.headers.get('cf-connecting-ip')||'shared'),now,120))return json({error:'잠시 뒤 다시 확인해 주세요.'},429);
  const raw=await request.text();if(raw.length>256)return json({error:'초대 주소를 확인해 주세요.'},400);
  const invitation=await validInvitation(env.DB,JSON.parse(raw)?.token,now);
  return invitation?json({valid:true,worldId:publicRoom,expiresAt:invitation.expiresAt}):json({error:'만료되었거나 취소된 초대입니다. 관리자에게 새 링크를 받아 주세요.'},403);
 }
 if(!await isOwner(request,env))return json({error:'관리자만 초대 링크를 관리할 수 있습니다.'},403);
 if(request.method==='GET')return json({worldId:publicRoom,invites:(await env.DB.prepare('SELECT id,created_at AS createdAt,expires_at AS expiresAt,revoked_at AS revokedAt FROM world_invites ORDER BY created_at DESC LIMIT 50').bind().all()).results});
 if(!['POST','DELETE'].includes(request.method))return json({error:'지원하지 않는 요청입니다.'},405);
 if(!await rateLimit(env.DB,'invite-admin',now,20))return json({error:'잠시 뒤 다시 시도해 주세요.'},429);
 const raw=await request.text();if(raw.length>512)return json({error:'요청이 너무 큽니다.'},413);const body=JSON.parse(raw);
 if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'요청을 확인해 주세요.'},400);
 if(request.method==='DELETE'){
  if(typeof body.id!=='string'||body.id.length>64)return json({error:'초대를 선택해 주세요.'},400);
  const changed=await env.DB.prepare('UPDATE world_invites SET revoked_at=? WHERE id=? AND revoked_at IS NULL').bind(now,body.id).run();
  if(!changed.meta?.changes)return json({error:'활성 초대를 찾을 수 없습니다.'},404);
  // One shared DB makes revocation effective across Sites and every frontend instance.
  await env.DB.prepare('UPDATE visitors SET seen=?,chat=\'\',chat_at=0,mode=\'\' WHERE invite_id=?').bind(now-20001,body.id).run();
  await env.DB.prepare('DELETE FROM ride_seats WHERE visitor IN (SELECT id FROM visitors WHERE invite_id=?)').bind(body.id).run();
  return json({ok:true});
 }
 const days=body.days??7;if(![1,7,30].includes(days))return json({error:'초대 유효기간을 확인해 주세요.'},400);
 const count=await env.DB.prepare('SELECT COUNT(*) AS count FROM world_invites WHERE revoked_at IS NULL AND expires_at>?').bind(now).first();
 if(count.count>=20)return json({error:'사용하지 않는 초대 링크를 먼저 폐기해 주세요.'},409);
 const token=hex(crypto.getRandomValues(new Uint8Array(32))),id=crypto.randomUUID(),expiresAt=now+days*86400000;
 await env.DB.prepare('INSERT INTO world_invites(id,token_hash,created_at,expires_at) VALUES(?,?,?,?)').bind(id,await digest(token),now,expiresAt).run();
 return json({id,worldId:publicRoom,url:spaceURL(token),expiresAt});
}

export async function joinWorld(request,env,now){
 const raw=await request.text();if(raw.length>2048)return json({error:'요청이 너무 큽니다.'},413);const body=JSON.parse(raw);
 if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'요청을 확인해 주세요.'},400);
 if(body.room&&body.room!==publicRoom)return json({error:'하나의 공개 겨울 광장만 운영합니다.'},400);
 if(!await rateLimit(env.DB,'join:'+await digest(request.headers.get('cf-connecting-ip')||'shared'),now,120))return json({error:'잠시 뒤 다시 입장해 주세요.'},429);
 const admin=await isOwner(request,env),session=await sessionInfo(request,env,now,admin);
 if(session.blocked)return json({error:'이 게스트의 입장이 제한되었습니다.'},403);
 let invitation=null;
 if(body.token!=null){invitation=await validInvitation(env.DB,body.token,now);if(!invitation)return json({error:'만료되었거나 취소된 초대입니다. 새 링크를 받아 주세요.'},403);}
 if(!admin&&session.self?.kicked_at&&(!invitation||invitation.createdAt<=session.self.kicked_at))return json({error:'관리자에 의해 이 세션의 입장이 제한되었습니다.'},403);
 let name;try{name=validateNickname(body.name||session.self?.name||'크림토끼');}catch(e){return json({error:e.message},400);}
 // Keep one of the twelve slots available so the owner can enter and moderate a full guest world.
 const authType=admin?'owner':'public',inviteId=null,capacity=worldCapacity(env);
 const capacitySQL=sql=>sql.replaceAll('<12','<'+capacity).replaceAll('<11','<'+(capacity-1));
 if(session.self){
  const changed=await env.DB.prepare(capacitySQL("UPDATE visitors SET room=?,name=?,seen=?,invite_id=?,admitted_at=?,kicked_at=0,auth_type=? WHERE id=? AND (SELECT COUNT(*) FROM visitors WHERE room=? AND seen>? AND admitted_at>0 AND id<>?)<12 AND (?=1 OR (SELECT COUNT(*) FROM visitors WHERE room=? AND seen>? AND admitted_at>0 AND auth_type<>'owner' AND id<>?)<11) AND (? IS NULL OR EXISTS(SELECT id FROM world_invites WHERE id=? AND revoked_at IS NULL AND expires_at>?))")).bind(publicRoom,name,now,inviteId,now,authType,session.id,publicRoom,now-20000,session.id,admin?1:0,publicRoom,now-20000,session.id,inviteId,inviteId,now).run();
  if(!changed.meta?.changes)return json({error:`광장이 가득 찼습니다. 잠시 뒤 다시 입장해 주세요. 게스트 정원은 ${capacity-1}명입니다.`},409);
  if(!session.valid){await env.DB.prepare("UPDATE visitors SET x=0,y=.95,z=30,yaw=0,region='outdoors',mode='',chat='',chat_at=0 WHERE id=?").bind(session.id).run();await env.DB.prepare('DELETE FROM ride_seats WHERE visitor=?').bind(session.id).run();}
  return json(publicSession(await env.DB.prepare('SELECT * FROM visitors WHERE id=?').bind(session.id).first()));
 }
 const color=/^#[0-9a-f]{6}$/i.test(body.color||'')?body.color:'#f4eee5';
 const secret=hex(crypto.getRandomValues(new Uint8Array(32))),id=await digest(secret);
 const result=await env.DB.prepare(capacitySQL("INSERT INTO visitors(id,room,name,color,accessory,x,z,yaw,seen,gesture,gesture_at,invite_id,admitted_at,auth_type) SELECT ?,?,?,?,'none',0,30,0,?,'',0,?,?,? WHERE (SELECT COUNT(*) FROM visitors WHERE room=? AND seen>? AND admitted_at>0)<12 AND (?=1 OR (SELECT COUNT(*) FROM visitors WHERE room=? AND seen>? AND admitted_at>0 AND auth_type<>'owner')<11) AND (? IS NULL OR EXISTS(SELECT id FROM world_invites WHERE id=? AND revoked_at IS NULL AND expires_at>?))")).bind(id,publicRoom,name,color,now,inviteId,now,authType,publicRoom,now-20000,admin?1:0,publicRoom,now-20000,inviteId,inviteId,now).run();
 if(!result.meta?.changes)return json({error:`입장할 수 없습니다. 현재 게스트 정원은 ${capacity-1}명이며 관리자 자리는 별도로 확보합니다.`},409);
 // A callback grant belongs to the prior login session. Keep the newly generated
 // random gameplay cookie and atomically move only that verified owner grant.
 // Invitation tokens and their validation remain completely separate.
 if(admin&&session.id&&!request.headers.get('oai-authenticated-user-id')){
  const grant=await env.DB.prepare('UPDATE owner_sessions SET session_id=? WHERE session_id=? AND expires_at>?').bind(id,session.id,now).run();
  if(!grant.meta?.changes){await env.DB.prepare('DELETE FROM visitors WHERE id=?').bind(id).run();return json({error:'인증이 만료되었습니다. 다시 로그인해 주세요.'},401);}
 }
 const secure=new URL(request.url).protocol==='https:'?'; Secure':'';
 return new Response(JSON.stringify(publicSession(await env.DB.prepare('SELECT * FROM visitors WHERE id=?').bind(id).first())),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':`winter_session=${secret}; Path=/api; HttpOnly; SameSite=Lax${secure}; Max-Age=2592000`}});
}
