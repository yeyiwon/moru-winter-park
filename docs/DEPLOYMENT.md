# v52 통합 배포 기록

사용자가 v48–52 수정본의 GitHub main·기존 Sites API·Vercel 공식 주소·Cloudflare 실시간 서버 운영 반영을 명시적으로 요청했다. 같은 소스와 검증된 결과물을 사용하며 기존 데이터와 환경 변수를 보존한다. 배포 전 최종 검사 중이며, 실제 배포 상태·커밋·데이터 비교는 아래 v52 결과에 기록한다. [릴리스 범위](release-v52.md). 이전 “보류” 표시는 당시 버전의 이력이다.

---

# v51 — 1분 스키장·곤돌라·성 공연 수정

정상 실제 활강 58.21초, 직선 곤돌라·고정 9대 운행·승차장 평탄화, 구역별 성 조명과 지상 빔·GPU 빛 알갱이를 반영했다. 음악과 운영 데이터는 유지한다. [원인·변경·실측·검증 범위](alpine-show-v51.md). 실제 Windows/휴대전화는 미검증이며 운영 배포는 보류다. 아래는 이전 버전 기록이다.

---

# v50 스키장 축소·빠른 이동 — 로컬 검증

최신 요청에 따라 스키장만 후속 수정했다. 메인 3.72km·낙차 1,404m, 실제 정상 활강 91.71초, 가까운 베이스 승강장과 빠른 리프트·곤돌라, 점프대 7곳, 이정표·파란 펜스 조명·나무 반짝임. [변경 내용·측정·검증 범위](alpine-compact-v50.md). 절벽 안쪽 승차장·중간 쉼터→정상 리프트·열린 정상 설면·지도 위치를 맞췄으며, 전체 검사 523개와 PC/터치 화면 보행·탑승을 검증했다. 실제 휴대전화·Windows 하드웨어는 미검증. main 통합·운영 배포 없음. 아래는 이전 버전 기록이다.

---

# v49 후속 수정 — 미배포 검증 브랜치

지도 투영·이름표, 연속 트리 편집 종료 시점, 채팅 닫기 제거, 고지대 달·오로라와 74초 성 공연을 수정했다. [원인·구현·실제 검사·남은 제한](castle-show-v49.md). v48 설산 작업과 같은 별도 브랜치에 보관하며 main 통합·운영 배포는 하지 않았다. 아래는 이전 작업 기록이다.

---

# v48 설산 리조트 — 별도 검증 브랜치

실제 5.6km 코스, 스키/스노보드, 6인 곤돌라, 좌우·중턱 리프트, 청크 지형과 공유 지도를 구현·검증 중이다. 최신 피드백에 따라 낙차 1,800m, 정상 활강 약 3분대, 선택 점프대 4곳으로 조정하고 중턱 재탑승·노선 분리를 개선했다. 기존 베이스와 다른 월드 구역을 유지한다. [설계·측정·검증 상태](alpine-resort-v48.md). 운영 배포와 main 통합은 하지 않았다. 아래 운영 기록은 이전 버전의 이력이다.

---

# v46 운영 반영 완료 — 2026-11-19

## v47 운영 확인

최신 운영 소스 `657581e`: GitHub main, Vercel `dpl_Ad3i46kBys9KUoxytxRJiVyR4YWp` READY, Sites 63 succeeded. 공식 주소의 release와 API revision 일치, 운영 브라우저 41/41 PASS. [후속 배포 기록](release-v47-followup.md).

v47 1차 운영 소스 `dfc0b77`: 저장·전송의 개별 버튼 테두리 제거, UI 간격·채팅 표시·트리 시점 복귀 및 `트리` 명칭 반영. 실제 운영 브라우저 36/36 PASS, 오류 0건. 후속 요청으로 닉네임 저장 완료 문구 제거, 모바일 지도 정렬 통일, 닫기 전까지 트리 꾸미기 시야 유지를 적용했다. [배포 및 검증 기록](release-v47-production.md).

