const icons={
 ride:'M5 18h14M8 16V9h8v7M9 5h6M12 5v4',
 walk:'M9 4h6v16H9M15 12h6m-3-3 3 3-3 3',
 water:'M3 17q3 3 6 0t6 0t6 0M8 12V8m4 4V5m4 7V8',
 skate:'M6 4v9l10 2q3 1 3 3H5V4m0 17h15',
 rest:'M5 20v-7h14v7M7 13V7h10v6',
};
const presets={carousel:['회전목마 내리기','ride'],ferris:['관람차 내리기','ride'],lift:['리프트 내리기','ride'],ski:['스키 벗기','skate'],sled:['썰매 내리기','ride'],skate:['스케이트 종료','skate'],bath:['탕에서 나오기','water'],smallbath:['탕에서 나오기','water'],footbath:['족욕 종료','water'],sauna:['일어나기','rest'],tea:['일어나기','rest'],dining:['일어나기','rest'],lie:['일어나기','rest'],rest:['일어나기','rest'],warm:['몸 녹이기 종료','walk'],roast:['굽기 종료','walk'],aquarium:['관람 종료','walk']};
// One semantic button owns pointer/keyboard activation for every facility.
export function createInteractionExitControl({root,button,onExit}){
 let current='';button.type='button';button.classList.add('interaction-exit-control');
 const activate=e=>{e.stopPropagation();if(current)onExit();};button.addEventListener('click',activate);
 const own=e=>e.stopPropagation();button.addEventListener('pointerdown',own);
 return{show(kind){const preset=presets[kind];if(!preset)return;if(current!==kind){current=kind;button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+icons[preset[1]]+'"/></svg><span>'+preset[0]+'</span>';button.setAttribute('aria-label',preset[0]);}button.disabled=false;root.hidden=false;},hide(){current='';button.disabled=true;root.hidden=true;},dispose(){button.removeEventListener('click',activate);button.removeEventListener('pointerdown',own);this.hide();},get kind(){return current;}};
}
