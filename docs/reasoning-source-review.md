# 논리·확률 콘텐츠 검토 기록

검토일: 2026-11-14. 범위: `dist/content/reasoning.json`의 rea01–rea20, 완성 문항 20개(논리 9개, 확률 11개), 대표 4개. 각 문항에는 별도 응용 질문이 있어 총 40개 질문을 제공하지만 콘텐츠 수는 **20개**로 센다.

`source-checked`는 아래 원문을 실제 열어 개념과 설명 범위를 대조하고 예제의 논리·수치를 AI 보조로 검산했다는 뜻이다. 독립적인 인간 전문가의 심사, 학습 효과 실험, 실제 사용자 이해도 검증을 뜻하지 않는다. 모든 문항의 `verification.note`에도 이 한계를 표시했다. IQ·지능 향상 등 검증하지 않은 효과를 주장하지 않는다.

## 원문 확인과 적용 범위

| 출처 | 직접 확인한 구간과 원리 | 연결 문항 |
|---|---|---|
| [OpenStax, Introductory Statistics 2e 3.2](https://openstax.org/books/introductory-statistics-2e/pages/3-2-independent-and-mutually-exclusive-events) | 독립 사건은 조건부 확률이 원래 확률과 같음. 상호 배타 사건은 교집합이 비어 있음. 복원 여부가 다음 추출의 조건을 바꿈. | rea01, rea11, rea13 |
| [UC Berkeley, Monty Hall](https://www.stat.berkeley.edu/~stark/SticiGui/Text/montyHall.htm) | 게임 규칙, 진행자의 정보와 행동, 항상 교체하는 전략의 2/3 성공률. 문항에는 선물 위치·공개·교체 규칙을 모두 명시. | rea02 |
| [MIT 6.042J 2010, Propositions](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/7853d585044ef21bce5f48ce5fc89d28_MIT6_042JF10_chap01.pdf) | 1.1.1 NOT/AND/OR, 1.1.2 IMPLIES, 역·대우 설명, 1.3 Predicates and Quantifiers. 조건문의 반례는 앞 조건 참·뒤 조건 거짓. | rea03, rea05–rea08 |
| [ONS, Bar charts](https://service-manual.ons.gov.uk/data-visualisation/chart-types/bar-charts) | Axis: 막대 길이가 값을 나타내므로 0 기준선이 필요하며, 잘린 축이 필요하면 다른 도표를 고려. 모든 종류의 그래프가 반드시 0부터 시작해야 한다는 주장은 하지 않음. | rea04 |
| [MIT 6.042J 2015, Mathematics for Computer Science](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/mit6_042js15_textbook.pdf) | 14.8, Rule 14.8.2(본문 574쪽): 일반화된 비둘기집 원리. 3.4의 De Morgan 법칙(3.11), 4.1의 연결 설명: 묶음 전체의 부정. | rea09, rea20 |
| [NIST DADS, Binary search](https://xlinux.nist.gov/dads/HTML/binarySearch.html) | 후보 구간을 반복해서 절반으로 줄이는 검색 원리. 문항의 예·아니오 질문 5회 하한은 별도 이진 기록 수 증명이며, 숫자 비교의 3결과를 그대로 인용한 것이 아님. | rea10 |
| [Stanford Encyclopedia of Philosophy, Bayes’ Theorem](https://plato.stanford.edu/entries/bayes-theorem/) | 조건부 확률의 방향, 기저율 및 참·거짓 양성을 결합한 관찰 이후 확률. 원리만 참조하고 공장 장치 1,000개의 표를 새로 구성. | rea12 |
| [OpenStax, Introductory Statistics 2e 3.3](https://openstax.org/books/introductory-statistics-2e/pages/3-3-two-basic-rules-of-probability) | 곱셈 규칙 P(A∩B)=P(B)P(A\|B), 독립일 때의 곱, 덧셈 규칙. 서로 배타적인 경로를 합하고 정확한 수열과 묶인 사건을 구별하는 데 적용. | rea13, rea17, rea19 |
| [OpenStax, Introductory Statistics 2e 4.2](https://openstax.org/books/introductory-statistics-2e/pages/4-2-mean-or-expected-value-and-standard-deviation) | μ=ΣxP(x), 장기 평균의 의미. 평균이 단일 시행 결과나 마감 보장을 뜻하지 않음. | rea14 |
| [Stanford Encyclopedia of Philosophy, Simpson’s Paradox](https://plato.stanford.edu/entries/paradox-simpson/) | 2장의 가중 평균과 집계 방향 역전, 3장의 인과 추론 조건. 2026-06-06 개정 원문 확인. 전체 또는 부분집단 중 어느 하나가 항상 인과적으로 옳다고 주장하지 않음. | rea15 |
| [OpenStax, Introductory Statistics 2e 1.2](https://openstax.org/books/introductory-statistics-2e/pages/1-2-data-sampling-and-variation-in-data-and-sampling) | 표집, 대표성, 큰 편향 표본, 자발적 응답과 미응답의 문제. 조사 수가 커도 포함 경로의 편향은 자동 소거되지 않음. | rea16 |
| [UC Berkeley Data 140, Birthday Problem](https://data140.org/textbook/content/chapter-01/birthday-problem/) | 1.4.1의 독립·균등·365일 가정, 1.4.2의 여사건 곱, 1.4.4의 23명 임계 결과. 실제 생일 분포와 단순 모형을 구분. | rea18 |

이 문서의 출처는 모두 직접 본문을 확인했다. 기존 rea01의 구판 URL은 이번에 실제 확인한 2e URL로 교체했다. 검토 중 본문 접근에 실패한 Duke PDF와 Penn State 페이지는 출처로 사용하지 않았다. 출처 페이지에 있는 긴 문장이나 해설을 옮기지 않았으며, 문항·선택지·오답 설명은 한국어로 새로 작성했다. 카드 선택과 잘못된 라벨 상자는 널리 알려진 논리 퍼즐 유형이며 새로운 수학적 발견이라고 주장하지 않는다.

## 문항별 독립 검산

| 문항 | 검산과 충분 조건 |
|---|---|
| rea01 | 6회 동전의 64개 수열 중 앞 5회가 앞면인 2개를 조건으로 취하면 다음 앞면은 1/2. 공정·독립·불변 상태를 명시. |
| rea02 | 선물 3개 위치 × 선택 3개 × 가능한 진행자 행동을 확률 가중. 총 질량 1, 유지 1/3, 교체 2/3. 항상 빈 문을 열고 언제나 교체를 권한다는 조건 필요. |
| rea03 | 두 소지품의 4개 진리표 상태를 전수 확인. 열쇠만이면 B, 모두 가지면 A와 B. C는 ‘둘 다 없음’으로 모호성 제거. 복수 통과 가능성을 인정. |
| rea04 | 실제 증가율 (50−40)/40=25%; 잘린 막대 비율 (50−30)/(40−30)=2. 응용의 40%→50%는 10%포인트·25% 상대 증가. |
| rea05 | 비→등 조건을 만족하는 세 상태에서 대우가 모두 참. 역·이는 비 없음/등 켜짐 반례가 존재. 실제 센서 오류는 이 엄격한 모형 바깥임을 구분. |
| rea06 | 카드 숨은 면의 불리언 조합 16개와 검사 집합 16개 전수 검사. 규칙을 확실히 판별하는 최소 집합은 A·7 하나. 네 장 모두는 충분하지만 최소가 아님. |
| rea07 | 24개 순열 중 ACBD 유일. 응용에서 인접 조건 제거 시 ABCD, ABDC, ACBD, CABD 네 답이 가능함을 인정. |
| rea08 | 세 내용의 6개 순열 중 모든 라벨이 틀린 2개만 남음. C에서 빨강 관찰은 [파랑,혼합,빨강], 파랑 관찰은 [혼합,빨강,파랑]으로 유일. |
| rea09 | 6개/7개의 모든 3범주 개수 분포를 열거. 6개는 [2,2,2]가 실패 반례, 7개는 언제나 최대 범주≥3. 확률 모형 불필요. |
| rea10 | 1..32 각 값에 실제 절반 질문을 적용하면 5개 답으로 모두 유일하게 구분. 4회 기록 16개로는 불가능. 정확한 예·아니오, 적응 질문 가능을 명시. |
| rea11 | 한 주사위에서 1과 2는 동시 불가지만 P(2\|1)=0 ≠ 1/6. 응용의 짝수와 {1,2}는 겹치지만 조건부 확률이 1/3으로 같음. |
| rea12 | 2×2 표 합 1,000. 경고 조건 분모 108, 실제 고장 9: 1/12≈8.3%. 90%는 다른 방향의 조건부 확률. 실제 의료 의사결정 문항이 아님. |
| rea13 | 구별한 실물 구슬의 비복원 순서 6개 중 빨강 포함 4개: 2/3. 복원 순서 9개 중 5개: 5/9. |
| rea14 | A 기대값1·분산0; B 기대값1·분산3. 응용 두 시간 분포의 평균5는 같지만 6분 마감 보장 여부가 다름. |
| rea15 | 부문별 B>A, 집계 A82/100>B30/110. 같은 1/2 가중치에서는 A50%<B60%. 배정 원인·능력을 이 기록만으로 확정하지 않음. |
| rea16 | 동일한 팬 응답 9,000/10,000을 유지해도 미관찰 10,000명의 의견에 따라 전체 찬성률 45%와 95%가 모두 가능. 전체 비율을 식별할 수 없음을 반례로 확인. |
| rea17 | 1/2×1/2+1/2×1=3/4. 응용 상자 균등 선택은 빨강 1/2지만 구슬을 합쳐 균등 추출하는 다른 절차는 1/10. |
| rea18 | 1−∏(365−i)/365, i=0..22 =0.5072972343239857. 22명은 절반 미만, 23명은 이상. 특정인과 일치 1−(364/365)^22≈5.86%와 구별. |
| rea19 | 4회 공정 동전의 16개 수열 전수 검사. HTHT·HHHH는 각각1개, 앞면 정확히2회는6개. 미리 지정한 정확 수열 조건 필요. |
| rea20 | 두 불리언의 4행에서 ¬(A∧B)=¬A∨¬B 및 ¬(A∨B)=¬A∧¬B 확인. 처리 중·알 수 없음 같은 제3상태는 명시적으로 제외. |

## 실행한 자동 검증

`node --test tests/reasoning-content.test.mjs` — **43/43 통과**. 본문 구조·시뮬레이션 계약, 20개 본문 개념 검산, 복습 계약과 20개 전이 문제 검산이다. Node의 내장 테스트 러너로 실행했다. 이 테스트는 UI 조작, 모바일 화면, 게임 이동, API 응답을 검증하지 않으며 그 영역은 부모 작업의 통합 검증 대상이다.

대표 4개의 `simulation.kind`(coin, monty, bridge, graph)는 기존 프런트엔드 계약을 유지했다. 새 문항 16개는 읽기 가능한 조건·판단·힌트·단계별 해설·선택지별 오류·새 상황 응용·한계·출처를 모두 포함한다. 외부 API 호출 없이 제공되며 모의 AI 응답을 실제 기능으로 표시하지 않는다.

후속 확장: 본문 20개 + 즉시 응용 20개 + 지연 복습 20개. 복습은 각 즉시 응용과 다른 상황을 사용한다.
