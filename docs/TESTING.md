## v58 운영 갱신 최종 확인

`0e0364f` CI 전체 **586/586**, 소스 검사·3종 빌드·예산·10/25/50/100 연결 부하·Linux 브라우저 **20개** 통과. 최종 운영 `43fbaab`는 같은 실행 코드에 배포 문서와 측정만 추가한 상태다. 구 Worker 업그레이드 실제 브라우저 **8/8**, 캐시·전달 검사 **13/13** 통과. 공식 사이트 다크/라이트 전환·갱신 후 세션과 설정 유지·인라인 관리 요소 **5/5**, 예외 0. [최종 배포](DEPLOYMENT.md).

일부 headless 운영 초기화에서 120초 대기 초과가 관찰됐고 원인은 확정하지 못했다. 마지막 공식 화면 검사는 정상 완료됐다. 천문대 2인 검사는 병렬 GPU 작업 중 모바일 전환 timeout 뒤 단독 재검증 20/20을 통과했다. 이 결과로 모든 기기에서 멈춤이 없다고 단정하지 않는다. 초기 잘못된 관리 선택자 실패는 검사 코드 오류였으며 이전 결과와 Git 이력을 보존한다.

## 기존 방문자 캐시 검증 추가

신규 프로필만 사용한 운영 검사는 이전 Service Worker에 묶인 방문자 문제를 발견하지 못했다. `scripts/verify-release-upgrade-v58.mjs`는 실제 이전 Worker를 설치·활성화하고 탭을 유지한 채 새 릴리스를 설치한다. 여러 공원 탭의 일관된 버전 전환, 일반 새로고침 후 다크 모드·인라인 관리 표시, 복구 진입, 닉네임·세션 보존을 확인한다. 캐시 설치 실패 시 새 버전 활성화를 막는 회귀 검사도 유지한다. [실행 결과](../qa/final-v58/release-upgrade.json).

# v58 공개 메타버스 최종 검증

- Mac Chrome, PC 1280×800 및 모바일 390×844 / 844×390 터치 에뮬레이션. 실물 Windows·Galaxy·iPhone·Safari는 UNKNOWN.
- 실제 로컬 WebSocket: 자동 공개 입장, 서로 다른 브라우저의 이동·채팅, 관람차/리프트 예약·탑승, 모바일 조이스틱, 네트워크 단절 후 재접속, 관리자 인증 지표. **20개 확인 통과**, 브라우저·console·HTTP 오류 0(의도한 오프라인 오류 제외). [원본](../qa/final-v58/operations/browser.json).
- 관리 상자 안의 상단/하단 스크롤, PC·세로·가로 화면, 임의 초기 닉네임/외형, 저장 후 재접속, 선택 기기 초기화, 트리 개별/전체 삭제, 초대 UI 제거. **15개 확인 통과**. [원본](../qa/final-v58/public-entry/verification.json).
- 설정의 기존 `#pane-social` 수직 중앙 정렬이 긴 관리 콘텐츠를 위로 밀어내던 원인이었다. 일반 block 흐름과 내부 스크롤로 수정했다.
- 최종 화이트 패널 불투명도 64–66%, HUD 76%, 다크 89–91%. 최종 대표 본문/보조색과 검정/흰 배경 합성 대비 최저 **4.704:1**. 실제 화면의 모든 픽셀에 대한 WCAG 인증은 아니다. 조명 5색과 129개 대상, 낮/밤, PC/DPR3 터치 화면, 다크 UI와 월드 색상 독립 확인. [원본](../qa/interface-v58/report.json).
- 채팅은 본인 민트, 타인 보라로 표시하고 `(나)` 등 부가 표기는 넣지 않는다. 미리보기는 투명 배경·12px, 빈 Enter는 닫기로 검증한다. 한글 조합 중 Enter, 조합이 먼저 끝난 Enter(229 포함), 반복 키와 초안 취소를 회귀 검사한다.
- 개인 BGM 및 3인 동시 공연 **15개 확인 통과**: 세 곡 독립 재생, 한 건 승인, 음소거 유지, 개인 playhead 정지/복원, 네트워크 재접속, 5분 제한, 관리자 즉시 시작/중복 방지. 실제 브라우저 결과는 [개인 음악 검사](../qa/final-v58/personal-audio/report.json)에 보관한다. 정상 공연을 시간 단축 없이 끝까지 재생해 복원을 검사한다.

로컬 전체 `npm test` **582/582 PASS**, 실패·건너뜀 0, 195.973초. 이후 채팅·shader 해제 등 집중 검사 **26/26 PASS**. 운영 SHA `6bc3c26`의 GitHub Actions는 shader 회귀 검사까지 포함한 **584/584 PASS**, 3종 빌드·자산 예산·10/25/50/100 연결 부하·Linux 실제 브라우저 20개 검사까지 success다. [CI 기록](../qa/final-v58/ci-final.json). 소스 검사와 Worker·Vercel·realtime 빌드·용량 검사도 통과했다. TypeScript/Lint 별도 명령은 없는 JavaScript 프로젝트다. 이 버전에서 퀴즈 콘텐츠를 새로 업데이트하지 않았다.

---

# v57 통합 검사

