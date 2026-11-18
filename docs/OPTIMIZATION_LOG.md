## v42 · 2026-11-19

OS 모션 감소가 앱의 명시적 선택을 무시하던 경로를 제거하고, 기본 보행·눈 낙하와 장식 애니메이션을 분리했다. UI는 품질별 배경/blur 차이를 제거했다. 불꽃의 수명·꼬리 지연과 소멸을 조정했으며 고정 GPU 버퍼를 유지한다. 382개 자동 검사·두 production build·용량 검사 PASS. 실제 Windows/갤럭시 검증 및 새 FPS 수치는 UNKNOWN. [상세](platform-motion-v42.md).

## 2026-11-19 v41 운영 검증 보완

유효 초대 PC/모바일 크기 2개 브라우저에서 공유 이동·발 애니메이션·정지·채팅·시설·재접속 PASS. 운영 PC 자동 medium 표본은 38.55fps(p95 33.4ms), 모바일 화면 high는 60fps(p95 16.7ms); 실제 스마트폰 결과가 아니며 PC 자동 품질의 프레임 저하를 남은 문제로 기록한다. 전체 380개 검사와 배포 성공을 모든 기기의 60fps 보장으로 표현하지 않는다. 음악 검사의 호스트 출력 장치 정지는 기본 audio 페이지로 분리하고, 무음 sink로 디코딩/전환/복구를 재확인했다. [세부 측정](PERFORMANCE.md), [검증](TESTING.md).

# 최적화 기록

## v41 · 2026-11-19

HDR/직접 출력 사전 컴파일과 RGBA16F sample 지원 검사, 동일 품질 render target 재할당 방지, custom VFX 출력 색공간 보완, 캐릭터 반복 구체 Geometry 재사용. 원격 좌표에 로컬 충돌/내비게이션을 적용하지 않고 제한된 snapshot 보간과 이동 거리 기반 보행을 사용한다. 음악 play 대기 중 중복 전환을 방지했다. 기존 LOD/품질·화질 회복 hysteresis·공유 파티클 버퍼를 유지한다. [원인과 변경](stability-v41.md), [동일 조건 실측](PERFORMANCE.md).


## v39 · 단일 공유 월드

별도 렌더러·의존성·시설·지형 변경 없음. 초대 토큰은 검증/입장에만 전송하고 이후에는 세션 쿠키를 사용한다. 방문자/초대/차단 검증을 한 조회로 묶고 토큰 해시에 인덱스를 둔다. 기존 위치 업데이트 간격, 원거리 관심 영역, GPU/VFX 품질 조절은 유지한다. 368개 검사 및 PC/모바일 크기 실제 Chrome 기능 회귀 PASS. 신규 FPS·GPU·물리 휴대폰 비교 수치는 UNKNOWN이며 v38 수치를 v39 측정으로 재사용하지 않는다.

## v38 · 2026-11-18

기준 운영 소스는 `0720494`. 구현 `275cdb7` 및 후속 수정. 기존 시설 좌표, 경로, 다리와 서버 접근 정책은 유지한다. 새로운 production dependency는 없다.

| 확인한 문제 | 변경 | 관련 파일 |
|---|---|---|
| 모바일 자동 화질 하락 시 글자·캐릭터가 뭉개짐 | DPR 하한 1 유지, MSAA 2, 낮음 단계에서는 Bloom/그림자부터 줄임 | `dist/render-budget.js`, `dist/glow-pass.js`, `dist/park.js` |
| 모든 크기의 캐릭터에 근거리 털 수 적용 | 투영 크기 기반 body/tail instance 수 제한, 원격 꼬리 상한 650 | `dist/companion.js`, `dist/character-tail.js` |
| 작은 모바일 말풍선마다 DOM 크기를 반복 측정 | ResizeObserver 캐시와 화면 경계 제한 | `dist/world-labels.js`, `dist/visitors.js` |
| 조이스틱 외곽 입력 제한·대시 절대 위치 상속 | 입력 반경과 손잡이 분리, pointer ID, 취소 시 초기화, 하단 버튼 행 | `dist/game-input.js`, 모바일 CSS |
| 최초 렌더보다 먼저 8초 연결 요청이 취소됨 | access/join만 30초 로딩 한계와 맞춤, 실제 준비 상태/재시도 유지 | `dist/social.js`, `dist/loading-state.js` |
| 저장 전에 외형이 동기화되거나 저장 중 덮어쓰기 | draft 분리, 서버 저장 완료 후 반영, 저장 중 presence 경합 방지 | customization/draft/social/server 모듈 |
| 꼬리 털이 띠로 몰리고 본체와 재질 차이 | 독립 seeded 분포·보간 노멀·끝 반구 털, body fibre/재질 재사용 | `dist/character-tail.js` |

유지한 기존 최적화: indexed 공간 batch, InstancedMesh, frustum culling, 카메라 BVH, 이동 경로 Worker, 실내 lazy 생성/해제, 주변 실제 광원 PC 6/모바일 4 슬롯, GPU VFX 고정 풀, polling backoff·원격 보간, 오디오 `preload=none`와 두 재생기 crossfade.

React를 사용하지 않는 Vanilla JavaScript 프로젝트이므로 React 리렌더 최적화는 해당 없음. 대부분 procedural Geometry/작은 텍스처이므로 새 KTX/Draco 디코더는 추가하지 않았다. 완전한 outdoor streaming, 최초 큰 월드 생성의 완전한 비동기 분할은 미구현이다.

수치와 한계: [PERFORMANCE.md](PERFORMANCE.md). 기능 회귀: [TESTING.md](TESTING.md). 배포: [DEPLOYMENT.md](DEPLOYMENT.md).
