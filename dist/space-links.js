export const parkOrigin='https://moru-winter-park.vercel.app';
export const publicRoom='winter-plaza';
export function invitationRoom(value){return /^[a-zA-Z0-9_-]{8,48}$/.test(value||'')&&value!==publicRoom?value:null;}
export function spaceURL(room,origin=parkOrigin){const url=new URL('/',origin);if(invitationRoom(room))url.searchParams.set('room',room);return url.href;}
