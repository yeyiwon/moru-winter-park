# v39 단일 월드 배포

기존 GitHub main, Vercel `moru-winter-park`, Sites `appgprj_6af6f606ab648191855ab9bd44c334fd` 및 D1 DB를 그대로 사용한다. 새 서버나 저장소를 생성하지 않는다.

게스트 정원은 11명, 전체 정원은 12명으로 관리자가 운영하러 들어올 자리를 확보한다.

검증한 API/마이그레이션을 Sites에 먼저 적용한 뒤 같은 소스를 GitHub main에 fast-forward하고 연결된 Vercel 배포를 확인한다. `0011_busy_hawkeye.sql`은 테이블/필드 추가뿐이며 이전 외형·소원·장식을 삭제하지 않는다. 기존 무초대 세션은 의도적으로 재승인이 필요하다. 관리자 로그인 후 **관리 → 초대 링크 관리**에서 새 초대를 발급한다. 모든 새 링크는 같은 메인 월드로 연결된다.

2026-11-18 운영 반영 확인:

- 최종 실행 커밋: `61e34e5bc4c63eabf070fbee4ace2f9a12cf93c2` (최초 단일 월드 `d069694`, 관리자 자리 확보 보완 포함). GitHub main fast-forward 완료.
- Sites **40**, `appgdep_6afdbbb4805c8191ba76fbedeaad5142`, `succeeded`. 기존 D1 및 공개 Site 외곽 접근 정책을 유지하고 앱에서 초대를 검증한다.
- Vercel `dpl_HuyjcMqYcEjRgRG2ZiD92TWnDoo9`, `READY`, `production`, 실행 SHA 일치, 기존 운영 alias 할당 확인.
- 두 운영 주소 health 200, `inviteRequired: true`, `winter-plaza` 확인. 초대 없는 join 403, 무효 토큰 403, 일반 사용자 관리 요청 403, 미승인 소원 조회 401 확인.
- Vercel 실제 PC/모바일 크기 Chrome에서 입장 제한·관리자 로그인 링크·같은 탭 잘못된 초대 처리·Ethereal 첫 곡·화면 경계 검사 PASS. page 오류 0, 5xx 0.
- 주요 파일 9개 × 두 주소 **18/18 SHA-256 일치**.
- 배포 직후 5분 오류 필터 로그 표본 4건은 모두 의도한 401/403, Worker outcome `ok`. 예외/5xx 없음. 원문 로그와 요청 헤더는 저장하지 않고 상태/경로만 기록했다.
- 실제 소유자 로그인과 초대 관리 화면은 **사용자 확인**. 운영 유효 초대로의 입장/멀티플레이는 **UNKNOWN**. 로컬에서는 관리자 발급·PC/모바일 동시 접속·공유·폐기까지 PASS이며 이를 운영 인증 검증으로 대체하지 않는다. 사용자가 운영 계정으로 로그인하고 초대 관리 화면을 확인했다고 응답했다. 실물 휴대폰도 UNKNOWN.

근거: [운영 검사](../qa/browser-v39/production/verification.json), [배포 정보](../qa/browser-v39/production/deployment.json), [배포 파일 비교](../qa/browser-v39/assets.json), [PC](../qa/browser-v39/production/gate-pc.jpg), [모바일](../qa/browser-v39/production/gate-mobile.jpg).

정원 보완 후 전체 368개 검사를 다시 실행해 통과했다(38.73초). 프런트엔드와 프록시 파일은 최초 v39 브라우저 검증본과 동일하다. 최종 Sites health 200/초대 제한 유지, Vercel READY와 운영 alias를 확인했다.

이후 배포 결과 기록 커밋은 문서·QA 자료만 포함한다. 그 커밋에 대한 GitHub/Vercel 후속 배포 역시 동일한 앱 코드이며, Sites 실행 소스는 위 커밋으로 유지한다.

---

# v38 프로덕션 배포

## 기존 대상

