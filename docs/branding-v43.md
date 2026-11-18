# v43 · SNOWHERE 브랜드 시안 — 2026-11-19

## 요청과 상태

사용자는 기존 이름을 더 간결하고 멋진 이름으로 바꾸고, 로딩 화면에서 올라오는 트리 모양을 정적 로고로 활용하며 링크 공유 제목·설명·썸네일까지 정리해 달라고 요청했다.

추천 이름 **SNOWHERE · 스노웨어**로 실제 소스와 검토 시안을 준비했다. 이름 선택 질문에는 답이 없어 추천 기본안으로 진행했으며 명시적인 최종 이름 선택으로 기록하지 않는다. 운영 배포와 새 주소 생성은 아직 하지 않았다. 기존 Vercel 팀 `team_PrxOY6C87yIECNDLhgcoMYdz`의 프로젝트 조회가 403으로 거절되어 연결 권한 승인 후 이어서 반영해야 한다. 이 제한은 Vercel 연결의 팀 권한이며 코드 오류나 앱의 장애를 뜻하지 않는다.

## 선택 이유

SNOWHERE는 눈이 있는 어딘가를 연상시키는 이름 제안이다. 트리, 설산, 놀이공원, 료칸 등 여러 공간을 담도록 겨울 전체를 가리키며 긴 문장형 제목을 짧은 워드마크로 줄였다. 독점 명칭이나 상표·도메인 확보를 뜻하지 않는다.

기존 `dist/luminous-loading.js`의 `loadingTreePath()`를 직접 가져와 로고를 만들었다. 참고 이미지에서 다시 그리거나 생성형 이미지로 대체하지 않았다. 트리의 비대칭 나선·바닥 루프·꼭대기로 올라가는 곡선 좌표는 원본과 동일하다.

## 자산과 적용

| 대상 | 결과 |
| --- | --- |
| 앱·브라우저 제목 | SNOWHERE · 스노웨어 |
| 화면 상단 | 정적 트리 심볼 + SNOWHERE |
| 링크 설명 | 함께 트리를 꾸미고, 눈 내리는 밤을 걷는 겨울 공간. |
| 기본 로고 | 투명 SVG, 아이보리·샴페인 색상 |
| 작은 로고 | 같은 곡선, 17 단위 선 두께, 블러 없음. 31–38px 헤더에서 확인 |
| 파비콘 | SVG와 32×32 PNG |
| 홈 화면 아이콘 | 180×180, 192×192, 512×512 PNG |
| 공유 썸네일 | 1200×630 PNG, 138,325바이트. 벡터 원본도 보관 |
| 정적 검토 페이지 | `/brand/preview.html`, 검색 노출 제외 |

`dist/brand-config.js`는 이름·설명·색상·공개 주소·자산 경로의 기준이다. `scripts/apply-brand.mjs`가 이를 초기 HTML head와 manifest로 기록하므로 공유 크롤러가 JavaScript를 실행할 필요가 없다. `og:title`, 설명, site name, URL, 이미지 URL·크기·타입·대체 텍스트 및 Twitter large-image 카드를 포함한다.

공유 이미지와 canonical은 실제 기존 공개 주소 `https://moru-winter-park.vercel.app` 기준이다. 검증하지 않은 새 도메인을 넣지 않는다. 초대 토큰은 현재와 같이 fragment로 유지하며 메타데이터·이미지·manifest에 넣지 않는다. 공통 공유 이미지에는 방문자·채팅·초대 정보가 없다.

서비스 워커는 기존 `knowledge-park-` 접두사를 유지하고 v43 캐시로 올려 이전 캐시 정리 규칙과 호환된다. 로고·아이콘·manifest는 precache하고 138KB 공유 카드는 게임 시작 시 미리 받지 않는다.

## 변경 파일

