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
