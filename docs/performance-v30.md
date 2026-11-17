# v30 — 구조·성능 검증 보고서

## 1. 기존 구조와 문제

실제 구성은 Vanilla JavaScript ES modules + vendored Three.js r170이다. React/R3F, React state, WebSocket, 물리 엔진, GLB 로더는 사용하지 않는다. 새 production dependency는 추가하지 않았다. Node의 테스트 러너, jsdom 26.1.0, esbuild 0.25 계열을 사용한다.

| 책임 | 현재 구현 |
| --- | --- |
| 앱·설정·지도 | `app.js`, `studio.js`, `world-map.js`, DOM events / Canvas 2D |
| 월드 | `themepark-world.js`, `winter-world.js`, `alpine-resort.js`, 지역별 layout/model 모듈 |
| 캐릭터 | `companion.js`, `wardrobe.js`, accessories / costumes; procedural geometry와 직접 포즈 계산 |
| 이동·물리 | `movement.js`, `navigation.js`, `winter-rides.js`, `skating.js`, 분석적 지형 높이와 단순 충돌체 |
| 카메라 | 시설별 view + `camera-clearance.js`, `camera-raycast.js`의 BVH |
| VFX | GPU shader / instanced particles, 고정 크기 트레일·이벤트 풀, landmark atmosphere |
| 동기화 | `social.js`, `visitors.js`; 인증된 HTTP polling, 원격 보간, 서버 좌석 예약 |
| 서버 | Sites Worker + D1(SQLite); Vercel은 같은 서버로 `/api` 프록시 |
| 사운드 | Web Audio buses / 음량 / 공간음 / 재사용 noise buffer + HTMLAudio 스트리밍 |
| 빌드 | 원본 `dist/` → Sites Worker static assets 또는 Vercel `web-dist/` |

메인 루프에 물리·표시·UI가 섞여 있었고, 사용하지 않는 실내와 미리보기까지 시작 시 생성했다. 랜드마크 내부 배치는 인덱스를 풀어 꼭짓점 데이터를 중복 저장했다. 첫 장애물 우회 이동은 약 23만 개의 격자 칸을 동기적으로 계산했다. 이름표는 위치를 쓴 직후 DOM 크기를 다시 읽었고, 정지 상태에서도 동일한 주기로 전체 데이터를 받았다.

## 2. 확인한 병목

- **실측:** 변경 전 Chrome에서 광장·스키의 프레임이 특히 느렸다. 아래 표와 원시 결과에 기록한다.
- **실측:** 첫 우회 경로 `(0,24) → (21,0)` 계산은 Node에서 약 7,636 ms. 필요 셀 평가와 broad phase 적용 후 약 463 ms, 동일한 5개 waypoint를 반환했다. 두 값은 단일 CPU 측정이며 FPS가 아니다. 최종 브라우저에서는 이 계산을 전용 Worker로 옮겼다. 기능 검사에서 약 488 ms 동안 20프레임을 렌더링하면서 같은 5개 waypoint를 반환했다. 앞선 실행은 168 ms / 10프레임이었다. CPU 단일 값과 브라우저 시간을 직접 비교해 배수 개선으로 주장하지 않는다.
- **확인:** 도형을 재질 하나로 넓게 합친 경우 화면 밖의 가지와 장식도 같은 bounding volume에 묶였다. 48-unit 배치를 먼저 시험했으나 PC 혼잡 장면의 draw-call/CPU 부담이 증가했다. 최종 버전은 128-unit 배치로 합치는 범위를 다시 조정했다. 배치 수가 증가하는 대신 실제 영역별 컬링이 가능해지는 의도적인 trade-off다.
- **확인:** Service Worker가 같은 JS를 query 유무에 따라 중복 precache했다. canonical URL 하나로 통일했다.
- **실제 브라우저에서 발견·수정:** 페이지 종료 시 오디오 해제 후 다른 종료 핸들러가 같은 HTMLAudio에 MediaElementSource를 다시 만들려는 오류. 종료한 엔진은 재연결하지 않도록 했다.

