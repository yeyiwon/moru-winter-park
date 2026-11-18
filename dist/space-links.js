export const parkOrigin='https://moru-winter-park.vercel.app';
export const publicRoom='winter-plaza';
export function invitationToken(value){return /^[a-f0-9]{64}$/.test(value||'')?value:null;}
// Fragments never reach access logs or Referer headers; redeem once into an HttpOnly session.
export function spaceURL(token,origin=parkOrigin){const url=new URL('/',origin);if(invitationToken(token))url.hash='invite='+token;return url.href;}
