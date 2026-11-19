import {Miniflare} from 'miniflare';import {build} from 'esbuild';import path from 'node:path';
import {apiFixture} from './service.mjs';
export async function realtimeFixture(t){
 const fixture=await apiFixture(),secret='local-test-only-'+crypto.randomUUID(),script=path.join(fixture.dir,'realtime.mjs');
 await build({entryPoints:['realtime/worker.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:script});
 const mf=new Miniflare({rootPath:fixture.dir,modulesRoot:fixture.dir,modules:true,scriptPath:script,compatibilityDate:'2026-07-01',durableObjects:{WORLD:{className:'WinterWorld',useSQLite:true}},bindings:{REALTIME_SECRET:secret,ALLOWED_ORIGINS:'http://127.0.0.1'},port:0,inspectorPort:0});
 const close=async()=>{await mf.dispose();fixture.close();};if(t)t.after(close);
 const url=await mf.ready;Object.assign(fixture.env,{REALTIME_URL:url.origin,REALTIME_SECRET:secret});
 return{...fixture,mf,url,close};
}
