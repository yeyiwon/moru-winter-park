# 인문·경제·언어·미디어·기술 콘텐츠 검토 기록

검토일: 2026-11-14. 대상: `dist/content/humanities.json`.

## 납품 범위

- 20개 완성 데이터: hum01–hum20. 대표 콘텐츠는 hum01–hum04 네 개만 지정했다.
- 5개 분야: 경제, 역사, 미디어, 언어, 기술. 전체 60개 중 이 파일이 맡은 20개이며, 전체 분야 수와 UI 연결은 통합 검증 대상이다.
- 기존 12개를 원문과 다시 대조하고, 언어·기술·통계 판단 문제 8개를 추가했다. 단순 문구 변경으로 개수를 늘리지 않았다.
- 각 항목에 조건, 판정, 힌트 2단계, 핵심 해설, 단계별 상세 해설, 선택지별 설명, 새로운 상황의 응용 문제, 한계, 실제 출처와 확인일을 넣었다.
- 관점 비교 hum01·hum02에는 각 모델의 주장·근거·전제·범위·한계와 판단 구분, 판단을 바꿀 추가 정보 질문이 있다. 사실에 반하는 주장을 동등한 관점으로 놓지 않았다.

## 검증 방법과 한계

연결된 원문을 웹에서 열고 `locator` 부분과 설명의 대응을 확인했다. `source-checked`는 AI 보조 원문 대조를 뜻하며 독립 전문가의 심사·인증을 뜻하지 않는다. 숫자와 인물, 편지·일기·지도·앱 사례는 학습용으로 구성한 상황이다. 실재 사건의 기록이나 현재 경제 수치로 표시하지 않는다. 원문을 길게 복제하지 않고 개념을 새 상황에 적용했다.

hum17의 초기 후보였던 미국 Census 정의 페이지는 첫 조회 후 후속 조회에서 시간 초과가 반복되어, 최종 출처를 정상 열람한 NIST의 평균·중앙값 정의로 교체했다. 실패한 URL을 최종 출처로 남기지 않았다.

## 출처와 설명의 대응