- GitHub: 현재 저장소 `github` remote의 `main`, 이전 운영 소스 `0720494998753c18f16a3bc7931043d084066fc6`.
- Vercel: `moru-winter-park`, 프로젝트 `prj_mbioBXlMSNwfJ8MWNaRMi2Lsm8I0`, team `team_PrxOY6C87yIECNDLhgcoMYdz`.
- 운영 주소: https://moru-winter-park.vercel.app
- API/DB를 담당하는 기존 Sites: https://bits-yeiwon-knowledge.expert-bass-1722.chatgpt.site

## 순서와 호환성

1. 전체 자동 검사, 브라우저 회귀, 실제 두 production build와 용량 검사.
2. 검증한 소스/배포물로 기존 Sites 갱신. `0010_loose_kronos.sql`은 nullable `visitors.color_top` 추가이며 기존 자료를 삭제하지 않는다.
3. Sites health와 신규 저장 경로 확인 후 GitHub `main`을 fast-forward. 강제 push 없음.
4. 연결된 Vercel Git 배포의 SHA와 READY, 운영 alias 확인.
5. PC/모바일 에뮬레이션에서 운영 초기 진입·외형 저장·채팅·지도·놀이시설·실내·음원 재생 확인. 테스트 게스트는 퇴장하여 본인 임시 데이터만 정리.

기존 사용자 설정과 소원은 유지한다. 실패하면 신규 frontend를 먼저 공개하지 않으며 이전 정상 운영 버전을 기준으로 원인을 진단한다. 인증/접근 정책을 완화하지 않는다. 비밀 값은 이 문서와 저장소에 기록하지 않는다.

## 상태

2026-11-18 운영 반영 및 배포 후 검증 완료.

- 실행 소스: `46b2488551f056f8c402f5c168e58002b321c64b`. 기존 GitHub main에 fast-forward 반영.
- Sites **버전 38**, 배포 `appgdep_6afdada2a0ec819194664af705c58d3d`, `succeeded`. 기존 공개 범위 유지.
- Vercel 배포 `dpl_6B7N2pcCGvWED9vC2LziTiNVCzyk`, `READY`, `production`. 위 SHA와 일치하며 `moru-winter-park.vercel.app` alias 할당 확인.
- Sites health 및 새 `/api/appearance` 저장/조회 성공. 기존 게스트 데이터 유지, `color_top` 저장 가능 확인. 처음 수동 점검의 잘못된 fluff 값(1)은 400으로 정상 거절됐고, 실제 UI 범위인 100으로 재확인했다.
- 운영 Vercel의 PC 1280×800 / 모바일 390×844 Chrome 에뮬레이션: 진입, 권한 거절, 외형 저장·재접속·다른 게스트 동기화, 채팅 전송·수신, 지도 이동, 소원 패널 화면 경계, 관람차·회전목마·온천 입퇴장, 료칸·천문대 전환, Ethereal 첫 곡 및 실제 재생, 초대 제목의 관리자 로그인 확인. **8개 묶음 검사 PASS**, page/WebGL 오류 0, 검사 중 5xx 응답 0.
- 두 운영 주소의 주요 JS/CSS 9개가 로컬 production 배포물과 SHA-256 일치.

근거: [운영 검사](../qa/browser-v38/release-production/verification.json), [PC 초대 화면](../qa/browser-v38/release-production/invite-pc.jpg), [모바일 초대 화면](../qa/browser-v38/release-production/invite-mobile.jpg), [에셋 일치](../qa/browser-v38/production-assets.json), [배포 메타데이터](../qa/browser-v38/production.json).

배포 후 결과를 추가한 후속 커밋은 문서·검증 자료만 포함한다. Sites 실행 소스는 위 SHA이며, GitHub main의 후속 기록으로 생기는 Vercel 배포도 동일한 앱 코드다. 실물 휴대폰과 실제 소유자 로그인 완료, 30분 이상 안정성은 UNKNOWN으로 유지한다.
