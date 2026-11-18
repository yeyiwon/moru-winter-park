// Voice input was retired. Old cached pages may still request this URL.
export const voiceCommand=()=>null;
export function createVoiceInput(){return{start:()=>false,stop(){},dispose(){},get listening(){return false;}};}
