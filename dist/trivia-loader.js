import {fallbackTrivia} from './trivia-fallback.js';
export function validTrivia(q){return q&&typeof q.id==='string'&&typeof q.question==='string'&&q.question.length<=240&&Array.isArray(q.options)&&q.options.length===4&&q.options.every(v=>typeof v==='string'&&v.length<=120)&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4&&typeof q.explanation==='string'&&q.explanation.length<=1000&&typeof q.category==='string'&&typeof q.source?.title==='string'&&/^https:\/\//.test(q.source?.url||'');}
export function dailyQuestions(items,date=new Date()){
 const day=Math.floor((date.getTime()+9*3600000)/86400000),categories=new Map();for(const q of items.filter(q=>validTrivia(q)&&!q.disabled)){if(!categories.has(q.category))categories.set(q.category,[]);categories.get(q.category).push(q);}
 const chosen=[...categories.values()].map(group=>group.sort((a,b)=>a.id.localeCompare(b.id))[((day%group.length)+group.length)%group.length]);
 return chosen.sort((a,b)=>hash(a.id+day)-hash(b.id+day)).slice(0,7);
}
function hash(s){let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export async function loadTrivia(win=typeof window==='undefined'?null:window){
 const admitted=!!win?.labSocialJoined;
 let cached=[];try{cached=JSON.parse(win?.localStorage.getItem('winter-trivia-cache'))||[];}catch{}let items=(Array.isArray(cached)?cached:[]).filter(validTrivia);if(!items.length)items=fallbackTrivia;
 try{const r=await (win?.fetch||fetch)('/content/daily-trivia.json',{signal:AbortSignal.timeout(3500)});if(!r.ok)throw Error();const data=await r.json();if(!Array.isArray(data)||data.length<7||!data.every(validTrivia))throw Error();items=data;try{win?.localStorage.setItem('winter-trivia-cache',JSON.stringify(data));}catch{}}catch{}
 // Only administrator-reviewed edits are admitted; raw external API output is never shown.
 if(admitted&&win?.labSocialJoined)try{const r=await (win?.fetch||fetch)('/api/quiz',{signal:AbortSignal.timeout(2000)});if(r.ok){const data=await r.json(),map=new Map(items.map(q=>[q.id,q]));for(const q of data.overrides||[])if(validTrivia(q))map.set(q.id,q);items=[...map.values()];}}catch{}
 return items.filter(q=>!q.disabled).length?items:fallbackTrivia;
}

export function galleryQuestions(items,categories,date=new Date()){
 const pool=items.filter(q=>validTrivia(q)&&!q.disabled&&categories.includes(q.category)).sort((a,b)=>a.id.localeCompare(b.id));if(!pool.length)return dailyQuestions(items,date);
 const offset=Math.floor((date.getTime()+9*3600000)/86400000)%pool.length;return Array.from({length:Math.min(6,pool.length)},(_,i)=>pool[(offset+i)%pool.length]);
}
