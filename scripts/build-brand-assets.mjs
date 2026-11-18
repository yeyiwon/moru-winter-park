/**
 * Export the actual loading-tree curve as a static white/gold identity.
 * Run: node scripts/build-brand-assets.mjs [--svg-only]
 * Manual export uses Python/fontTools for bundled-font outlines and sharp for PNG.
 * Production builds consume committed assets; no extra runtime dependencies.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
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
const { white = '#fffefa', gold = '#a8844c', goldLight = '#dfcea4' } = BRAND.colors;
const wordmark = BRAND.wordmark ?? BRAND.name.toLowerCase();
const start = (width, height, label) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(label)}"><title>${escape(label)}</title>`;
const gradient = `<linearGradient id="ribbon" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${gold}"/><stop offset=".4" stop-color="#c7ad76"/><stop offset=".72" stop-color="${gold}"/><stop offset="1" stop-color="#967641"/></linearGradient>`;
const curve = (stroke, width) => `<path d="${path}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;

// Outline the repository's own Pretendard font so SVG and PNG have identical type.
// Node supplies WOFF2's Brotli decoding when the Python Brotli module is absent.
function outlinedWordmark() {
  const python = String.raw`
import sys,json,types,subprocess
settings=json.load(sys.stdin)
try:
 import brotli
except ImportError:
 brotli=types.ModuleType('brotli')
 brotli.decompress=lambda data:subprocess.run([settings['node'],'-e',"const z=require('node:zlib');let b=[];process.stdin.on('data',d=>b.push(d)).on('end',()=>process.stdout.write(z.brotliDecompressSync(Buffer.concat(b))));"],input=data,stdout=subprocess.PIPE,check=True).stdout
 sys.modules['brotli']=brotli
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from html import escape
font=TTFont(settings['font'])
if 'fvar' in font:font=instantiateVariableFont(font,{'wght':350})
glyphs=font.getGlyphSet();cmap=font.getBestCmap();word=settings['word']
scale=30/font['head'].unitsPerEm;tracking=1.2
advance=sum(font['hmtx'][cmap[ord(ch)]][0] for ch in word)
cursor=600-(advance*scale+tracking*(len(word)-1))/2
parts=[f'<g aria-label="{escape(word)}" fill="{escape(settings["color"])}">']
for ch in word:
 name=cmap[ord(ch)];pen=SVGPathPen(glyphs);glyphs[name].draw(pen);outline=pen.getCommands()
 if outline:parts.append(f'<path d="{outline}" transform="translate({cursor:.3f} 441) scale({scale:.8f} {-scale:.8f})"/>')
 cursor+=font['hmtx'][name][0]*scale+tracking
parts.append('</g>');print(''.join(parts))
`;
  const result = spawnSync(process.env.CODEX_PRIMARY_RUNTIME_PYTHON || 'python3', ['-c', python], {
    input: JSON.stringify({ font: join(root, 'dist/fonts/PretendardVariable.woff2'), word: wordmark, color: gold, node: process.execPath }),
    encoding: 'utf8', maxBuffer: 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`Wordmark export needs Python and fontTools. ${result.stderr || result.error?.message || ''}`);
  return result.stdout.trim();
}

const primary = start(600, 540, `${BRAND.nameKo} 골드 트리 로고`) + `<defs>${gradient}</defs>` + curve('url(#ribbon)', 5) + '</svg>';
const monochrome = start(600, 540, `${BRAND.nameKo} 단색 트리 로고`) + curve(gold, 5) + '</svg>';
// The world remains dark. This brighter compact mark retains contrast in its header.
const compact = start(600, 540, `${BRAND.nameKo} 작은 트리 로고`) + curve(goldLight, 17) + '</svg>';
const icon = (small = false) => start(600, 600, `${BRAND.nameKo} 앱 아이콘`) + `<rect width="600" height="600" rx="116" fill="${white}"/><g transform="translate(42 58) scale(.86)">` + curve(gold, small ? 30 : 14) + '</g></svg>';
const appleIcon = start(600, 600, `${BRAND.nameKo} 홈 화면 아이콘`) + `<rect width="600" height="600" fill="${white}"/><g transform="translate(42 58) scale(.86)">` + curve(gold, 14) + '</g></svg>';
const og = start(1200, 630, `${BRAND.name} white gold`) + `<defs>${gradient}</defs><rect width="1200" height="630" fill="${white}"/><g transform="translate(456 149) scale(.48)">` + curve('url(#ribbon)', 4.5) + '</g>' + outlinedWordmark() + '</svg>';
const files = new Map([
  ['logo-primary.svg', primary], ['logo-monochrome.svg', monochrome], ['logo-compact.svg', compact],
  ['favicon.svg', icon(true)], ['icon.svg', icon()], ['og-image.svg', og],
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
    ['favicon-32.png', icon(true), 32, 32], ['icon-192.png', icon(), 192, 192],
    ['icon-512.png', icon(), 512, 512], ['apple-touch-icon.png', appleIcon, 180, 180],
    ['og-image.png', og, 1200, 630],
  ]) await sharp(Buffer.from(source), { density: 192 }).resize(width, height).png({ compressionLevel: 9 }).toFile(join(output, name));
}
await writeFile(join(output, 'README.md'), `# ${BRAND.name} 브랜드 자산\n\n사용자가 선택한 윈터라이드의 화이트·골드 자산. 이름과 팔레트는 \`dist/brand-config.js\`에서 관리한다.\n\n- 모든 트리는 기존 \`dist/luminous-loading.js\`의 \`loadingTreePath()\`를 그대로 사용한 정적 SVG다.\n- \`logo-primary.svg\`: 투명 배경의 은은한 골드 선. \`logo-monochrome.svg\`: 단색 골드.\n- \`logo-compact.svg\`: 어두운 월드 헤더에서 읽히는 밝은 골드. 28~32px에 맞춘 선 두께 17.\n- \`favicon.svg\`, 32px PNG와 앱 아이콘: 화이트 바탕의 골드 트리. 작은 파비콘에는 30 단위 선 사용.\n- \`og-image.png\`, SVG: 1200 × 630, 따뜻한 화이트 바탕. 약 220px 높이 트리와 30px의 작은 소문자 \`${wordmark}\`만 표시한다. 한글 부제·캐치프레이즈·블러 없음.\n- 워드마크는 프로젝트의 Pretendard 350을 벡터 윤곽으로 변환한다. SVG와 PNG의 글자 모양이 같고 외부 폰트 요청이 없다.\n- 재생성: \`node scripts/build-brand-assets.mjs\`. SVG만: \`--svg-only\`. 수동 생성에는 Python/fontTools와 Node가 필요하며, PNG에는 sharp가 추가로 필요하다. 배포 빌드는 커밋된 자산을 사용한다.\n\n원본 트리 경로는 변경하지 않는다. 방문자·초대 토큰·비공개 장면이 없는 공통 자산이다.\n`);
console.log(`Brand assets written to ${output}`);
