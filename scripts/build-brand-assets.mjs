/**
 * Regenerate the static identity from the ACTUAL loading-screen curve.
 * No animation, screenshots, remote fonts, random particles, or private URLs.
 * Run: node scripts/build-brand-assets.mjs
 * SVG-only export: node scripts/build-brand-assets.mjs --svg-only
 * Raster export needs sharp (project installation or CODEX_PRIMARY_RUNTIME_NODE_MODULES).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadingTreePath } from '../dist/luminous-loading.js';
import { BRAND } from '../dist/brand-config.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'dist', 'brand');
await mkdir(output, { recursive: true });
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
const path = loadingTreePath();
const { night, ivory, champagne } = BRAND.colors;
const start = (width, height, label) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(label)}"><title>${escape(label)}</title>`;
const gradient = `<linearGradient id="ribbon" x1=".2" y1="0" x2=".8" y2="1"><stop stop-color="${ivory}"/><stop offset=".45" stop-color="${champagne}"/><stop offset=".7" stop-color="${ivory}"/><stop offset="1" stop-color="${champagne}"/></linearGradient>`;
const curve = (stroke, width, extras = '') => `<path d="${path}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extras}/>`;
const primary = start(600, 540, `${BRAND.nameKo} 트리 로고`) + `<defs>${gradient}<filter id="halo" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="4"/></filter></defs>` + curve(champagne, 7, 'opacity=".18" filter="url(#halo)"') + curve('url(#ribbon)', 4.5) + '</svg>';
const monochrome = start(600, 540, `${BRAND.nameKo} 단색 트리 로고`) + curve(ivory, 5) + '</svg>';
// 31–38px header marks need a full device-pixel stroke. Keep the original path.
const compact = start(600, 540, `${BRAND.nameKo} 작은 트리 로고`) + `<defs>${gradient}</defs>` + curve('url(#ribbon)', 17) + '</svg>';
const icon = (small = false) => start(600, 600, `${BRAND.nameKo} 앱 아이콘`) + `<rect width="600" height="600" rx="116" fill="${night}"/><g transform="translate(42 58) scale(.86)">` + curve(ivory, small ? 25 : 14) + '</g></svg>';
const appleIcon = start(600, 600, `${BRAND.nameKo} 홈 화면 아이콘`) + `<rect width="600" height="600" fill="${night}"/><g transform="translate(42 58) scale(.86)">` + curve(ivory, 14) + '</g></svg>';
const og = start(1200, 630, `${BRAND.name} · ${BRAND.nameKo}`) + `<defs>${gradient}<radialGradient id="night-glow"><stop stop-color="#273044"/><stop offset=".52" stop-color="#121f32"/><stop offset="1" stop-color="${night}"/></radialGradient><radialGradient id="warm-glow"><stop stop-color="${champagne}" stop-opacity=".085"/><stop offset="1" stop-color="${champagne}" stop-opacity="0"/></radialGradient><filter id="halo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter></defs><rect width="1200" height="630" fill="${night}"/><rect width="1200" height="630" fill="url(#night-glow)"/><ellipse cx="600" cy="294" rx="350" ry="254" fill="url(#warm-glow)"/><g transform="translate(390 90) scale(.7)">` + curve(champagne, 10, 'opacity=".24" filter="url(#halo)"') + curve('url(#ribbon)', 3.6) + `</g><text x="600" y="495" text-anchor="middle" fill="${ivory}" font-family="Georgia, 'DejaVu Serif', serif" font-size="42" font-weight="400" letter-spacing="5">${escape(BRAND.name)}</text></svg>`;
const files = new Map([
  ['logo-primary.svg', primary], ['logo-monochrome.svg', monochrome], ['logo-compact.svg', compact],
  ['favicon.svg', icon(true)], ['icon.svg', icon()],
  ['og-image.svg', og],
]);
for (const [name, content] of files) await writeFile(join(output, name), content + '\n');
if (!process.argv.includes('--svg-only')) {
  const require = createRequire(import.meta.url);
  let sharp;
  try { sharp = require('sharp'); }
  catch {
    const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
    if (!runtimeModules) throw new Error('PNG export needs sharp. Set CODEX_PRIMARY_RUNTIME_NODE_MODULES or install sharp, or use --svg-only.');
    sharp = require(require.resolve('sharp', { paths: [runtimeModules] }));
  }
  for (const [name, source, width, height] of [
    ['favicon-32.png', icon(true), 32, 32],
    ['icon-192.png', icon(), 192, 192],
    ['icon-512.png', icon(), 512, 512],
    ['apple-touch-icon.png', appleIcon, 180, 180],
    ['og-image.png', og, 1200, 630],
  ]) {
    await sharp(Buffer.from(source), { density: 192 }).resize(width, height).png({ compressionLevel: 9 }).toFile(join(output, name));
  }
}
await writeFile(join(output, 'README.md'), `# ${BRAND.name} 브랜드 자산\n\n이름은 브랜드 시안이며 \`dist/brand-config.js\` 한 곳에서 관리한다.\n\n- 로고는 기존 \`dist/luminous-loading.js\`의 \`loadingTreePath()\`를 그대로 가져온 정적 SVG다. 애니메이션과 난수 효과가 없다.\n- \`logo-primary.svg\`: 투명 배경, 아이보리·샴페인색. \`logo-monochrome.svg\`: 투명 배경 단색.\n- \`logo-compact.svg\`: 31~38px 헤더용 투명 로고. 원본 경로에 17px 선을 적용하고 블러를 제거한다.\n- \`favicon.svg\`와 32px PNG: 같은 곡선에 작은 화면용 굵은 선 적용.\n- \`icon-192.png\`, \`icon-512.png\`, \`apple-touch-icon.png\`: 앱/홈 화면 아이콘.\n- \`og-image.png\`와 SVG: 1200 × 630 공유 썸네일. 트리와 작은 영문 이름만 표시하며 한글 부제는 사용하지 않는다. 특정 방문자·초대 토큰·비공개 장면이 없는 공통 이미지.\n- 재생성: \`node scripts/build-brand-assets.mjs\`. SVG만: \`node scripts/build-brand-assets.mjs --svg-only\`. PNG 생성에는 sharp가 필요하다.\n\n원본 트리 경로의 좌표와 곡선은 변경하지 않는다. 출력별로 크기·선 두께·색상만 달라진다. SVG 썸네일의 글자는 사용 환경의 폰트에 영향을 받을 수 있어 공유에는 검증된 PNG를 사용한다.\n`);
console.log(`Brand assets written to ${output}`);
