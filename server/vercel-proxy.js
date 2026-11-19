export const backendOrigin='https://bits-yeiwon-knowledge.expert-bass-1722.chatgpt.site';
const routes=new Set(['owner-auth','realtime','quiz-journal','quiz-refresh','appearance','health','access','invite','invite-check','join','tree','name','leave','chat','presence','ride','wishes','reports','admin','events','quiz','assist','region','operations','world-state','experience','fireworks']);
export async function proxyRequest(request,fetcher=fetch,{cronSecret}={}){
 const url=new URL(request.url),route=url.searchParams.get('route')||url.pathname.slice(5),write=!['GET','HEAD'].includes(request.method);
 const error=(message,status)=>Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
 if(!routes.has(route))return error('요청을 찾을 수 없습니다.',404);
 if(!['GET','HEAD','POST','PATCH','DELETE'].includes(request.method))return error('지원하지 않는 요청입니다.',405);
 if(write&&(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site'))return error('다른 사이트에서는 변경할 수 없습니다.',403);
 if(route==='quiz-refresh'&&(!cronSecret||request.method!=='GET'||request.headers.get('authorization')!=='Bearer '+cronSecret))return error('예약 작업만 실행할 수 있습니다.',403);
 const body=write?await request.text():undefined;if(body?.length>4096)return error('요청이 너무 큽니다.',413);
 // Forward only the guest session. Client-supplied Sites identity headers must
 // never become an administrator identity at the shared backend.
 const headers=new Headers({'Accept':'application/json','Origin':backendOrigin});
 if(route==='quiz-refresh')headers.set('Authorization','Bearer '+cronSecret);
 const session=/(?:^|;\s*)winter_session=([a-f0-9]{64})(?:;|$)/.exec(request.headers.get('cookie')||'');
 const login=/(?:^|;\s*)winter_login=([a-f0-9]{64})(?:;|$)/.exec(request.headers.get('cookie')||'');
 if(session||login)headers.set('Cookie',[session&&'winter_session='+session[1],login&&'winter_login='+login[1]].filter(Boolean).join('; '));if(write)headers.set('Content-Type','application/json');
 try{
  const target=new URL(backendOrigin+'/api/'+route),revision=url.searchParams.get('revision');
  if(route==='tree'&&/^[a-f0-9]{24}$/.test(revision||''))target.searchParams.set('revision',revision);
  if(route==='quiz-journal'&&url.searchParams.has('cursor'))target.searchParams.set('cursor',url.searchParams.get('cursor'));
  const upstream=await fetcher(target.href,{method:request.method,headers,body,redirect:'manual',signal:AbortSignal.timeout(route==='quiz-refresh'?25000:8000)});
  if(upstream.status>=300&&upstream.status<400||!upstream.headers.get('content-type')?.includes('application/json'))return error('공간 연결을 확인해 주세요.',502);
  const responseHeaders=new Headers({'Content-Type':'application/json','Cache-Control':'no-store'});
  const cookies=upstream.headers.getSetCookie?.()||[upstream.headers.get('set-cookie')||''];
  const cookie=cookies.flatMap(value=>value.split(/,(?=\s*[^;,=]+=)/)).find(value=>/^\s*winter_(?:session|login)=(?:[a-f0-9]{64})?;/.test(value));
  if(cookie)responseHeaders.set('Set-Cookie',cookie.trim());
  return new Response(upstream.body,{status:upstream.status,headers:responseHeaders});
 }catch{return error('공간 연결을 확인해 주세요.',502);}
}
