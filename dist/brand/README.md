# WINTERIDE 브랜드 자산

사용자가 선택한 윈터라이드의 화이트·골드 자산. 이름과 팔레트는 `dist/brand-config.js`에서 관리한다.

- 모든 트리는 기존 `dist/luminous-loading.js`의 `loadingTreePath()`를 그대로 사용한 정적 SVG다.
- `logo-primary.svg`: 투명 배경의 은은한 골드 선. `logo-monochrome.svg`: 단색 골드.
- `logo-compact.svg`: 어두운 월드 헤더에서 읽히는 밝은 골드. 28~32px에 맞춘 선 두께 17.
- `favicon.svg`, 32px PNG와 앱 아이콘: 화이트 바탕의 골드 트리. 작은 파비콘에는 30 단위 선 사용.
- `og-image.png`, SVG: 1200 × 630, 따뜻한 화이트 바탕. 약 220px 높이 트리와 30px의 작은 소문자 `winteride`만 표시한다. 한글 부제·캐치프레이즈·블러 없음.
- 워드마크는 프로젝트의 Pretendard 350을 벡터 윤곽으로 변환한다. SVG와 PNG의 글자 모양이 같고 외부 폰트 요청이 없다.
- 재생성: `node scripts/build-brand-assets.mjs`. SVG만: `--svg-only`. 수동 생성에는 Python/fontTools와 Node가 필요하며, PNG에는 sharp가 추가로 필요하다. 배포 빌드는 커밋된 자산을 사용한다.

원본 트리 경로는 변경하지 않는다. 방문자·초대 토큰·비공개 장면이 없는 공통 자산이다.
