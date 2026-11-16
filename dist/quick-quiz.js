import {closeDialog} from './ui-motion.js';
export const trivia=[
 ['문어의 심장은 몇 개일까요?',['1개','2개','3개','8개'],2,'문어는 아가미로 피를 보내는 심장 두 개와 몸 전체로 보내는 심장 한 개가 있어요.','🐙'],
 ['밤하늘의 달빛은 어디에서 올까요?',['달의 불꽃','태양빛의 반사','지구의 전등','별빛의 합성'],1,'달은 태양빛을 반사해서 밝게 보여요.','☾'],
 ['바나나가 자라는 식물은?',['커다란 풀','야자나무','덩굴나무','선인장'],0,'바나나는 나무처럼 보이지만 줄기처럼 보이는 부분이 잎집으로 이루어진 큰 풀입니다.','✧'],
 ['거미의 다리는 몇 개일까요?',['4개','6개','8개','10개'],2,'거미는 다리가 여덟 개예요. 다리가 여섯 개인 곤충과는 다른 무리입니다.','✦'],
 ['우주 공간에서 소리가 잘 전달되지 않는 이유는?',['너무 추워서','너무 어두워서','소리를 전할 물질이 거의 없어서','중력이 없어서'],2,'소리는 공기나 물 같은 매질의 진동으로 전달돼요. 진공에서는 전달될 수 없어요.','✧'],
 ['펭귄은 어떤 동물일까요?',['포유류','조류','어류','양서류'],1,'날지는 못해도 깃털이 있고 알을 낳는 새예요. 날개는 물속에서 헤엄치는 데 쓰입니다.','❋'],
 ['피아노의 건반 88개 중 검은 건반은?',['22개','30개','36개','44개'],2,'표준 88건반 피아노에는 흰 건반 52개, 검은 건반 36개가 있어요.','♫'],
 ['무지개 바깥쪽에 있는 색은?',['보라','초록','파랑','빨강'],3,'보통 보는 1차 무지개는 바깥쪽이 빨강, 안쪽이 보라예요.','✺'],
 ['사람의 몸에서 가장 큰 기관은?',['심장','폐','피부','위'],2,'온몸을 감싸고 있는 피부가 가장 큰 기관입니다.','✦'],
 ['얼음이 물에 뜨는 이유는?',['물보다 밀도가 낮아서','공기가 꼭 들어 있어서','물이 얼음을 밀어내서','얼음이 차가워서'],0,'물은 얼면서 부피가 늘어나 같은 부피의 물보다 가벼워져요.','❄'],
 ['태양계에서 가장 큰 행성은?',['지구','토성','해왕성','목성'],3,'목성은 태양계에서 가장 큰 행성이에요. 거대한 기체 행성입니다.','♃'],
 ['에펠탑이 있는 도시는?',['파리','로마','빈','마드리드'],0,'에펠탑은 프랑스 파리의 센강 가까이에 있어요.','✧'],
 ['아보카도의 먹는 부분은 식물의 무엇일까요?',['뿌리','줄기','열매','잎'],2,'가운데 씨가 있는 열매예요. 식물학적으로는 과일입니다.','✦'],
 ['눈 결정의 기본 대칭은?',['오각형','육각형','칠각형','팔각형'],1,'얼음 결정에서 물 분자가 배열되는 구조 때문에 기본적으로 여섯 갈래 대칭이 나타나요.','❄'],
 ['빛의 삼원색에 들어가지 않는 색은?',['빨강','초록','파랑','노랑'],3,'화면에서 쓰는 빛의 삼원색은 빨강·초록·파랑, RGB예요.','✺'],
 ['돌고래는 어떻게 숨을 쉴까요?',['아가미로','피부로','폐로','숨을 쉬지 않아요'],2,'돌고래는 포유류라 물 위로 올라와 폐로 공기를 마셔요.','✧'],
 ['베토벤 교향곡 9번의 마지막 악장에는?',['합창','기타 독주','드럼 솔로','대사가 있는 연극'],0,'마지막 악장에 독창과 합창이 등장해서 「합창」 교향곡으로도 불립니다.','♫'],
 ['자석에서 서로 끌어당기는 조합은?',['N극과 N극','S극과 S극','N극과 S극','모든 조합'],2,'서로 다른 극은 끌어당기고, 같은 극은 밀어내요.','✦']
];
const dialog=document.createElement('dialog');dialog.id='quick-quiz';dialog.setAttribute('aria-labelledby','quick-question');
dialog.innerHTML='<div class="quiz-header"><span>STAR QUIZ</span><button class="icon-button" aria-label="퀴즈 닫기"><svg viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17"/></svg></button></div><h2 id="quick-question"></h2><div class="quiz-options"></div><div class="quiz-result" role="status" hidden></div><div class="quiz-footer"><span class="quiz-count"></span><button class="quiz-next" hidden>다음 <svg viewBox="0 0 24 24"><path d="M5 12h14m-5-5 5 5-5 5"/></svg></button></div><div class="quiz-burst" aria-hidden="true"></div>';
document.body.append(dialog);let order=[],index=0,score=0,answered=false,cleanup;
function fireworks(){const el=dialog.querySelector('.quiz-burst');el.replaceChildren();if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('still'))return;const colors=['#ffcef0','#b9fff0','#f7e1a4','#d3c7ff'];for(let burst=0;burst<3;burst++)for(let i=0;i<24;i++){const p=document.createElement('i'),a=i/24*Math.PI*2,d=70+(i%4)*18;p.style.left=(burst===0?50:burst===1?18:82)+'%';p.style.top=(burst===0?30:48)+'%';p.style.animationDelay=burst*.14+'s';p.style.setProperty('--spark',colors[i%4]);p.style.setProperty('--sx',Math.cos(a)*d+'px');p.style.setProperty('--sy',Math.sin(a)*d+'px');el.append(p);}clearTimeout(cleanup);cleanup=setTimeout(()=>el.replaceChildren(),1900);}
function render(){answered=false;const [question,options,, ,symbol]=trivia[order[index]];dialog.querySelector('#quick-question').textContent=question;const choices=dialog.querySelector('.quiz-options');choices.replaceChildren();options.forEach((text,i)=>{const b=document.createElement('button');b.textContent=text;b.onclick=()=>answer(i);choices.append(b);});dialog.querySelector('.quiz-result').hidden=true;dialog.querySelector('.quiz-next').hidden=true;dialog.querySelector('.quiz-count').textContent=`${index+1} / ${order.length} · ${score} 정답`;}
function answer(choice){if(answered)return;answered=true;const [,,correct,explanation]=trivia[order[index]],ok=choice===correct;if(ok)score++;[...dialog.querySelector('.quiz-options').children].forEach((b,i)=>{b.disabled=true;b.classList.toggle('correct',i===correct);b.classList.toggle('wrong',i===choice&&!ok);});const result=dialog.querySelector('.quiz-result'),title=document.createElement('strong');title.textContent=ok?'정답!':'오답';result.replaceChildren(title,document.createTextNode(explanation));result.hidden=false;dialog.querySelector('.quiz-next').hidden=false;dialog.querySelector('.quiz-next').textContent=index===order.length-1?'한 번 더 ↗':'다음 →';dialog.querySelector('.quiz-count').textContent=`${index+1} / ${order.length} · ${score} 정답`;window.labSound?.(ok?'correct':'wrong');if(ok)fireworks();}
function reset(){order=trivia.map((_,i)=>i);for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}index=score=0;render();}
window.openQuickQuiz=()=>{reset();if(!dialog.open)dialog.showModal();document.body.classList.add('quiz-open');window.dispatchEvent(new Event('lab:pause'));};
dialog.querySelector('.icon-button').onclick=()=>closeDialog(dialog);dialog.querySelector('.quiz-next').onclick=()=>{if(++index===order.length)reset();else render();};dialog.addEventListener('close',()=>{clearTimeout(cleanup);dialog.querySelector('.quiz-burst').replaceChildren();document.body.classList.remove('quiz-open');window.dispatchEvent(new Event('lab:close'));});
document.querySelector('#go-quiz').onclick=()=>{document.querySelector('#park-menu').open=false;window.travelToPlace?.('quiz');};

dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog(dialog);});
