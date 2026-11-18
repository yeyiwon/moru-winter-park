# SNOWHERE 브랜드 자산

이름은 브랜드 시안이며 `dist/brand-config.js` 한 곳에서 관리한다.

- 로고는 기존 `dist/luminous-loading.js`의 `loadingTreePath()`를 그대로 가져온 정적 SVG다. 애니메이션과 난수 효과가 없다.
- `logo-primary.svg`: 투명 배경, 아이보리·샴페인색. `logo-monochrome.svg`: 투명 배경 단색.
- `logo-compact.svg`: 31~38px 헤더용 투명 로고. 원본 경로에 17px 선을 적용하고 블러를 제거한다.
- `favicon.svg`와 32px PNG: 같은 곡선에 작은 화면용 굵은 선 적용.
- `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`: 앱/홈 화면 아이콘.
- `og-image.png`와 SVG: 1200 × 630 공유 썸네일. 트리와 작은 영문 이름만 표시하며 한글 부제는 사용하지 않는다. 특정 방문자·초대 토큰·비공개 장면이 없는 공통 이미지.
- 재생성: `node scripts/build-brand-assets.mjs`. SVG만: `node scripts/build-brand-assets.mjs --svg-only`. PNG 생성에는 sharp가 필요하다.

원본 트리 경로의 좌표와 곡선은 변경하지 않는다. 출력별로 크기·선 두께·색상만 달라진다. SVG 썸네일의 글자는 사용 환경의 폰트에 영향을 받을 수 있어 공유에는 검증된 PNG를 사용한다.
