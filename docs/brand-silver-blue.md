# 실버·아이스 블루 브랜드 — 2026-11-19

## 사용자 피드백과 결정

- 기존 나선 트리의 정적 실루엣과 소문자 워드마크를 거절했다. 워드마크는 전부 대문자로 요청했다.
- 이름은 ‘내가 사랑하는 겨울’의 의미와 연결되기를 원하지만 감성 쇼핑몰처럼 들리는 표현은 선호하지 않았다. NEVE/HIVER/LUMI 및 CARO INVERNO/AMIVER 제안은 제외했다.
- 이번 요청은 추가 취향 질문 대신 이름 추천을 하고, 금색을 실버·파랑으로 바꾸는 것이다.
- **색상·정적 로고·대문자는 구현 대상이고, 새 이름은 추천 단계다.** 운영명은 기존 WINTERLIGHT를 유지하며 후보를 최종 선택한 것으로 처리하지 않는다.

## 디자인

- 팔레트: 쿨화이트 `#f6f9fc`, 실버 `#c4d2df`, 밝은 실버 `#edf4fa`, 아이스 블루 `#8bbde5`, 스틸 블루 `#5e87ab`.
- 정적 심볼: 중앙에 여백이 있는 여섯 갈래 결정. 층층이 감긴 곡선 대신 떨어진 각면으로 24–32px에서도 형태를 구분한다. SVG animation/script 없음.
- 헤더: PC 14px, 모바일 13px, Pretendard 500. 작은 대문자와 제한된 자간. 아이콘 28px / 모바일 24px.
- 공유 이미지: 1200×630. 푸른 겨울밤 바탕, 실버 결정, 작은 대문자 이름. 로고 아래 한글·영문 부제 없음.
- 로딩: 원본 트리 path, 2.7초 그리기와 준비 단계 동작을 유지하고 선·입자·문자 색만 실버·블루로 변경했다. 실제 월드의 조명·시설 재질은 이 브랜드 수정 범위에 포함하지 않았다.
- 캐시: `BRAND.revision = silver-blue-v1`을 HTML 자산 URL에서 함께 사용. 서비스 워커는 기존 최신 직접 조작 UI 캐시 버전을 보존한 새 이름으로 갱신.

## 이름 추천과 사실 구분

1. **HIBERNA — 히베르나**: 라틴어 hīberna는 중성 복수 명사로 겨울 숙영지를 뜻한다. ‘내가 머물고 싶은 겨울 세계’는 이 프로젝트에 붙이는 브랜드 해석이다. [Lewis & Short / Logeion](https://logeion.org/hibernus).
2. **NIVIS — 니비스**: 라틴어 nix(눈)의 속격 형태로 ‘눈의’라는 뜻이다. 니비스는 제안하는 한국어 호칭이며 고전 라틴어 발음은 니위스에 가깝다. [Logeion](https://logeion.org/nivis), [Open University 발음 안내](https://www.open.edu/openlearn/mod/oucontent/view.php?id=25780&section=3).

두 후보는 `dist/brand/candidates/`의 비교 이미지와 `/brand/preview.html`에서 볼 수 있다. 후보 이름은 실제 운영 메타데이터에 적용하지 않았다. HIBERNA에는 과거 Tibia 월드명 사용례가 있으며 독점성·상표 사용 가능성을 확인한 결과가 아니다.

## 변경 파일과 검증

- 기준: 최신 Sites 소스 `4b4d12014f5edc0cbeee98035cfbda8673f49831`. 기존 직접 입력·모바일·커스터마이징 후속 작업을 보존했다.
- 변경: `dist/brand-config.js`, `dist/brand.css`, `dist/brand/*`, `dist/index.html`, `dist/site.webmanifest`, `dist/sw.js`, 로딩 JS/CSS의 색상, 브랜드 생성 스크립트, 기존 로딩 검사, 문서.
- `npm run build`, `npm run build:vercel`: PASS.
- `node --test tests/loading-controls.test.mjs`: 3/3 PASS. 원본 로딩 경로 유지, 실제 준비 단계, 정적 대문자 로고, 기존 입력 동작을 확인했다.
- `npm run test:budget`: PASS. 전체 자산 22,636,517 B / 제한 25,165,824 B. 코드 gzip 1,012,800 B / 제한 1,280,000 B.
- 생성 PNG를 직접 열어 색상·각면·대문자·부제 부재를 확인했다. 자산 크기·해시는 `qa/brand-silver/local-validation.json`에 기록했다.
- 이번 작업에서 전체 게임·실물 모바일·외부 메신저 캐시 결과를 새로 검증했다고 주장하지 않는다.

## 운영 반영

검증한 소스와 산출물을 기존 Sites와 Vercel 프로젝트에 반영한다. 기존 공개 범위·환경 변수·Git 연결·도메인·API/데이터 구조를 변경하지 않는다. 공개 GitHub 연결의 쓰기 권한 403은 기존에 확인된 별도 동기화 제한이다. 배포 후 실제 운영 결과를 추가 기록한다.