## 3. 변경 파일과 책임 분리

| 파일 | 변경 |
| --- | --- |
| `simulation-clock.js`, `player-state.js`, `park.js` | 최대 4회 catch-up의 60 Hz 물리 step, 캐릭터 포즈는 display frame당 1회; Idle/Walking/Running/Jumping/스키/리프트/관람차/회전목마/스케이트/행동/실내 상태; 점프·조작 가드 |
| `navigation-client.js`, `navigation-worker.js`, `navigation.js`, `collision-grid.js`, `movement.js` | 클릭 경로 Worker, 최신 요청만 유지, 입력·이동·탑승 시 오래된 경로 취소, lazy 격자와 정적 충돌 broad phase |
| `mesh-batch.js`, `castle-model.js`, `ferris-model.js`, `carousel-model.js` | 색·노멀·UV·삼각형 순서를 보존하는 indexed batch |
| `themepark-world.js`, `winter-world.js`, `alpine-resort.js` | 공간별 배치 경계; 기본 frustum/shadow culling 활용 |
| `interior-world.js`, `scene-resources.js`, `local-lights.js` | 실내 lazy 생성·입구 근처 선행 준비·90초 부재 후 해제; 재진입 캐시; 충돌체/지역 광원 등록과 해제 |
| `frame-metrics.js`, `render-budget.js`, `glow-pass.js` | opt-in 프레임/GPU 측정, bounded query, 메뉴 일시정지를 제외한 10초 실제 프레임 수집, 느린 기기 자동 품질 반응, 그림자 크기/주기와 해상도, 낮음 모드에서 미사용 render target 해제 |
| `presence-policy.js`, `social.js`, `server/api.js` | 이동 1초 / 정지 2초 / 숨김 8초 / 장애 backoff; 먼 위치 5초 갱신, 근처·좌석·채팅·감정 유지 |
| `shared-tree.js`, `server/vercel-proxy.js` | 트리 revision 응답, 가까이 2초 / 멀리 8초, 요청 직렬화와 이전 방 응답 차단 |
| `world-labels.js`, `visitors.js`, `companion.js`, `game-input.js` | 이름표 크기 캐시, 원격 포즈 15/30/60 Hz, 멀티터치 소유권 유지, 리스너와 원격 리소스 해제, 이전 눈/귀/소품 캐시까지 퇴장 시 해제 |
| `audio-engine.js` | 공간음 계산 10 Hz / listener 30 Hz, 중복 등록 방지, 루프·media·listener 수명 정리 |
| `production-assets.mjs`, build scripts, `static-response.js`, `sw.js` | 동일 production 변환, ETag/304, 중복 다운로드 제거, version query와 무관한 CSS/JS 오프라인 캐시, v30 cache |
| QA scripts / tests | production 브라우저 측정, 실제 GPU 통계, 두 세션 탑승, 터치 입력, 반복 출입, 용량·알고리즘 회귀 검사 |

## 4. 최적화 적용·검토 범위

