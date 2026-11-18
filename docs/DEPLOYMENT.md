# v43 수정본 보관 · 운영 배포 보류

**사용자 결정: 배포는 보류하고 수정본만 보관한다.** GitHub main push·Vercel 배포·Sites 배포를 수행하지 않았다. 아래 접속 정책과 `/admin`은 로컬 수정본에 구현된 예정 동작이며 현재 운영에 적용됐다는 뜻이 아니다.

공개 입장은 초대 없이 같은 winter-plaza를 사용한다. 일반 방문자는 https://moru-winter-park.vercel.app 로, 관리자는 https://moru-winter-park.vercel.app/admin 으로 들어간다. `/admin`은 기존 Sites의 소유자 인증 경로에 연결되며 서버 소유자 검증을 통과해야 관리 UI를 사용할 수 있다. 기존 D1·환경 변수·소원/외형/장식 데이터 유지, 마이그레이션 없음.

385개 자동 검사와 두 build·용량 검사를 통과했다. 최종 수정본 전체 385/385 PASS(37.88초), 두 build와 예산 검사 PASS. 총 22,376,602 bytes, code gzip 981,975 bytes. 배포 후 운영 검증은 **NOT RUN**이다. 아래 v42 이전 초대 제한 및 관리자 진입 설명은 과거 기록이다.

---

# v42 운영 배포 — 2026-11-19

- 실행 소스 **14998b17a754bfcecc7df61bf1020c08c7004ad6**, GitHub main fast-forward 완료.
- 기존 Sites **42**, `appgdep_6afe011904548191999a262520ca34b6`, **succeeded**. 공개 범위·D1·런타임 환경 변수 유지, 마이그레이션 없음.
- Vercel **dpl_GLwPNPgbyxtRPRUauPsruKWcfcxS**, **READY / production**, 위 SHA 일치 및 `moru-winter-park.vercel.app` alias 확인.
- Sites/Vercel health 모두 200. 앱 파일 11개×두 주소 중 21개 원문 SHA 일치. Sites HTML은 Cloudflare가 붙인 script 때문에 원문만 다르며 삽입 부분을 제외한 앱 HTML은 정확히 일치.
- 사용자 제공 초대를 숨김 입력으로 전달해 실제 운영 PC 1280×800 / 터치 모바일 390×844 게스트 2개에서 **14개 검사 PASS**, page/WebGL 오류 0. 초대 입장, 모션 감소 중 발 보행·눈 낙하, 전체 모션 설정 복귀, PC 지도 버튼 숨김/모바일 표시, 지도 열기, 게스트 관리 API 403, 동일 `winter-plaza` 확인. 종료 후 해당 테스트 세션만 퇴장.
- PC/모바일 모두 보행 발 z 변화 범위 **0.39889**. 카메라 기준을 제외한 눈 높이 PC **16.07770→14.74831**, 모바일 **16.10298→14.83628**. 운영 서버에 테스트 불꽃 공연·소원·장식을 생성하지 않았다.
- 관리자 진입 위치는 **설정 → 초대 → 관리**. 로컬 owner fixture에서 열기/권한 노출을 검사했고, 실제 소유자 운영 로그인은 이전 사용자 확인이다.

[운영 검사](../qa/browser-v42/production/report.json), [배포 정보](../qa/browser-v42/production/deployment.json), [제공 파일 비교](../qa/browser-v42/production/assets.json), [수정 원인과 로컬 검증](platform-motion-v42.md).

실제 Windows·갤럭시·iPhone 기기와 모니터 색 프로필 비교는 UNKNOWN. OS 모션 설정 에뮬레이션을 물리 기기 검사로 표현하지 않는다. 앱 소스가 같은 후속 문서/QA 커밋은 Vercel에서 다시 빌드되며 Sites 실행 소스는 위 SHA를 유지한다. 앱 rollback 시 이전 Sites 41/Vercel 앱 `4af6a06`을 기준으로 삼을 수 있으며 데이터 변경은 없다.

