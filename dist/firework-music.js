import {showTrack} from './show-tracks.js';
// Keep one streaming element; mobile devices need time to finish each seek.
export function createFireworkMusic(context,bus,onActive=()=>{},createAudio=()=>new Audio()){
 let element=null,source=null,level=null,trackId=null,showId=null,playing=false,pending=false,retryAt=0,disposed=false,desiredAge=0,enabledNow=false,requested=false,blocked=false,needsSync=true,lastSeek=-Infinity,driftSince=null,lastNow=0;
 const active=value=>{if(value!==playing){playing=value;onActive(value);}};
 function pause(){enabledNow=false;needsSync=true;driftSince=null;element?.pause();active(false);}
 function release(){pause();requested=false;blocked=false;if(element){element.removeAttribute('src');element.load();}source?.disconnect();level?.disconnect();source=null;level=null;element=null;trackId=null;showId=null;pending=false;}
 function align(now){
  if(!element||element.readyState<1||element.seeking)return;
  const error=Math.abs(element.currentTime-desiredAge);
  if(needsSync){needsSync=false;driftSince=null;lastSeek=now;if(error>.12)element.currentTime=desiredAge;return;}
  // Do not chase short decoder stalls or restart an in-flight Safari seek.
  if(element.paused||element.readyState<3||now-lastSeek<2500){driftSince=null;return;}
  if(error<.8){driftSince=null;return;}
  driftSince??=now;
  if(now-driftSince>=1200){element.currentTime=desiredAge;lastSeek=now;driftSince=null;}
 }
 function play(fromGesture=false){
  if(!element||!requested||pending||(!fromGesture&&(!enabledNow||lastNow<retryAt))||!element.paused)return;
  const current=element;pending=true;retryAt=lastNow+1200;
  let attempt;try{attempt=current.play();}catch(error){attempt=Promise.reject(error);}
  Promise.resolve(attempt).then(()=>{if(disposed||current!==element||!requested){current.pause();return;}blocked=false;active(true);}).catch(error=>{if(current===element){blocked=error?.name==='NotAllowedError';needsSync=true;active(false);}}).finally(()=>{if(current===element)pending=false;});
 }
 return {update(show,now,enabled=true){
  if(disposed)return;const track=showTrack(show?.musicId);
  if(!track){release();return;}
  const age=(now-show.startsAt)/1000;
  if(!['scheduled','playing'].includes(show.state)||now>=(show.endsAt??show.startsAt+track.duration*1000)){release();return;}
  if(trackId!==track.id||showId!==show.id){release();element=createAudio();element.preload='auto';element.loop=false;element.playbackRate=1;element.crossOrigin='anonymous';element.src=track.url;source=context.createMediaElementSource(element);level=context.createGain();level.gain.value=track.gain??1;source.connect(level).connect(bus);trackId=track.id;showId=show.id;retryAt=0;element.load();}
  lastNow=now;desiredAge=Math.max(0,age);requested=enabled&&age>=0;enabledNow=requested&&context.state==='running';
  if(!enabledNow){pause();return;}
  align(now);play();if(!element.paused)active(true);
 },resumeFromGesture(){if(!requested||disposed)return;align(lastNow);play(true);},dispose(){disposed=true;release();},get voices(){return playing?1:0;},get media(){return element;},get blocked(){return blocked;}};
}
