(()=>{
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let sound=false;try{sound=localStorage.getItem('lab-sound')==='on'}catch{}
const soundButton=document.getElementById('sound');
function soundLabel(){soundButton.textContent=sound?'소리 켜짐 ♪':'소리 꺼짐';soundButton.setAttribute('aria-pressed',sound);soundButton.setAttribute('aria-label',sound?'효과음 끄기':'효과음 켜기')}
soundLabel();let audio;
function tone(correct){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const t=audio.currentTime;const notes=correct?[659.25,987.77]:[293.66,261.63];notes.forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=f;o.connect(g);g.connect(audio.destination);const start=t+i*.085;g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(.025,start+.012);g.gain.exponentialRampToValueAtTime(.001,start+.42);o.start(start);o.stop(start+.44)});}catch{}}
soundButton.addEventListener('click',()=>{sound=!sound;soundLabel();try{localStorage.setItem('lab-sound',sound?'on':'off')}catch{}if(sound)tone(true)});
window.labFeedback=correct=>{tone(correct);requestAnimationFrame(()=>document.querySelector('.explanation')?.scrollIntoView({block:'nearest',behavior:reduce.matches||document.body.classList.contains('still')?'instant':'smooth'}));if(correct)window.parkCelebrate?.();if(reduce.matches||document.body.classList.contains('still'))return;const answer=document.querySelector(correct?'.answer.correct':'.answer.wrong');answer?.animate(correct?[{boxShadow:'0 0 0 0 #b8eed000'},{boxShadow:'0 0 34px 0 #b8eed029',offset:.4},{boxShadow:'0 0 0 0 #b8eed000'}]:[{opacity:.55},{opacity:1}],{duration:correct?650:250,easing:'ease-out'});};
})();
const overlay=document.getElementById('quiz-overlay'),shade=document.getElementById('quiz-shade');
window.labTransition=()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('still'))return;document.getElementById('quiz-slot')?.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:380,easing:'cubic-bezier(.22,1,.36,1)'})};
let quizOpener;
function openQuiz(){
  if(!overlay.hidden)return;
  quizOpener=document.activeElement;document.getElementById('park-menu').open=false;
  const origin=window.parkKnowledgeOrigin?.();overlay.style.setProperty('--entry-x',origin?(origin.x-innerWidth/2)+'px':'0px');overlay.style.setProperty('--entry-y',origin?(origin.y-innerHeight/2)+'px':'55px');
  if(origin){document.body.style.setProperty('--source-x',origin.x+'px');document.body.style.setProperty('--source-y',origin.y+'px')}
  shade.hidden=false;document.getElementById('discovery-card').inert=true;
  window.dispatchEvent(new Event('lab:open'));
  overlay.hidden=false;document.body.classList.add('quiz-open');overlay.scrollTop=0;
  document.querySelector('.park-home').inert=true;document.querySelector('header').inert=true;document.querySelector('.park-bottom').inert=true;document.querySelector('#joystick').inert=true;
  document.getElementById('close-quiz').focus({preventScroll:true});
}
function closeQuiz(){
  if(overlay.hidden)return;
  overlay.hidden=true;shade.hidden=true;document.getElementById('discovery-card').inert=false;document.body.classList.remove('quiz-open');
  document.querySelector('.park-home').inert=false;document.querySelector('header').inert=false;document.querySelector('.park-bottom').inert=false;document.querySelector('#joystick').inert=false;
  window.dispatchEvent(new Event('lab:close'));
  const opener=quizOpener?.isConnected&&quizOpener.getClientRects().length?quizOpener:document.querySelector('#park-menu summary');opener.focus({preventScroll:true});
}
window.openParkKnowledge=category=>{if(!overlay.hidden)return;window.startParkQuiz(category,discoveryQuestion?.cat===category?discoveryQuestion.id:undefined);openQuiz()};
document.getElementById('open-quiz').addEventListener('click',()=>window.openParkKnowledge());
document.getElementById('close-quiz').addEventListener('click',closeQuiz);
shade.addEventListener('click',closeQuiz);
document.getElementById('open-discovery').addEventListener('click',()=>window.openParkKnowledge(discoveryQuestion?.cat));
document.getElementById('dismiss-discovery').addEventListener('click',()=>window.dismissParkDiscovery?.());
document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',openQuiz));
document.querySelector('.brand').addEventListener('click',closeQuiz);
document.addEventListener('keydown',e=>{
  if(overlay.hidden)return;
  if(e.key==='Escape'){e.preventDefault();closeQuiz()}
  if(e.key==='Tab'){
    const focusable=[...overlay.querySelectorAll('button:not(:disabled),a[href],input,textarea,summary,[tabindex="0"]')].filter(el=>el.getClientRects().length);
    const first=focusable[0],last=focusable.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
});

let discoveryQuestion=null;
window.showParkDiscovery=book=>{const card=document.getElementById('discovery-card');if(!book){card.hidden=true;document.body.classList.remove('discovery-visible');return;}discoveryQuestion=window.getParkPreview(book.cat);if(!discoveryQuestion)return;document.getElementById('discovery-field').textContent=discoveryQuestion.label;document.getElementById('discovery-question').textContent=discoveryQuestion.question;card.hidden=false;document.body.classList.add('discovery-visible');};
document.addEventListener('pointerdown',e=>{const menu=document.getElementById('park-menu');if(menu.open&&!menu.contains(e.target))menu.open=false;});
