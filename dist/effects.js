(()=>{
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let sound=false;try{sound=localStorage.getItem('lab-sound')==='on'}catch{}
const soundButton=document.getElementById('sound');
function soundLabel(){soundButton.textContent=sound?'소리 켜짐 ♪':'소리 꺼짐';soundButton.setAttribute('aria-pressed',sound);soundButton.setAttribute('aria-label',sound?'효과음 끄기':'효과음 켜기')}
soundLabel();let audio;
function tone(correct){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const t=audio.currentTime;const notes=correct?[659.25,987.77]:[293.66,261.63];notes.forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=f;o.connect(g);g.connect(audio.destination);const start=t+i*.085;g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(.025,start+.012);g.gain.exponentialRampToValueAtTime(.001,start+.42);o.start(start);o.stop(start+.44)});}catch{}}
soundButton.addEventListener('click',()=>{sound=!sound;soundLabel();try{localStorage.setItem('lab-sound',sound?'on':'off')}catch{}if(sound)tone(true)});
window.labFeedback=correct=>{tone(correct);if(correct)window.parkCelebrate?.();if(reduce.matches||document.body.classList.contains('still'))return;const answer=document.querySelector(correct?'.answer.correct':'.answer.wrong');answer?.animate(correct?[{boxShadow:'0 0 0 0 #b8eed000'},{boxShadow:'0 0 34px 0 #b8eed029',offset:.4},{boxShadow:'0 0 0 0 #b8eed000'}]:[{opacity:.55},{opacity:1}],{duration:correct?650:250,easing:'ease-out'});};
})();
const overlay=document.getElementById('quiz-overlay');
function openQuiz(){overlay.hidden=false;document.body.classList.add('quiz-open');document.getElementById('close-quiz').focus();}
function closeQuiz(){overlay.hidden=true;document.body.classList.remove('quiz-open');document.getElementById('open-quiz').focus();}
document.getElementById('open-quiz').addEventListener('click',()=>{go('explore');openQuiz()});
document.getElementById('close-quiz').addEventListener('click',closeQuiz);
document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',openQuiz));
document.querySelector('.brand').addEventListener('click',closeQuiz);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)closeQuiz()});
