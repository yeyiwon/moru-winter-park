export function projectedCharacterHeight(camera,position,height){
 const distance=Math.max(1,Math.hypot(camera.position.x-position.x,camera.position.y-position.y,camera.position.z-position.z));
 return 1.6*height/(2*Math.tan(camera.fov*Math.PI/360)*distance);
}
// Slow down quality changes, not movement. Ignore background-tab pauses and
// require sustained spare frame time before restoring a higher resolution.
export function createRenderBudget({pixelRatio=1,mobile=false,mode='auto'}={}){
 let level=mobile?1:0,count=0,total=0,started=0,changed=0,fastWindows=0;
 const ratios=()=>mobile?[1.25,1,.9,.75]:[1.5,1.2,1,.85];
 function settings(){const manual=mode!=='auto',tier=manual?({high:0,medium:2,low:3})[mode]:level;return{quality:manual?mode:tier<2&&!mobile?'high':'medium',pixelRatio:Math.min(pixelRatio,ratios()[tier]),samples:tier===0?2:0,shadowInterval:[1/24,1/20,1/15,1/12][tier]};}
 return{
  get mode(){return mode;},get settings(){return settings();},
  setMode(value){mode=['auto','high','medium','low'].includes(value)?value:'auto';count=total=started=changed=fastWindows=0;if(mode==='auto')level=mobile?1:0;return settings();},
  viewport(dpr,compact){pixelRatio=dpr;mobile=compact;return settings();},
  sample(milliseconds,now){
   if(mode!=='auto'||milliseconds<=0||milliseconds>120)return false;
   if(!started){started=now;return false;}if(now-started<2000)return false;
   total+=milliseconds;if(++count<90)return false;const average=total/count;count=total=0;
   if(average>22&&level<3&&now-changed>5000){level++;changed=now;fastWindows=0;return true;}
   fastWindows=average<17.6?fastWindows+1:0;
   if(fastWindows>=4&&level>0&&now-changed>15000){level--;changed=now;fastWindows=0;return true;}return false;
  }
 };
}
