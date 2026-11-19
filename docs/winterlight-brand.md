# WINTERLIGHT · 윈터라이트 — 2026-11-19

## 사용자 결정과 적용 범위

사용자가 화이트·골드 방향을 선택했고, 최종 이름을 윈터라이트로 정정했다. 대외 표기는 **WINTERLIGHT**, 화면의 시각 워드마크는 **winterlight** 소문자다. 예전 SNOWHERE와 이름 후보는 과거 검토 기록으로만 남긴다.

이름 아래 한글 부제 없이 작은 이름과 기존 로딩 화면의 트리 경로만 사용한다. 썸네일·아이콘은 화이트 바탕, 골드는 차분한 샴페인 톤이다. 게임의 실제 밤 풍경 위 헤더는 흰 글씨와 밝은 골드 심볼로 대비를 확보한다. 월드 전체의 색상이나 로딩 애니메이션을 변경하는 작업은 아니다.

## 구성

- 기준 파일: `dist/brand-config.js`. 이름·시각표기·색상·설명·실제 공개 주소·자산 경로를 공유한다.
- 서체: 프로젝트에 포함된 Pretendard. 상단 이름 15px / 모바일 13px, weight 350. 공유 이미지의 영문 글자는 같은 번들 서체의 벡터 윤곽으로 고정한다.
- 색상: 화이트 `#fffefa`, 오프화이트 `#f8f7f3`, 골드 `#a8844c`, 샴페인 `#b4935d`, 어두운 배경용 밝은 골드 `#dfcea4`.
- 로고: `loadingTreePath()`의 원본 좌표 유지. 출력 크기에 맞춘 선 두께와 색상만 변경.
- 자산: 정적 SVG 심볼, 32px 파비콘, 180/192/512px 홈 화면 아이콘, 1200×630 PNG 공유 카드.
- 메타데이터: HTML title, OG/Twitter 제목·설명·이미지, manifest. 공유 크롤러의 JavaScript 실행 없이 노출된다.
- 캐시: 이미지·CSS·아이콘 링크 `winterlight-v1`, 서비스 워커 `knowledge-park-v46-winterlight`.
- 주소: 검증된 기존 `https://moru-winter-park.vercel.app`를 유지한다. 등록하지 않은 새 도메인을 만들거나 메타데이터에 넣지 않았다.

## 변경 파일

`dist/brand-config.js`, `dist/brand.css`, `dist/brand/*`, `dist/index.html`, `dist/site.webmanifest`, `dist/sw.js`, 브랜드 생성 스크립트 3개, 패키지명 2개 파일, 기존 `tests/loading-controls.test.mjs`의 시각 이름 기대값, README·CHANGELOG·현재 문서.

## 실제 검증

- 기존 로딩·브랜드·입력 검사 `tests/loading-controls.test.mjs`: 3/3 PASS. 표시 이름은 BRAND.wordmark, 메타데이터는 BRAND.name으로 검사 의도를 유지했다.
- `npm run build`, `npm run build:vercel`, `npm run test:budget`: PASS.
- 생성된 1200×630 PNG를 직접 열어 화이트·골드 구성, 작은 영문 이름과 한글 부제 부재를 확인했다. PNG 파일 크기는 18,513바이트다.
- 로고/아이콘은 원본 트리 경로를 포함하고 SVG animation/script 요소가 없음을 확인했다. 메타데이터와 manifest의 이름·컬러 및 새 캐시 URL을 확인했다.
- 기존 전체 게임 테스트·실제 기기 테스트·실제 공유 플랫폼 표시를 이번 변경의 결과로 주장하지 않는다.

## 저장과 운영 반영

사용자는 공개 GitHub 소스 업로드와 기존 사이트 운영 반영에 명시적으로 동의했고, 이후 재시도를 요청했다. 별도의 배포 승인을 다시 요구하지 않는다.

GitHub 연결은 실제 쓰기 요청에서 `403 Resource not accessible by integration`을 반환하고 설치 목록도 비어 있어 아직 동기화할 수 없다. 이는 사용자 동의가 아닌 연결 권한 문제다. 기존 GitHub main을 변경하거나 권한 제한을 우회하지 않는다.

검증한 소스 `ad81ba549e0cd13761c1f9289d4ef14efbccc949`와 기존 프로젝트 설정을 사용해 Vercel 직접 배포를 완료했다. 환경 변수·도메인·Git 연결은 변경하지 않았다.

### Sites 운영 반영 완료

