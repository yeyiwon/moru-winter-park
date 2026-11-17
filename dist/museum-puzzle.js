import {closeDialog} from './ui-motion.js';
export function createOrbitPuzzle(){
 const steps=[1,2,3];return{steps,turn(index){if(!Number.isInteger(index)||index<0||index>2)return false;steps[index]=(steps[index]+1)%4;return steps.every(n=>n===0);},reset(){steps.splice(0,3,1,2,3);}};
}
export function mountMuseumPuzzle(){
 const puzzle=createOrbitPuzzle(),dialog=document.createElement('dialog');dialog.id='museum-puzzle';dialog.className='glass-panel';dialog.setAttribute('aria-labelledby','puzzle-title');
 dialog.innerHTML='<div class="panel-heading"><h2 id="puzzle-title">별자리 정렬</h2><button class="icon-button" aria-label="퍼즐 닫기"><svg viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17"/></svg></button></div><p>세 궤도의 빛나는 표시를 맨 위에 맞춰 보세요.</p><div class="orbit-controls"></div><output role="status"></output>';
 document.body.append(dialog);const output=dialog.querySelector('output');
 function render(){dialog.querySelector('.orbit-controls').replaceChildren(...puzzle.steps.map((step,i)=>{const b=document.createElement('button');b.setAttribute('aria-label',(i+1)+'번 궤도 90도 회전');b.innerHTML='<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="18"/><path class="orbit-target" d="m26 3 3 4h-6Z"/><g style="transform:rotate('+step*90+'deg);transform-origin:26px 26px"><circle class="orbit-star" cx="26" cy="8" r="3"/></g></svg><span>'+(i+1)+'번 궤도</span>';b.onclick=()=>{const solved=puzzle.turn(i);render();window.dispatchEvent(new CustomEvent('lab:puzzle-turn',{detail:[...puzzle.steps]}));window.labSound?.(solved?'correct':'select');output.textContent=solved?'정렬 완료':' ';if(solved)window.dispatchEvent(new CustomEvent('lab:exhibit-correct',{detail:'logic'}));};return b;}));}
 window.openMuseumPuzzle=()=>{puzzle.reset();render();output.textContent='';if(!dialog.open)dialog.showModal();document.body.classList.add('quiz-open');window.dispatchEvent(new Event('lab:pause'));window.dispatchEvent(new CustomEvent('lab:puzzle-turn',{detail:[...puzzle.steps]}));window.dispatchEvent(new CustomEvent('lab:exhibit-focus',{detail:'logic'}));};
 dialog.querySelector('.icon-button').onclick=()=>closeDialog(dialog);dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog(dialog);});dialog.addEventListener('close',()=>{document.body.classList.remove('quiz-open');window.dispatchEvent(new Event('lab:exhibit-close'));window.dispatchEvent(new Event('lab:close'));});
}
