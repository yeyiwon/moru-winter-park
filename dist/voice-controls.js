const commands={
 '지도열기':'map','지도열어':'map','지도':'map',
 '설정열기':'settings','설정열어':'settings',
 '음악끄기':'mute','음악꺼':'mute','음악꺼줘':'mute',
 '퀴즈시작':'quiz','퀴즈열기':'quiz',
 '손흔들기':'wave','인사':'wave','기쁨':'joy','춤':'dance',
};
export function voiceCommand(text){return commands[String(text).normalize('NFC').replace(/[\s.!?。]/g,'')]||null;}
export function createVoiceInput(Recognition,{onCommand,onStatus}){
 let active=null,timer;
 function stop(){clearTimeout(timer);const old=active;active=null;old?.abort();}
 return {stop,get listening(){return !!active;},start(){
  if(active||!Recognition)return false;
  const r=new Recognition();active=r;r.lang='ko-KR';r.continuous=false;r.interimResults=false;r.maxAlternatives=1;
  r.onresult=e=>{if(active!==r)return;const command=voiceCommand(e.results?.[0]?.[0]?.transcript||'');stop();if(command){onStatus('명령을 실행했습니다.');onCommand(command);}else onStatus('지원하는 명령을 말해 주세요. 클릭으로도 이용할 수 있습니다.');};
  r.onerror=e=>{if(active!==r)return;stop();onStatus(e.error==='not-allowed'?'마이크 권한이 꺼져 있습니다. 기존 버튼을 이용해 주세요.':'음성을 인식하지 못했습니다. 다시 누르거나 기존 버튼을 이용해 주세요.');};
  r.onend=()=>{if(active===r){stop();onStatus('음성 입력이 끝났습니다.');}};
  try{r.start();onStatus('듣는 중… 최대 8초');timer=setTimeout(()=>{stop();onStatus('음성 입력 시간이 끝났습니다.');},8000);return true;}catch{stop();onStatus('이 브라우저에서 음성 입력을 시작할 수 없습니다.');return false;}
 }};
}
if(typeof document!=='undefined'&&document.querySelector('#pane-audio')){
 const details=document.createElement('details');details.id='voice-settings';details.className='preference-settings';
 details.innerHTML='<summary>음성 명령 · 선택 사항</summary><div class="preference-body"><p class="preference-note">버튼을 누른 동안 지도·설정·퀴즈·감정 표현을 실행합니다. 브라우저에 따라 음성이 음성 인식 제공자의 서버로 전송될 수 있습니다. 이 앱은 녹음이나 인식 문장을 저장하지 않습니다.</p><label class="setting-check"><span>음성 입력 사용에 동의</span><input type="checkbox"></label><button type="button" data-listen class="quiet-action" disabled>마이크 시작</button><p role="status"></p><p class="preference-note">지도 열기 · 설정 열기 · 음악 끄기 · 퀴즈 시작 · 손 흔들기 · 기쁨 · 춤</p></div>';
 document.querySelector('#pane-audio').append(details);
 const supported=window.isSecureContext&&(window.SpeechRecognition||window.webkitSpeechRecognition),button=details.querySelector('[data-listen]'),consent=details.querySelector('input'),status=details.querySelector('[role=status]');
 function execute(command){if(command==='map'||command==='settings'){window.openWinterSettings(command==='map'?'map':'light');return;}if(command==='mute'){const music=document.querySelector('#music');if(music.getAttribute('aria-checked')==='true')music.click();return;}
  document.querySelector('#studio').close();if(command==='quiz')window.openQuickQuiz?.();else window.dispatchEvent(command==='wave'?new Event('lab:wave'):new CustomEvent('lab:emote',{detail:command}));
 }
 const voice=createVoiceInput(supported,{onCommand:execute,onStatus(text){status.textContent=text;button.textContent=voice.listening?'마이크 중지':'마이크 시작';button.setAttribute('aria-pressed',String(voice.listening));}});
 if(!supported){consent.disabled=true;status.textContent='이 브라우저는 음성 명령을 지원하지 않습니다. 기존 조작을 이용해 주세요.';}
 consent.onchange=()=>{button.disabled=!consent.checked||!supported;if(!consent.checked){voice.stop();button.textContent='마이크 시작';status.textContent='음성 입력을 껐습니다.';}};
 button.onclick=()=>{if(voice.listening){voice.stop();status.textContent='음성 입력을 중지했습니다.';button.textContent='마이크 시작';button.setAttribute('aria-pressed','false');}else if(consent.checked)voice.start();};
 function stop(){voice.stop();button.textContent='마이크 시작';button.setAttribute('aria-pressed','false');}
 document.querySelector('#studio').addEventListener('close',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);details.addEventListener('toggle',()=>{if(!details.open)stop();});
}
