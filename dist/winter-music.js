export const winterTracks=[
 {id:'first-snow',title:'First Snow'},
 {id:'moonlight',title:'Moonlight'},
 {id:'at-the-end-of-all-things',title:'At The End Of All Things'}
].map(t=>({...t,artist:'Scott Buckley',src:'/audio/'+t.id+'.m4a',source:'https://www.scottbuckley.com.au/library/'+t.id+'/',license:'https://creativecommons.org/licenses/by/4.0/'}));
export const winterTrack=winterTracks[0];
export function createWinterMusic(doc=document,win=window){
 const button=doc.querySelector('#music'),slider=doc.querySelector('#music-volume'),output=doc.querySelector('#music-value'),track=doc.querySelector('#music-track'),select=doc.querySelector('#music-select'),credit=doc.querySelector('#music-source');
 const audio=doc.createElement('audio');audio.id='winter-background-music';audio.loop=false;audio.preload='none';audio.hidden=true;doc.body.append(audio);
 let enabled=true,volume=.12,started=false,index=0,playRequest=0;
 try{enabled=win.localStorage.getItem('lab-music')!=='off';const saved=win.localStorage.getItem('lab-music-volume-v2');if(saved!==null)volume=Math.max(0,Math.min(1,Number(saved)||0));index=Math.max(0,winterTracks.findIndex(t=>t.id===win.localStorage.getItem('lab-music-track')));}catch{}
 for(const t of winterTracks){const o=doc.createElement('option');o.value=t.id;o.textContent=t.title;select.append(o);}
 function labels(){button.setAttribute('aria-checked',enabled);button.textContent=enabled?'켜짐':'꺼짐';slider.value=Math.round(volume*100);output.textContent=Math.round(volume*100)+'%';}
 function trackLabel(){const t=winterTracks[index];track.textContent=t.title+' · '+t.artist;select.value=t.id;credit.href=t.source;credit.textContent=t.title+' — '+t.artist;}
 async function play(){if(!enabled||doc.hidden||!audio.paused)return;const request=++playRequest;try{await audio.play();if(request===playRequest){started=true;trackLabel();}}catch{if(request===playRequest)track.textContent=started?'재생을 다시 눌러 주세요.':'화면을 누르면 음악이 재생됩니다.';}}
 function choose(next){playRequest++;audio.pause();index=(next+winterTracks.length)%winterTracks.length;audio.src=winterTracks[index].src;trackLabel();try{win.localStorage.setItem('lab-music-track',winterTracks[index].id);}catch{}if(enabled)play();}
 select.addEventListener('change',()=>choose(winterTracks.findIndex(t=>t.id===select.value)));
 doc.querySelector('#music-prev').addEventListener('click',()=>choose(index-1));doc.querySelector('#music-next').addEventListener('click',()=>choose(index+1));audio.addEventListener('ended',()=>choose(index+1));
 button.addEventListener('click',()=>{enabled=!enabled;try{win.localStorage.setItem('lab-music',enabled?'on':'off');}catch{}labels();if(enabled)play();else{playRequest++;audio.pause();}});
 slider.addEventListener('input',()=>{volume=Number(slider.value)/100;audio.volume=volume;try{win.localStorage.setItem('lab-music-volume-v2',String(volume));}catch{}labels();});
 doc.addEventListener('pointerdown',play,{capture:true});doc.addEventListener('keydown',play,{capture:true});doc.addEventListener('visibilitychange',()=>{if(doc.hidden){playRequest++;audio.pause();}else if(started)play();});win.addEventListener('pagehide',()=>audio.pause());
 audio.addEventListener('error',()=>track.textContent='음악을 불러오지 못했습니다. 다음 곡을 눌러 주세요.');audio.src=winterTracks[index].src;audio.volume=volume;labels();trackLabel();
 return{get enabled(){return enabled;},get track(){return winterTracks[index];},audio};
}
if(typeof document!=='undefined'&&document.querySelector('#music'))createWinterMusic();
