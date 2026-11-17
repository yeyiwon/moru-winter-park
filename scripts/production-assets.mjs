import {transformSync} from 'esbuild';
// Both deployments publish the same modules. Keep identifiers for diagnostic
// stacks; remove only redundant syntax/whitespace, never shaders or content.
export function productionAsset(source,extension){
 if(!['.js','.css'].includes(extension))return source;
 return transformSync(source,{loader:extension==='.css'?'css':'js',target:'es2022',minifyWhitespace:true,minifySyntax:true,minifyIdentifiers:false,legalComments:'inline'}).code;
}
