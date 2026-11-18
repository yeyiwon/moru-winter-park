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
