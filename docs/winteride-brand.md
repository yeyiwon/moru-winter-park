# WINTERIDE · 윈터라이드 — 2026-11-19

## 사용자 결정과 적용 범위

사용자가 “윈터라이드로 하고 화이트 골드 느낌으로가자”라고 선택했다. 대외 표기는 **WINTERIDE**, 화면의 시각 워드마크는 **winteride** 소문자다. 예전 SNOWHERE와 이름 후보는 과거 검토 기록으로만 남긴다.

이름 아래 한글 부제 없이 작은 이름과 기존 로딩 화면의 트리 경로만 사용한다. 썸네일·아이콘은 화이트 바탕, 골드는 차분한 샴페인 톤이다. 게임의 실제 밤 풍경 위 헤더는 흰 글씨와 밝은 골드 심볼로 대비를 확보한다. 월드 전체의 색상이나 로딩 애니메이션을 변경하는 작업은 아니다.

## 구성

- 기준 파일: `dist/brand-config.js`. 이름·시각표기·색상·설명·실제 공개 주소·자산 경로를 공유한다.
- 서체: 프로젝트에 포함된 Pretendard. 상단 이름 15px / 모바일 13px, weight 350. 공유 이미지의 영문 글자는 같은 번들 서체의 벡터 윤곽으로 고정한다.
- 색상: 화이트 `#fffefa`, 오프화이트 `#f8f7f3`, 골드 `#a8844c`, 샴페인 `#b4935d`, 어두운 배경용 밝은 골드 `#dfcea4`.
- 로고: `loadingTreePath()`의 원본 좌표 유지. 출력 크기에 맞춘 선 두께와 색상만 변경.
- 자산: 정적 SVG 심볼, 32px 파비콘, 180/192/512px 홈 화면 아이콘, 1200×630 PNG 공유 카드.
- 메타데이터: HTML title, OG/Twitter 제목·설명·이미지, manifest. 공유 크롤러의 JavaScript 실행 없이 노출된다.
- 캐시: 이미지·CSS·아이콘 링크 `winteride-v1`, 서비스 워커 `knowledge-park-v46-winteride`.
- 주소: 검증된 기존 `https://moru-winter-park.vercel.app`를 유지한다. 등록하지 않은 새 도메인을 만들거나 메타데이터에 넣지 않았다.

## 변경 파일

`dist/brand-config.js`, `dist/brand.css`, `dist/brand/*`, `dist/index.html`, `dist/site.webmanifest`, `dist/sw.js`, 브랜드 생성 스크립트 3개, 패키지명 2개 파일, 기존 `tests/loading-controls.test.mjs`의 시각 이름 기대값, README·CHANGELOG·현재 문서.

## 실제 검증

- 기존 로딩·브랜드·입력 검사 `tests/loading-controls.test.mjs`: 3/3 PASS. 표시 이름은 BRAND.wordmark, 메타데이터는 BRAND.name으로 검사 의도를 유지했다.
- `npm run build`, `npm run build:vercel`, `npm run test:budget`: PASS.
- 생성된 1200×630 PNG를 직접 열어 화이트·골드 구성, 작은 영문 이름과 한글 부제 부재를 확인했다. PNG 파일 크기는 18,379바이트다.
- 로고/아이콘은 원본 트리 경로를 포함하고 SVG animation/script 요소가 없음을 확인했다. 메타데이터와 manifest의 이름·컬러 및 새 캐시 URL을 확인했다.
- 기존 전체 게임 테스트·실제 기기 테스트·실제 공유 플랫폼 표시를 이번 변경의 결과로 주장하지 않는다.

## 저장과 운영 반영

공개 GitHub 저장소의 소스 업로드는 앞선 자동 승인 검토에서 공개 업로드의 명시 동의 부족으로 거절되었다. 이번 디자인 선택이 그 별도 업로드 동의까지 뜻한다고 해석하지 않으며, 거절된 작업을 재시도하거나 우회하지 않는다. 검토 가능한 코드·자산을 기존 Sites 소스 저장본에 준비하고, 공개 GitHub 반영에 대한 명시 동의를 최종 단계에서 요청한다.

운영에 미반영인 동안 Sites와 Vercel의 실제 화면은 이 저장본과 다르다. 운영 반영 뒤에는 두 호스트의 HTML·공유 이미지·아이콘 및 canonical을 확인해야 한다. 공유 플랫폼의 캐시 갱신 시점은 UNKNOWN이다.
