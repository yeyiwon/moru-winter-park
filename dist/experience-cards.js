import {winterTracks} from './music-catalog.js';
import {validTrivia} from './trivia-loader.js';
import {musicStyles,musicPaces,musicTags} from './experience-preferences.js';
export function renderExperienceCards(container,result,{onPlay,onQuiz}={}){
 container.replaceChildren();const doc=container.ownerDocument;
 for(const card of (Array.isArray(result?.cards)?result.cards:[]).slice(0,3)){
  const music=card.component==='RecommendationCard'?winterTracks.find(t=>t.id===card.item?.id):null;
  const knowledge=['ExplanationPanel','QuizCard'].includes(card.component)&&validTrivia(card.item)?card.item:null;
  if(!music&&!knowledge)continue;
  const article=doc.createElement('article');article.className='experience-card';article.dataset.component=card.component;
  const title=doc.createElement('h3'),text=doc.createElement('p'),action=doc.createElement('button');action.type='button';
  if(music){
   title.textContent=music.title;text.textContent=music.artist;
   const why=doc.createElement('small'),tags=musicTags[music.id]||[];why.textContent=[musicStyles[tags[0]],musicPaces[tags[1]]].filter(Boolean).join(' · ');
   action.textContent='재생';action.setAttribute('aria-label',music.title+' 재생');action.onclick=()=>onPlay?.(music.id);article.append(title,text,why,action);
  }else{
   title.textContent=knowledge.question;text.textContent=card.component==='ExplanationPanel'?knowledge.explanation:'보기에서 답을 골라 보세요.';
   const link=doc.createElement('a');link.href=knowledge.source.url;link.textContent=knowledge.source.title;link.target='_blank';link.rel='noopener noreferrer';link.className='quiz-source';
   action.textContent='문제 풀기';action.onclick=()=>onQuiz?.(knowledge.id);article.append(title,text,link,action);
  }
  container.append(article);
 }
 return container.childElementCount;
}