- 유지: 기존 캐릭터와 장식, 월드 동선, 성·트리·오로라 VFX, 원격 보간, 서버 인증·좌석 고유 제약·개별 하차·요청 검증.
- 새 적용: indexed landmark buffers, 공간 batch, UI 측정 캐시, lazy 실내/미리보기, Worker 경로 계산, 리소스 해제, 변경량에 따른 네트워크 응답, 디바이스별 shadow/DPR budget.
- 기존 적용을 유지·보완: InstancedMesh, 캐릭터 화면 크기 LOD, GPU VFX와 고정 풀, 원격 frustum culling, 실내외 visibility 분리, 주변 광원 슬롯(PC 6 / 모바일 4), 1/4 크기 threshold Bloom, 카메라 BVH.
- KTX2/Basis/Draco/Meshopt/GLB: 검토했으나 이번에 도입하지 않았다. 대부분 procedural geometry와 작은 procedural texture이며 압축할 대규모 외부 GLB/텍스처 세트가 없다. 새 디코더보다 중복 vertex 제거가 직접적이었다. 오디오는 기존 압축 m4a 스트리밍과 `preload=none` 유지.
- 추가 occlusion query: 도입하지 않았다. GPU readback과 popping 위험을 늘리지 않고 기본 frustum, 공간 batch, 실내외 분리부터 사용했다.
- 제거한 온실은 복원하지 않았다. 이전에 명시적으로 삭제된 콘텐츠이므로 이번 성능 시나리오에서 제외했다.
- 전 구역을 별도 다운로드하고 원경 대체 모델에서 고해상도로 전환하는 **완전한 outdoor streaming은 미구현**이다. 현재 outdoor 랜드마크의 조망은 유지하고, 실내의 생성·해제와 공간 컬링까지 적용했다.

## 5. FPS·프레임 타임 비교

최종 비교 결과는 `qa/browser-v30/` JSON과 이 절의 최종 표를 참고한다. 기준 소스는 v29 commit `2cc66a1cf84a9691297355ced91a2cc0c1301962`다. 기준 static files는 당시 production과 같은 배포 파일이며, 변경 후는 `npm run build:vercel` 결과물을 사용한다. 별도 Chrome 프로필·격리된 로컬 DB를 사용한다.

FPS는 별도 RAF의 횟수가 아니라 **실제 게임 animate callback**을 측정한다. 일반 FPS 측정에서는 GPU query를 끈다. GPU timer는 별도 probe로 측정하며 GPU/driver 진단 오버헤드가 포함될 수 있으므로 해당 probe의 FPS를 일반 FPS와 섞지 않는다. CPU callback 시간과 CDP TaskDuration은 GPU 시간과 다르다.

각 장면 **8초 단일 구간**의 평균 FPS / P95 ms. 자동 화질이며 장면·VFX 시점과 부하에 따른 변동이 있다. 성 조망 재방문은 광장으로 돌아온 시나리오이므로 첫 광장 수치만 골라 일반화하지 않는다.

| 장면 | PC 이전 → 이후 FPS | PC P95 이전 → 이후 | 모바일 에뮬레이션 FPS 이전 → 이후 | 모바일 P95 이전 → 이후 |
| --- | ---: | ---: | ---: | ---: |
| 중앙 광장 | 36.4 → 55.0 | 33.4 → 33.3 | 48.8 → 50.2 | 33.4 → 33.4 |
| 트리 | 60.0 → 60.0 | 16.8 → 16.7 | 59.9 → 60.0 | 16.8 → 16.7 |
| 성 조망 재방문 | 37.3 → 34.6 | 33.4 → 50.0 | 54.3 → 57.4 | 33.3 → 16.8 |
| 관람차 탑승 | 60.0 → 60.0 | 16.7 → 16.7 | 60.0 → 60.0 | 16.7 → 16.8 |
| 회전목마 | 43.8 → 50.5 | 33.4 → 33.4 | 59.9 → 60.0 | 16.8 → 16.7 |
| 리프트 | 43.2 → 45.3 | 33.4 → 33.4 | 55.2 → 60.0 | 33.3 → 16.7 |
| 스키 활강 | 38.9 → 39.0 | 33.4 → 33.4 | 50.6 → 50.6 | 33.4 → 33.4 |
| 온천 실내 | 60.0 → 60.0 | 16.7 → 16.8 | 60.0 → 60.0 | 16.7 → 16.7 |
| 퀴즈존 | 56.4 → 55.1 | 33.3 → 33.3 | 60.0 → 60.0 | 16.7 → 16.7 |
| 광장 12인 | 37.2 → 37.2 | 33.4 → 33.4 | 42.5 → 41.4 | 33.4 → 33.4 |

