# v44 로컬 검증 자료

운영 배포는 보류했다. 실물 Windows/휴대폰 결과가 아닌 **Mac Chrome 157 + 모바일 viewport/CDP touch** 기록이다. 각 스크립트는 별도 로컬 테스트 DB만 대상으로 하며 source route injection은 브라우저 테스트에만 사용한다.

## 재현

프로젝트 루트에서 기존 개발 의존성을 준비한 뒤 격리 서버 두 개를 연다. `LOCAL_OWNER_EMAIL`은 운영 인증 우회가 아니라 개발 서버에만 존재하는 가짜 소유자 fixture다. 아래 DB는 운영 데이터와 별개다.

```sh
PORT=4189 LOCAL_DB_PATH=/tmp/winter-v44-qa.sqlite node scripts/dev-server.mjs
PORT=4190 LOCAL_DB_PATH=/tmp/winter-v44-qa.sqlite LOCAL_OWNER_EMAIL=qa-owner@example.invalid node scripts/dev-server.mjs
```

Playwright Core의 기존 설치 위치는 `PLAYWRIGHT_PATH`, Chrome 실행 파일은 `CHROME_PATH`로 지정한다. 새 production dependency는 필요하지 않다. 선택 환경 변수 `QA_URL`, `QA_OWNER_URL`은 localhost만 허용한다.

```sh
node qa/camera-v44/camera-check.mjs
node qa/camera-v44/mobile-input-check.mjs
node qa/camera-v44/flow-check.mjs
node qa/camera-v44/framing-check.mjs
BASELINE_SHA=38544a2 node scripts/profile-startup.mjs
```

- camera: 실제 mouse/touch 선택, Pointer Lock/Esc, UI 입력 분리, 트리 선택/닫기.
- mobile-input: CDP 멀티터치 이동+카메라+점프, pinch, 손 떼기, 좌우 리프트 수동 시선 유지/종료.
- flow: 두 브라우저의 점프·오마카세 좌석·서버 공연 동기화·감상·퀴즈. 테스트 DB에 단기 공연/게스트를 만들며 종료 시 테스트 세션과 공연만 정리한다.
- framing: 같은 좌표에서 이전/이후 트리를 촬영하고 모바일 색상 도크 펼침 및 가로 화면에서 상단·밑동·캐릭터가 가려지지 않는지 검사한다.
- profile: 기존 전체 모듈 그래프와 현재 소스를 각 viewport에서 3회씩 새 context로 비교. 타 브라우저 검사/전체 테스트와 동시에 실행하지 않는다. 실제 필수 준비 완료까지 Long Task/프레임 간격/총시간을 측정한다.

`before/after` PNG는 같은 해상도로 촬영했다. 트리 비교는 동일한 x/z, yaw 0에서 도크를 열었다. 시간이 흐르는 하늘/VFX·자동 게스트 외형은 고정하지 않았다. `framing.json`은 도크 색상 펼침과 가로 화면 검사, `startup.json`은 정식 성능 비교이다. FPS·GPU 메모리·실제 휴대폰 성능을 추정해 기록하지 않았다.

[구현·수치·한계](../../docs/camera-interactions-v44.md).
