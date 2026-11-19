# v44 — 탐험 카메라·좌석·트리·공연·퀴즈·초기화

2026-11-19. 구현 커밋 **`968d804`**, 기준 커밋 `38544a2`, 작업 브랜치 `codex/public-world-v43-release`. **사용자 결정에 따라 로컬 수정본만 보관한다. GitHub main, Vercel, Sites에 배포하지 않았다.** 기존 이름·로고·섬 위치·시설·소원/외형 데이터와 공개 입장 정책을 보존한다.

## 원인과 변경

### 카메라와 입력

`park.js` 안의 도착 구도, 활동 시점, 리프트, 트리 프레이밍이 같은 yaw/pitch/distance를 각각 덮어쓰고 있었다. 기존 42m 성 감상 구도와 상황별 거리 초기화도 일반 탐험 시점과 혼재했다. `exploration-camera.js`가 목표 각도·거리·FOV·추적점을 소유하며, `park.js`는 플레이어/시설 상태만 전달한다. 실내 경계 보정은 컨트롤러의 최종 위치 보정 단계에 둔다.

| 항목 | 이전 | 변경 |
|---|---|---|
| 기본 탐험 | 초기 성 감상 42m, 이동 목적지별 시점 초기화 | PC 거리 14 / 모바일 16, pitch 25°, FOV 50° |
| PC 상대 입력 | 메뉴의 별도 시야 버튼 | 게임 배경 클릭 → Pointer Lock, Esc/UI/입력 필드/창 이탈 시 해제 |
| 회전 범위 | 일반 상향 −0.65rad, 리프트 −0.1rad | −1.3~1.18rad, 지면 아래로 카메라를 내리는 대신 올려다보는 방향 보정 |
| 감도 | 고정 계수 | 기존 설정 안 40~200%, 로컬 저장 |
| 추적 | 점프/시설/일반 구도 처리 분산 | 점프 높이를 뺀 지면 기준, 회전과 이동 추적 분리 |
| 시설 시점 | 프레임마다 일부 목표 재지정 | 시설 진입 때 한 번 지정, 수동 회전 유지, 종료 시 이전 시점 복원 |
| 트리 | PC 최소 68 / 모바일 최소 56 | 같은 yaw에서 수관·캐릭터·도크 크기로 계산, 검사 구도 53.42 / 52.30 |

트리/공연 감상 중 지도 이동도 감상 전 시야로 정리한 뒤 목적지에 배치한다.

마우스는 `movementX/Y`를 사용하며 멈춘 뒤 빠르게 수렴한다. 건물 충돌 후 복귀 속도 제한과 리프트 지지대의 선택적 투명화는 유지한다. 포인터 잠금이 거부된 브라우저에서는 기존 드래그 방식으로 계속 조작한다. 터치 pointer ID를 분리해 조이스틱·카메라·점프를 동시에 처리하며 두 손가락은 거리 조절에 사용한다.

트리는 아래쪽이 넓고 꼭대기가 좁은 실제 비율을 프레이밍 계산에 반영한다. 도크 높이 변경/화면 회전에 재계산하며, 가로 화면에서는 도크 비율 상한과 초점 높이 탐색 범위를 넓혀 밑부분 가림을 보정했다. 사용자가 직접 카메라를 돌리면 자동 프레이밍을 중단한다. 도크 닫기는 이전 시점을 복원한다. 모션 감소에서는 트리 자동 프레이밍을 하지 않는다. 장식 비행은 카메라를 끌고 다니지 않는다.

### 같은 시설 내 좌석 배정

기존 벤치는 좌석 0부터 차례로 시도했고 오마카세는 고정된 한 위치를 공유했다. `dining-seats.js`에 기존 세 스툴의 좌표를 정의하고 기존 `ride_seats` 예약을 재사용한다. 벤치/오마카세의 `앉기`는 해당 시설의 빈 좌석만 섞어 시도한다. DB unique key와 `INSERT … ON CONFLICT DO NOTHING`이 동시 요청의 승자를 정한다. 같은 사용자의 중복 요청은 이미 확보한 예약을 반환한다.

서버는 구역·시설 ID·접근 거리와 앉은 자세를 검증한다. 캐릭터와 원격 플레이어는 같은 좌석 pose를 사용한다. 일어나기·시설 변경·퇴장·20초 예약 만료는 기존 정리 경로로 처리한다. 원래 주방장·식사 자세·음식·서빙 동작을 유지하며 DB 마이그레이션은 없다.

### 트리 선택

기존 반경 26을 트리 반경 9.4 + 접근 여유 4.6 = **14**로 줄였다. 13/15/40 거리 및 가까운 벤치 우선 안내를 검사했다. 투명한 큰 선택 상자를 제거하고 실제 가지 메시를 Raycast 대상으로 등록하며, 정적 병합 뒤에도 태그를 보존한다. 장식 상세 보기 판정을 먼저 하고 가지 클릭/탭은 꾸미기를 연다. 원거리 클릭은 접근 안내만 표시한다. 소원·장식 서버 저장 검증은 그대로다.

