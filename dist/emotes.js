const button=document.createElement('button'),panel=document.createElement('div');
button.id='emote-toggle';button.setAttribute('aria-label','감정 표현');button.setAttribute('aria-controls','emote-panel');button.setAttribute('aria-expanded','false');button.textContent='☺';
panel.id='emote-panel';panel.hidden=true;panel.setAttribute('aria-label','감정 선택');panel.setAttribute('role','group');
function close(){document.body.classList.remove('emote-open');panel.hidden=true;button.setAttribute('aria-expanded','false');}
for(const [kind,label,icon]of [['heart','하트','♡'],['joy','기쁨','✧'],['sad','슬픔','☂'],['surprise','놀람','!'],['dance','춤','♫']]){
 const b=document.createElement('button');b.textContent=icon;b.setAttribute('aria-label',label);b.onclick=()=>{window.dispatchEvent(new CustomEvent('lab:emote',{detail:kind}));close();};panel.append(b);
}
button.onclick=()=>{const open=panel.hidden;close();if(open){window.dispatchEvent(new Event('lab:pause'));panel.hidden=false;document.body.classList.add('emote-open');button.setAttribute('aria-expanded','true');}};
for(const target of [button,panel])target.addEventListener('pointerdown',e=>e.stopPropagation());
document.body.append(button,panel);
window.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
document.addEventListener('pointerdown',e=>{if(!panel.contains(e.target)&&!button.contains(e.target))close();});
window.addEventListener('lab:pause',close);
