import baseQuestions from '../dist/content/daily-trivia.json' with {type:'json'};
export const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export function messageText(value,max=160){
 if(typeof value!=='string')throw Error('내용을 입력해 주세요.');
 const text=value.normalize('NFC').trim();
 if(!text||text.length>max||/[<>\u0000-\u001f]/.test(text))throw Error(`태그 없이 1~${max}자로 입력해 주세요.`);
 if(/씨발|시발새끼|개새끼|죽여버|병신|n[i1]gger/i.test(text))throw Error('다른 사람을 공격하는 표현은 사용할 수 없습니다.');
 return text;
}
async function bodyOf(request,max=4096){const raw=await request.text();if(raw.length>max)throw Error('입력 내용이 너무 깁니다.');return JSON.parse(raw);}
export async function rateLimit(DB,id,now,limit=5,period=60000){
 await DB.prepare('INSERT INTO invite_attempts(id,attempts,reset_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=CASE WHEN reset_at<? THEN 1 ELSE attempts+1 END,reset_at=CASE WHEN reset_at<? THEN ? ELSE reset_at END').bind(id,now+period,now,now,now+period).run();
 return (await DB.prepare('SELECT attempts FROM invite_attempts WHERE id=?').bind(id).first()).attempts<=limit;
}
export async function communityAPI(request,env,self,admin){
 const DB=env.DB,url=new URL(request.url),path=url.pathname,now=Date.now();
 if(!['/api/wishes','/api/reports','/api/admin','/api/events','/api/quiz'].includes(path))return null;
 try{
 if(path==='/api/wishes'&&request.method==='GET'){
  const rows=await DB.prepare('SELECT w.id,w.author AS guestKey,(SELECT kind FROM tree_decorations d WHERE d.id=w.id) AS kind,(SELECT color FROM tree_decorations d WHERE d.id=w.id) AS color,w.message,w.visibility,w.created_at AS createdAt,CASE WHEN w.author=? THEN 1 ELSE 0 END AS mine,(SELECT COUNT(*) FROM wish_reactions r WHERE r.wish_id=w.id) AS reactions,EXISTS(SELECT 1 FROM wish_reactions r WHERE r.wish_id=w.id AND r.author=?) AS reacted FROM wishes w WHERE w.room=? AND (w.visibility=\'public\' OR w.author=?) ORDER BY w.created_at DESC LIMIT 160').bind(self.id,self.id,self.room,self.id).all();const wishes=(rows.results||[]).map(({guestKey,...wish})=>({...wish,name:'게스트 '+String(guestKey).slice(0,4).toUpperCase()}));return json({wishes});
 }
 if(path==='/api/wishes'&&request.method==='POST'){
  const b=await bodyOf(request,512);if(b.action!=='react')return json({error:'장식을 선택해 소원을 달아 주세요.'},400);
  const wish=await DB.prepare('SELECT id FROM wishes WHERE id=? AND room=? AND visibility=\'public\'').bind(String(b.id||''),self.room).first();if(!wish)return json({error:'소원을 찾을 수 없습니다.'},404);
  if(!await rateLimit(DB,'reaction:'+self.id,now,30))return json({error:'잠시 후 다시 눌러 주세요.'},429);
  const old=await DB.prepare('SELECT author FROM wish_reactions WHERE wish_id=? AND author=?').bind(wish.id,self.id).first();
  if(old)await DB.prepare('DELETE FROM wish_reactions WHERE wish_id=? AND author=?').bind(wish.id,self.id).run();else await DB.prepare('INSERT INTO wish_reactions(wish_id,author) SELECT ?,? WHERE NOT EXISTS (SELECT 1 FROM wish_reactions WHERE wish_id=? AND author=?)').bind(wish.id,self.id,wish.id,self.id).run();return json({ok:true});
 }
 if(path==='/api/reports'&&request.method==='POST'){
  const b=await bodyOf(request,1024);if(!['wish','chat','decoration'].includes(b.type))return json({error:'신고할 내용을 선택해 주세요.'},400);
  const reason=messageText(b.reason,200);let target;
  if(b.type==='wish')target=await DB.prepare('SELECT id FROM wishes WHERE id=? AND room=? AND (visibility=\'public\' OR author=?)').bind(String(b.id),self.room,self.id).first();
  if(b.type==='decoration')target=await DB.prepare('SELECT id FROM tree_decorations WHERE id=? AND room=?').bind(String(b.id),self.room).first();
  if(b.type==='chat')target=await DB.prepare('SELECT id FROM visitors WHERE id=? AND room=? AND chat_at>?').bind(String(b.id),self.room,now-600000).first();
  if(!target)return json({error:'신고할 내용을 찾을 수 없습니다.'},404);
  if(!await rateLimit(DB,'report:'+self.id,now,3,300000))return json({error:'신고를 접수했습니다. 추가 신고는 잠시 뒤 보내 주세요.'},429);
  await DB.prepare('INSERT INTO reports(id,room,reporter,target_type,target_id,reason,created_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),self.room,self.id,b.type,target.id,reason,now).run();return json({ok:true});
 }
 if(path==='/api/events'&&request.method==='GET'){return json({events:(await DB.prepare('SELECT id,title,starts_at AS startsAt,ends_at AS endsAt,kind FROM world_events WHERE enabled=1 AND ends_at>? ORDER BY starts_at LIMIT 12').bind(now).all()).results||[]});}
 if(path==='/api/quiz'&&request.method==='GET'){return json({overrides:(await DB.prepare('SELECT id,payload FROM quiz_overrides ORDER BY updated_at DESC LIMIT 100').bind().all()).results.map(r=>({id:r.id,...JSON.parse(r.payload)}))});}
 if(path!=='/api/admin')return json({error:'지원하지 않는 요청입니다.'},405);
 if(!admin)return json({error:'관리자만 사용할 수 있습니다.'},403);
 if(request.method==='GET'){
  const [reports,people,decorations,events,quizzes]=await Promise.all([
   DB.prepare('SELECT id,room,target_type AS type,target_id AS targetId,reason,created_at AS createdAt FROM reports WHERE resolved=0 ORDER BY created_at DESC LIMIT 80').bind().all(),
   DB.prepare('SELECT id,room,name,chat,chat_at AS chatAt FROM visitors WHERE seen>? ORDER BY seen DESC LIMIT 80').bind(now-600000).all(),
   DB.prepare('SELECT id,room,kind FROM tree_decorations ORDER BY created_at DESC LIMIT 160').bind().all(),
   DB.prepare('SELECT id,title,starts_at AS startsAt,ends_at AS endsAt,kind,enabled FROM world_events ORDER BY starts_at DESC LIMIT 30').bind().all(),
   DB.prepare('SELECT id,payload FROM quiz_overrides ORDER BY updated_at DESC LIMIT 100').bind().all()]);
  // Private wish text is deliberately never included in moderation listings.
  return json({reports:reports.results,people:people.results,decorations:decorations.results,events:events.results,quizzes:quizzes.results.map(r=>({id:r.id,...JSON.parse(r.payload)}))});
 }
 if(request.method!=='POST')return json({error:'지원하지 않는 요청입니다.'},405);
 const b=await bodyOf(request,8192),id=String(b.id||'');
 if(b.action==='resolve'){await DB.prepare('UPDATE reports SET resolved=1 WHERE id=?').bind(id).run();}
 else if(b.action==='remove-decoration'||b.action==='remove-wish'){
  await DB.prepare('DELETE FROM wishes WHERE id=?').bind(id).run();await DB.prepare('DELETE FROM wish_reactions WHERE wish_id=?').bind(id).run();await DB.prepare('DELETE FROM tree_decorations WHERE id=?').bind(id).run();
 }else if(b.action==='clear-chat'){await DB.prepare('UPDATE visitors SET chat=\'\',chat_at=0 WHERE id=?').bind(id).run();}
 else if(b.action==='block'){const found=await DB.prepare('SELECT id FROM visitors WHERE id=?').bind(id).first();if(!found)return json({error:'사용자를 찾을 수 없습니다.'},404);await DB.prepare('INSERT INTO visitor_blocks(id,created_at) VALUES(?,?) ON CONFLICT(id) DO NOTHING').bind(id,now).run();await DB.prepare('UPDATE visitors SET chat=\'\',seen=0 WHERE id=?').bind(id).run();}
 else if(b.action==='save-quiz'){
  const q=b.quiz||{},source=q.source||{};if(!Array.isArray(q.options)||q.options.length!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3||!/^https:\/\//.test(source.url||''))return json({error:'보기 4개, 정답과 HTTPS 출처를 확인해 주세요.'},400);
  const data={question:messageText(q.question,240),options:q.options.map(v=>messageText(v,120)),answer:q.answer,explanation:messageText(q.explanation,1000),category:messageText(q.category||'일반',20),source:{title:messageText(source.title||'출처',120),url:String(source.url).slice(0,600)},disabled:!!q.disabled};
  await DB.prepare('INSERT INTO quiz_overrides(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').bind(id||crypto.randomUUID(),JSON.stringify(data),now).run();
 }else if(b.action==='remove-quiz'){const base=baseQuestions.find(q=>q.id===id);if(base){await DB.prepare('INSERT INTO quiz_overrides(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').bind(id,JSON.stringify({...base,disabled:true}),now).run();}else await DB.prepare('DELETE FROM quiz_overrides WHERE id=?').bind(id).run();}
 else if(b.action==='save-event'){
  if(!['lights','quiz','tree'].includes(b.kind)||!Number.isFinite(b.startsAt)||!Number.isFinite(b.endsAt)||b.endsAt<=b.startsAt||b.endsAt-b.startsAt>604800000)return json({error:'종류와 시작·종료 시간을 확인해 주세요.'},400);
  await DB.prepare('INSERT INTO world_events(id,title,starts_at,ends_at,kind,enabled) VALUES(?,?,?,?,?,1) ON CONFLICT(id) DO UPDATE SET title=excluded.title,starts_at=excluded.starts_at,ends_at=excluded.ends_at,kind=excluded.kind,enabled=1').bind(id||crypto.randomUUID(),messageText(b.title,60),b.startsAt,b.endsAt,b.kind).run();
 }else if(b.action==='remove-event'){await DB.prepare('DELETE FROM world_events WHERE id=?').bind(id).run();}
 else return json({error:'지원하지 않는 관리 작업입니다.'},400);
 return json({ok:true});
 }catch(e){if(e instanceof SyntaxError)return json({error:'입력 형식을 확인해 주세요.'},400);if(/입력|표현/.test(e.message))return json({error:e.message},400);throw e;}
}
