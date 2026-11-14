# API 결정 · 2026-11-14

현재 Sites 런타임 변수 목록은 비어 있으며, 앱에 연결된 추론 서비스 인증 정보가 없습니다. 현재 배포 형식은 정적 사이트입니다.

이번 버전은 모델을 실시간 호출하지 않습니다. 본문·힌트·선택지별 피드백·응용·복습은 출처 대조를 거친 정적 콘텐츠에서 제공됩니다. 자유 서술은 개인의 근거를 기록하며 자동 채점하지 않습니다. AI 피드백을 흉내 내는 응답은 없습니다. 앱의 외부 AI 호출 수와 그에 따른 추론 과금은 0입니다.

실시간 OpenAI API를 추가하려면 프로젝트용 인증 정보와 서버 경유 호출, 사용할 모델·예산의 결정이 필요합니다. 공식 인증 문서에서 키의 서버 보관 조건을 확인했습니다. 가격 페이지는 현재 business/pricing으로 이동하므로 해당 페이지의 ChatGPT 좌석 가격을 API 토큰 가격으로 인용하지 않았습니다. 실제 API 모델을 연결하지 않은 상태에서 비용을 추정해 약속하지 않습니다.

확인 자료:
- https://developers.openai.com/api/docs/guides/api-keys
- https://developers.openai.com/api/reference/overview
- https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety
- https://openai.com/api/pricing/ (business/pricing으로 리디렉션, API 모델 단가 확인에 사용하지 않음)

실제 구현된 장애 대응:
- 콘텐츠 JSON 요청 병합(in-flight 중복 제거), 7초 제한, 재시도 버튼.
- 이전 콘텐츠 캐시가 있으면 네트워크 실패 시 캐시로 학습.
- Service Worker 설치 성공 후 동일 출처 정적 파일의 오프라인 응답.
- 저장 실패/손상 시 사용자 알림과 메모리 내 계속 진행.
- 시뮬레이션은 클릭당 최대 1,000회로 제한.

외부 모델 응답 캐싱·서버별 사용자 사용량 제한은 연결된 외부 모델이 없으므로 구현됐다고 주장하지 않습니다.
