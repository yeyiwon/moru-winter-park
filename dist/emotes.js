const button=document.createElement('button'),panel=document.createElement('div');
button.id='emote-toggle';button.setAttribute('aria-label','감정 표현');button.setAttribute('aria-controls','emote-panel');button.setAttribute('aria-expanded','false');button.textContent='☺';
panel.id='emote-panel';panel.hidden=true;panel.setAttribute('aria-label','감정 선택');panel.setAttribute('role','group');
function close(){document.body.classList.remove('emote-open');panel.hidden=true;button.setAttribute('aria-expanded','false');}
for(const [kind,label,icon]of [['wave','손 흔들기','♧'],['heart','하트','♡'],['joy','기쁨','✧'],['sad','슬픔','☂'],['surprise','놀람','!'],['dance','춤','♫']]){
 const b=document.createElement('button');b.textContent=icon;if(kind==='wave')b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="m8 13-2-4q-1-2 1-2l3 5-2-7q0-2 2-1l2 7-1-8q1-2 2 0l1 8 1-6q2-1 2 1v9q0 5-5 6-3 0-5-3l-3-4q-1-2 1-2l3 2M20 3l1 2M3 3 2 5"/></svg>';b.setAttribute('aria-label',label);b.onclick=()=>{window.dispatchEvent(kind==='wave'?new Event('lab:wave'):new CustomEvent('lab:emote',{detail:kind}));close();};panel.append(b);
}
button.onclick=()=>{const open=panel.hidden;close();if(open){window.dispatchEvent(new Event('lab:pause'));panel.hidden=false;document.body.classList.add('emote-open');button.setAttribute('aria-expanded','true');}};
for(const target of [button,panel])target.addEventListener('pointerdown',e=>e.stopPropagation());
document.body.append(button,panel);
window.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
document.addEventListener('pointerdown',e=>{if(!panel.contains(e.target)&&!button.contains(e.target))close();});
window.addEventListener('lab:pause',close);