실행 소스 `0fe286b8e25ddab2315c5b3a2df0d55b6f78d663`: GitHub main, Sites 61, Vercel production, 무료 Cloudflare 실시간 서버에 반영했다. 전체 489개 자동 검사·17개 원격 브라우저 검사·20개 실제 운영 검사 PASS. 사용자가 공식 `/admin` 로그인 후 관리 화면을 확인했다. 기존 소원·장식·소유자 데이터 보존. 실물 Windows/iOS/Android와 운영 장시간 성능은 UNKNOWN이다.

[최종 배포·검증 기록](release-v46-production.md). 이 문서는 운영 후 증거 브랜치에 보관하며, 아래는 이전 작업 이력이다.

---

# v46 배포 상태 — 2026-11-19

[현재 변경 및 확인 범위](official-ui-v46.md)

Cloudflare 무료 SQLite 실시간 서버의 10개 연결 사전 검증을 통과했다. 유료 Render 서버는 생성하지 않았다. 전체 487개·운영 브라우저 17개·추가 UI 15개·캐시 4개 검사 PASS. 운영 전환 결과는 별도로 기록하며 아래 본문은 과거 이력이다.

---

# 공개 운영 수정본의 배포 상태와 실행 절차 — 2026-11-19

**이번 작업은 로컬 보관 상태다.** 이후의 과거 배포 기록과 구분한다. 원격 GitHub/Sites/Vercel 변경은 없고 운영 DB migration도 없다. 현재 공식 주소 https://moru-winter-park.vercel.app/ 와 backend 도메인은 유지한다. 읽기 전용으로 확인한 실제 SHA/배포 ID는 [소스 감사](public-operations-v45.md#실제-운영-구조와-소스-불일치)에 있다.

## 승인 후 적용 순서

1. 현재 Sites 54/소스 `01f00c60d9cb180704fde97ed27dbb6a6fe22fcf`와 Vercel `dpl_141ESF8WAfkspfe1XKsQMGRRD67D`를 rollback 기준으로 보존한다. GitHub main이 뒤처져 있으므로 검증한 로컬 merge를 먼저 review한다. 기존 GitHub 쓰기 권한 문제의 해결 여부는 미확인이다.
2. D1 전체 export 또는 Time Travel bookmark를 확보하고, **별도 DB에서 restore 및 소원·장식·quiz_journal 행 검증**을 수행한다. 장식 backup만으로 전체 DB 복구가 가능하다고 가정하지 않는다. 운영 0000–0016은 재실행/수정하지 않고 새 0017만 적용한다.
3. `realtime/wrangler.jsonc`의 staging Worker/SQLite DO를 별도 계정 환경에 준비한다. 아직 생성하지 않았다. 실제 staging 도메인을 정확하게 `ALLOWED_ORIGINS`에 넣는다. `REALTIME_SECRET`은 32자 이상의 안전한 난수이며 Worker와 Sites 서버 secret 저장소에만 같은 값으로 설정한다. `REALTIME_URL`도 서버 설정이다. 브라우저 번들·README·커밋에 secret 값을 넣지 않는다.
4. 격리 staging에서 `npm ci`, `npm run check`, `npm test`, `npm run build`, `npm run build:vercel`, `npm run build:realtime`, `npm run test:budget`, `npm run test:load`와 브라우저 회귀를 통과시킨다. CI workflow는 PR/수동 실행용으로 작성했지만 원격 실행은 아직 NOT RUN이다.
5. 같은 commit의 서버·정적 파일·WebSocket Worker를 준비한다. `release.json`과 Worker revision으로 동일 소스를 확인한다. `dirty: true` 산출물을 운영에 사용하지 않는다. Sites/D1을 먼저 준비하고 Vercel 프런트 API proxy 경로와 `/admin` fallback을 확인한다. 그 후 `REALTIME_URL`·secret을 연결한다. Vercel은 인증 헤더를 위조 전달하지 않는다.
6. 실제 소유자가 공식 `/admin` → Sites 로그인 → 공식 `/admin`으로 돌아오는지 확인한다. 게스트의 403, state/code 재사용 차단, 소유자 로그아웃/재인증을 검사한다. 공개 입장·두 기기 이동·저장·불꽃 동시 신청·좌석 경쟁과 물리 Windows/iPhone/Android smoke test도 필요하다.
7. 초기에는 정원과 오류율을 관찰한다. 로컬 100명은 인터넷/D1/호스팅 수용량 보장이 아니다. 인증된 `/api/operations`의 오류·응답·연결 상태와 provider 지표를 함께 본다. 외부 장애 알림과 비용 경보는 별도로 연결해야 한다.

