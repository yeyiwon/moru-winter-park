// Apply the saved UI preference before styles paint; the world clock is independent.
(()=>{
 const root=document.documentElement,key='winter-ui-theme';
 try{root.dataset.uiTheme=localStorage.getItem(key)==='dark'?'dark':'glass';}catch{root.dataset.uiTheme='glass';}
 document.addEventListener('DOMContentLoaded',()=>{
  const control=document.querySelector('#ui-dark-mode');if(!control)return;
  control.checked=root.dataset.uiTheme==='dark';
  control.addEventListener('change',()=>{const theme=control.checked?'dark':'glass';root.dataset.uiTheme=theme;try{localStorage.setItem(key,theme);}catch{}});
 },{once:true});
})();
