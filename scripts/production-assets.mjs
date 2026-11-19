import {createHash} from 'node:crypto';
import {transformSync} from 'esbuild';
// Both deployments publish the same modules. Keep identifiers for diagnostic
// stacks; remove only redundant syntax/whitespace, never shaders or content.
export function productionAsset(source,extension){
 if(!['.js','.css'].includes(extension))return source;
 return transformSync(source,{loader:extension==='.css'?'css':'js',target:'es2022',minifyWhitespace:true,minifySyntax:true,minifyIdentifiers:false,legalComments:'inline'}).code;
}

export function releaseServiceWorker(source,files){
 // Hosting may copy authoring notes too; only shipped runtime formats define a release.
 const hashes=Object.fromEntries(Object.entries(files).filter(([name])=>name!=='/sw.js'&&name!=='/release.json'&&/\.(?:html|css|js|json|webmanifest|txt|svg|ico|woff2|jpg|jpeg|png|webp)$/.test(name)).sort(([a],[b])=>a.localeCompare(b)).map(([name,bytes])=>[name,createHash('sha256').update(bytes).digest('hex')]));
 if(hashes['/index.html'])hashes['/']=hashes['/index.html'];
 const id=createHash('sha256').update(JSON.stringify(hashes)).digest('hex').slice(0,20);
 return source.replace(/const CACHE=[^;]+;/,`const CACHE='winterlight-${id}';`).replace('const INTEGRITY={};','const INTEGRITY='+JSON.stringify(hashes)+';');
}

// Sites may append its authentication scripts to HTML. A release stamp verifies
// the app version without depending on provider-owned injected bytes.
export function stampReleaseHTML(html,worker){
 const id=worker.match(/const CACHE='([^']+)'/)[1];
 return html.replace('</head>',`<meta name="winter-release" content="${id}"></head>`);
}