P99와 각 프레임 CPU, 전체 main-thread TaskDuration, draw calls, 삼각형 수, viewport/DPR 및 시나리오 전후 화질은 원시 JSON에 있다. PC는 처음 광장 DPR 1에서 시작했고, 기준 버전은 그 측정 중 0.85로 낮아졌다. 최종 버전은 첫 광장에서 1을 유지했으나 재방문 이후 0.85로 낮아졌다. 따라서 자동 화질 결과를 동일한 GPU 설정의 순수 알고리즘 비교로 해석하지 않는다.

긴 측정 비교는 아래에 별도 기록한다. 30초 단일 구간 추가 측정(M2 / Chrome / 자동 화질). 앞선 8초 검사와 차이가 있으므로 재현 환경·길이·품질을 구분한다. 스키 30초는 **활강과 도착 후 이동을 함께 포함**한다. 순수 활강 8초 결과(38.9 → 39.0 FPS)는 사실상 비슷하므로, 이를 주행 중 항상 57 FPS라고 해석하면 안 된다.

| 장면 | FPS 이전 → 이후 | 평균 frame ms 이전 → 이후 | P95 ms 이전 → 이후 | P99 ms 이전 → 이후 |
| --- | ---: | ---: | ---: | ---: |
| 중앙 광장 | 45.3 → 56.6 | 22.07 → 17.67 | 50.0 → 33.3 | 50.1 → 33.4 |
| 스키 출발 → 도착 후 이동 | 34.9 → 57.0 | 28.65 → 17.54 | 50.0 → 16.8 | 66.7 → 33.4 |
| 광장 12인 | 45.3 → 51.8 | 22.09 → 19.30 | 33.4 → 33.4 | 50.0 → 33.4 |

두 측정 모두 같은 자동 모드지만 실제 선택한 화질은 다르다. 긴 측정의 최종 버전은 DPR 1을 유지했고, 기준 버전은 스키에서 0.85를 사용했다. 최종 광장은 MSAA 0 / shadow 2048 / 20 Hz였으며, 스키·12인에서는 MSAA 0↔2 변경이 있었다. 기준 광장은 MSAA 2→0, shadow 2048 / 24→15 Hz였다. 수동 동일 화질 FPS의 순수 기하 최적화 이득으로 주장하지 않는다.

30초 12인 장면에서 주 관찰 클라이언트의 응답 전송량은 85,066 → 36,622 bytes, 요청은 46 → 17회였다(약 57% 전송량 감소). 서버 전체 합계나 cloud 지연 수치가 아니다. 11개의 실제 분리 쿠키 세션을 포함해 두 측정 모두 시작/종료에 원격 11명이 유지됐다.

GPU timer는 별도 **수동 medium, DPR 1** probe에서 측정했다. PC 그림자 해상도는 이전 고정 2048, 이후 medium 1024이므로 변경된 budget의 효과가 함께 포함된다. 광장 GPU 20.26 → 20.77 ms / CPU callback 11.43 → 9.98 ms, 스키 GPU 18.16 → 17.30 ms / CPU 16.62 → 13.56 ms. GPU query 사용 시의 FPS를 위 일반 FPS와 혼합하지 않는다.

## 6. 메모리·Draw Call·전송량

Geometry bytes는 CPU attribute/index 배열의 합계다. GPU 전체 VRAM 사용량과 같지 않다. Texture bytes는 RGBA/mipmap 추정이며 render target/압축/driver 내부 할당까지 정확히 나타내지 않는다. 실제 texture/geometry 개수는 `renderer.info.memory`, JS heap은 Chrome의 측정값을 기록한다.

