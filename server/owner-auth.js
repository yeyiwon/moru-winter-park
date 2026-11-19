import {digest,hex,isOwner,sessionToken} from './invitations.js';
import {parkOrigin} from '../dist/space-links.js';
import {rateLimit} from './community-api.js';
const siteOrigin='https://bits-yeiwon-knowledge.expert-bass-1722.chatgpt.site';
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const stateCookie=request=>/(?:^|;\s*)winter_login=([a-f0-9]{64})(?:;|$)/.exec(request.headers.get('cookie')||'')?.[1];
export async function ownerSession(request,env,now=Date.now()){
 const token=sessionToken(request);if(!token)return false;
 const row=await env.DB.prepare('SELECT session_id FROM owner_sessions WHERE session_id=? AND expires_at>?').bind(await digest(token),now).first();
 return !!row;
}
export async function ownerAuthAPI(request,env,now){
 if(new URL(request.url).pathname!=='/api/owner-auth')return null;
 const reply=(data,status=200,cookie)=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})}});
 if(request.method!=='POST')return reply({error:'지원하지 않는 요청입니다.'},405);
 const raw=await request.text();if(raw.length>512)return reply({error:'요청이 너무 큽니다.'},413);
 const body=JSON.parse(raw)||{},secure=new URL(request.url).protocol==='https:'?'; Secure':'';
 const cookie=(name,value,age)=>`${name}=${value}; Path=/api; HttpOnly; SameSite=Lax${secure}; Max-Age=${age}`;
 if(!await rateLimit(env.DB,'owner-login:'+await digest(request.headers.get('cf-connecting-ip')||'shared'),now,30))return reply({error:'잠시 후 다시 로그인해 주세요.'},429);
 if(body.action==='begin'){
  const state=random();return reply({url:siteOrigin+'/admin?owner_redirect='+state},200,cookie('winter_login',state,600));
 }
 if(body.action==='grant'){
  // Only the provider-authenticated owner may issue a one-use exchange code.
  if(!request.headers.get('oai-authenticated-user-id')||!await isOwner(request,env))return reply({error:'소유자 인증이 필요합니다.'},403);
  if(!/^[a-f0-9]{64}$/.test(body.state||''))return reply({error:'로그인을 다시 시작해 주세요.'},400);
  const code=random();await env.DB.prepare('INSERT INTO owner_login_codes(code_hash,state_hash,expires_at) VALUES(?,?,?)').bind(await digest(code),await digest(body.state),now+60000).run();
  return reply({url:parkOrigin+'/admin#owner_code='+code});
 }
 if(body.action==='exchange'){
  const state=stateCookie(request);if(!state||!/^[a-f0-9]{64}$/.test(body.code||''))return reply({error:'로그인을 다시 시작해 주세요.'},403);
  const claimed=await env.DB.prepare('DELETE FROM owner_login_codes WHERE code_hash=? AND state_hash=? AND expires_at>? RETURNING code_hash').bind(await digest(body.code),await digest(state),now).first();
  if(!claimed)return reply({error:'인증이 만료되었거나 이미 사용되었습니다.'},403);
  // Rotate the identity on elevation to prevent session fixation. Guest data remains intact.
  const secret=random();await env.DB.prepare('INSERT INTO owner_sessions(session_id,expires_at) VALUES(?,?)').bind(await digest(secret),now+8*3600000).run();
  return reply({ok:true},200,cookie('winter_session',secret,8*3600));
 }
 if(body.action==='logout'){
  const token=sessionToken(request);if(token)await env.DB.prepare('DELETE FROM owner_sessions WHERE session_id=?').bind(await digest(token)).run();
  return reply({ok:true},200,cookie('winter_session','',0));
 }
 return reply({error:'요청을 확인해 주세요.'},400);
}
