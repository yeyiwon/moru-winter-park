# 일상 호기심 추가 콘텐츠 출처 대조

- 대조일: 2026-11-15
- 추가: day01–day12, 12개. 기존 68개와 제목·주제를 대조했습니다. 모두 representative:false입니다.
- 출처를 실제 열어 해당 절을 읽은 AI 편집 검토입니다. 독립 전문가 심사가 아닙니다.
- 상황·수치·선택지·응용·복습은 독자적으로 구성했습니다. 기사 문장을 번역 복제하지 않았습니다.
- 원문 주장을 단순화한 조건과 적용 범위는 각 항목 boundaries에 표시했습니다.

| ID | 주제 | 확인한 원 출처와 위치 | 대조 범위 |
|---|---|---|---|
| day01 | 파란 낮과 붉은 저녁은 같은 햇빛인데 | [NASA · Why Is the Sky Blue?](https://spaceplace.nasa.gov/blue-sky/en/) · What makes a red sunset? | 태양 고도에 따른 대기 통과 거리와 산란 |
| day02 | 무지개 끝으로 걸어가면 닿을까 | [NOAA NESDIS · What Causes a Rainbow?](https://www.nesdis.noaa.gov/about/k-12-education/optical-phenomena/what-causes-rainbow) · The Short Answer / Why Is a Rainbow a Bow—or Arc? | 관찰자 위치, 굴절·반사, 원형 무지개 |
| day03 | 우주 정거장에서는 중력이 꺼질까 | [NASA · What Is Microgravity?](https://www.nasa.gov/learning-resources/for-kids-and-students/what-is-microgravity-grades-5-8/) · Is There Gravity in Space? / Why Do Objects Float in Orbit? | 궤도 중력과 공동 자유낙하 |
| day04 | 밤하늘의 초록 커튼은 햇빛 반사일까 | [NASA · What Is an Aurora?](https://spaceplace.nasa.gov/aurora/en/) · What makes this happen? | 태양 활동, 자기장, 대기 기체의 발광 |
| day05 | 작아진 파일이 글자 하나도 잃지 않을 수 있나 | [MDN · Lossless compression](https://developer.mozilla.org/en-US/docs/Glossary/Lossless_compression) · Lossless compression 정의 | 정확한 원본 복원과 가역성 |
| day06 | 사진을 크게 저장하면 사라진 털결도 돌아올까 | [MDN · Lossy compression](https://developer.mozilla.org/en-US/docs/Glossary/Lossy_compression) · Lossy compression 정의 | 손실 압축의 비가역성과 원본 정보 삭제 |
| day07 | 짧은 링크는 목적지를 미리 알려 줄까 | [MDN · Redirections in HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Redirections) · Principle / Redirection loops | Location 기반 이동 안내와 순환 리다이렉트 |
| day08 | 파일 지문이 다르면 내용도 다를까 | [MDN · Hash function](https://developer.mozilla.org/en-US/docs/Glossary/Hash_function) · Hash function / Cryptographic hash functions | 가변 길이 입력, 고정 길이 출력, 충돌 저항성 |
| day09 | 주사위 합은 모두 똑같이 나올까 | [OpenStax · Introductory Statistics 2e 3.1](https://openstax.org/books/introductory-statistics-2e/pages/3-1-terminology) · Equally likely outcomes / sample space | 같은 확률의 표본공간에서 사건의 결과 수를 나누는 원리 |
| day10 | 좋아하는 간식을 더했더니 사람이 늘었다 | [OpenStax · Introductory Statistics 2e 3.3](https://openstax.org/books/introductory-statistics-2e/pages/3-3-two-basic-rules-of-probability) · The Addition Rule | 합집합에서 교집합을 한 번 빼는 원리 |
| day11 | 색 세 개와 모자 두 개면 코디는 다섯 개? | [OpenStax · College Algebra 2e 9.5](https://openstax.org/books/college-algebra-2e/pages/9-5-counting-principles) · Using the Multiplication Principle | 독립적으로 허용되는 단계별 선택의 수를 곱하는 원리 |
| day12 | 20% 줄이고 20% 늘리면 제자리일까 | [OpenStax · College Algebra 2e 6.1](https://openstax.org/books/college-algebra-2e/pages/6-1-exponential-functions) · Identifying Exponential Functions / percent change | 일정한 비율 변화와 곱셈 계수의 관계 |

## 독립 계산 검증

- day08: 결정적 함수에서 f(a)≠f(b)이면 a≠b. 역방향의 동일성 보장은 주장하지 않았습니다.
- day09: 독립인 공정한 6면 주사위 36쌍을 열거하면 합 7은 6쌍, 합 2는 1쌍. 응용의 합 3은 2쌍, 합 12는 1쌍입니다.
- day10: 12+9−5=16, 20−16=4. 응용 18+15−8=25입니다.
- day11: 자유 조합 3×2=6, 응용 4×3=12. 제한 조합 1+2+2=5입니다.
- day12: 100×0.8×1.2=96, 응용 200×0.5×1.5=150. 80→100 증가율은 20/80=25%입니다.

## 제외와 한계

- NASA의 /rainbow/en/ 경로는 404여서 사용하지 않았습니다. 실제 열린 NOAA 원문으로 대체했습니다.
- OpenStax Contemporary Mathematics의 시도한 경로는 열리지 않아 사용하지 않았습니다. 실제 열린 College Algebra 2e 9.5를 사용했습니다.
- 현재 천체 위치, 특정 브라우저 버전별 동작, 법률·의료 판단 등 시간 민감하거나 고위험인 주장은 추가하지 않았습니다.
- day01의 노을·day02의 무지개·day03의 자유낙하·day04의 오로라는 핵심 기전을 설명하며 개별 관측을 완전히 예측하는 모형은 아닙니다.
