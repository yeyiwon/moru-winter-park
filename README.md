# 모루 겨울공원

Three.js 기반 겨울 소셜 공간. 스키·리프트, 온천, 놀이공원, 공동 트리와 퀴즈, 휴대 아이템을 제공합니다.

## 실행

```sh
npm ci
npm run dev
npm test
npm run build
```

## 배포

- Sites: `npm run build`로 Worker와 정적 자산을 패키징합니다. 기존 D1 DB와 관리자 ChatGPT 인증을 사용합니다.
- Vercel: `npm run build:vercel`로 정적 게임을 배포합니다. `/api`는 동일한 Sites 서버에 게스트 세션만 전달합니다. 따라서 두 주소의 방문자가 동일한 초대 공간을 공유합니다.
- 관리자 로그인·초대 생성은 기존 Sites 인증 주소에서 진행합니다. Vercel의 관리자 로그인 버튼도 해당 주소로 연결됩니다.
- 저장소에는 비밀 키나 사용자 DB가 포함되지 않습니다.

## 음악

First Snow, Moonlight, At The End Of All Things — Scott Buckley. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). 곡별 공식 출처와 변환 정보는 [음원 라이선스](dist/audio/LICENSE.txt)에 있습니다.