---

# v41 프로덕션 배포 — 2026-11-19

기존 Sites/D1 → GitHub main → Vercel 흐름으로 동일 소스를 반영했다. 새 서버/저장소와 권한 우회는 추가하지 않았다. 마이그레이션 0012~0014는 추가형이며 기존 소원·외형·초대 데이터 삭제 없음. 기존 env는 유지하고 예약 호출용 CRON_SECRET만 양쪽 runtime에 같은 값으로 설정했다. 비밀 값·초대 토큰·쿠키는 기록하지 않는다.

- 앱 실행 소스: `de2400382d36288f40051099eb1fff738798edd6`. 서버/동기화 커밋 `6c91ffe` 포함. GitHub main fast-forward 완료.
- Sites **41**, `appgdep_6afdccbc9a84819191a266a8e0e6190f`, **succeeded**. 기존 audience·D1 유지.
- Vercel `dpl_5WbMLco1ur8dsHFcp6LwC3uCHqy8`, **READY / production**, 실행 SHA 일치.
- [운영 주소](https://moru-winter-park.vercel.app) 및 Sites health 200. `winter-plaza`, `inviteRequired:true` 유지.
- 핵심 렌더/VFX/모바일 파일 6개 × 2개 운영 주소: **12/12 SHA-256 일치**.
- 유효한 사용자 제공 테스트 초대로 독립 게스트 접속. 테스트 종료 후 해당 테스트 세션만 퇴장했다. 실제 운영 소원·장식 삭제는 수행하지 않았다.
- 관리자 API는 일반 게스트에게 403. 실제 소유자 로그인과 초대 관리 화면은 이전 사용자 확인이며, 새 운영 관리자 세션을 테스트 fixture로 대체하지 않았다.
- 배포 후 10분 오류 필터의 5건은 접근 전 퀴즈 401 및 게스트 운영 API 403. Worker outcome 모두 `ok`, 표본의 예외/5xx 없음. [요약](../qa/browser-v41/production/server-log-summary.json). 원시 요청 헤더는 저장하지 않았다.
- 운영 음악은 파일 로딩·첫 곡 Ethereal·다음 곡·복귀의 재생 시간 진행을 무음 QA 출력으로 검증했다. 기본 호스트 출력 장치 정지와 실제 청취 UNKNOWN은 [검증 기록](TESTING.md)에 구분했다.
- 인증된 일일 퀴즈 생성 실제 호출: HTTP **200**, 후보 **2개**, `review`. 후보는 공개되지 않으며 관리자 검토가 필요하다. 기존 OPENAI 설정 재사용. 실제 비용은 UNKNOWN.

Vercel cron `0 21 * * *`(한국 오전 6시, 요금제 시간 오차 가능)을 설정했다. 수동 인증 호출은 검증했으며 미래 예약 실행 자체는 아직 UNKNOWN. 생성 실패 시 기존 퀴즈를 유지하고 하루 중복 호출을 제한한다.

근거: [배포/에셋 결과](../qa/browser-v41/production/deployment.json), [운영 모바일](../qa/browser-v41/production/mobile.json), [운영 PC](../qa/browser-v41/production/pc.json). 모바일 화면은 Mac Chrome 에뮬레이션이며 실물 Windows/iOS/Android 검증이 아니다.

아래 과거 v39의 ‘운영 유효 초대 UNKNOWN’은 당시 기록이며 이번 v41에서 위 검사로 갱신했다. 장애 시 이전 정상 Vercel 배포 및 Sites 40으로 복귀할 수 있다. 추가형 DB 테이블을 삭제할 필요는 없다.

후속 기록 커밋은 QA와 문서만 포함한다. Sites 앱 실행 소스는 위 SHA를 유지하며 후속 Vercel 배포도 동일한 앱 코드다.

---

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
