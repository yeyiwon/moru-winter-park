// Run on entry only; do not interrupt an active ride or an unsent chat after loading.
(()=>{
 const current=document.querySelector('meta[name="winter-release"]')?.content;
 if(!current||!('serviceWorker'in navigator))return;
 void fetch('/sw.js',{cache:'no-store'}).then(response=>response.ok?response.text():'').then(source=>{
  const published=source.match(/\bCACHE\s*=\s*['"]([^'"]+)['"]/)?.[1];
  if(!published)return;
  const key='winter-release-recovery';
  if(published===current){try{sessionStorage.removeItem(key);}catch{}return;}
  try{if(sessionStorage.getItem(key)===published)return;sessionStorage.setItem(key,published);}catch{}
  location.replace('/refresh.html'+(/^\/admin(?:\/|$)/.test(location.pathname)?'?return=/admin':''));
 }).catch(()=>{}); // A complete cached release remains usable offline.
})();