## 장애 시

- 코드 오류: 두 프런트/서버를 같은 이전 release로 rollback한다. DO 배포 교체 시 재연결·lease 갱신이 동작하는지 staging에서 먼저 확인한다.
- 실시간 서버가 구성됐으나 장애인 경우 새 입장은 503으로 제한된다. 이미 저장한 데이터는 통신 실패로 취소하지 않는다. 무작정 100명을 polling으로 전환하지 않는다. 운영 중 해제는 트래픽을 낮추고 12명 fallback 정책을 확인한 뒤 수행한다.
- 데이터: 0017은 추가형이므로 코드 rollback 시 테이블을 삭제하지 않는다. 손상이 확인되면 검증한 backup을 별도 DB에 복원하고 데이터 차이를 확인한 뒤 전환한다. 운영 전체 복원은 이번 작업에서 수행하지 않았다.
- 관리자 알림: 현재 관리자 UI 오류 기록은 구현됐으나 이메일/외부 push는 미연결이다. 이를 24시간 무인 운영 완료로 표시하지 않는다.

로컬 QA는 `node scripts/dev-realtime.mjs`로 새 임시 SQLite를 만들며 종료 후 지운다. 4189는 게스트, 4190은 개발 전용 소유자 fixture다. 이 fixture를 공개 호스트에 올리거나 운영 인증으로 사용하지 않는다.

---

# v44 · 배포 보류 유지

**로컬 수정본만 보관한다는 사용자 지시를 유지한다.** GitHub main push, Vercel 및 Sites 배포 모두 NOT RUN. 393개 검사와 두 production build·예산 검사 PASS. 전체 22,384,423 bytes / code gzip 984,954 bytes. 기존 라이브 미리보기 http://127.0.0.1:4183 에서 확인하며 서버 API 변경도 로컬 서버 재시작으로 반영한다. 운영 DB·환경 변수·저장소 업로드를 수행하지 않았고 DB migration도 없다. [변경·검증 범위](camera-interactions-v44.md).

---

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

# v44 운영 배포 완료 — 2026-11-19

## 2026-11-19 · v45 직접 시야·활동 탭·닉네임

앱 commit `4b4d12014f5edc0cbeee98035cfbda8673f49831`를 Sites 50(succeeded)과 Vercel production(`dpl_GxAUTntqV82aPkmL4wUDtzj5un1P`, READY)에 배포했다. Vercel 핵심 자산12/12 해시 및 health/access/anonymous quiz-journal 검사 통과. Sites는 실행기 직접HTTP403이었으나 실제 브라우저에서 새 UI 자산 참조와 초대 화면을 확인했다. DB 마이그레이션·데이터 변경 없음. GitHub 쓰기403은 이전부터 남아 있어 검증 소스를 직접 배포했다. [구체적인 변경·검증·제약](direct-input-ui-v45.md).

최신 투명 글래스 UI·중앙 퀴즈·카메라·좌석·료칸/천문대 개선과 WINTERLIGHT 브랜드를 기존 운영 주소에 반영했다.

