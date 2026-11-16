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
 const sequences={bath:[349,523,698],tea:[349,440],drink:[349,440],rest:[392,494],bubble:[988,1319,1568],wave:[659,784],eat:[330,440],roast:[196,262],warm:[262,330],duet:[523,659,784,1047,1319],move:[392,587.33],discover:[783.99,1174.66],open:[523.25,783.99],close:[440],select:[660],correct:[659.25,830.61,987.77,1318.51],wrong:[293.66,261.63],step:[150],land:[196],travel:[392,587.33,783.99]};
 const notes=sequences[kind]||sequences.select,start=audio.currentTime;
 notes.forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain(),when=start+i*.065,quiet=kind==='step'?.012:kind==='land'?.025:.075;o.type='sine';o.frequency.setValueAtTime(f,when);if(kind==='move'||kind==='step')o.frequency.exponentialRampToValueAtTime(f*.6,when+.18);g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(quiet,when+.012);g.gain.exponentialRampToValueAtTime(.0001,when+(kind==='correct'?.65:.36));o.connect(g);g.connect(master);o.start(when);o.stop(when+.7);});
 if(['open','travel','bath','roast','bubble'].includes(kind)){const length=Math.floor(audio.sampleRate*.18),buffer=audio.createBuffer(1,length,audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*Math.sin(i/length*Math.PI);const n=audio.createBufferSource(),filter=audio.createBiquadFilter(),g=audio.createGain();n.buffer=buffer;filter.type='lowpass';filter.frequency.setValueAtTime(1800,start);filter.frequency.exponentialRampToValueAtTime(300,start+.18);g.gain.value=.035;n.connect(filter);filter.connect(g);g.connect(master);n.start();}
};
// One looping noise source, filtered continuously by speed and edge pressure.
let glide=null;
window.labSkiSound=({active=false,speed=0,lean=0,brake=false}={})=>{
 if(!audio||audio.state!=='running')return;
 if(active&&sound&&!glide){const buffer=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate),data=buffer.getChannelData(0);let previous=0;for(let i=0;i<data.length;i++){previous=previous*.6+(Math.random()*2-1)*.4;data[i]=previous;}const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=buffer;source.loop=true;filter.type='bandpass';filter.Q.value=.55;gain.gain.value=0;source.connect(filter).connect(gain).connect(master);source.start();glide={source,filter,gain};}
 if(!glide)return;const intensity=active&&sound&&!document.hidden?Math.min(1,speed/20):0,edge=Math.min(1,Math.abs(lean)+(brake?.8:0));glide.gain.gain.setTargetAtTime(intensity*(.14+edge*.14),audio.currentTime,.1);glide.filter.frequency.setTargetAtTime(420+intensity*1100+edge*1500,audio.currentTime,.12);
};
window.addEventListener('lab:pause',()=>window.labSkiSound());window.addEventListener('blur',()=>window.labSkiSound());document.addEventListener('visibilitychange',()=>{if(document.hidden)window.labSkiSound();});
let activeTones=[];
window.labTone=async kind=>{
 if(!sound||volume===0)return false;unlock();if(!audio)return false;
 try{
  await audio.resume();if(audio.state!=='running')return false;
  for(const osc of activeTones){try{osc.stop();}catch{}}activeTones=[];
  const partials=kind==='rich'?[[220,.54],[440,.28],[660,.18]]:[[220,1]],now=audio.currentTime;
  for(const [hz,amplitude]of partials){const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=hz;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.16*amplitude,now+.025);gain.gain.exponentialRampToValueAtTime(.0001,now+.75);osc.connect(gain);gain.connect(master);osc.onended=()=>{osc.disconnect();gain.disconnect();activeTones=activeTones.filter(o=>o!==osc);};osc.start(now);osc.stop(now+.8);activeTones.push(osc);}
  return true;
 }catch{return false;}
};
button.addEventListener('click',()=>{sound=!sound;labels();try{localStorage.setItem('lab-sound',sound?'on':'off')}catch{}if(sound)unlock();if(master)master.gain.setTargetAtTime(sound?volume*.45:0,audio.currentTime,.015);if(sound)window.labSound('select');});
slider.addEventListener('input',()=>{volume=Number(slider.value)/100;if(master)master.gain.setTargetAtTime(sound?volume*.45:0,audio.currentTime,.03);labels();try{localStorage.setItem('lab-volume',String(volume))}catch{}});slider.addEventListener('change',()=>window.labSound('select'));labels();
window.labFeedback=correct=>{window.labSound(correct?'correct':'wrong');requestAnimationFrame(()=>document.querySelector('.explanation')?.scrollIntoView({block:'nearest',behavior:reduce.matches||document.body.classList.contains('still')?'instant':'smooth'}));if(correct)window.parkCelebrate?.();if(reduce.matches||document.body.classList.contains('still'))return;document.querySelector(correct?'.answer.correct':'.answer.wrong')?.animate([{opacity:.5,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:450,easing:'cubic-bezier(.16,1,.3,1)'});};
})();
