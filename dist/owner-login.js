import {parkOrigin} from './space-links.js';
// Credentials stay in HttpOnly cookies; the one-use callback code is removed before any await.
export async function finishOwnerLogin(request){
 const code=new URLSearchParams(location.hash.slice(1)).get('owner_code');
 if(code){history.replaceState(null,'',location.pathname);await request('owner-auth',{action:'exchange',code});}
}
export async function continueOwnerLogin(request,access){
 const state=new URLSearchParams(location.search).get('owner_redirect');
 if(state&&location.origin!==parkOrigin){
  if(access.admin){const result=await request('owner-auth',{action:'grant',state});location.replace(result.url);return true;}
  document.querySelector('#owner-signin').href='/signin-with-chatgpt?return_to='+encodeURIComponent('/admin?owner_redirect='+state);
 }
 return false;
}
export function bindOwnerLogin(request){
 const button=document.querySelector('#owner-signin');
 button.addEventListener('click',async event=>{
  if(location.origin!==parkOrigin)return;
  event.preventDefault();if(button.dataset.busy)return;button.dataset.busy='true';
  try{const result=await request('owner-auth',{action:'begin'});location.assign(result.url);}
  catch(error){document.querySelector('#invite-description').textContent=error.message;delete button.dataset.busy;}
 });
}
