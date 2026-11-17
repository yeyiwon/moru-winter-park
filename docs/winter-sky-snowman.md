# 겨울 하늘·광장 눈사람 연결

## 소유 변경

- `dist/winter-sky.js`: 기존 API 유지. 하늘 오로라와 상세 달을 관리한다. 온실은 월드 통합 과정에서 제거했다.
- `dist/plaza-snowman.js`: 기존 빛의 듀엣을 대신할 독립 눈사람 에셋. 기존 활동 목록·이벤트·충돌 등록은 호출자가 처리한다.

## 오로라와 달

기존 980m 폭의 3개 커튼을 190m/145m 폭의 2개 원거리 커튼으로 바꿨다. 세로 높이도 25–35m 정도로 제한한다. 형상이 수평 방향으로 접혀 삼각형이 중복되지 않도록 monotonic mesh를 유지한다.

단순 축소에 그치지 않고, 서로 다른 높이의 가는 수직 ray, 상단 filament, 낮은 채도의 녹색·민트·청색 층, 길이 방향의 불균일한 밝기, 느린 깊이 fold, 상단·양 끝의 점진적인 소실을 적용했다. NormalBlending을 사용해 겹침이 과도한 발광으로 변하지 않는다. 높음에서는 2개, 보통/낮음에서는 주 커튼 1개를 표시한다. 실내·낮에는 숨긴다.

`createDetailedMoon()`은 반지름 6.8m인 원거리 구체다. NASA CGI Moon Kit의 실제 LROC WAC 색상 모자이크(1024×512)를 사용한다. 파일과 출처·라이선스는 `dist/textures/`에 포함했다. 네트워크 의존 없이 같은 배포에서 제공하며 이미지 실패 시 기존의 결정론적 표면으로 대체한다. 과도한 halo 없이 명암 경계와 약한 지구 반사광을 표현한다.

`lunar-phase.js`는 SunCalc 1.9.0의 최소 천문식을 사용해 현재 날짜의 대략적인 밝은 면 비율과 차고 기우는 방향을 계산한다. 실제 시간 갱신마다 반영되며, 사용자가 낮/밤 조명을 선택해도 실제 날짜는 유지한다. USNO의 2026-11-09/17/24 및 12-01 위상 시각과 비교했다. 11월 17일 20:48 KST가 상현이다. 정밀한 관측 시뮬레이션은 아니며 달의 하늘 위치와 겉보기 크기는 아트 디렉션에 따른다.

새 달은 `createWinterSky`가 자동 생성한다. 기존 `quiet-sun-moon`은 밤에 숨기고 낮에는 유지해 중복 표시를 방지한다. 기존 DirectionalLight 위치는 바꾸지 않는다.

`themepark-world.js`의 sky sphere shader에 남아 있던 넓은 `band/folds` 배경 무늬도 통합 과정에서 제거했다. 오로라 두 구현이 겹치지 않는다.

## 눈사람 API

```js
const snowman = createPlazaSnowman(scene, {x:-6.5,y:.09,z:3});
snowman.update(time, still, player); // player는 optional {x,z}
snowman.interact(time);             // 시작하면 true, 이미 동작 중이면 false
snowman.busy;                       // 현재 행동 중인지
snowman.collision;                  // {x,z,r:1.02}
snowman.dispose();
```

광장 눈사람은 머리를 넓히고 얼굴을 낮춰 둥근 비율로 조정했다. 짧은 당근코, 작고 둥근 장갑, 기본 볼 색을 사용한다. 우체국·스키장 상인도 큰 머리와 장갑을 적용했다.

4.2초 동안 오른손이 코를 잡고 실제 당근 mesh를 분리해 바라본 뒤 제자리에 돌려놓는다. 평소에는 손을 흔들고 작은 점프를 하며, 상호작용 중에는 이 동작을 멈춘다. 손·팔 관절이 당근을 따라 움직이고 눈, 입, 볼, 고개가 함께 반응한다. 반복 클릭은 현재 동작을 재시작하지 않는다. 움직임 줄이기에서는 정상 표정과 코 위치로 즉시 정리한다. AI 안내·NPC 대화·퀘스트를 추가하지 않는다.

고정 부품은 재질별로 병합했다. 28 meshes / 40,000 triangles 미만이며 매프레임 mesh를 만들지 않는다. 실제 이동하는 부위는 머리·눈·표정, 독립 당근, 두 팔과 손, 천으로 만든 목도리 꼬리다. 표정과 형태는 기존 캐릭터를 복제하지 않은 원본 디자인이다.

## 검증 범위

`node --test tests/aurora-curtains.test.mjs tests/plaza-snowman.test.mjs`

5개 검사는 오로라 범위/접힘/유한 geometry, 밤·실내·품질 전환, 달 표면의 지형 변화와 shader 명암 경계, 실제 코 분리·손 위치·복귀, 반복/움직임 줄이기, 에셋 예산과 관절 행렬을 검사한다. 실제 GPU shader 화면, 월드와 합친 카메라 구도 및 활동 버튼은 별도의 브라우저 통합 검증 대상이다.

최종 NPC의 손 흔들기·코를 든 두 자세는 실제 geometry와 normal을 Blender로 렌더링해 확인했다. 결과는 `/Users/yeiwon/Documents/Codex/2026-11-15/new-chat/outputs/winter-v27/npc-review/plaza-snowman-review.png`에 있다. 독립 모델 렌더는 앱 shader/월드 통합 화면의 증거가 아니다.