### 불꽃놀이와 퀴즈

서버 공연 예고를 3초에서 **10초**로 변경했다. 서버 공연 ID/시작 시각/seed를 받은 클라이언트에만 작은 `불꽃놀이 보기` 안내를 표시한다. 선택한 사용자의 카메라만 기존 공연 영역을 향하며 플레이어는 이동시키지 않는다. 직접 시야 조작하면 자동 감상을 중단하고, 정상 종료·서버 중단 시 저장한 시점을 복원한다. 고정 파티클 풀·품질 단계·발사/폭발 사운드·기존 광원 펄스를 유지한다.

퀴즈의 큰 장식 그래픽과 72개 DOM 입자 효과를 없애고 18px 선형 체크/X 및 짧은 opacity 모션으로 정리했다. 답 선택 강조, 해설, 출처, 더 알아보기와 지식집 흐름은 유지한다. 퀴즈 내용과 기존 유리 팔레트는 변경하지 않는다.

## 초기화 분할과 실제 측정

실제 Chrome CPU 표본에서 동기식 Geometry 병합, 설산/보행길/트리 생성 등이 한 번에 메인 스레드를 점유했다. `startup-work.js`의 generator 실행기가 약 8ms 작업 묶음 후 rAF와 다음 task로 제어를 돌려 로딩 SVG에 paint 기회를 준다. 병합은 원본 메시별, 설산은 지형 행/색상 묶음별, 보행길은 셀 묶음별, 트리는 가지 층별로 분할한다. 기존 동기식 builder API도 보존해 빌드 도구와 검사가 같은 결과를 사용한다.

로딩 그림·크기·문구와 실제 준비 완료/오류·재시도 조건은 유지한다. 새 WebGL 로딩 장면이나 production dependency는 없다. 단일 작업이 큰 시설 생성/셰이더 준비는 여전히 남아 있으므로 모든 Long Task를 없앴다고 표현하지 않는다.

Mac Apple M2 / Chrome 157, DPR 1, 로컬 동일 테스트 DB. 이전 전체 프런트 모듈 그래프 `38544a2`와 현재 그래프를 각각 새 browser context로 제공했다. 각 화면 3회씩 before/after 순서로 비교했으며 아래는 중앙값이다. 터치 화면은 **실물 휴대폰이 아닌 에뮬레이션**이다.

| 조건 | 항목 (ms) | 이전 | 이후 |
|---|---|---:|---:|
| PC 1280×800 | 최대 Long Task | 2262 | 207 |
| PC 1280×800 | 최대 화면 프레임 간격 | 2266 | 183 |
| PC 1280×800 | Long Task 합계 | 2456 | 1247 |
| PC 1280×800 | 월드 준비 완료 | 3414 | 4239 |
| 모바일 화면 390×844 | 최대 Long Task | 2349 | 212 |
| 모바일 화면 390×844 | 최대 화면 프레임 간격 | 2350 | 183 |
| 모바일 화면 390×844 | Long Task 합계 | 2556 | 1252 |
| 모바일 화면 390×844 | 월드 준비 완료 | 3352 | 4225 |

최대 Long Task는 약 91% 줄었지만 전체 준비 시간은 PC 약 0.82초, 모바일 화면 약 0.87초 늘었다. 프레임을 양보하는 비용과 브라우저 캐시/환경 변동을 포함한다. 초기 진입이 더 빨라졌다는 주장은 하지 않는다. 남은 약 200ms 구간의 추가 분할과 실제 저사양 기기 검증이 필요하다. 평균 FPS·GPU 메모리·실물 Windows/모바일 성능은 이번 측정에서 **UNKNOWN**이다.

[측정 원시값](../qa/camera-v44/startup.json), [재현 스크립트](../scripts/profile-startup.mjs).

## 검증

