# 실내 에셋 및 의상 연결 계약

## 실내 좌표와 이동

`dist/interior-layout.js`는 Three.js에 의존하지 않는다. 료칸은 `(400,0)` 중심의 42×34m 공간, 온실은 `(500,0)` 중심의 50×44m 타원형 공간이다. 기본 바닥은 `y=.09`다. 실외 문은 부모 월드에서 연결하고, 실내에서는 해당 room의 entry/exit를 사용한다.

- `interiorAt(x,z)`: 방 정보 또는 null.
- `interiorCanStandAt(x,z,radius=.35)`: 방 경계, 가구 및 설비 충돌.
- `interiorSurfaceHeight(x,z)`: 바닥/경사로 높이. 실내 밖은 null.
- `interiorCanMoveFrom(from,to)`: 같은 방의 충돌 없는 목적지이며 높이 변화가 .22m 이하인지 검사한다. 클라이언트는 이동 단계를 작게 나눠 호출해야 한다.
- `interiorPositionValid(x,y,z)`: 네트워크 위치 범위 검사. 가구 위의 지정 좌석 pose만 좁게 예외 허용한다.
- `interiorInteractions`: 실제로 서서 접근할 수 있는 상호작용 지점.
- `interiorActivityPoses`: 실제 좌석 위치. y는 좌석 표면 + .82m이며 모루가 바라보는 방향은 yaw다. 접근점으로 복귀한 다음 일반 이동을 재개해야 가구에 갇히지 않는다.

온실 경사로는 남쪽 지상에서 시작해 타원을 270° 돌아 6m 위에 도달한다. 상단에는 수평 전망 구간이 있다. 모든 경사로 높이를 모델과 동일한 상수로 계산한다. 층 사이 순간이동이나 경사로 옆에서 갑자기 올라타는 이동을 높이 차 검사로 막는다.

## 렌더링

`buildInteriors(scene)` 반환값은 `{root,rooms,occluders,setActive,setCamera,update}`다. 처음에는 숨겨진 상태다. `setActive('ryokan'|'conservatory'|null)`로 방을 표시하고 실외 월드의 가시성은 호출자가 관리한다. 카메라 위치 계산 후 `setCamera(camera.position)`를 호출하면 가까운 료칸 벽과 천장을 잘라 시야를 확보한다. `update(time,still)`은 활성 방의 족욕 증기, 폭포 및 오로라 shader 시간만 갱신한다.

가구, 가림막 및 충돌은 하나의 layout을 공유한다. 불투명한 정적 부품은 material별로 병합하고, 카메라 가림 처리용 벽 그룹 및 실제 경사로 mesh는 보존한다. 실내 창밖 설경도 각 방 그룹 안에 있으므로 실외를 숨겨도 유지된다.

## 유카타와 눈사람

`dist/winter-costumes.js`:

- `createYukata()`는 모루 `companion.shape` 로컬 원점에 붙이는 Group이다. 하단 곡면 옷자락, 교차 깃, 오비와 뒤 매듭, 곡선 소매, 설화 자수와 작은 직조 DataTexture를 포함한다. 얼굴과 눈 영역은 비운다. 기본 visible=true이며 실내 자동 착용/해제 정책은 호출자가 정한다.
- `createSnowfolk()`는 발밑 y=0, 총높이 약 2.57m인 눈사람 상인 Group이다. `group.update(time)` 또는 `group.userData.update(time)`으로 작은 고개/가지팔 움직임을 갱신한다. 안내/대화/AI 기능은 포함하지 않는다. 인스턴스마다 움직임 상태가 독립적이다.

## 검증 및 전달물

`node --test tests/interiors.test.mjs tests/winter-costumes.test.mjs`

7개 검사는 입장/퇴장/활동 접근 가능성, 각 방의 BFS 이동 경로, 1,000구간 경사로 연속성, 모델 raycast와 바닥 높이 일치, 실제 가구 표면과 좌석 높이 일치, 방 가시성 및 벽 cutaway, mesh/triangle 한도, 유카타 얼굴 가림 여부, 눈사람 인스턴스별 idle을 검증한다.

`scripts/export-interiors.mjs`, `scripts/export-winter-costumes.mjs`, `scripts/render-interiors.py`는 실제 생성된 geometry를 Blender로 전달해 GLB와 검사 PNG를 만든다. 산출물은 `/Users/yeiwon/Documents/Codex/2026-11-15/new-chat/outputs/interiors-v3`에 둔다. 런타임은 기존 JS geometry를 사용하므로 큰 GLB/JSON을 dist 또는 배포 번들에 복사하지 않는다.

Blender 프리뷰의 오로라/폭포는 WebGL shader를 재현하지 않는 단순 fallback 재질이며 증기 Points와 직조 texture도 전달하지 않는다. 따라서 PNG는 모델 배치·형태 확인용이다. 브라우저의 실내 입출입, 행동 취소, 카메라, 실제 모바일 조작과 원격 presence는 통합 후 별도 플레이 검증이 필요하다. 이 에셋 작업 자체는 commit/deploy를 수행하지 않는다.