공간 batch는 첫 후보 960개에서 최종 771개로 조정했다. 이를 draw-call 감소로 표현하지 않는다. 테스트는 공간 배치 수 1,000개 미만, 재질 225개 미만, CPU geometry 200 MiB 미만, 전체 삼각형 450만 미만을 함께 감시한다. shadow pass 빈도와 자동 화질에 따라 frame draw-call 합계가 달라지므로 원시 결과에 DPR·samples·shadow 주기도 남긴다.

최종 실내 10회 출입에서 CPU geometry는 862개로 동일했고 새 ID는 없었다. GPU geometry는 752개, texture는 25개로 모든 반복에서 일정했다. GC 후 heap은 327.84 → 328.54 MB였다. 약 112초 외부 탐험 후에는 실내 캐시가 0개로 해제됐다. 이때 새 외부 구역을 본 상태의 heap은 332.32 MB였으므로 같은 시점/같은 장면 비교와 구분한다. 장기 누수 전체를 증명하는 결과는 아니며 실제 수시간 실행은 별도 검증이 필요하다.


첫 광장 snapshot의 비교(Decimal MB; GC 강제 없음):

| 항목 | PC 이전 → 이후 | 모바일 에뮬레이션 이전 → 이후 |
| --- | ---: | ---: |
| CPU geometry 배열 MB | 233.81 → 183.29 | 233.81 → 183.29 |
| JS heap MB | 459.83 → 342.27 | 419.97 → 366.91 |
| 평균 draw calls | 742.18 → 912.19 | 510.89 → 636.81 |
| 활성 texture | 25.00 → 25.00 | 17.00 → 17.00 |
| 초기 준비 ms | 10368.00 → 8805.00 | 8754.00 → 10349.00 |
| 시작 전송 MB | 6.01 → 5.53 | 6.01 → 5.53 |

도형 배열은 약 21.6% 감소했다. Draw calls는 기준보다 증가하며, 일부 장면의 FPS는 비슷하거나 감소했다. 모바일 에뮬레이션의 이번 cold-start 시간은 증가했으므로 초기 로딩이 모든 환경에서 빨라졌다고 결론 내리지 않는다. 로컬 초기 전송은 압축하지 않은 HTTP 측정이며 cloud CDN 전송량과 같지 않다. Production 파일 총 16.94 MB, JS/CSS 2.77 MB(gzip 0.876 MB), 오디오 11.48 MB로 용량 예산을 통과한다.

서버 처리 시간 자체는 UNKNOWN이다. 로컬 API는 테스트용 persistent Python SQLite bridge를 사용하므로 이 응답 시간을 cloud Worker 성능으로 보고하지 않는다. 네트워크 수치는 측정한 HTTP response bytes와 요청 횟수다.

## 7. PC 검증

macOS / Apple M2 / Chrome 157 / ANGLE Metal 실 GPU의 headless 브라우저에서 실행한다. 소프트웨어 WebGL mock 결과와 구분한다. 데스크톱 viewport 1280×800. Windows Chrome/Edge와 macOS Safari 실측은 UNKNOWN.

목표는 일반 지원 사양 60 FPS이며 모든 PC에 대한 보장이 아니다. 최고 화질 고정과 자동 모드를 구분한다. 자동 모드가 더 낮은 효과 해상도를 선택한 결과는 해당 설정과 함께 보고한다.

## 8. 모바일 검증

Chrome mobile emulation: 390×844, DPR 3, touch/coarse pointer, 실제 3개 동시 touch point로 이동+카메라+점프와 cancel을 검사한다. 조이스틱·점프·달리기·감정·채팅·메뉴 버튼의 사각형 겹침도 검사한다.

**이는 스마트폰 실기기 성능 검증이 아니다.** iOS Safari / Android Chrome / 저사양 휴대폰의 GPU·발열·장시간 FPS는 UNKNOWN. 고성능 모바일 60 / 하한 모바일 30 FPS는 검증 목표이며 확정 지원 보장이 아니다.

## 9. 기능·회귀 검증