전체 559/559 PASS, 실패·건너뜀 0. 이후 실시간·음식·좌석 19개와 느린 연결 큐 1개 PASS. PC·세로/가로 터치 화면에서 료칸, 좌석, 서빙, 반복 출입, 수면 셰이더를 확인했다. [원본·한계](ryokan-world-v57.md). 별도 TypeScript/Lint 명령은 없는 JavaScript 프로젝트다.

# v55 천문대·공연 검사

실제 GPU 천문대 8방향 회전·안내 문구·출구 E 조작·중앙 퀴즈·개인 지식집·2인 채팅·터치 카메라·반복 방문 검사와 실제 두 공연 음원의 신호·전환 검사를 수행했다. [상세 결과와 원본](observatory-show-v55.md). 실물 Windows/iOS/Android는 UNKNOWN. 최종 `npm test` **550/550 PASS**, 실패·건너뜀 0, 150.07초. 실제 천문대 20개 및 두 음원 8개 검사 PASS. PC·모바일 화면 공연 4구간, 6회 반복 해제 검사 PASS. 별도 TypeScript/Lint 명령은 없는 JavaScript 프로젝트이며 318개 JS 모듈 소스 검사, Worker·Vercel·realtime 빌드와 용량 검사도 모두 통과했다.

# v54 천문대 검사

`npm test` **548/548 PASS**, 실패·건너뜀 0, 165.96초. 마지막 별빛 재질 조정은 실제 GPU 체험 검사로 다시 검증했다. [원본 체험 결과](../qa/observatory-v54/experience/report.json), [설계·카메라·퀴즈·동기화 범위](observatory-v54.md). Mac Chrome PC와 모바일 터치 화면에서 수행했으며 실물 Windows/Edge·iPhone·Galaxy·수 시간 내구 시험은 UNKNOWN이다. JavaScript 프로젝트로 별도 TypeScript/Lint 명령은 없다. 소스 312개 모듈 검사, 최종 재질의 천문대 집중 검사 10개, 10~100명 부하 검사도 통과했다. 3종 빌드·용량 및 운영 결과는 [배포 기록](DEPLOYMENT.md)에 기록한다.

---

# v53 최종 검사