- 저장 버전: 46, 소스 `ad81ba549e0cd13761c1f9289d4ef14efbccc949`.
- 배포: `appgdep_6afe7ff192708191937e65967143eead`, `succeeded`, 2026-11-19 13:50 KST.
- 운영 주소: https://bits-yeiwon-knowledge.expert-bass-1722.chatgpt.site
- 사이트 표시 이름도 `WINTERLIGHT`로 변경했다. 공개 범위는 유지했다.
- Sites 소유자 검증 헤더를 사용한 HTTP 읽기 검사 9/9 PASS. HTML title/OG/Twitter, 공유 PNG, 파비콘, 정적 트리 로고, manifest, 헤더 CSS, 서비스 워커, health, 초대 필요 상태를 확인했다. 일반 외부 방문자의 인증 없는 Sites 접근을 검증한 결과로 주장하지 않는다.
- 공유 PNG: 1200×630, 18,513바이트, SHA256 `aa9d89d08fac0750f411c6cbf1ad6633a94dee43383c747fca2adb45428cd846`, 로컬 준비본과 일치.
- 결과: `qa/brand-v46/sites-production-validation.json`. 인증 토큰과 게스트 데이터는 기록하지 않았다.

### Vercel 운영 반영 완료

- 배포: `dpl_3DW4QuujFGswHeqNfQtQzcm5rqKq`, production, `READY`, 2026-11-19 13:58 KST.
- 운영 주소: https://moru-winter-park.vercel.app
- 빌드 주소: https://moru-winter-park-2wkd9mxg2-yeyiwons-projects.vercel.app
- 공식 배포 상태에서 기존 운영 별칭 연결과 `aliasError: null`을 확인했다.
- 인증 없는 공개 HTTP 검사 9/9 PASS. HTML·OG/Twitter 이름, 1200×630 PNG의 정확한 SHA256, 원본 트리 SVG, manifest, 15px/13px 헤더 CSS, 새 service worker, health, 익명 접속의 초대 필요 상태를 확인했다.
- 결과: `qa/brand-v46/vercel-production-validation.json`.

### 대용량 전송 문제와 배포 입력 동일성

연결 도구의 대용량 파일 전송이 응답 없이 대기하여 중단했다. 작은 파일 업로드는 성공했지만 큰 파일 16개는 성공 여부를 확인할 수 없었다. 실패한 전송을 계속 기다리는 대신, 기존 공개 저장소의 고정 commit `46dc3223bed447ed0eba80aa1a6b83fd09975769`에서 변경 없는 소스 201개를 빌드 시 가져오는 패키지를 만들었다. 새 브랜드·의존성 목록·API 진입점 등 29개 파일은 직접 전달했다.

`scripts/restore-release-source.mjs`는 정해진 공개 origin과 commit만 허용하고 redirect를 거부한다. 각 파일의 크기와 SHA256을 검사한 뒤 전체 입력을 다시 검사한다. 다운로드 실패나 불일치는 원래 빌드 전에 중단된다. 확인되지 않은 원격 코드는 실행하지 않는다. 비교 기준은 `qa/brand-v46/vercel-source-manifest.json`이다.

애플리케이션·빌드 입력 227개는 승인 소스와 바이트 단위로 같다. 임시 배포용 `vercel.json`은 `buildCommand` 앞에 복원 단계만 추가하며, outputDirectory·regions·rewrites·redirects·headers·crons를 포함한 나머지 설정은 원본과 정확히 비교한다. 호스팅이 추가하는 `name`은 기존 프로젝트 값 `moru-winter-park`일 때만 허용한다. 원본 저장소의 `vercel.json`은 바꾸지 않았다.

로컬 복원과 production build를 완료한 뒤 최종 웹 자산 217개를 기존 승인 빌드와 비교했고 누락·추가·해시 차이가 모두 0이었다. `qa/brand-v46/vercel-package-validation.json`에 기록했다. 운영 빌드에서도 201개 복원과 전체 입력 검증, 기존 빌드 성공을 확인했다. 이 방식의 외부 소스 접근은 빌드에만 필요하며 운영 페이지는 새 배포에 포함된 파일을 제공한다.

첫 두 직접 배포는 호스팅이 추가한 `name` 필드로 설정 검사가 실패했고, 기존 운영 별칭을 변경하지 않았다. 관찰한 차이만 엄격하게 처리한 세 번째 배포가 성공했다. 기존 전체 게임·모바일 실제 기기·메신저 자체 캐시 화면 검증을 이번 정적 브랜드 배포의 결과로 주장하지 않는다.

GitHub의 다음 자동 배포 전에 이 수정본을 저장소에 동기화해야 한다. 실제 공유 플랫폼의 캐시 갱신 시점은 UNKNOWN이다.
