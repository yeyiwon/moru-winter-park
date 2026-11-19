# WINTERLIGHT — 실버·아이스 블루 / 원본 로딩 트리

## 최종 사용자 선택

- 이름은 **WINTERLIGHT · 윈터라이트**로 확정했다.
- 로고는 **로딩창의 트리 모양 그대로** 요청했다. 먼저 만든 결정형 심볼을 원본 트리로 교체했다.
- 금색 대신 실버·파랑, 작은 대문자, 로고 아래 부제 없음.
- HIBERNA / NIVIS 등 대체 이름은 채택하지 않았고, 해당 비교 자산과 추천 표시는 제거했다.

## 모양을 보존한 방법

`dist/luminous-loading.js`의 `loadingTreePath()`를 브랜드 생성 스크립트에서 직접 import한다. 원본의 연속 Bézier 경로와 600:540 좌표계, 가로세로 비율을 보존하고 배치는 동일 비율 확대·축소와 이동만 사용한다. 경로를 다시 그리거나 꼭대기에 장식을 추가하지 않는다.

정적 로고는 로딩 트리가 완성된 모습을 사용한다. 기존 로딩의 halo/soft/core 세 겹 빛을 사용하며 작은 아이콘에서는 가독성을 위해 선 두께를 조정한다. SVG 로고 자체에는 animation/script가 없다. 로딩창의 곡선·시간·실제 준비 단계·동작은 유지한다.

## 디자인과 적용 범위

- 쿨화이트 `#f6f9fc`, 실버 `#c4d2df`, 밝은 실버 `#edf4fa`, 아이스 블루 `#8bbde5`, 스틸 블루 `#5e87ab`.
- 헤더: PC 14px, 모바일 13px, Pretendard 500 대문자. 아이콘 28px / 모바일 24px.
- 공유 카드: 1200×630, 푸른 겨울밤 바탕에 실버·파랑의 원본 트리와 작은 WINTERLIGHT. 한글·영문 부제 없음.
- 로고·파비콘·앱 아이콘·OG/Twitter 이미지·manifest·상단 헤더를 함께 갱신한다.
- 자산 revision은 `silver-tree-v1`, 서비스 워커는 기존 v45 직접 입력 기능을 보존한 새 캐시 이름을 쓴다.
- 실제 월드의 조명·시설 재질과 방문자 데이터·API 구조는 변경하지 않는다.

## 검증과 배포 기록

기준 소스는 최신 직접 입력 UI `4b4d12014f5edc0cbeee98035cfbda8673f49831`이며 동시 작업의 배포 기록 `377b968`을 병합해 보존했다.

먼저 실버·블루 결정형 시안을 소스 `3afbb03c0b775fcffbe318b8af0fc2756a0b5bc9`로 Sites 53 및 Vercel에 반영했고 각 origin의 HTTP 11개 검사가 통과했다. 그 뒤 사용자가 WINTERLIGHT 이름과 원본 로딩 트리를 선택해 이 최종 후속 변경을 진행했다. 이전 시안의 기록은 `qa/brand-silver/initial/`에 보존한다.

최종 검증 결과·배포 ID는 `qa/brand-silver/`에 기록한다. 전체 게임과 실물 모바일, 외부 메신저 캐시는 이번 브랜드 작업에서 새로 검증한 것으로 주장하지 않는다. 공개 GitHub 연결의 쓰기 권한 403은 기존 별도 동기화 제한이며, 기존 Sites 소스 저장과 Vercel 파일 배포를 사용한다.

최종 로컬 검증: Worker·Vercel build PASS, 기존 로딩·입력 검사 3/3 PASS. 6개 SVG의 트리 경로가 원본 문자열과 전부 일치함을 확인했다. OG PNG를 직접 열어 최종 모양을 확인했다. 정적 용량 22,646,442 B / 25,165,824 B, 코드 gzip 1,012,787 B / 1,280,000 B로 예산 검사 PASS.

## 최종 운영 반영 완료

- 소스: `01f00c60d9cb180704fde97ed27dbb6a6fe22fcf`.
- Sites: 버전 54, deployment `appgdep_6afe9cb2e8e481918ca62ef842309219`, succeeded.
- Vercel: `dpl_141ESF8WAfkspfe1XKsQMGRRD67D`, READY, 기존 `moru-winter-park.vercel.app` alias 정상.
- 양쪽 운영 HTTP 각각 11/11 PASS. WINTERLIGHT 제목, 원본 트리 로고·파비콘·CSS·manifest·로딩 모듈·미리보기·서비스 워커의 응답을 확인했다. 1200×630 공유 PNG는 45,581 B이며 로컬 준비본 SHA256과 일치한다.
- API health와 기존 초대 보호 응답도 읽기 검사 통과. 방문자 데이터에 쓰기 작업 없음.
- Vercel 빌드에서 공개 저장소의 고정 baseline 168파일 복원 및 237개 원본 소스 해시 검증 성공. 라우팅·환경 변수·도메인·Git 연결 설정은 변경하지 않았다.
