const enc=new TextEncoder(),keys=new Map();
const base64=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const bytes=value=>Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
async function key(secret){if(!secret||secret.length<32)throw Error('Realtime signing key missing');if(!keys.has(secret)){if(keys.size>2)keys.clear();keys.set(secret,crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']));}return keys.get(secret);}
export async function signTicket(payload,secret){const body=base64(enc.encode(JSON.stringify(payload)));return body+'.'+base64(new Uint8Array(await crypto.subtle.sign('HMAC',await key(secret),enc.encode(body))));}
export async function verifyTicket(token,secret,now=Date.now()){
 try{if(typeof token!=='string'||token.length>4096)return null;const [body,signature,extra]=token.split('.');if(extra||!await crypto.subtle.verify('HMAC',await key(secret),bytes(signature),enc.encode(body)))return null;const payload=JSON.parse(new TextDecoder().decode(bytes(body)));return payload.aud==='winter-realtime'&&payload.exp>now&&payload.exp<=now+125000&&/^[a-f0-9]{64}$/.test(payload.id)?payload:null;}catch{return null;}
}
export async function signRPC(body,secret){return base64(new Uint8Array(await crypto.subtle.sign('HMAC',await key(secret),enc.encode(body))));}
export async function verifyRPC(body,signature,secret){try{return await crypto.subtle.verify('HMAC',await key(secret),bytes(signature),enc.encode(body));}catch{return false;}}