- `dist/brand-config.js`, `dist/brand.css`, `dist/brand/*`, `dist/site.webmanifest`, `dist/index.html`, `dist/sw.js`
- `scripts/build-brand-assets.mjs`, `scripts/apply-brand.mjs`, `scripts/build-brand-preview.mjs`
- `scripts/build-worker.mjs`, `scripts/dev-server.mjs`: `.svg`, `.ico`, `.webmanifest` 응답 타입과 바이너리 처리
- `package.json`, `package-lock.json`: 앱 패키지명과 빌드의 메타데이터 동기화 단계. 의존성 추가 없음
- `tests/loading-controls.test.mjs`: 과거 눈 결정 로고 고정 검사를 현재 정적 트리/원본 경로 일치 계약으로 변경

월드 지형·시설·렌더러·캐릭터·음악·DB·쿠키·게스트 권한·초대 발급 기능은 변경하지 않았다. 로딩 트리의 애니메이션 코드와 준비 단계도 그대로다.

## 재생성

```sh
node scripts/build-brand-assets.mjs
node scripts/apply-brand.mjs
node scripts/build-brand-preview.mjs
npm run build
npm run build:vercel
```

SVG 원본은 `--svg-only`로 내보낼 수 있다. PNG 재생성은 sharp가 필요하며 현재 작업에서는 설치된 primary runtime의 sharp를 사용했다. 일반 배포 빌드는 커밋된 PNG를 사용하므로 새 이미지 생성 의존성이 필요 없다. 공유용 PNG는 폰트까지 픽셀로 고정돼 있으며 SVG 원본의 텍스트는 열람 환경 폰트에 따라 달라질 수 있다.

## 실제 검증

- `loading-controls`, `performance-delivery`, `social-ui`, `vercel-proxy`: **22/22 PASS**. 전체 게임 테스트를 재실행했다고 기록하지 않는다.
- `npm run build`, `npm run build:vercel`, `npm run test:budget`: PASS. Vercel 산출물 22,562,887바이트, 코드 gzip 983,887바이트로 기존 제한 이내다. FPS나 GPU 개선 수치가 아니다.
- 생성된 로고 4종에 기존 `loadingTreePath()`가 그대로 포함되고 애니메이션·스크립트 요소가 없음을 확인.
- Worker를 메모리에서 실행해 `/`, manifest, compact SVG, favicon SVG, 공유 PNG, 검토 HTML이 로그인·DB 없이 200과 올바른 MIME으로 반환됨을 확인.
- 클라우드 브라우저 1363×936에서 브랜드 검토 화면과 714px/340px 상단 샘플을 확인. PNG·아이콘 정상 로드, 워드마크 `animation:none`, 문서 가로 넘침 없음. 32px 파비콘과 31/38px compact 심볼도 시각 확인.
- 초기 실제 월드 방문은 `GL_RENDERER = Disabled`와 WebGL context 생성 실패를 보고했다. 이 브라우저에서의 실제 게임 플레이·3D 로딩 완료는 **UNKNOWN**이다. 문제를 숨기기 위해 제품 코드를 바꾸지 않았다.
- 명령 실행 프로세스의 localhost HTTP는 연결되지 않았지만 공식 preview relay에서 브라우저 화면은 열렸다. HTTP 계약은 위 Worker 직접 호출로 확인했고 이를 배포 후 네트워크 검증과 혼동하지 않는다.

근거: [검증 JSON](../qa/brand-v43/validation.json), [브랜드 검토 화면](../qa/brand-v43/brand-review.jpg).

## 배포 후 남은 확인

Vercel 팀 연결 승인 후 현재 프로젝트·Git 연결·최신 커밋을 다시 확인한다. 기존 서버와 Vercel에 같은 소스를 반영하고 운영 URL에서 HTML·OG PNG·파비콘을 확인한다. 새 주소는 실제 사용 가능 여부와 연결 결과를 확인한 뒤에만 canonical 및 공유 링크에 적용한다. 현재 공유 플랫폼의 캐시 갱신 시간, 실제 카카오톡·디스코드 카드 표시, 새 도메인 가용성, 실물 모바일 결과는 **UNKNOWN**이다.
