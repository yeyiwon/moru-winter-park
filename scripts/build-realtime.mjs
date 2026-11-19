import {build} from 'esbuild';
await build({entryPoints:['realtime/worker.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'.winter-build/realtime/index.js',minify:true});
console.log('Built bounded WebSocket Worker; provisioning and secrets are separate deployment steps.');
