(()=>{
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let sound=true;try{sound=localStorage.getItem('lab-sound')!=='off'}catch{}
const soundButton=document.getElementById('sound');
function soundLabel(){soundButton.textContent=sound?'소리 켜짐 ♪':'소리 꺼짐';soundButton.setAttribute('aria-pressed',sound);soundButton.setAttribute('aria-label',sound?'효과음 끄기':'효과음 켜기')}
soundLabel();let audio;
function tone(correct){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const t=audio.currentTime;const notes=correct?[659.25,987.77]:[293.66,261.63];notes.forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=f;o.connect(g);g.connect(audio.destination);const start=t+i*.085;g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(.025,start+.012);g.gain.exponentialRampToValueAtTime(.001,start+.42);o.start(start);o.stop(start+.44)});}catch{}}
soundButton.addEventListener('click',()=>{sound=!sound;soundLabel();try{localStorage.setItem('lab-sound',sound?'on':'off')}catch{}if(sound)tone(true)});
window.labFeedback=correct=>{tone(correct);if(reduce.matches||document.body.classList.contains('still'))return;const answer=document.querySelector(correct?'.answer.correct':'.answer.wrong');answer?.animate(correct?[{boxShadow:'0 0 0 0 #b8eed000'},{boxShadow:'0 0 34px 0 #b8eed029',offset:.4},{boxShadow:'0 0 0 0 #b8eed000'}]:[{opacity:.55},{opacity:1}],{duration:correct?650:250,easing:'ease-out'});};
// Perspective projection of a slowly rotating 3D point field and crystalline wireframes.
const canvas=document.getElementById('space-canvas'),ctx=canvas.getContext('2d');if(!ctx)return;
let w,h,dpr,frame=0,last=0,mx=0,my=0,px=0,py=0;
const points=Array.from({length:100},()=>({x:(Math.random()-.5)*1800,y:(Math.random()-.5)*1100,z:Math.random()*1300,color:Math.random()>.5?'187,162,255':'147,227,238'}));
function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}resize();addEventListener('resize',resize);addEventListener('pointermove',e=>{mx=(e.clientX/w-.5)*50;my=(e.clientY/h-.5)*30},{passive:true});
function ribbon(cx,cy,scale,time){for(let row=0;row<20;row++){ctx.beginPath();for(let i=0;i<=110;i++){const u=i/110*Math.PI*2;const x=Math.sin(u)*150*scale,y=Math.sin(u*2+time)*48*scale+row*3*scale,z=Math.cos(u)*90;const f=450/(450+z);const xx=cx+(x+px*.5)*f,yy=cy+(y+py*.4)*f;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.strokeStyle=`rgba(170,185,225,${.025+row*.002})`;ctx.lineWidth=.7;ctx.stroke()}}
function draw(t){if(t-last<32){frame=requestAnimationFrame(draw);return}last=t;const still=reduce.matches||document.body.classList.contains('still'),time=still?0:t*.00013;px+=(mx-px)*.025;py+=(my-py)*.025;ctx.clearRect(0,0,w,h);for(let p of points){const z=(p.z+time*80)%1300,s=650/(650+z),x=w/2+(p.x+(still?0:px))*s,y=h/2+(p.y+(still?0:py))*s;ctx.fillStyle=`rgba(${p.color},${.13+s*.4})`;ctx.beginPath();ctx.arc(x,y,s*1.6,0,Math.PI*2);ctx.fill()}ribbon(w*.86,h*.68,w<650?.7:1.6,time);ribbon(w*.08,h*.25,.8,-time);if(!document.hidden)frame=requestAnimationFrame(draw)}frame=requestAnimationFrame(draw);document.addEventListener('visibilitychange',()=>{if(!document.hidden){cancelAnimationFrame(frame);frame=requestAnimationFrame(draw)}});
})();
