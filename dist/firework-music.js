import {showTrack} from './show-tracks.js';
import {fireworkConfig} from './firework-score.js';
// Original 120 BPM score authored for WINTERLIGHT, no external recording/sample.
export function createShowNotes(){
 const notes=[],chords=[[50,57,62,65],[53,60,65,69],[46,53,58,62],[48,55,60,64]];
 for(let beat=0;beat<140;beat++){
  const at=beat*.5,chord=chords[Math.floor(beat/8)%4],phase=at<10?0:at<25?1:at<45?2:at<60?3:4;
  notes.push({at,midi:chord[beat%4]+12,kind:beat%4===0?'bell':'piano',duration:1.1,level:.055+phase*.008});
  if(beat%8===0)for(const midi of chord)notes.push({at,midi,kind:'strings',duration:3.8,level:.022+phase*.007});
  if(phase>=3&&beat%4===0){notes.push({at,midi:chord[0]-12,kind:'drum',duration:.45,level:.11});for(const midi of chord.slice(1))notes.push({at,midi,kind:'brass',duration:1.3,level:.025});}
 }
 for(const midi of [50,57,62,66,74])notes.push({at:70,midi,kind:'strings',duration:3.8,level:.045});
 return notes.sort((a,b)=>a.at-b.at);
}
function createLegacyMusic(context,bus,onActive=()=>{}){
 const notes=createShowNotes(),voices=new Set();let id=null,last=-1,index=0,playing=false;
 const frequency=midi=>440*2**((midi-69)/12);
 function stop(){for(const node of voices){try{node.source.stop();}catch{}node.source.disconnect();node.gain.disconnect();node.filter?.disconnect();}voices.clear();if(playing)onActive(false);playing=false;}
 function note(cue,at){
  if(voices.size>=48)return;
  const source=context.createOscillator(),gain=context.createGain(),filter=context.createBiquadFilter(),pitch=frequency(cue.midi),soft=cue.kind==='strings'||cue.kind==='brass',attack=cue.kind==='strings'?.32:cue.kind==='brass'?.12:.012;
  source.type=cue.kind==='strings'?'sawtooth':cue.kind==='brass'?'triangle':'sine';source.frequency.setValueAtTime(pitch,at);
  if(cue.kind==='drum')source.frequency.exponentialRampToValueAtTime(pitch*.35,at+.22);
  filter.type='lowpass';filter.frequency.value=cue.kind==='strings'?1200:cue.kind==='brass'?2100:8000;filter.Q.value=.4;
  gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(cue.level,at+attack);if(soft)gain.gain.setValueAtTime(cue.level*.65,at+cue.duration*.65);gain.gain.exponentialRampToValueAtTime(.0001,at+cue.duration);
  source.connect(filter).connect(gain).connect(bus);const node={source,gain,filter};voices.add(node);source.onended=()=>{voices.delete(node);source.disconnect();filter.disconnect();gain.disconnect();};source.start(at);source.stop(at+cue.duration+.02);
 }
 return{update(show,now,enabled=true){
  const age=show?(now-show.startsAt)/1000:-1;
  if(!show||age<0||now>=(show.endsAt??show.startsAt+fireworkConfig.duration*1000)||!enabled||context.state!=='running'){stop();id=null;last=-1;return;}
  if(id!==show.id||age<last||age-last>1){stop();id=show.id;index=notes.findIndex(n=>n.at>=age);if(index<0)index=notes.length;}
  if(!playing){playing=true;onActive(true);}last=age;
  // Small look-ahead uses audio time, while seeking resumes at server time.
  while(index<notes.length&&notes[index].at<age+.18){const n=notes[index++];if(n.at>=age-.035)note(n,context.currentTime+Math.max(.005,n.at-age));}
 },dispose:stop,get voices(){return voices.size;}};
}

// One streaming element avoids decoding two full recordings into mobile memory.
export function createFireworkMusic(context,bus,onActive=()=>{},createAudio=()=>new Audio()){
 const legacy=createLegacyMusic(context,bus,onActive);let element=null,source=null,trackId=null,playing=false,pending=false,retryAt=0,disposed=false,desiredAge=0,enabledNow=false,blocked=false;
 const active=value=>{if(value!==playing){playing=value;onActive(value);}};
 function pause(){enabledNow=false;element?.pause();active(false);}
 function release(){pause();blocked=false;if(element){element.removeAttribute('src');element.load();}source?.disconnect();source=null;element=null;trackId=null;pending=false;}
 return {update(show,now,enabled=true){
  if(disposed)return;const track=showTrack(show?.musicId);
  if(!track){release();legacy.update(show,now,enabled);return;}
  legacy.update(null,now,false);
  const age=(now-show.startsAt)/1000;
  if(!['scheduled','playing'].includes(show.state)||now>=(show.endsAt??show.startsAt+track.duration*1000)){release();return;}
  if(trackId!==track.id){release();element=createAudio();element.preload='auto';element.loop=false;element.crossOrigin='anonymous';element.src=track.url;source=context.createMediaElementSource(element);source.connect(bus);trackId=track.id;retryAt=0;element.load();}
  desiredAge=Math.max(0,age);enabledNow=enabled&&age>=0&&context.state==='running';
  if(!enabledNow){pause();return;}
  if(element.readyState>=1&&Math.abs(element.currentTime-desiredAge)>.22)element.currentTime=desiredAge;
  if(element.paused&&!pending&&now>=retryAt){
   const current=element;pending=true;retryAt=now+1200;
   Promise.resolve(current.play()).then(()=>{if(disposed||current!==element||!enabledNow){current.pause();return;}if(Math.abs(current.currentTime-desiredAge)>.22)current.currentTime=desiredAge;blocked=false;active(true);}).catch(error=>{if(current===element){blocked=error?.name==='NotAllowedError';active(false);}}).finally(()=>{if(current===element)pending=false;});
  }else if(!element.paused)active(true);
 },dispose(){disposed=true;release();legacy.dispose();},get voices(){return legacy.voices+(playing?1:0);},get media(){return element;},get blocked(){return blocked;}};
}