Mac Chrome PC/터치 화면의 실제 3D·음악·채팅·곤돌라 검증과 스키 입력 재검사를 수행했다. [검증과 실패 후 수정 이력](release-v53.md#검증-범위). 실물 Windows/Galaxy/iPhone 및 실제 가상 키보드 검증은 UNKNOWN. 최종 `npm test` **543/543 PASS**, 실패·건너뜀 0, 39.48초. `npm run check` 305개 JS 모듈, Worker·Vercel·realtime 빌드와 용량 검사를 통과했다. 10/25/50/100명 localhost WebSocket 부하도 각각 15초, 전송 성공률 100%, 거부·오류 0으로 통과했다. [최종 검사 기록](../qa/gameplay-v53/verification.json). 공식 운영 UI 60/60, 실제 3인 공유 공연·중도 입장·전체 종료 및 운영 동승/조작 15/15도 통과했다. [운영 증거](DEPLOYMENT.md). JavaScript 프로젝트로 별도 TypeScript/Lint 명령은 없다. [같은 운영 커밋의 GitHub Actions](https://github.com/yeyiwon/moru-winter-park/actions/runs/44670009060)도 전체 단계 success이며 Linux 브라우저 검사까지 포함한다.

---

# v52 최종 통합 검사

완곡 실제 재생, PC/모바일 화면 공연, 6회 재진입 리소스, 공유 공연·중도 입장·게스트 권한, 실제 58초 활강과 스키/보드 점프, 지도/역 접근, 투명도 fallback·강제 다크 색상표·제목·닫기 정렬을 검사했다. 실제 Windows/Edge·Galaxy·iPhone Safari는 UNKNOWN. [상세 증거](release-v52.md#검증과-성능). 최종 `npm run check` 296개 모듈, `npm test` 532개 전부 통과. 오디오 활성화 차단/복구·공연 중 일반 BGM 음소거도 포함한다. 10/25/50/100명 localhost WebSocket 부하 모두 성공률 100%. TypeScript와 Lint 별도 명령은 이 JavaScript 프로젝트에 없다. Worker·Vercel·realtime 빌드와 용량 검사를 모두 통과했다. 운영 57개 확인과 실제 공연 동기화 결과는 [DEPLOYMENT](DEPLOYMENT.md)에 기록했다.

운영 SHA `b360198`의 [GitHub Actions 전체 검사](https://github.com/yeyiwon/moru-winter-park/actions/runs/44631325693)도 성공했다. 로컬 532개 검사와 별도로 Linux의 공개 접속·실시간 이동·터치·좌석·채팅·관리자·재접속 브라우저 검사까지 통과했다. 기존 pinned Actions의 Node 20 런타임 강제 Node 24 전환 경고가 있으나 실패는 없었다.

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

최종 로컬 브라우저: 정상 활강 182.61초와 하단 걷기 복귀, 스키/보드 점프·착지, 두 게스트 곤돌라 동승·채팅·정상 하차, 모바일 화면에서 세 리프트·멀티터치·제동·점프 통과. 실물 휴대폰/Windows 검사는 UNKNOWN. 자동 검사와 화면 증거는 [v48 기록](alpine-resort-v48.md)에 구분했다.

---

# v47 UI·채팅·카메라 개선 — 2026-11-19

## v47 운영 확인

최신 운영 소스 `657581e`: 전체 자동 검사 494/494, 운영 브라우저 41/41 PASS. 연속 꾸미기 15/15 및 초기 전환 중 등록 7/7은 격리 로컬 브라우저에서 검증했다. [후속 배포 기록](release-v47-followup.md).

v47 1차 운영 소스 `dfc0b77`: 저장·전송의 개별 버튼 테두리 제거, UI 간격·채팅 표시·트리 시점 복귀 및 `트리` 명칭 반영. 실제 운영 브라우저 36/36 PASS, 오류 0건. 후속 요청으로 닉네임 저장 완료 문구 제거, 모바일 지도 정렬 통일, 닫기 전까지 트리 꾸미기 시야 유지를 적용했다. [배포 및 검증 기록](release-v47-production.md).

관리·초대·닉네임 정렬, 입력 중에만 보이는 채팅 기록과 머리 위 말풍선, 상단 트리 알림, 공통 상호작용 버튼, 3D 장식 미리보기와 색상 응답, 직접 닫을 때 복귀하는 연속 트리 꾸미기 시야 및 넓어진 회전목마 시야. [변경 이유·브라우저 증거·검증 한계](ui-camera-comfort-v47.md). 후속 배포 결과는 운영 확인 후 별도 기록한다.

아래는 이전 작업 이력이다.

---

# v46 운영 반영 완료 — 2026-11-19

실행 소스 `0fe286b8e25ddab2315c5b3a2df0d55b6f78d663`: GitHub main, Sites 61, Vercel production, 무료 Cloudflare 실시간 서버에 반영했다. 전체 489개 자동 검사·17개 원격 브라우저 검사·20개 실제 운영 검사 PASS. 사용자가 공식 `/admin` 로그인 후 관리 화면을 확인했다. 기존 소원·장식·소유자 데이터 보존. 실물 Windows/iOS/Android와 운영 장시간 성능은 UNKNOWN이다.

[최종 배포·검증 기록](release-v46-production.md). 이 문서는 운영 후 증거 브랜치에 보관하며, 아래는 이전 작업 이력이다.

---

# v46 검증 상태 — 2026-11-19

[현재 변경 및 확인 범위](official-ui-v46.md)

Cloudflare 무료 SQLite 실시간 서버의 10개 연결 사전 검증을 통과했다. 유료 Render 서버는 생성하지 않았다. 전체 487개·운영 브라우저 17개·추가 UI 15개·캐시 4개 검사 PASS. 운영 전환 결과는 별도로 기록하며 아래 본문은 과거 이력이다.

---

# 공개 운영 수정본 검증 — 2026-11-19

이번 수정본의 결과를 먼저 기록한다. 아래의 v43/v44/v45 과거 배포 기록은 당시 근거이며 현재 배포 상태를 뜻하지 않는다.

## 자동 검사

최종 전체 **479/479 PASS**, 실패·취소·건너뜀 0, 122.646초. 실제 Mac Chrome 브라우저 **17/17 PASS**, page/예상 외 console/shader 오류 0. Worker·Vercel·WebSocket 빌드와 자산 예산 모두 PASS.

- JavaScript 구문 검사: `npm run check`. 프로젝트에 TypeScript/ESLint 설정이 없어 이를 별도 typecheck/lint 통과로 표시하지 않는다.
- 기존 전체 회귀 + 소유자 인증·공동 공연·실제 workerd WebSocket·migration 데이터 보존 검사: 최종 결과는 [검증 manifest](../qa/operations-v45/verification.json).
- Worker/Vercel/WebSocket build와 정적 자산 budget 실행. 정확한 크기·횟수는 manifest를 따른다.
- 가입 없는 공용 입장/최대 수용량/세션 위조·재사용·CSRF/관리자 403/닉네임·외형 저장 rate limit/허용 Origin/악성 payload·빈도 제한을 검사한다.
- 원격 이동 sequence·정지·근접32명·Hibernation 복원·강퇴 후 ticket 거부, 존재하지 않는 관람차 탑승 pose 거부를 확인한다.
- 25명의 동시 공연 요청을 같은 ID로 합치고, 10초 예고·종료 후 900초·관리자 cooldown 우회·활성 공연 중복 금지를 실제 SQL로 검사한다.
- Published migrations 0000–0016으로 만든 DB에 방문자·장식·소원·지식집을 저장한 뒤 0017 적용 전후 행이 동일하다. 운영 DB에는 쓰지 않았다.
- 새 실시간 서버 장애를 주입했을 때 신규 입장 503과 관리자 degraded 상태가 나온다. 구성하지 않았을 때는 기존 polling이다.

초기 전체 회귀 재실행에서 runtime fixture가 두 번만 가짜 RAF를 제공해 작업 분할 도중 기다렸다. 실제 브라우저는 정상 완료했다. fixture를 프레임 pump로 바꿨다. 이후 전체/단독 실행의 20초 watchdog 실패도 기록했으며, CPU 기반 vm/jsdom에서 실제 geometry를 구성하는 검사는 60초 완료 제한·16ms 프레임 pump·최대 4개 동시 실행으로 다시 검사했다. 이 watchdog은 성능 목표가 아니며 실제 초기화 시간은 브라우저에서 따로 측정한다. 장기 부하 도구도 큰 latency 배열을 `Math.max(...array)`로 펼쳐 집계가 실패한 첫 실행을 폐기하고 reduce 집계로 수정해 재실행했다. 두 실패를 서비스 성공 결과에 섞지 않는다.

최종 브라우저 검사에서 입장 전 `/api/quiz` 401을 재현했다. 정적 문항은 먼저 읽되 서버 검토 문항은 입장 완료 이벤트 뒤에 읽도록 고쳤다. 이전 요청의 늦은 응답이 최신 문항을 덮어쓰지 않는 회귀 검사도 추가했다.

## 실제 브라우저

[scripts/verify-operations-browser.mjs](../scripts/verify-operations-browser.mjs), Mac Chrome 157. 매 실행 전 `dev-realtime.mjs`를 새 임시 DB로 시작한다. 이전 공연의 15분 대기 상태가 있는 DB를 재사용하면 신청 버튼이 비활성인 것이 정상이며 테스트 성공으로 간주하지 않는다. 게스트와 관리자용 **격리 로컬 DB** 사용. [브라우저 원시 결과](../qa/operations-v45/browser.json).

- 서로 다른 두 브라우저 context의 공개 입장·원격 캐릭터·채팅·공통 공연 ID/seed/시각.
- PC 키보드 이동, 모바일 CDP touch의 원 밖 조이스틱 입력·손 떼기 정지.
- 실제 화면의 관람차/리프트 탑승 버튼 → 서버 예약 → 이동 유지 → 종료.
- 390×844 세로·844×390 가로 설정/지도/커마 패널 경계.
- 13초 offline 후 online 자동 복구.
- 게스트 관리 API 403, 개발용 소유자 fixture의 `/admin` 자동 열기·연결 지표·같은 공연 중단.
- page exception 및 예상하지 않은 console/shader error 검사. 의도적으로 offline으로 만든 페이지에서 해당 시간에 발생한 `ERR_INTERNET_DISCONNECTED`만 별도 기록한다. 그 외 console error는 모두 실패로 처리한다.

스크린샷: [PC 활동](../qa/operations-v45/desktop-activities.png), [모바일 커마](../qa/operations-v45/mobile-customization.png), [모바일 지도](../qa/operations-v45/mobile-map.png), [가로 화면](../qa/operations-v45/mobile-landscape.png), [관리](../qa/operations-v45/admin.png).

이 검사는 실제 스마트폰·Windows/Edge/Safari, 운영 소유자 provider 로그인 또는 운영 100인 플레이 검사가 아니다. 물리 기기·배터리·앱 잠금·네트워크 NAT·멀티터치 카메라의 실물 조작감은 UNKNOWN이다.

## 부하·렌더링

[PERFORMANCE](PERFORMANCE.md)에 조건·FPS·p95·최저 단일 프레임·초기화·CPU/메모리 한계를 기록했다. 실제 workerd에 10/25/50/100개 WebSocket으로 이동·점프·채팅·퀴즈 조회·소원 장식·좌석 경쟁·공연 신청·재접속을 수행한다. 브라우저 100개 또는 사람 100명의 시험이 아니다.

100명 지속 검사에서도 lease 기간을 넘겨 갱신·재접속한다. 30분 이상 플레이·호스팅 Worker CPU/RAM·전체 DB 복원·실물 기기 성능은 UNKNOWN이다.

## 운영 적용 전 미완료

별도 staging/production WS Worker 준비, 실제 전체 D1 backup/restore, 같은 SHA의 GitHub·Sites·Vercel 배포, 공식 `/admin`의 실제 소유자 인증 왕복, 배포 중 연결 복구, 물리 기기 smoke test, 외부 장애/비용 알림. **배포 보류를 유지하며 이 항목들을 완료 처리하지 않았다.** CI 파일은 작성했으나 GitHub hosted workflow 실행은 NOT RUN이다.

---

# v44 카메라·좌석·트리·공연·퀴즈

전체 **393/393 PASS**(149.95초), build·build:vercel·test:budget PASS. Mac Chrome 상대 마우스/터치, 멀티터치+점프, 양쪽 리프트 시선 유지, 트리 click/tap·닫기 복원, 두 게스트 오마카세 서로 다른 좌석/공유/일어나기, 동기화 공연·선택 감상·수동 해제, 퀴즈 결과 확인. 브라우저 pageerror 0. 실물 Windows/휴대폰·장시간·운영 배포 후 결과 UNKNOWN / NOT RUN. 별도 lint/typecheck N/A. [재현과 화면](camera-interactions-v44.md#검증).

---

# v43 공개 월드 · 입력 · 모바일 UX

사용자 요청으로 **배포 보류**, 최종 분리 수정본 385/385 PASS(37.88초), 운영 배포 후 검증 NOT RUN.

전체 **385/385 PASS**, 두 production build·용량 검사 PASS. 별도 TypeScript/lint 명령 없음. Mac Chrome에서 실제 Pointer Lock·WASD·방향키·한글 물리 키·텍스트 입력 차단·커마 저장 복귀를 검증했다. 390/320/844px 반응형과 독립 게스트 2개 흐름 20개 PASS, 관리자 API 거절 403, page/WebGL 오류 0. 물리 Windows/Edge/iPhone/Android 결과는 UNKNOWN이다. 음악은 무음 sink 디코딩·재생 시간·전환·재접속을 확인했으며 실제 스피커 청취 UNKNOWN.

공개 QA는 더 이상 초대 토큰이 필요하지 않다. `QA_URL`/`QA_OWNER_URL`을 같은 격리 DB 서버로 지정하여 `QA_FLOW=1 QA_MOBILE=1 node scripts/verify-multiplayer.mjs`로 재현한다. 기존 v41/v42의 초대 기반 검증은 당시 정책 기록이며 현재 정책은 아니다. [전후 화면·원시 결과](public-world-v43.md).

## 2026-11-19 · v44 운영 반영 확인

## 2026-11-19 · v45 직접 시야·UI 검증

전체 457/457 PASS(49.286초), Worker·Vercel 빌드와 정적 용량 예산 통과. 실제 브라우저 320/390px에서 닉네임 편집 전후 미리보기 y=193px·프로필 높이68px 동일, 가로 넘침 없음. 활동 탭·중복 음악 음소거/시야 버튼/왼쪽 조작법 제거 확인. GPU 렌더링 및 실물 기기 조작감은 UNKNOWN. [상세 및 로그](direct-input-ui-v45.md).

Sites48 succeeded, Vercel READY 및 기존 alias 확인. adapter의 실제 Vercel 빌드에서239개 정확한 소스+설정 검증과 baseline170개 복원 성공. 운영 핵심16파일 해시 일치, health200/access200/비승인 quiz-journal401 확인. 실제 브라우저의 초대 화면에서 새로운 투명 글래스 CSS를 확인했다. 기존448개 기능 검사와 모바일 배치 검사를 재사용했다. 새 운영 게스트 쓰기·3D/GPU·실물 기기·장시간 다인 동시 접속을 수행한 것으로 표시하지 않는다. [검증 결과](../qa/release-v44/production-verification.json), [전체 기록](release-v44-2026-11-19.md).

# v44 개발 미리보기 검증 — 2026-11-19

후속 CSS 조정: 흰색 알파를 낮춘 투명 글래스·밝은 전경으로 변경한 뒤 데스크톱 설정·드롭다운·퀴즈와390×844 실제 앱 iframe의 중앙 정렬·투과를 확인했다. 아래448개 검사는 그 전 기능 구현의 결과이며 이번 CSS 조정 때문에 전체 기능 검사를 다시 실행하지는 않았다. [후속 UI 근거](../qa/resort-v44/clear-glass-checks.json), [실제 화면·한계](clear-glass-v44.md).

이번 기록은 현재 활성 로컬 개발 미리보기와 격리된 QA 데이터베이스의 결과다. 공개 업로드·커밋·프로덕션 배포는 수행하지 않았다. 아래의 v42/v41 운영 검증은 해당 버전의 과거 기록으로 보존하며 v44의 실행 결과로 사용하지 않는다.

## 자동 검사

최종 전체 `npm test`는 **448/448 PASS**, 실패·취소·건너뜀 0개, **63.006초**였다. 카메라 요청값 보존, 실내 입장과 실제 좌석 선택, 좌석 동시 경쟁, 게스트 불꽃 신청, 개인 퀴즈 기록, 식사 좌석 만료 복구, 료칸·천문대 geometry/동선과 자원 해제 회귀를 포함한다. `park.js`와 관련 모듈의 구문 검사 및 `git diff --check`도 통과했다.

카메라·좌석의 앱 통합 테스트는 실제 DOM과 Three scene을 사용하되 GPU renderer는 stub으로 대체한다. 실제 의자를 화면 좌표로 투영한 pointer 입력 → 정확한 좌석 번호 요청 → 해당 좌표 착석까지 검사하지만 실제 화면 렌더나 체감 조작을 검증한 것은 아니다.

## 실제 브라우저에서 확인한 범위

실제 Chrome UI와 격리 SQLite에 연결된 일반 게스트 세션을 사용했다. 같은 origin의 iframe으로 **390×844, 320×640, 844×390** CSS viewport를 검사했다. 이 크기 검사를 실물 휴대폰 테스트로 표시하지 않는다.

- 커스터마이징 미리보기·선택지·저장 영역의 분리, 작은 화면의 음악 버튼과 채팅 입력, 밝은 유리 패널·텍스트·지도 아이콘/툴팁 표시를 확인했다.
- 실제 게스트가 퀴즈에 답하고 서버의 저장 완료 응답을 받은 뒤 개인 지식집의 문항·해설·출처를 확인했다.
- 실제 게스트가 불꽃을 신청하여 버튼의 `10초 후 시작` → `불꽃놀이 진행 중` 상태 전환을 확인했다. 3D 불꽃 자체를 이 브라우저에서 렌더한 것은 아니다.
- 실제 `quick-quiz.js`와 전체 CSS를 사용하는 `body.inside-room` UI fixture에서 세 화면 크기의 중앙 정렬을 확인했다. 가로 화면은 내부 스크롤을 유지했다. 이 fixture는 3D 실내 입장을 재현하지 않는다.
- WebGL 오류 이후 로딩 레이어가 아래 UI의 포인터를 가로채지 않고 설정을 열 수 있음을 확인했다.
- 최종 빌드 후 라이브 미리보기 서버를 재시작하고 기존 실제 게스트로 설정 → 내 지식집 → 퀴즈 재진입을 확인했다. 저장한 기록이 유지됐다. 1363×936에서 퀴즈 dialog는 `[401.5, 197.171875, 560, 541.640625]`, 화면 중심 오차는 `[0, -0.0078125]`px였으며 밝은 팔레트를 유지했다. [재시작 후 최종 화면](../qa/resort-v44/quiz-centered-final.jpg).

원시 근거: [브라우저 검사 JSON](../qa/resort-v44/browser-checks.json). 관련 캡처: [모바일 유리 UI](../qa/resort-v44/mobile-glass-after.jpg), [지식집](../qa/resort-v44/journal-glass-after.jpg), [퀴즈 중앙 정렬](../qa/resort-v44/quiz-centered-mobile.jpg).

## 3D 검증 한계

이 실행 환경은 **GL_VENDOR = Disabled, GL_RENDERER = Disabled**이며 WebGLRenderer 생성이 실패했다. 따라서 실제 카메라 구도의 편안함, 수족관 shader의 GPU 컴파일·물빛, 셰프의 렌더된 전달 동작, 실물 Windows/iOS/Android의 입력·오디오·FPS·발열은 **UNKNOWN**이다. 이 실패를 앱 전체 3D 성공이나 특정 OS의 오류 해결로 보고하지 않는다.

CPU로 만든 료칸·천문대 형상 스틸은 mesh 구성과 겹침을 검토하는 참고 자료다. 실제 WebGL shader·후처리·조명 예산·게임 카메라를 재현한 런타임 완성 화면이 아니다.

## 로컬 빌드와 용량 검사

- `npm run build`: PASS, Worker static assets 228개 생성.
- `npm run build:vercel`: PASS, Vercel용 web assets 생성.
- `npm run test:budget`: PASS, 검사 파일 229개, 전체 22,543,964 bytes / 한도 25,165,824 bytes, code gzip 1,014,070 bytes / 한도 1,280,000 bytes, 오디오 16,329,873 bytes.
- `git diff --check`: PASS. 빌드 후 신규 CSS/JS와 SW 자산 등록이 보존됨을 확인했다.

이 값은 빌드·배포물 용량 검사이며 실제 CPU/GPU/FPS·네트워크·물리 기기 성능이나 프로덕션 배포 성공을 뜻하지 않는다.

구현과 개별 근거: [고정 시야 정책](stable-camera-v44.md), [실내 시야·직접 좌석 선택](seating-and-indoor-view-v44.md), [료칸 마감](ryokan-craft-v44.md), [천문대 실내](museum-interior-v44.md).

---

# v42 모션·지도·불꽃 회귀

전체 **382/382** 검사, Sites/Vercel production build, 용량 검사 PASS. Mac Chrome OS 모션 감소 에뮬레이션에서 보행·눈 낙하 및 명시적 전체 모션 복귀를 확인했다. PC/작은 모바일/일반 모바일/가로 화면 지도 버튼과 설정·관리 메뉴 검사 15개 PASS, page/WebGL 오류 0. 실제 운영 PC/모바일 게스트 14개 검사도 PASS이며 모션 감소 중 보행·눈 낙하와 설정 복귀를 확인했다. [운영 결과](../qa/browser-v42/production/report.json). 실제 Windows·실물 휴대폰 UNKNOWN. [상세·전후 자료](platform-motion-v42.md).

---

# v41 검증 — 2026-11-19

최종 전체 자동 검사 **380/380 PASS**(36.04초). 불꽃 광원 한도와 신고·운영 폼 회귀도 포함한다. 별도 lint/typecheck 명령은 없는 JavaScript 프로젝트이며 Node/bundling으로 구문을 검사한다. `npm run build`, `npm run build:vercel`, `npm run test:budget` PASS.

로컬 Chrome 독립 guest context 2개:

- 유효 초대 자동 진입·동일 winter-plaza·저장/기본 외형, 게스트 초대/로그인 UI 없음.
- 게스트 invite/admin/operations API 직접 접근 각각 403.
- 실제 WASD 이동/정지 snapshot, 채팅 공유, 커마 취소/저장.
- 모바일 지도 첫 터치 선택과 이동 확인, 패널 종료.
- 관람차·회전목마·초급/정상 리프트 탑승 후 취소·일반 이동 복귀.
- 별빛 만물관/료칸 입장과 퇴장, 실내 전용 상태 복귀.
- 조이스틱 경계 밖 입력+다른 손가락 카메라, 터치 종료 정지.
- 일시 오프라인 후 재접속. page 오류 0.

[모바일 원시 결과](../qa/browser-v41/mobile.json), [PC 비교](../qa/browser-v41/pc-after.json), [인원별 렌더·정지·퇴장](../qa/browser-v41/crowd.json).

로컬 재현: 격리된 같은 LOCAL_DB_PATH로 guest 4187 및 LOCAL_OWNER_EMAIL fixture 4188 서버 실행. `QA_FLOW=1 QA_MOBILE=1 node scripts/verify-multiplayer.mjs`, `node scripts/profile-multiplayer.mjs`. Playwright는 외부 QA 도구이며 production dependency가 아니다. PLAYWRIGHT_PATH/CHROME_PATH 및 QA_URL/QA_OWNER_URL/QA_OUT으로 환경을 지정한다. 운영 두 세션 검사는 QA_URL을 운영 주소로 지정하고 권한이 있는 테스트 초대를 숨김 stdin으로 전달한다. 토큰/쿠키/원시 요청 헤더는 기록하지 않는다.

서버 자동 검사는 관리자 권한/소유자 spoof 차단, 백업+수량+revision 전체 삭제와 소원 보존, 후보 생성 일일 제한·동시성·유효성·비자동공개·예약 경로 차단을 포함한다. 운영 데이터 전체 삭제는 수행하지 않는다.

추가 화면 검사: 실제 음악 11곡 목록, 현재 곡과 다음 곡 각각 currentTime 진행·활성 오디오 1개·오디오 오류 없음. 로딩 트리 폭 360px, 실제 흐린 배경, 844×390 가로 커마 페이지 가로 넘침 없음, low 직접 출력에서 world-ready 유지. 불꽃 GPU 버퍼 74,880 입자 draw 활성 및 셰이더 콘솔 오류 0. [화면/오디오 결과](../qa/browser-v41/visual-report.json).

UNKNOWN: 실물 Windows·iPhone Safari·Android Chrome, Safari 실브라우저 오디오 중단, 실제 장시간 발열/배터리. 자동 검사·Mac의 모바일 에뮬레이션을 이 기기들의 검증으로 대체하지 않는다. 운영 재검증은 DEPLOYMENT 기록과 구분한다.

## 운영 게스트 검증

기존 Vercel 주소에서 사용자 제공 테스트 초대를 숨김 stdin으로 전달해 독립 브라우저 두 개를 실행했다. 390×844 터치 화면에서 자동 입장, 지도 선택/확인, 커마 저장/취소, 공유 채팅, 관람차·회전목마·양쪽 리프트 탑승/종료, 천문대·료칸 입퇴장, 조이스틱 경계 밖+카메라 동시 입력, 터치 종료 정지, 오프라인 복귀 PASS. 게스트 운영 API 3종은 403, page/WebGL 오류 0.

원격 발 위치 75표본에서 보행 변화가 관측되고 마지막 정지 좌표는 동일했다. 단순 서버 좌표만 검사한 결과와 구분한다. [원시 결과](../qa/browser-v41/production/mobile.json).

PC 1280×800 운영 화면에서도 19개 시나리오(진입 2개 포함)를 통과했고 page/WebGL 오류는 0이다. 모바일은 22개. 상대 캐릭터 발 움직임과 정지 좌표도 실제 render 객체로 관찰했다. [PC 원시 결과](../qa/browser-v41/production/pc.json).

일일 AI 후보 생성은 실제 운영 호출에서 200/검토 대기 2개. 생성된 문항의 사실성 검증과 관리자 최종 공개는 이 테스트에 포함하지 않는다.

### 운영 음악 검증과 출력 장치 한계

처음 운영 검사에서 `paused:false`·readyState 4지만 재생 시간이 0에 머물렀다. 게임을 제외한 기본 audio 페이지에서도 localhost/운영 모두 4.5초 후 0.023초, AudioContext clock 0.005초에 정지했다. 이 실행 환경의 기본 출력 장치가 멈춰 있어 앱 재생 성공으로 표시하지 않았다.

브라우저 QA에서만 무음 sink를 지정한 뒤 같은 운영 코드/파일을 재검사했다. Ethereal **5.07→7.57초**, 다음 Cinematic **4.97→7.47초**, 일시 오프라인 복귀 후 **16.49→18.98초** 진행. 크로스페이드 종료 후 재생 중인 오디오 1개, 오류 0, 파일 Range 206. 서버/배포 코드는 변경하지 않았다. 디코딩·시간 진행·곡 전환·복구 PASS이며 실제 스피커 청취와 물리 모바일 출력은 UNKNOWN이다.

[최초 관측](../qa/browser-v41/production/audio-initial.json), [최소 분리 검사](../qa/browser-v41/production/audio-isolation.json), [무음 sink 운영 재검사](../qa/browser-v41/production/audio-silent-sink.json). 재현: `QA_SILENT_AUDIO=1 node scripts/verify-audio-playback.mjs`에 테스트 초대를 숨김 입력한다. 기본값은 실제 출력 장치이며 QA_SILENT_AUDIO는 앱 설정이 아니다.

---

# v39 단일 월드 검증

- 최종 `npm test`: **368/368 PASS**, 38.73초 (정원 보완 후 최종 재실행). 격리 SQLite 사용.
- 첫 전체 실행은 366/367 통과였다. 음악 첫 곡 변경 후 이전/다음 테스트의 기대값이 옛 순서에 남아 있어 실제 순서(Ethereal → Cinematic)에 맞췄다. 같은 탭 초대 링크 재검증 회귀를 추가한 뒤 전체 재실행에서 368개가 통과했다.
- `npm run build`, `npm run build:vercel`, `npm run test:budget`, `git diff --check` PASS. 별도 lint/typecheck 명령은 없다.
- 서버 검사: 무초대·이전 세션·임의 방·다른 관리자 ID·프록시 인증 위조 차단, 랜덤 초대 해시 저장, 만료/폐기, 서로 다른 초대의 같은 월드, 채팅/외형/소원, 강퇴/차단/좌석 해제, 게스트 11명 병렬 입장 + 소유자 입장/운영 가능, 전체 12명 제한, Origin/rate limit.
- 실제 Chrome PC 1280×800 / 터치 모바일 에뮬레이션 390×844: **11개 묶음 PASS**, page 오류 0. 초대 발급 UI, 무초대 제한, 두 브라우저 입장·이동·채팅·소원·장식 공유, 외형 저장/재접속, 일반 게스트 관리 거절, 강퇴/새 초대 복귀, 차단/폐기 후 기존 세션 종료 확인.
- 같은 초대 세션으로 PC·모바일 지도, 관람차·회전목마·온천 종료, 료칸·천문대 출입, Ethereal 첫 곡 실제 재생 확인.
- 근거: [브라우저 결과](../qa/browser-v39/verification.json), [검사 요약](../qa/browser-v39/checks.json), [구현·재현 스크립트](single-world-v39.md).
- 운영 두 주소의 접근 정책 검사 및 Vercel PC/모바일 크기 화면 4개 묶음 PASS, page/5xx 오류 0. 18개 배포 파일 비교 일치. [운영 결과](../qa/browser-v39/production/verification.json). 운영 유효 초대 입장은 UNKNOWN이며, 소유자 로그인/초대 관리 화면은 사용자 확인으로 구분한다. 로컬 관리자 fixture는 loopback 테스트 서버에만 있으며 production 인증 우회는 추가하지 않았다.
- **UNKNOWN:** 운영 유효 초대 입장, 실물 iPhone/Android, 새 버전의 장시간 부하/FPS. 로컬 다중 브라우저는 실제 두 휴대폰 검사로 표시하지 않는다.

---

# v38 검증 기록

## 자동 검사

- Node 전체 테스트 **362/362 PASS**, 최종 꼬리와 Ethereal 첫 곡 변경 포함. 격리된 SQLite 테스트 데이터 사용.
- `npm run build`, `npm run build:vercel`, `npm run test:budget` PASS.
- 별도 TypeScript 애플리케이션/tsconfig, lint/typecheck 명령은 없음. 존재하지 않는 검사를 통과했다고 기재하지 않는다. JavaScript 구문 및 bundling은 실제 build로 확인했다.
- 서버 권한/Origin/게스트 세션/기존 단색 저장 호환/좌석 경쟁/재접속/자원 해제 회귀는 기존 자동 검사에 포함.

## 실제 Chrome 실행

- `qa/browser-v38/mobile/verification.json`: 360도 아날로그·최대 입력·경계 밖·멀티터치·달리기·취소·점프·지도·채팅·저장·초대 정렬 PASS.
- `qa/browser-v38/final/verification.json`: 꼬리 정면/측면/후면/45도와 분홍/네이비, 걷기/달리기, 그라데이션 저장/취소/복원/두 세션 동기화, 관리자 링크, 실제 장면 blur 로딩 PASS.
- `qa/browser-v38/verification.json`: PC/노트북/태블릿/모바일/작은 모바일/가로 화면의 꾸미기 정렬, 저장 실패·재시도·취소·초기화, 미리보기 회전 PASS.
- `qa/browser-v38/regression/world-after.json`: 료칸/천문대 실제 서버 구역 전환·로딩·앉기·이동 해제·퇴장, 두 좌석·세 번째 사용자 거절·개별 하차·닉네임 검사 PASS.
- `qa/browser-v38/regression/resort.json`: 양쪽 리프트 2인 탑승·서로 다른 좌석·사용자 시선 유지·정상 하차, 네 코스 완주·장비/UI 종료, 어묵·모닥불 보존, 베이스에서 료칸까지 실제 보행 PASS. 측정한 리프트 초기 이동 구간의 카메라 jump(1 unit 이상/50ms 이하) 0건.

## 운영 배포 확인

최종 대상과 결과는 [DEPLOYMENT.md](DEPLOYMENT.md)에 기록한다. `scripts/verify-release-v38.mjs`는 숨겨진 QA hook/인증 우회 없이 새 게스트로 접속하며 자체 테스트 게스트만 퇴장 처리한다. 운영의 기존 소원·장식은 수정하지 않는다.

- `qa/browser-v38/release-local/verification.json`: PC/모바일 실제 게스트 초기 진입, 외형 저장/복원/두 클라이언트 동기화, 채팅 전송/수신, 지도, 관람차 두 좌석/개별 하차·회전목마·온천 종료·소원 패널 화면 경계, 실내 전환, Ethereal 실제 재생, 초대 로그인 PASS.
- `qa/browser-v38/release-production/verification.json`: 배포 후 실제 Vercel 주소에서 PC/모바일 크기의 8개 묶음 검사 PASS. 로컬과 같은 진입·저장·동기화·채팅·이동·시설·실내·음원 검사, page/WebGL 오류 및 5xx 응답 0. 운영에서는 다른 이용자의 좌석을 침범하지 않도록 두 번째 관람차 좌석 경쟁 검사를 생략했다. 소원·장식 등록은 운영 데이터를 변경하지 않고 로컬 회귀 결과로 구분한다.
- Sites/Vercel 핵심 배포 파일 9개가 검증한 production 배포물과 일치. Sites 신규 그라데이션 저장/조회 PASS.
- 180초 꼬리 착용 12인 자동 품질 검사 완료. 장시간 보증은 아님([수치](PERFORMANCE.md)).

## UNKNOWN

실물 iPhone Safari, Android Chrome, 앱 내 브라우저, 발열·배터리, 30분 이상 연속 실행은 미검증. Mac Chrome 모바일 에뮬레이션을 실물 휴대폰 결과로 표시하지 않는다. ChatGPT 관리자 인증 완료에는 실제 소유자 세션이 필요하며 테스트용 게스트는 관리자 기능 거절과 로그인 주소만 확인한다.