- 검사 harness의 고정 1,500프레임 대기가 병렬 부하에서 먼저 끝나는 문제를 확인했다. 실제 모듈 평가 완료까지 프레임을 공급하되 120초 기한을 두도록 수정한 후 전체 재검사했다.
- 전체 `npm test`: **393/393 PASS**, 149.95초. 카메라 보간/충돌/복귀, 예약 경합·만료·원격 pose, 트리 범위·벤치 우선, 입력 잠금 실패 대체 동작 포함.
- `npm run build`, `npm run build:vercel`, `npm run test:budget`: **PASS**. 파일 204개, 전체 22,384,423 bytes, code gzip 984,954 bytes. Vercel build는 로컬 산출물 생성이며 배포가 아니다.
- 별도 TypeScript/lint 명령: **N/A**(현재 vanilla JavaScript 구성). 변경 JS 및 QA 스크립트 구문 검사와 production bundle로 확인했다.
- Mac Chrome 실제 canvas 마우스 클릭·상대 이동·Esc, 설정 중 카메라 정지, 점프 시 카메라 높이 유지 PASS.
- 모바일 화면 CDP touch 입력: 조이스틱 경계 밖 이동 + 카메라 + 점프 동시 조작, 두 손가락 거리 조절, 손을 떼면 정지 PASS. 좌/우 리프트에 탑승해 직접 바꾼 yaw/pitch가 이동 중 유지되고 종료되는 것 확인.
- 트리 실제 가지 click/tap으로 도크 열기, 전신/트리 상단 프레이밍, 닫기 후 원래 거리와 yaw 복원 PASS. 390×844 색상 도크 펼침과 844×390 가로 화면에서도 트리 상단·밑동·캐릭터가 도크 밖에 표시됨을 확인했다.
- 독립 게스트 2개가 료칸의 다른 스툴에 착석하고 양쪽 좌석 상태를 공유, 일어나서 일반 이동과 실외 복귀 PASS. 4명/3좌석 경합·만석·만료는 자동 API 검사 PASS.
- 동일 서버 공연 정보 동기화, 10초 예고, 선택 시 플레이어 고정, 공연 실제 렌더, 중단 시 시야 복원, 수동 카메라 조작으로 자동 감상 해제 PASS.
- 퀴즈 답변·설명·선형 결과 아이콘 표시, DOM burst 0개 PASS. 브라우저 pageerror 0.
- 실물 Windows/Edge·iOS Safari·Android, 장시간 사용, 실제 스피커 출력, 운영 배포 후 동기화는 **UNKNOWN / NOT RUN**. Mac Chrome touch 에뮬레이션을 실물 결과로 기재하지 않는다.

테스트용 위치 이동은 QA 주입 함수로 준비했으며 사용자 조작은 실제 mouse/touch 이벤트로 수행했다. 3D 빌더/컨트롤러 참조를 노출하는 QA 주입은 배포 소스에 포함하지 않는다. 운영 데이터가 아닌 별도 SQLite DB를 사용했다.

## 화면과 기록

| 구도 | 이전 | 이후 |
|---|---|---|
| PC 초기 탐험 | [이전](../qa/camera-v44/before/desktop.png) | [이후](../qa/camera-v44/after/desktop.png) |
| 모바일 초기 탐험 | [이전](../qa/camera-v44/before/mobile.png) | [이후](../qa/camera-v44/after/mobile.png) |
| PC 트리, 같은 좌표·yaw | [이전](../qa/camera-v44/before/desktop-tree.png) | [이후](../qa/camera-v44/after/desktop-tree.png) |
| 모바일 트리, 같은 좌표·yaw | [이전](../qa/camera-v44/before/mobile-tree.png) | [이후](../qa/camera-v44/after/mobile-tree.png) |

[모바일 색상 펼침](../qa/camera-v44/after/mobile-tree-expanded.png) · [모바일 가로](../qa/camera-v44/after/mobile-tree-landscape.png).

[오마카세](../qa/camera-v44/after/desktop-dining.png) · [모바일 오마카세](../qa/camera-v44/after/mobile-dining.png) · [불꽃 감상](../qa/camera-v44/after/desktop-fireworks.png) · [퀴즈](../qa/camera-v44/after/desktop-quiz.png).

입력/시점 기록: [camera.json](../qa/camera-v44/after/camera.json), [mobile-input.json](../qa/camera-v44/after/mobile-input.json), [flow.json](../qa/camera-v44/after/flow.json). [재현 방법](../qa/camera-v44/README.md).

## 주요 파일

- `dist/exploration-camera.js`, `camera-clearance.js`, `park.js`, `game-input.js`: 시점 소유권·입력·충돌·복원.
- `dist/dining-seats.js`, `ride-seats.js`, `winter-experience.js`, `server/ride-api.js`, `server/api.js`: 시설 내 원자적 좌석 배정.
- `dist/tree-layout.js`, `winter-world.js`, `shared-tree.js`: 트리 유효 거리·실제 메시 선택.
- `dist/firework-score.js`, `firework-notice.js`, `quick-quiz.js`, `index.html`, `ui-system.css`: 공연 상황 안내·조용한 퀴즈·카메라 감도.
- `dist/startup-work.js`, `mesh-batch.js`, `themepark-world.js`, `alpine-resort.js`, `world-art.js`, `snow-path.js`: 같은 월드 데이터의 단계적 생성.

실행 시점의 포인터 잠금 권한·브라우저 지원은 실패 시 드래그로 대체한다. 사용자 승인 전 GitHub/Vercel/Sites 반영은 계속 보류한다.
