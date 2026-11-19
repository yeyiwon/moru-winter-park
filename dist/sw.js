const CACHE='winterlight-v46-official';
const INTEGRITY={};
const scripts=["ornament-preview","realtime-client","owner-login","ryokan-craft","museum-interior-details","camera-policy","ryokan-service","fireworks-request","quiz-journal","quiz-journal-data","loading-backdrop","fur-gradient","character-tail","googly-glasses","appearance-draft","customization-ui","wardrobe-icons","character-ears","balloon-design","balloon-booth","held-balloon","plaza-paving","plaza-uplights","ski-map","server-clock","festival-plaza","luminous-loading","firework-score","hand-sparkler","winter-architecture-details","winter-fireworks","nickname","bench-layout","winter-bench","clay-eyes","held-popcorn","music-catalog","experience-preferences","experience-cards","personalization","exhibit-cards","onsen-layout","onsen-response","onsen-waterfall","onsen-water","ryokan-exterior-layout","ryokan-finish","ryokan-garden","ryokan-window","architecture-kit","district-layout","region-layout","interaction-exit-control","museum-puzzle","museum-world","ryokan-aquarium","ryokan-chef","world-settings","interaction-lifecycle", "activity-camera", "ryokan-meal", "navigation-client", "navigation-worker", "collision-grid", "frame-metrics", "simulation-clock", "player-state", "scene-resources", "presence-policy", "render-budget", "local-lights","lighting-theme","landmark-lighting", "mesh-batch", "space-links", "lunar-phase", "tree-layout","tree-topper", "fixture-glow", "glass-controls", "guest-names", "move-marker", "plaza-snowman", "tree-atmosphere", "activity-reactions", "activity-state", "alpine-resort", "alpine-forest-layout", "app", "audio-engine", "audio-world", "aurora-landmarks", "camera-clearance", "camera-raycast", "castle-atmosphere", "castle-layout", "castle-model", "carousel-horse-geometry", "carousel-model", "character-accessories", "community-ui", "companion", "connected-terrain", "decorations", "discovery", "effects", "emotes", "fantasy-vfx", "ferris-model", "ferris-layout", "festival-layout", "festival-rides", "footprints", "game-input", "glow-pass", "interior-layout", "interior-world", "learning-core", "loading-state", "movement", "navigation", "panels", "park", "park-details", "park-lamps", "park-layout", "path-routes", "preview-orbit", "quick-quiz", "resort-layout", "resort-blueprint", "resort-scenery", "retreat-atmosphere", "retreat-layout", "ride-seats", "shared-tree", "simulations", "ski-trails", "snow-path", "social", "spa-experience", "spa-resort", "studio", "themepark-world", "tree-ornaments", "trivia-fallback", "trivia-loader", "ui-motion", "vfx-shaders", "visitors", "wardrobe", "weather-clock", "winter-costumes", "winter-experience", "winter-music", "winter-retreat", "winter-rides", "winter-sky", "winter-world", "world-art", "world-guide-data", "world-interactions", "world-labels", "world-layout", "world-map","map-atlas","map-icons", "world-paths", "world-time"];
const CORE=['./','./index.html','./brand.css','./site.webmanifest','./brand/logo-primary.svg','./brand/logo-compact.svg','./brand/favicon.svg','./brand/favicon-32.png','./brand/icon-192.png','./brand/icon-512.png','./brand/apple-touch-icon.png','./style.css','./soft.css','./winter.css','./aurora.css','./metaverse.css','./glass.css','./ui-system.css','./luminous-loading.css','./customization.css','./mobile-ui.css','./resort-ui-v43.css','./quiz-journal.css','./seat-selection.css','./fonts/PretendardVariable.woff2','./textures/loading-world.webp','./textures/moon-lroc.jpg','./textures/winter-world-map.webp','./vendor/three.module.js',...scripts.map(n=>'./'+n+'.js'),...['science','reasoning','humanities','perspectives','everyday','daily-trivia'].map(n=>'./content/'+n+'.json')];
// Include every emitted code module, including lazy imports absent from the manual core list.
for(const path of Object.keys(INTEGRITY))if(/\.(?:js|css)$/.test(path)&&!CORE.some(item=>new URL(item,self.location.href).pathname===path))CORE.push(path);
const assetPaths=new Set(CORE.map(p=>new URL(p,self.location.href).pathname));
async function installCohort(){
 const cache=await caches.open(CACHE);
 if(!Object.keys(INTEGRITY).length){await cache.addAll(CORE);return;}
 // Stage a complete release; if deployment changes halfway through this fetch,
 // reject installation instead of caching mixed JavaScript modules.
 try{
  for(let start=0;start<CORE.length;start+=8)await Promise.all(CORE.slice(start,start+8).map(async path=>{
   const url=new URL(path,self.location.href),response=await fetch(new Request(url,{cache:'reload'}));
   if(!response.ok||response.redirected)throw Error('Release asset unavailable');
   if(url.pathname==='/'||url.pathname==='/index.html'){
    if(!(await response.clone().text()).includes(`<meta name="winter-release" content="${CACHE}">`))throw Error('HTML release changed during installation');
   }else{const expected=INTEGRITY[url.pathname];if(expected){const digest=await crypto.subtle.digest('SHA-256',await response.clone().arrayBuffer()),actual=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');if(actual!==expected)throw Error('Release changed during installation');}}
   await cache.put(new Request(url),response);
  }));
 }catch(error){await caches.delete(CACHE);throw error;}
}
self.addEventListener('install',event=>event.waitUntil(installCohort()));
// A waiting release activates only after existing tabs close. Never swap modules
// beneath a running world or remove the cache used by another active release.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>/^(winterlight-|knowledge-campus-|knowledge-park-)/.test(key)&&key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 const pathname=['/admin','/admin/'].includes(url.pathname)?'/index.html':url.pathname;
 if(!assetPaths.has(pathname))return;
 const cacheKey=new Request(url.origin+pathname);
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(cacheKey);if(cached)return cached;
  // CORE is installed atomically. Missing bytes must not be filled from another release.
  return new Response('새로 접속해 최신 버전을 불러와 주세요.',{status:503,headers:{'Cache-Control':'no-store'}});
 }));
});