| 항목 | 출처 | 실제로 대조한 부분 | 뒷받침하는 범위 |
|---|---|---|---|
| hum01 | [IMF · Externalities: Prices Do Not Capture All Costs](https://www.imf.org/en/publications/fandd/issues/series/back-to-basics/externalities) | Negative and positive externalities | 시장 거래에 포함되지 않는 제3자의 비용과 사적·사회적 비용의 차이 |
| hum02 | [OECD · Measuring well-being and progress](https://www.oecd.org/en/topics/sub-issues/measuring-well-being-and-progress.html) | 소개와 Key messages | GDP가 경제적 산출을 측정하지만 분배와 삶의 여러 측면을 포괄하지 않음 |
| hum03 | [미국 국립문서기록관리청 · Analyze a Written Document](https://www.archives.gov/education/lessons/worksheets/analyze-a-written-document-novice) | Observe its parts / Use it as historical evidence | 작성자·수신자·날짜를 확인하고 다른 사료로 맥락을 보완하는 문서 분석 |
| hum04 | [영국 통계청 · Percentages and percentage points](https://service-manual.ons.gov.uk/content/numbers/percentages) | Percentages and percentage points | 비율 간 차이인 퍼센트포인트와 상대적인 백분율 변화의 구분 |
| hum05 | [미국 노동통계국 · Consumer Price Index FAQ](https://www.bls.gov/cpi/questions-and-answers.htm) | 1. What is the CPI? | 가격 수준과 시간에 따른 평균 가격 변화율의 구분 |
| hum06 | [미국 노동통계국 · Consumer Price Index FAQ](https://www.bls.gov/cpi/questions-and-answers.htm) | 1. What is the CPI? / 2. Whose buying habits does the CPI reflect? | 소비자물가지수의 평균적 소비 바구니와 개인별 물가 경험의 차이 |
| hum07 | [Federal Reserve Education · Opportunity Cost](https://www.federalreserveeducation.org/teaching-resources/economics/scarcity/opportunity-cost) | Transcript · Lesson #3 | 기회비용은 포기한 대안 전부의 합이 아니라 가장 가치 있는 다음 대안 |
| hum08 | [OpenStax · Principles of Economics 3e, 2.1](https://openstax.org/books/principles-economics-3e/pages/2-1-how-individuals-make-choices-based-on-their-budget-constraint) | Sunk Costs | 회수할 수 없는 과거 비용과 현재 선택의 추가 비용·편익을 구별 |
| hum09 | [미국 국립문서기록관리청 · Analyze a Poster](https://www.archives.gov/education/lessons/worksheets/analyze-a-poster-novice) | Try to make sense of it | 제작자·대상 독자·제작 시기와 포스터의 주장 분석 |
| hum10 | [미국 국립문서기록관리청 · Analyze a Photograph](https://www.archives.gov/education/lessons/worksheets/analyze-a-photograph-novice) | Meet the photo / Try to make sense of it | 사진 속 관찰 내용과 촬영 목적·설명·맥락을 구별 |
| hum11 | [미국 국립문서기록관리청 · Analyze a Map](https://www.archives.gov/education/lessons/worksheets/analyze-a-map-novice) | Observe its parts / Try to make sense of it | 범례·축척·지도 제작 목적과 시기를 확인하는 방법 |
| hum12 | [OpenStax · Introductory Statistics 2e, 1.4](https://openstax.org/books/introductory-statistics-2e/pages/1-4-experimental-design-and-ethics) | Experimental Design and Ethics | 관찰 연구와 실험의 구별, 교란 요인과 무작위 배정 |
| hum13 | [Unicode · Characters and Combining Marks](https://www.unicode.org/faq/char_combmark.html) | Combining Marks / How are characters counted? | 사용자에게 보이는 문자 단위, 코드 포인트, 바이트의 차이 |
| hum14 | [Unicode Standard Annex #15 · Normalization Forms](https://www.unicode.org/reports/tr15/) | 1.1 Canonical and Compatibility Equivalence / 1.2 Normalization Forms | 정준 동등성과 호환 동등성, 정규화의 범위와 주의점 |
| hum15 | [W3C Internationalization · Choosing a Language Tag](https://www.w3.org/International/questions/qa-choosing-language-tags) | Introduction / Decision 1 / keep your language tag as short as possible | 언어 태그가 콘텐츠 언어를 식별하며 필요한 경우에만 부가 구별을 하는 원칙 |
| hum16 | [Stanford Encyclopedia of Philosophy · Pragmatics](https://plato.stanford.edu/entries/pragmatics/) | 1. Introduction / 3.1 Indexicals and Demonstratives | 지시 표현 해석에 화자·시간·장소 등 발화 맥락이 필요하다는 설명 |
| hum17 | [NIST/SEMATECH · Measures of Location](https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm) | Definition of Location / Why Different Measures | 산술평균과 중앙값의 정의, 큰 값이 평균과 중앙값에 미치는 영향의 차이 |
| hum18 | [Pew Research Center · Comparing Two Types of Online Survey Samples](https://www.pewresearch.org/methods/2023/09/07/comparing-two-types-of-online-survey-samples/) | How we did this / Terminology | 모집 방식이 다른 확률 기반·자발적 온라인 표본의 실제 비교 연구 |
| hum19 | [NIST CSRC Glossary · Digital signature](https://csrc.nist.gov/glossary/term/digital_signature) | Definitions; NIST SP 800-63-4 references | 디지털 서명의 인증·무결성 보호와 기밀성의 구분 |
| hum20 | [IETF RFC 9111 · HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111.html) | 1. Introduction / 4.2 Freshness / 4.3 Validation | 신선한 응답의 재사용과 원본 서버 재검증의 차이 |

## 편집상 구분

- hum01: 개인 비용 최소화와 외부 비용을 포함한 전체 비용 비교다. 외부 비용의 추정이 불확실하면 결론의 강도도 달라진다.
- hum02: GDP 측정 사실과 어떤 삶의 측면을 중요하게 보는가를 분리했다. GDP가 무의미하다는 결론을 내리지 않는다.
- hum03·09·10·11: 자료 제작의 의도·범위·맥락을 확인하는 방법을 가르친다. 가상의 자료 내용으로 실재 역사 사건을 주장하지 않는다.
- hum04: 상대 변화와 퍼센트포인트를 구분한다. 응용은 분류기의 정확도와 오류율 관계로 바꿔 같은 공식을 다른 맥락에서 쓰게 했다.
- hum05·06: 가격 수준/상승률과 개인 소비 비중을 구별한다. 고정 소비량 및 두 품목 묶음은 명시된 단순화다.
- hum08: 회수 불가능한 과거 비용만 제외한다. 앞으로의 취소 비용, 의무, 평판 등 실제 차이를 만드는 요소까지 무시하라는 뜻이 아니다. 응용은 추가 개발비 숫자 문제의 복제가 아니라 공연 참석과 휴식 비교다.
- hum12: 관찰 상관만으로 인과를 확정하지 않지만, 효과가 없다고 확정하지도 않는다.
- hum13·14: 보이는 글자 단위/코드 포인트/바이트와 정준 정규화를 구별한다. 정규화가 모든 비슷한 글자나 동음이의어를 합치는 처리는 아니다.
- hum15: W3C 출처는 콘텐츠 언어와 선택적인 지역 하위 태그를 설명한다. 국기만으로 언어를 표시하지 않는 디자인 결론은 그 구분을 사례에 적용한 추론이며 W3C의 직접적인 금지문 인용이 아니다.
- hum16: ‘내일·여기’ 해석은 발화 맥락에 달려 있다. 날짜를 정할 수 있어도 구체 장소 정보가 없으면 모른다고 답한다.
- hum17: 평균과 중앙값 어느 하나가 항상 정답인 것은 아니다. 큰 값을 제거하라는 식으로 설명하지 않는다.
- hum18: 큰 자발적 표본이 대표성을 보장하지 않는다는 판단이다. 실제 Pew 비교 연구의 특정 오차 수치를 모든 조사에 일반화하지 않는다.
- hum19: 신뢰할 수 있는 키·올바른 서명 검증이 조건이다. 무결성·인증과 기밀성을 분리하며 서명이 본문 암호화를 자동 제공한다고 설명하지 않는다.
- hum20: 명시적인 신선도 기간 안의 재사용 가능한 응답이라는 조건이다. 모든 새로 고침이 항상 같은 캐시를 사용한다고 단정하지 않는다.

## 실행한 데이터 검증

Python 3로 JSON을 로드하고 다음을 확인했다.

- 총 20개, 연속 식별자 hum01–hum20, 중복 없음, 대표 4개.
- 계약의 모든 필수 필드 존재. 선택지·정답 인덱스·오답 해설 길이 일치.
- 모든 항목에 힌트 2개, 상세 단계 3개 이상, 유효한 응용 정답.
- 난이도 1–3, 소요 시간 3–8분, 허용 공간 ID.
- 두 관점 항목의 비교 필드와 판단 구분·추가 질문 존재.
- 19개 고유 출처 URL과 각 출처의 위치·지원 범위가 모두 기록됨.
- 상대 감소 10→5 및 2→1은 50%, 소비 비중별 상승률은 2%·5%임을 독립 계산.
- 연봉 예시 평균은 40→50, 중앙값은 30으로 유지됨을 계산. 대기 시간 응용 중앙값은 3.
- 결합 문자 코드 포인트 수와 é·한글의 정준 정규화 사례를 Python Unicode 처리로 확인.

이 기록은 콘텐츠 데이터와 출처 검토 범위다. 해당 콘텐츠의 브라우저 접근성, 상태 저장, 공간 상호작용, 실제 모바일 조작을 이 파일 작성자가 테스트했다고 주장하지 않는다.
