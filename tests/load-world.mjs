import {readFileSync} from 'node:fs';
const source=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const layoutUrl=data(source('world-layout.js'));
const movementUrl=data(source('movement.js').replace("'./world-layout.js'",JSON.stringify(layoutUrl)));
const navigationUrl=data(source('navigation.js').replace("'./movement.js'",JSON.stringify(movementUrl)));
export const layout=await import(layoutUrl);
export const movement=await import(movementUrl);
export const navigation=await import(navigationUrl);
