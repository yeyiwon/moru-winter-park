# 공개 월드 운영 기반 — 로컬 검증본 (2026-11-19)

## 현재 상태

이 변경은 `codex/public-world-v43-release`에 보관하는 **미배포 수정본**이다. 사용자의 배포 보류 결정을 유지했다. GitHub push, Sites 업로드, Vercel 배포, 운영 DB 변경, Cloudflare 계정·리소스 생성은 하지 않았다. 로컬 성공을 운영 성공으로 간주하지 않는다.

- 공식 주소: https://moru-winter-park.vercel.app/
- 구현한 관리자 주소: 같은 도메인의 `/admin`. 운영에는 아직 새 인증 교환이 적용되지 않았다.
- 로컬 게스트: http://127.0.0.1:4189/
- 로컬 관리자 fixture: http://127.0.0.1:4190/admin (별도 QA 인증이며 실제 소유자 계정 검증이 아님).

## 실제 운영 구조와 소스 불일치

읽기 전용으로 확인한 구성은 Vercel 정적 프런트 + API proxy → 기존 Sites Worker + D1이다. 기존 이동 동기화는 HTTP polling이며 운영 Durable Object/WebSocket binding은 발견하지 못했다. Sites manifest는 D1/R2만 선언하므로 새 WebSocket Worker는 별도 연결이 필요하다.

| 출처 | 확인한 버전 |
|---|---|
| GitHub main | `46dc3223bed447ed0eba80aa1a6b83fd09975769` |
| Sites 실제 운영 54 | `01f00c60d9cb180704fde97ed27dbb6a6fe22fcf` / `appgdep_6afe9cb2e8e481918ca62ef842309219` |
| Sites 저장 55 | `59e7ec4ac0333455cda3d98fa3ae0a0b623fc8cc`, 54 이후 문서·검증 기록 변경 |
| Vercel production | `dpl_141ESF8WAfkspfe1XKsQMGRRD67D`, READY, Git commit metadata 없음 |

GitHub가 실제 서비스보다 뒤처져 있었다. 최신 Sites 소스 전체를 로컬 병합한 후 공개 운영 기능을 적용했다. 현재 운영의 WINTERLIGHT 브랜드, 직접 드래그 카메라, 원하는 좌석 선택, 3인 오마카세·셰프, 퀴즈 지식집, 료칸·천문대 디테일을 유지했다. 과거 미배포 v44 카메라/자동 좌석 정책을 현재 화면과 섞지 않았다. 초기화 작업 분할은 동일한 geometry 생성 순서를 유지하며 다시 적용했다. GitHub 원격 동기화는 아직 미완료이며 정상 CI 자동 배포라고 표시하지 않는다.

## 공개 입장과 소유자 인증

서버가 생성한 임의 세션을 HttpOnly cookie로 발급한다. 초대 없이 동일한 `winter-plaza`에 들어가며 30일 익명 기록을 재사용한다. 기존 초대 데이터와 관리자 관리 API는 남기되 공개 입장의 필수 조건으로 사용하지 않는다. 쿠키 삭제·다른 기기의 익명 데이터 복구는 지원하지 않는다. 차단은 서버 발급 익명 identity 기준이므로 쿠키를 지우고 새 identity를 만드는 공격을 영구적으로 막는 장치가 아니다. 공개 운영 시 edge의 IP/행동 기반 제한과 비용 경보를 함께 검토해야 한다.

공식 도메인의 `/admin` → 기존 Sites의 소유자 인증 → 60초 일회용 코드 → 공식 도메인 교환으로 연결한다. 임의 state는 HttpOnly cookie와 대조하고, 코드는 hash만 저장하며 원자적으로 소비한다. 관리자 세션은 새 identity로 회전하고 8시간 만료한다. URL fragment 코드는 즉시 제거한다. 닉네임·프런트 변수·URL 값으로 권한을 부여하지 않는다. Vercel proxy는 인증 헤더를 그대로 전달하지 않으며 허용한 cookie만 전달한다.

로컬: 코드 재사용, state 불일치, 일반 게스트 권한, CSRF 차단을 검사했다. 닉네임·외형 변경은 세션별 분당 30회로 제한한다. **실제 ChatGPT 소유자 인증을 두 도메인에서 왕복하는 검사는 UNKNOWN**이다. 배포 후 소유자가 직접 확인해야 한다.

## 실시간 서버

