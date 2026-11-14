(()=>{
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let sound=true,volume=.4;try{sound=localStorage.getItem('lab-sound')!=='off';const v=localStorage.getItem('lab-volume');if(v!==null)volume=Math.max(0,Math.min(1,Number(v)||0));}catch{}
const button=document.getElementById('sound'),slider=document.getElementById('sound-volume'),output=document.getElementById('volume-value');let audio,master,lastStep=0;
function labels(){button.textContent=sound?'켜짐':'꺼짐';button.setAttribute('aria-checked',sound);slider.value=Math.round(volume*100);output.textContent=Math.round(volume*100)+'%';}
function unlock(){if(!sound)return;try{if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=volume*.45;master.connect(audio.destination);}if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}}
document.addEventListener('pointerdown',unlock,{capture:true});document.addEventListener('keydown',unlock,{capture:true});
window.labSound=(kind)=>{
 if(!sound||!audio||audio.state!=='running')return;
 if(kind==='step'){if(audio.currentTime-lastStep<.26)return;lastStep=audio.currentTime;}
 const sequences={move:[392,587.33],discover:[783.99,1174.66],open:[523.25,783.99],close:[440],select:[660],correct:[659.25,830.61,987.77,1318.51],wrong:[293.66,261.63],step:[150],land:[196],travel:[392,587.33,783.99]};
 const notes=sequences[kind]||sequences.select,start=audio.currentTime;
 notes.forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain(),when=start+i*.065,quiet=kind==='step'?.012:kind==='land'?.025:.075;o.type='sine';o.frequency.setValueAtTime(f,when);if(kind==='move'||kind==='step')o.frequency.exponentialRampToValueAtTime(f*.6,when+.18);g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(quiet,when+.012);g.gain.exponentialRampToValueAtTime(.0001,when+(kind==='correct'?.65:.36));o.connect(g);g.connect(master);o.start(when);o.stop(when+.7);});
 if(kind==='open'||kind==='travel'){const length=Math.floor(audio.sampleRate*.18),buffer=audio.createBuffer(1,length,audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*Math.sin(i/length*Math.PI);const n=audio.createBufferSource(),filter=audio.createBiquadFilter(),g=audio.createGain();n.buffer=buffer;filter.type='lowpass';filter.frequency.setValueAtTime(1800,start);filter.frequency.exponentialRampToValueAtTime(300,start+.18);g.gain.value=.035;n.connect(filter);filter.connect(g);g.connect(master);n.start();}
};
button.addEventListener('click',()=>{sound=!sound;labels();try{localStorage.setItem('lab-sound',sound?'on':'off')}catch{}if(sound){unlock();window.labSound('select');}});
slider.addEventListener('input',()=>{volume=Number(slider.value)/100;if(master)master.gain.setTargetAtTime(volume*.45,audio.currentTime,.03);labels();try{localStorage.setItem('lab-volume',String(volume))}catch{}});slider.addEventListener('change',()=>window.labSound('select'));labels();
window.labFeedback=correct=>{window.labSound(correct?'correct':'wrong');requestAnimationFrame(()=>document.querySelector('.explanation')?.scrollIntoView({block:'nearest',behavior:reduce.matches||document.body.classList.contains('still')?'instant':'smooth'}));if(correct)window.parkCelebrate?.();if(reduce.matches||document.body.classList.contains('still'))return;document.querySelector(correct?'.answer.correct':'.answer.wrong')?.animate([{opacity:.5,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:450,easing:'cubic-bezier(.16,1,.3,1)'});};
})();
const overlay=document.getElementById('quiz-overlay'),shade=document.getElementById('quiz-shade');
window.labTransition=()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('still'))return;document.getElementById('quiz-slot')?.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:380,easing:'cubic-bezier(.22,1,.36,1)'})};
let quizOpener;
function openQuiz(){
  if(!overlay.hidden)return;
  window.labSound?.('open');quizOpener=document.activeElement;document.getElementById('park-menu').open=false;
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
  window.labSound?.('close');overlay.hidden=true;shade.hidden=true;document.getElementById('discovery-card').inert=false;document.body.classList.remove('quiz-open');
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
window.showParkDiscovery=book=>{const card=document.getElementById('discovery-card');if(!book){card.hidden=true;document.body.classList.remove('discovery-visible');return;}discoveryQuestion=window.getParkPreview(book.cat);if(!discoveryQuestion)return;document.getElementById('discovery-field').textContent=discoveryQuestion.label;document.getElementById('discovery-question').textContent=discoveryQuestion.question;card.hidden=false;document.body.classList.add('discovery-visible');window.labSound?.('discover');};
document.addEventListener('pointerdown',e=>{const menu=document.getElementById('park-menu');if(menu.open&&!menu.contains(e.target))menu.open=false;});