전체 자동 테스트 **278/278 통과** 후, 종료 시 Worker 오류 방어·CSS 오프라인 캐시·비활성 GPU 계측을 추가 확인한 관련 테스트 **10/10 통과**. 이후 분할 크기·포즈 계산·커마 자원 해제까지 반영한 관련 회귀 테스트 **52/52 통과**. 마지막 52개에는 새 자원 해제 검사가 포함된다. 최종 진단 표시의 일시정지 시간 제외 검사를 추가한 delivery 테스트 8/8도 통과했다. `npm run build`, `npm run build:vercel`, `npm run test:budget`, `git diff --check`도 통과했다. 실제 Chrome의 `functional.json`은 **10개 검사 통과, pageerror 0건**이다. 기능 검사는 걷기·점프·커스터마이징·탑승 중 점프 차단·2인 같은 곤돌라/개별 하차·실내 이동/재진입/해제·멀티터치·UI 겹침·Worker 경로 처리·브라우저 오류를 포함한다. 순수 함수/DOM/GPU stub 검사는 실제 Chrome 검증과 구분한다.

별도 TypeScript typecheck/lint 설정은 저장소에 없다. `node --check`, 실제 두 production build, 기존 테스트와 추가 회귀 검사로 검증한다.

재현 명령:

```sh
npm test
npm run build
npm run build:vercel
npm run test:budget
# 테스트용 Playwright는 외부 QA 경로에 설치한다. production dependency가 아니다.
PORT=4182 PREVIEW_STATIC_DIR=web-dist npm run dev
PROFILE_URL=http://127.0.0.1:4182 PROFILE_OUTPUT=qa/browser-v30/after-desktop.json npm run profile:browser
PROFILE_URL=http://127.0.0.1:4182 PROFILE_MOBILE=1 PROFILE_OUTPUT=qa/browser-v30/after-mobile-emulation.json npm run profile:browser
PROFILE_URL=http://127.0.0.1:4182 node scripts/verify-browser.mjs
```

QA DB와 브라우저 프로필은 실제 방문자의 공간과 분리한다. 전후 서버는 같은 persistent SQLite 테스트 어댑터를 사용한다. 이는 매 SQL마다 프로세스를 시작하던 로컬 서버 오버헤드를 제거하기 위한 것이며 production Worker 변경과 구분한다. 12인 시나리오는 API로 별도 쿠키 세션 11개를 입장시키고 heartbeat를 유지하며, 자기 이름표를 제외한 원격 플레이어 11명이 측정 전후 모두 존재하는지 검사한다. GPU probe는 `PROFILE_GPU=1`, 통제된 수동 화질은 `PROFILE_QUALITY=high|medium|low`, 특정 시나리오는 `PROFILE_SCENARIOS=plaza,ski`로 실행한다.

## 10. 남은 병목·우선순위

1. 실기기 iOS/Android 및 Windows/Safari 측정과 발열 지속 시험. 지원 하한과 최종 자동 화질 계수는 이 측정 후 확정한다.
2. 순수 스키 활강·장면에 따른 투명 조명/그림자 비용이 남는다. 수동 최고 화질은 최종 하드웨어 행렬 검증이 필요하다. 사용자에게 선택된 수동 화질을 몰래 바꾸지 않으며 기본 자동 모드를 유지한다.
3. 전 outdoor 구역의 원경 LOD/단계별 생성·다운로드는 미구현. 기존 조망과 상세 장식을 보존하는 별도 에셋 단계화가 필요하다.
4. 브라우저별 정확한 GPU VRAM, 실제 서버 내부 처리 지연, 수시간·다중 실기기 탐험은 UNKNOWN. 짧은 자동 검사만으로 무누수·무렉을 보장하지 않는다.
5. 방 정원은 기존 12명이다. 이번에는 그 범위의 보간·interest management·폴링을 개선했다. 수백 명 규모 WebSocket/서버 아키텍처를 구현했다고 주장하지 않는다.
