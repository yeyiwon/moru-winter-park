import fs from 'node:fs';
import { BRAND } from '../dist/brand-config.js';

// Keep crawler-visible HTML and install metadata in sync without client JavaScript.
const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const origin = new URL(BRAND.url);
if (origin.protocol !== 'https:' || origin.search || origin.hash || origin.pathname !== '/') throw Error('Use the verified public HTTPS origin, without an invitation.');
const url = origin.origin + '/';
const title = `${BRAND.name} · ${BRAND.nameKo}`;
const socialImage = new URL(BRAND.assets.socialImage, url).href + '?v=snowhere-v1';
const metadata = `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<!-- brand:metadata:start -->
<meta name="theme-color" content="${escape(BRAND.colors.night)}">
<meta name="application-name" content="${escape(BRAND.name)}">
<meta name="apple-mobile-web-app-title" content="${escape(BRAND.nameKo)}">
<meta name="description" content="${escape(BRAND.description)}">
<title>${escape(title)}</title>
<link rel="canonical" href="${escape(url)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="${escape(BRAND.name)}">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(BRAND.description)}">
<meta property="og:url" content="${escape(url)}">
<meta property="og:image" content="${escape(socialImage)}">
<meta property="og:image:secure_url" content="${escape(socialImage)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escape(BRAND.assets.socialImageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(BRAND.description)}">
<meta name="twitter:image" content="${escape(socialImage)}">
<meta name="twitter:image:alt" content="${escape(BRAND.assets.socialImageAlt)}">
<link rel="icon" href="${BRAND.assets.favicon}" type="image/svg+xml">
<link rel="icon" href="${BRAND.assets.favicon32}" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${BRAND.assets.appleTouchIcon}" sizes="180x180">
<link rel="mask-icon" href="${BRAND.assets.logoMonochrome}" color="${BRAND.colors.champagne}">
<link rel="manifest" href="/site.webmanifest">
<!-- brand:metadata:end -->
`;
let html = fs.readFileSync('dist/index.html', 'utf8');
html = html.replace(/(<head>)[\s\S]*?(?=<link rel="stylesheet")/, '$1\n' + metadata);
html = html.replace(/<svg class="brand-definitions"[\s\S]*?<\/svg>\s*/, '');
html = html.replace(/<a class="brand"[\s\S]*?<\/a>/, `<a class="brand" href="#" aria-label="${escape(BRAND.nameKo)} 홈"><span class="brand-mark" aria-hidden="true"><img src="${BRAND.assets.logoCompact}" width="38" height="34" alt="" decoding="async"></span><span class="brand-word">${escape(BRAND.name)}</span></a>`);
html = html.replace(/<link rel="stylesheet" href="brand\.css[^\"]*">/g, '');
html = html.replace('</head>', '<link rel="stylesheet" href="brand.css?v=snowhere-v1"></head>');
fs.writeFileSync('dist/index.html', html);
fs.writeFileSync('dist/site.webmanifest', JSON.stringify({
  id: '/', name: title, short_name: BRAND.nameKo, description: BRAND.description,
  lang: 'ko-KR', start_url: '/', scope: '/', display: 'standalone',
  background_color: BRAND.colors.night, theme_color: BRAND.colors.night,
  icons: [
    { src: BRAND.assets.icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: BRAND.assets.icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
  ],
}, null, 2) + '\n');
console.log(`Applied ${title} metadata, static logo, and manifest.`);
