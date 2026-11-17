import fs from 'node:fs';
export function createLivePreview(directory){
 const clients=new Set(),started=Date.now();let debounce;
 const watcher=fs.watch(directory,{recursive:true},(_,name)=>{if(!name||! /\.(js|css|html|json)$/.test(name))return;clearTimeout(debounce);debounce=setTimeout(()=>{for(const response of clients)response.write('event: change\ndata: '+JSON.stringify({file:String(name),at:Date.now()})+'\n\n');},450);});
 const heartbeat=setInterval(()=>{for(const response of clients)response.write(': keepalive\n\n');},15000);heartbeat.unref();
 return{handle(req,res){if(req.url!=='/__dev/events')return false;res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive'});res.write('event: ready\ndata: '+started+'\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return true;},
 inject(html){return html.replace('</body>',`<script>
 (()=>{let server=null;const source=new EventSource('/__dev/events');const reload=()=>{if(document.activeElement?.matches('input,textarea,[contenteditable=true]')){document.activeElement.addEventListener('blur',()=>location.reload(),{once:true});}else location.reload();};source.addEventListener('ready',e=>{if(server&&server!==e.data)reload();server=e.data;});source.addEventListener('change',e=>{const changed=JSON.parse(e.data).file;if(changed.endsWith('.css')){for(const link of document.querySelectorAll('link[rel=stylesheet]')){const url=new URL(link.href);url.searchParams.set('dev',Date.now());link.href=url.href;}}else reload();});addEventListener('pagehide',()=>source.close(),{once:true});})();
 </script></body>`);},close(){watcher.close();clearInterval(heartbeat);clearTimeout(debounce);for(const client of clients)client.end();clients.clear();}};
}
