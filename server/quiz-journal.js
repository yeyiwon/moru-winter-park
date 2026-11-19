import questions from '../dist/content/daily-trivia.json' with {type:'json'};
import {validTrivia} from '../dist/trivia-loader.js';
import {quizSnapshot,quizRevision,journalRecordId} from '../dist/quiz-journal-data.js';
import {json,rateLimit} from './community-api.js';

const columns='record_id AS recordId,question_id AS questionId,revision,snapshot,choice,correct,ever_correct AS everCorrect,saved,first_at AS firstAt,updated_at AS updatedAt,last_attempt AS attemptId';
function record(row){return row?{...row,snapshot:JSON.parse(row.snapshot),correct:!!row.correct,everCorrect:!!row.everCorrect,saved:!!row.saved,synced:true}:null;}
async function findQuestion(DB,id){
 const override=await DB.prepare('SELECT payload FROM quiz_overrides WHERE id=?').bind(id).first();
 if(override){try{return{...JSON.parse(override.payload),id};}catch{return null;}}
 return questions.find(q=>q.id===id)||null;
}

export async function quizJournalAPI(request,env,self,now=Date.now()){
 const url=new URL(request.url);if(url.pathname!=='/api/quiz-journal')return null;
 if(!self?.id)return json({error:'공간에 입장한 뒤 기록을 확인해 주세요.'},401);
 const DB=env.DB;
 if(request.method==='GET'){
  // The client cannot choose an owner. Pagination never changes the session scope.
  const offset=Number(url.searchParams.get('cursor')||0);
  if(!Number.isSafeInteger(offset)||offset<0||offset>100000)return json({error:'기록 위치를 확인해 주세요.'},400);
  const rows=await DB.prepare('SELECT '+columns+' FROM quiz_journal WHERE visitor=? ORDER BY updated_at DESC,record_id LIMIT 51 OFFSET ?').bind(self.id,offset).all();
  const values=rows.results||[];
  return json({records:values.slice(0,50).map(record),nextCursor:values.length>50?String(offset+50):null,scope:'guest-session'});
 }
 if(request.method!=='POST')return json({error:'지원하지 않는 요청입니다.'},405);
 let body;
 try{const raw=await request.text();if(raw.length>700)throw Error();body=JSON.parse(raw);}catch{return json({error:'기록할 내용을 확인해 주세요.'},400);}
 if(!body||!['answer','save'].includes(body.action))return json({error:'기록할 동작을 확인해 주세요.'},400);
 const allowed=body.action==='answer'?['action','questionId','revision','choice','attemptId']:['action','recordId','saved'];
 if(Object.keys(body).some(k=>!allowed.includes(k)))return json({error:'기록 형식을 확인해 주세요.'},400);
 if(!await rateLimit(DB,'quiz-journal:'+self.id,now,40))return json({error:'잠시 뒤 다시 기록해 주세요.'},429);
 if(body.action==='save'){
  if(typeof body.recordId!=='string'||body.recordId.length>180||typeof body.saved!=='boolean')return json({error:'담을 지식을 확인해 주세요.'},400);
  const result=await DB.prepare('UPDATE quiz_journal SET saved=? WHERE visitor=? AND record_id=?').bind(body.saved?1:0,self.id,body.recordId).run();
  if(!result.meta?.changes)return json({error:'내가 풀어본 기록을 찾을 수 없습니다.'},404);
  return json({record:record(await DB.prepare('SELECT '+columns+' FROM quiz_journal WHERE visitor=? AND record_id=?').bind(self.id,body.recordId).first())});
 }
 if(typeof body.questionId!=='string'||body.questionId.length>120||typeof body.revision!=='string'||!Number.isInteger(body.choice)||body.choice<0||body.choice>3||typeof body.attemptId!=='string'||! /^[a-zA-Z0-9_-]{8,80}$/.test(body.attemptId))return json({error:'선택한 답을 확인해 주세요.'},400);
 const question=await findQuestion(DB,body.questionId);
 if(!validTrivia(question)||question.disabled)return json({error:'현재 제공되지 않는 문제입니다. 새 문제를 불러와 주세요.'},404);
 const revision=quizRevision(question);
 if(revision!==body.revision)return json({error:'문제가 수정되었습니다. 다시 불러온 뒤 풀어 주세요.'},409);
 const snapshot=quizSnapshot(question),id=journalRecordId(question),correct=body.choice===question.answer?1:0;
 // A retry updates neither time nor result; each question revision remains one card.
 // The server grades its own catalogue and never trusts a client-provided answer.
 await DB.prepare('INSERT INTO quiz_journal(visitor,record_id,question_id,revision,snapshot,choice,correct,ever_correct,saved,first_at,updated_at,last_attempt) VALUES(?,?,?,?,?,?,?,?,0,?,?,?) ON CONFLICT(visitor,record_id) DO UPDATE SET choice=excluded.choice,correct=excluded.correct,ever_correct=MAX(quiz_journal.ever_correct,excluded.ever_correct),updated_at=excluded.updated_at,last_attempt=excluded.last_attempt WHERE quiz_journal.last_attempt<>excluded.last_attempt').bind(self.id,id,question.id,revision,JSON.stringify(snapshot),body.choice,correct,correct,now,now,body.attemptId).run();
 return json({record:record(await DB.prepare('SELECT '+columns+' FROM quiz_journal WHERE visitor=? AND record_id=?').bind(self.id,id).first())});
}