- `realtime/worker.js`: Cloudflare Durable Object의 WebSocket Hibernation API. 하나의 논리적 월드, 최대 100명, 같은 구역에서 가장 가까운 32명만 전송한다. 이 정원은 로컬 부하 시험용 상한이며 운영에서 보장된 수용량은 아니다.
- 위치는 Worker 메모리/소켓 attachment에 저장한다. D1은 10초 checkpoint와 영속 상호작용에 사용한다. 이동 패킷마다 D1을 쓰지 않는다.
- 이동 10Hz, 정지 0.75초, 비활성 화면 4초 주기. 서버 15msg/s 제한, 30msg/s 초과 연결 종료, payload 2KB 제한. 패킷 sequence·시각·지형·속도·예약 좌석 위치를 검사한다.
- 첫 응답은 전체 profile, 이후 변경 필드만 보낸다. 좌표는 0.001 단위다. 요청한 클라이언트에만 snapshot을 응답하며 매 이동마다 전원 broadcast하지 않는다.
- 짧은 signed ticket은 WebSocket subprotocol로 보내 URL에 남기지 않는다. lease는 120초, 40초마다 서버 세션 재검증. 서버 RPC는 서명·시각·nonce 검사와 2.5초 timeout을 사용한다.
- 재연결은 지수 backoff로 최대 6회 후 멈춘다. 온라인 복귀/화면 활성화 시 다시 시도한다. 같은 세션의 중복 탭은 기존 연결을 종료한다.
- 강퇴·차단은 기존 DB 권한 검사와 연결 폐기를 함께 수행한다. 취소한 ticket은 남은 유효 기간보다 길게 거부한다. Hibernation 시 lease·pose·sequence와 공유 공연 상태를 복구한다.
- 새 서버 설정이 없으면 기존 12명 polling을 유지한다. 설정한 서버가 불통이면 새 입장을 503으로 제한한다. 이미 저장된 채팅·장식은 알림 전달 실패 때문에 되돌리지 않는다.

현재 100명을 넘는 분산 구역 처리와 200명 확장은 구현하지 않았다. 호스팅 CPU·DB 지연을 관측한 뒤 상한과 관심 구역 분할을 결정해야 한다. 신규 서비스는 아직 미프로비저닝 상태다.

## 불꽃놀이

게스트는 활동 탭에서 신청한다. 서버의 원자적 조건부 저장으로 동시 신청을 한 ID·seed·시각에 합친다. 10초 countdown → 74초 공연 → 종료 후 15분 제한. 별도 예약 queue는 제공하지 않는다. 이미 준비/진행 중이면 같은 공연을 안내한다. 관리자는 cooldown을 건너뛸 수 있으나 활성 공연과 겹칠 수 없다.

중간 접속은 현재 시각부터 재생한다. 알림의 ‘불꽃놀이 보기’를 눌렀을 때만 시선을 보간하며 드래그·줌·R·이동·탑승 시 자동 감상을 끝낸다. 화면 전체 flash나 강제 이동은 추가하지 않았다. 관리자의 중단은 idempotent이며 이미 예약한 다음 일반 공연 시각을 보수적으로 유지한다. 이전 버전이 저장한 공연의 기존 deadline은 호환용으로 보존하며 새 공연부터 15분 정책을 쓴다.

## 운영 관측과 데이터 보존

관리 UI는 활성 연결·구역·최근 서버 오류·5분 오류 추이·서버 왕복 지연·빌드 revision·장식 backup 상태를 표시한다. 차단 해제와 30일 관리 조치 기록을 추가했다. 외부 알림 서비스는 연결하지 않았으며 관리자 화면 밖의 push/email 장애 통보는 UNKNOWN이다. DO 카운터는 현재 isolate 기간이고 장기 모니터링 자료로 해석하면 안 된다.

운영 적용된 migrations 0000–0016은 그대로 유지했다. 새 `0017_dazzling_firelord.sql`은 owner code/session, moderation audit, error revision/index만 추가한다. 운영 DB에는 실행하지 않았다. 테스트 DB에 기존 방문자·소원·장식·퀴즈 기록을 넣고 0017 전후 행이 같은지 비교한다. 기존 장식 backup/복구는 유지하지만 전체 D1 backup 복구 검증은 UNKNOWN이다.

## 검증 범위와 남은 운영 조건

실제 결과는 [TESTING](TESTING.md), [PERFORMANCE](PERFORMANCE.md), [배포 절차](DEPLOYMENT.md)를 따른다. 물리 Windows/Edge, Safari, iPhone, Android, 발열·배터리·장시간 메모리 안정성, 인터넷 환경 지연과 실제 D1 billing rows는 UNKNOWN이다. 모바일 Chrome 화면 에뮬레이션을 실제 스마트폰 검사라고 표시하지 않는다.

승인 후에만 같은 commit으로 GitHub·Sites·Vercel을 맞추고, 별도 staging WebSocket 및 전체 DB backup을 먼저 검증해야 한다. 현재 운영 사이트에는 이 수정본이 반영되지 않았다.
