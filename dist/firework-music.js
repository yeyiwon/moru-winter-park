import {showTrack} from './show-tracks.js';
// One streaming element avoids decoding two full recordings into mobile memory.
export function createFireworkMusic(context,bus,onActive=()=>{},createAudio=()=>new Audio()){
 let element=null,source=null,level=null,trackId=null,playing=false,pending=false,retryAt=0,disposed=false,desiredAge=0,enabledNow=false,blocked=false;
 const active=value=>{if(value!==playing){playing=value;onActive(value);}};
 function pause(){enabledNow=false;element?.pause();active(false);}
 function release(){pause();blocked=false;if(element){element.removeAttribute('src');element.load();}source?.disconnect();level?.disconnect();source=null;level=null;element=null;trackId=null;pending=false;}
 return {update(show,now,enabled=true){
  if(disposed)return;const track=showTrack(show?.musicId);
  if(!track){release();return;}
  const age=(now-show.startsAt)/1000;
  if(!['scheduled','playing'].includes(show.state)||now>=(show.endsAt??show.startsAt+track.duration*1000)){release();return;}
  if(trackId!==track.id){release();element=createAudio();element.preload='auto';element.loop=false;element.crossOrigin='anonymous';element.src=track.url;source=context.createMediaElementSource(element);level=context.createGain();level.gain.value=track.gain??1;source.connect(level).connect(bus);trackId=track.id;retryAt=0;element.load();}
  desiredAge=Math.max(0,age);enabledNow=enabled&&age>=0&&context.state==='running';
  if(!enabledNow){pause();return;}
  if(element.readyState>=1&&Math.abs(element.currentTime-desiredAge)>.22)element.currentTime=desiredAge;
  if(element.paused&&!pending&&now>=retryAt){
   const current=element;pending=true;retryAt=now+1200;
   Promise.resolve(current.play()).then(()=>{if(disposed||current!==element||!enabledNow){current.pause();return;}if(Math.abs(current.currentTime-desiredAge)>.22)current.currentTime=desiredAge;blocked=false;active(true);}).catch(error=>{if(current===element){blocked=error?.name==='NotAllowedError';active(false);}}).finally(()=>{if(current===element)pending=false;});
  }else if(!element.paused)active(true);
 },dispose(){disposed=true;release();},get voices(){return playing?1:0;},get media(){return element;},get blocked(){return blocked;}};
}
