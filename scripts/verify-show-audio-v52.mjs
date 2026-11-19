import fs from 'node:fs/promises';
import {chromium} from '/Users/yeiwon/Documents/Codex/winter-qa-tools/node_modules/playwright-core/index.mjs';
const origin=process.env.PROFILE_URL||'http://127.0.0.1:4193';if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Isolated local test only');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling']}),page=await browser.newPage(),report={environment:'macOS Chrome real MP3/WebAudio streaming; silent test output; full wall-clock duration, no speed change'},errors=[];
page.on('pageerror',e=>errors.push(e.message));await page.route(origin+'/',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><button>Music verification</button>'}));
try{
 await page.goto(origin);await page.click('button');
 await page.evaluate(async()=>{
  const {showTracks}=await import('/show-tracks.js'),{createFireworkMusic}=await import('/firework-music.js');const ctx=new AudioContext();await ctx.resume();const output=ctx.createGain();output.gain.value=0;output.connect(ctx.destination);window.qa={tracks:[],done:false};
  const start=performance.now()+2500;
  for(const track of showTracks){const item={id:track.id,expected:track.duration,samples:[],events:[]},music=createFireworkMusic(ctx,output,v=>item.events.push({active:v,at:(performance.now()-start)/1000})),show={id:track.id,musicId:track.id,state:'scheduled',startsAt:start,endsAt:start+track.duration*1000};qa.tracks.push(item);
   music.update(show,performance.now());const element=music.media;element.addEventListener('loadedmetadata',()=>item.duration=element.duration);element.addEventListener('error',()=>item.error=element.error?.message||'media error');
   let last=-1;const timer=setInterval(()=>{const now=performance.now(),age=(now-start)/1000;music.update(show,now);if(Math.floor(age)%10===0&&Math.floor(age)!==last){last=Math.floor(age);item.samples.push({age,current:element.currentTime,paused:element.paused,ready:element.readyState,rate:element.playbackRate});}
    if(age>track.duration+1){clearInterval(timer);item.released=music.media===null;music.dispose();item.complete=true;if(qa.tracks.every(t=>t.complete))qa.done=true;}
   },50);
  }
  const track=showTracks[0],late=createFireworkMusic(ctx,output),lateShow={id:'late',musicId:track.id,state:'playing',startsAt:performance.now()-35000};late.update(lateShow,performance.now());setTimeout(()=>{late.update(lateShow,performance.now());setTimeout(()=>{qa.late={at:late.media?.currentTime,paused:late.media?.paused};late.dispose();},500);},1000);
 });
 await page.waitForFunction(()=>qa.done,null,{timeout:150000});Object.assign(report,await page.evaluate(()=>qa));
 for(const track of report.tracks){if(track.error||!track.released||Math.abs(track.duration-track.expected)>.08||track.samples.filter(s=>s.age>1&&s.age<track.expected-1).some(s=>s.paused||s.rate!==1||Math.abs(s.current-s.age)>.35))throw Error('Recording drift or playback failure '+track.id);}
 if(report.late.paused||report.late.at<35||report.late.at>38)throw Error('Late join seek failed');if(errors.length)throw Error('Browser errors');console.log('PASS both full recordings, server-clock seek, playback rate 1, release');
}catch(e){report.failure=e.stack;process.exitCode=1;console.log(e.stack);}finally{report.errors=errors;await fs.mkdir('qa/castle-show-v52',{recursive:true});await fs.writeFile('qa/castle-show-v52/audio.json',JSON.stringify(report,null,2));await browser.close();}