- [운영 주소](https://moru-winter-park.vercel.app/).
- 실행 소스 `21c05e5c3061520f202e984e6c39e2c6fdde0751`.
- Sites **48**, `appgdep_6afe8762453081918cd3c30abcf611ec`, **succeeded**.
- Vercel `dpl_2GrxUwBN3UqhG369598KP4VsbmKo`, **READY / production**, 기존 alias 유지.
- 기존 D1에 0015/0016 반영. quiz_journal 신규 생성, 확인한 소원4행·장식25행 변화 없음. 실제 운영3인 좌석 경쟁은 새로 검증하지 않았다.
- 최종 Worker/Vercel 빌드·용량 PASS, 기존 전체448개 기능 검사 재사용. 운영16개 핵심 파일 해시 일치, health/access/quiz-journal 권한 검사 PASS.
- GitHub 쓰기는403으로 거절됐다. Sites 소스 저장과 Vercel 직접 소스 배포는 성공했으며 GitHub main 동기화는 미완료다.
- 실물 Windows/iOS/Android·GPU/FPS·장시간 다인 플레이 성능은 UNKNOWN.

[전체 배포·보존·검증 기록](release-v44-2026-11-19.md).

---

# 배포 전 v44 개발 미리보기 기록 — 2026-11-19

**아래는 운영 배포 전 개발 단계 당시의 기록이다. 당시에는 로컬 미리보기까지만 반영했다. 현재 운영 결과는 위 완료 기록을 따른다.** 아래의 v41/v39/v38 배포 ID, 실행 SHA와 운영 검증은 과거 이력이며 v44가 같은 운영 주소에 올라갔다는 근거가 아니다.

- 기존 체크아웃과 개발 미리보기를 유지했다. 새로운 운영 서버나 저장소를 만들지 않았고 실제 운영 데이터를 수정하지 않았다.
- 최종 빌드 후 현재 라이브 로컬 미리보기를 재시작했다. `sites-preview`는 **RUNNING**, 개발 서버 4173과 relay 3000을 유지한다. 기존 실제 게스트로 설정 → 지식집 → 퀴즈에 다시 들어가 저장 기록 유지와 최종 코드 제공을 확인했다. 1363×936에서 중앙 정렬된 밝은 퀴즈 UI를 확인했다. [재시작 후 화면](../qa/resort-v44/quiz-centered-final.jpg).
- 최종 전체 자동 검사 **448/448 PASS, 63.006초**. 좌석·퀴즈·불꽃·권한·마이그레이션 회귀는 격리 테스트 데이터베이스에서 확인했다. 이 검사를 운영 DB migration 실행으로 표시하지 않는다.
- 실제 브라우저에서도 격리 로컬 QA SQLite의 일반 게스트 세션으로 퀴즈 저장·개인지식집과 불꽃 신청을 확인했다. 운영 소유자 로그인이나 실제 운영 게스트를 사용한 재검증이 아니다.
- 390×844·320×640·844×390의 CSS 배치 검사는 실제 Chrome UI/iframe viewport에서 수행했다. 3D 입퇴장·실물 모바일·Windows 확인을 대신하지 않는다.
- GL_VENDOR/GL_RENDERER가 `Disabled`라 실제 3D 육안·GPU/FPS·실물 기기 검증은 **UNKNOWN**이다. CPU 형상 스틸도 런타임 완성 화면이 아니다.

근거: [실제 브라우저 검사](../qa/resort-v44/browser-checks.json), [전체 검증 범위](TESTING.md), [성능 한계](PERFORMANCE.md). 변경 상세: [카메라](stable-camera-v44.md), [실내·좌석](seating-and-indoor-view-v44.md), [료칸](ryokan-craft-v44.md), [천문대](museum-interior-v44.md).

## 공개하지 않은 로컬 배포물 검증

- `npm run build`: PASS, Worker static assets 228개.
- `npm run build:vercel`: PASS, Vercel용 web assets 생성.
- `npm run test:budget`: PASS, 파일 229개. 전체 22,543,964 / 25,165,824 bytes, code gzip 1,014,070 / 1,280,000 bytes, 오디오 16,329,873 bytes.
- `git diff --check`: PASS. 빌드 후 신규 CSS/JS와 SW 자산 등록을 재확인했다.

위 결과는 로컬 배포물 생성·용량 검사다. 공개 업로드나 프로덕션 배포 성공을 의미하지 않으며 CPU/GPU·물리 기기 성능 수치도 아니다. 현재는 라이브 로컬 개발 미리보기만 유지한다.

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
