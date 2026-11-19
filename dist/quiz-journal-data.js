import {validTrivia} from './trivia-loader.js';

export function quizSnapshot(question){
 if(!validTrivia(question))return null;
 return {id:question.id,category:question.category,question:question.question,options:[...question.options],answer:question.answer,explanation:question.explanation,source:{title:question.source.title,url:question.source.url}};
}

// Content identity only, never an authentication or permission credential.
export function quizRevision(question){
 const snapshot=quizSnapshot(question);if(!snapshot)return null;
 let a=2166136261,b=3335557771;
 for(const c of JSON.stringify(snapshot)){const n=c.codePointAt(0);a=Math.imul(a^n,16777619);b=Math.imul(b^n,2246822519);}
 return 'q1-'+(a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');
}

export function journalRecordId(question){return question.id+'@'+quizRevision(question);}
export function validJournalRecord(record){
 return record&&typeof record.recordId==='string'&&validTrivia(record.snapshot)&&record.recordId===journalRecordId(record.snapshot)&&Number.isInteger(record.choice)&&record.choice>=0&&record.choice<4&&Number.isFinite(record.updatedAt);
}

export function mergeJournalRecords(records){
 const byId=new Map();
 for(const row of records.filter(validJournalRecord)){
  const previous=byId.get(row.recordId);
  const confirmedAttempt=row.synced&&row.attemptId&&row.attemptId===previous?.attemptId;
  if(!previous||confirmedAttempt||row.updatedAt>=previous.updatedAt)byId.set(row.recordId,{...row,everCorrect:!!(row.everCorrect||previous?.everCorrect)});
 }
 return [...byId.values()].sort((a,b)=>b.updatedAt-a.updatedAt||a.recordId.localeCompare(b.recordId));
}
