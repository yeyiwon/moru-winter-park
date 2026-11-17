# 일일 퀴즈 출처 검토

검토일: 2026-11-17. 대상: `dist/content/daily-trivia.json`.

## 데이터 구성과 범위

과학·역사·지리·동물·자연·예술·일반 각 5문항, 총 35문항이다. 각 항목은 안정적인 ID, 한국어 질문, 서로 다른 선택지 4개, 정답 index(0–3), 짧은 해설, 출처 제목·URL, `verifiedAt`을 갖는다. 생활 속 얕은 상식과 안정적인 역사·분류 사실을 골랐다. 법률·의학 판단, 최신 순위, 변동 인구·관광 통계는 넣지 않았다.

기존 `science.json`, `humanities.json`, `everyday.json`과 출처 검토 문서의 NASA·USGS·OpenStax·NOAA·Carnegie Hall·NGA·UNSW 자료를 먼저 재사용했다. 기존 quick quiz의 달빛, 얼음, 문어, 거미, 돌고래, 펭귄, 눈 결정, 무지개, 에펠탑, RGB 주제도 출처를 붙여 다시 작성했다. 기존 파일은 수정하지 않았다.

문제·오답·해설은 사실을 대조하여 새로 작성했으며 API 질문이나 기관의 수업·기사 문장을 번역 복제하지 않았다. 이미지·음원·원문 본문을 포함하지 않는다. 출처의 저작권 라이선스가 이 새 문제 데이터 전체에 자동 적용된다고 주장하지 않는다.

`verifiedAt`은 AI 편집 과정에서 출처와 정답을 대조한 날짜이며 독립 전문가의 심사나 영구적 무오류 보증을 뜻하지 않는다. 공식 원문 또는 공식 페이지의 검색 본문을 확인했으며, 직접 열기 제한이 있는 두 항목은 아래에 명시했다. 접근 제한은 우회하지 않았다.

## 외부 API 조사와 채택 결정

### Open Trivia DB

[공식 API 문서](https://opentdb.com/api_config.php)는 무료 JSON API, API key 불필요, 데이터의 CC BY-SA 4.0 적용을 명시한다. 번역·수정한 문제를 공개 배포한다면 저작자 표시와 동일조건변경허락 의무를 함께 검토해야 한다. 문서의 설정은 범주·난이도·문제 형식·인코딩이며, 한국어 요청용 언어 매개변수는 확인되지 않았다.

[공식 API 1문항 응답](https://opentdb.com/api.php?amount=1&type=multiple)을 웹 도구로 확인했다. `response_code:0`과 `type`, `difficulty`, `category`, `question`, `correct_answer`, `incorrect_answers`가 왔고, 그 응답에는 근거 출처나 검증 해설 필드가 없었다. 이 샘플의 문제 문장은 프로젝트에 저장하거나 출제하지 않았다. API의 분류상 Verified 상태와 우리 서비스가 요구하는 한국어 해설·1차 출처 검증은 같은 것이 아니다.

문서상 호출당 최대 50문항, IP당 5초에 한 번 호출할 수 있다. Session token으로 재출제를 줄일 수 있지만 6시간 미사용 시 만료되고 풀이 소진되면 reset이 필요하다. 따라서 token만으로 영구적인 출제 이력을 보장할 수 없다.

### The Trivia API

[공식 Quickstart와 License](https://the-trivia-api.com/docs/)에 따르면 기본 질문은 key 없이 받을 수 있고 API·반환 데이터는 CC BY-NC 4.0이다. 상업 이용은 유료 구독 조건을 따로 확인해야 한다. 무료 공개 API라는 이유만으로 상업 이용까지 무제한 허용된다고 해석하지 않는다.

공식 응답 예시는 질문, 정답, 오답, 분류, 난이도, 태그 등을 제공하지만 해설이나 사실 근거 URL은 포함하지 않는다. [다국어 공식 안내](https://the-trivia-api.com/docs/tutorials/multilingual-quiz/)에는 `en`, `es`, `nl`, `hi`, `tr`, `fr`, `de`, `ru`, `pt`의 9개 언어가 나열되어 있고 한국어 `ko`는 없다. 번역 질문 기능에는 구독과 API key가 필요하다.

### 현재 결정

두 API 모두 조사했으나 미검토 문제를 실시간 게임에 직접 연결하지 않았다. 이번 한국어 35문항은 API 번역본이 아니라 기관의 사실 자료를 바탕으로 편집한 로컬 검증 데이터다. 외부 API를 나중에 도입하더라도 수집 → 라이선스 확인 → 한국어 편집 → 정답·오답·해설·근거 대조 → 관리자 승인 후 로컬 데이터에 반영하는 절차가 필요하다.

일별 seed, 사용자별 최근 ID, 일일 캐시와 실패 시 로컬 데이터 대체는 앱 구현의 책임이다. 이 파일은 외부 API의 당일 응답이나 외부 서비스 가용성에 의존하지 않는다. 35문항은 유한한 풀이므로 무한히 새로운 질문을 보장하지 않으며, 전체 풀이 소진되면 반복될 수 있다.

## 문항별 대조 기록

| ID | 분야 | 확인한 사실과 범위 | 출처 |
|---|---|---|---|
| daily-sci-01 | 과학 | 가시광선에서 달빛의 주된 원인은 햇빛 반사. NASA Moon FAQ 및 기존 science.json 출처 재사용. | [NASA · Top Moon Questions](https://science.nasa.gov/moon/top-moon-questions/) |
| daily-sci-02 | 과학 | 생활 환경의 얼음·액체 물 밀도 비교. 고압 얼음 등 특수 조건은 출제하지 않음. | [USGS · Water Density](https://www.usgs.gov/water-science-school/science/water-density) |
| daily-sci-03 | 과학 | 계절의 주된 원인은 자전축 기울기. 태양 거리 효과가 전혀 없다는 주장은 하지 않음. | [NASA Space Place · What Causes the Seasons?](https://spaceplace.nasa.gov/seasons/en/) |
| daily-sci-04 | 과학 | 컵 바깥 표면의 물방울에 한정. 수증기 응결과 컵 내부 물 누출 구분. | [USGS · Condensation and the Water Cycle](https://www.usgs.gov/water-science-school/science/condensation-and-water-cycle) |
| daily-sci-05 | 과학 | 물/공기 경계를 비스듬히 통과하는 빛의 굴절. | [OpenStax · The Law of Refraction](https://openstax.org/books/college-physics-2e/pages/25-3-the-law-of-refraction) |
| daily-hist-01 | 역사 | 세종의 1443년 창제·1446년 반포. 공식 검색 본문에서 대조; 직접 열기 403. 국립한글박물관 공식 검색 본문에서도 교차 확인. | [국가유산청 국가유산포털 · 훈민정음(해례본)](https://www.heritage.go.kr/heri/html/HtmlPage.do?pageNo=5_4_2&pg=%2Funesco%2FMemHeritage%2FMemHeritage_01.jsp) |
| daily-hist-02 | 역사 | 전시 안내서 인쇄 쪽 42–43의 로제타석 설명. 공식 PDF 검색 본문 대조; 직접 PDF 열기 403. 세 언어가 아니라 세 문자라는 표현 유지. | [British Museum · Hieroglyphs: Unlocking Ancient Egypt](https://www.britishmuseum.org/sites/default/files/2022-10/Hieroglyphs_unlocking_ancient_Egypt_large_print_guide_The_British_Museum.pdf) |
| daily-hist-03 | 역사 | UNESCO Description: 잉카, 안데스 지형, terraces. | [UNESCO World Heritage Centre · Historic Sanctuary of Machu Picchu](https://whc.unesco.org/en/list/274/) |
| daily-hist-04 | 역사 | IOC 본문: 최초 근대 올림픽, Athens/Greece/1896. | [IOC · Celebrate Olympic Games](https://www.olympics.com/ioc/celebrate-olympic-games) |
| daily-hist-05 | 역사 | NASA Apollo 11 임무 기록: 첫 유인 달 착륙과 승무원. | [NASA · Apollo 11](https://www.nasa.gov/mission/apollo-11/) |
| daily-geo-01 | 지리 | NOAA Ocean Fact: 가장 큰 대양 및 가장 깊은 평균 수심. 변동 통계 숫자는 배제. | [NOAA Ocean Exploration · How Big Is the Pacific Ocean?](https://oceanexplorer.noaa.gov/ocean-fact/pacific-size/) |
| daily-geo-02 | 지리 | NASA Short Answer: 남극은 대륙이며 남극점을 포함, 대부분 얼음에 덮임. | [NASA Space Place · What Is Antarctica?](https://spaceplace.nasa.gov/antarctica/en/) |
| daily-geo-03 | 지리 | UNESCO Description: 호주 북동쪽 해안. 생물 종 수 통계는 배제. | [UNESCO World Heritage Centre · Great Barrier Reef](https://whc.unesco.org/en/list/154/) |
| daily-geo-04 | 지리 | 운영기관 Access: Paris, Champ de Mars. 높이·방문객 수는 출제하지 않음. | [Eiffel Tower Official Website · Access](https://www.toureiffel.paris/en/access-map) |
| daily-geo-05 | 지리 | RMG의 위도·경도 정의. 적도 위도 0°와 본초 자오선 경도 0° 구분. | [Royal Museums Greenwich · What Is Longitude?](https://www.rmg.co.uk/stories/time/what-longitude) |
| daily-animal-01 | 동물 | Aquarium Cool facts: 심장 3개, 몸으로 1개·아가미로 2개. | [Monterey Bay Aquarium · Red Octopus](https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/red-octopus) |
| daily-animal-02 | 동물 | 일반적인 거미의 걷는 다리 네 쌍. 다리 부상 등 개체 예외와 더듬이처럼 보이는 촉지 구분. | [Australian Museum · Spider Anatomy](https://australian.museum/learn/teachers/learning/spider-anatomy/) |
| daily-animal-03 | 동물 | NOAA: 돌고래는 포유류, 폐로 공기 호흡. | [NOAA Ocean Service · Are Dolphins Fish?](https://oceanservice.noaa.gov/facts/dolphin.html) |
| daily-animal-04 | 동물 | San Diego Zoo: 펭귄은 새, 물속 이동에 적응한 날개. | [San Diego Zoo · Penguin](https://zoo.sandiegozoo.org/animals/penguin) |
| daily-animal-05 | 동물 | Smithsonian: egg/larva/pupa/adult 순서. | [Smithsonian Gardens · About Butterflies](https://gardens.si.edu/learn/for-educators/cultivating-habitat/butterfly-gardening/about-butterflies/) |
| daily-nature-01 | 자연 | 별 모양 결정의 기본 여섯 갈래 구조. 모든 눈이 완벽한 육각별이라는 단정은 제외. | [NOAA · How Do Snowflakes Form?](https://www.noaa.gov/stories/how-do-snowflakes-form-science-behind-snow) |
| daily-nature-02 | 자연 | NASA: 파장에 따른 대기 산란. 바다 반사설 배제. | [NASA Space Place · Why Is the Sky Blue?](https://spaceplace.nasa.gov/blue-sky/en/) |
| daily-nature-03 | 자연 | NASA: 태양 입자·자기장·대기 기체 발광. 달빛 반사와 구분. | [NASA Space Place · What Is an Aurora?](https://spaceplace.nasa.gov/aurora/en/) |
| daily-nature-04 | 자연 | OpenStax: 광합성 원료 CO2와 물, 빛에너지 및 탄소 고정. | [OpenStax Biology 2e · Overview of Photosynthesis](https://openstax.org/books/biology-2e/pages/8-1-overview-of-photosynthesis) |
| daily-nature-05 | 자연 | NOAA Why the Colors / Double Rainbow: 1차 무지개 바깥쪽 빨강, 2차 순서 반대. | [NOAA NESDIS · What Causes a Rainbow?](https://www.nesdis.noaa.gov/about/k-12-education/optical-phenomena/what-causes-rainbow) |
| daily-art-01 | 예술 | MoMA 작품 79802의 작가 기록. 제작 월에 관한 논쟁은 출제하지 않음. | [MoMA · Vincent van Gogh, The Starry Night](https://www.moma.org/collection/works/79802?locale=en) |
| daily-art-02 | 예술 | Louvre Salle des États의 작가·소장 작품 설명. | [Louvre · From the Mona Lisa to the Wedding Feast at Cana](https://www.louvre.fr/en/explore/the-palace/from-the-mona-lisa-to-the-wedding-feast-at-cana) |
| daily-art-03 | 예술 | Carnegie Hall Instructions: tempo=fast/slow, dynamics=loud/soft. 수업 활동/문장을 복제하지 않음. | [Carnegie Hall · Musical Expression Through Movement](https://www.carnegiehall.org/Education/Programs/Music-Educators-Toolbox/K-Musical-Expression-Through-Movement) |
| daily-art-04 | 예술 | NGA Background: form=3 dimensions, sculpture. 평면 그림의 입체감과 실제 입체 제작을 구분. | [National Gallery of Art · The Elements of Art: Form](https://www.nga.gov/educational-resources/elements-art/elements-art-form) |
| daily-art-05 | 예술 | UNSW Envelope, spectrum and timbre: 같은 높이·크기의 소리를 구별하는 특성. | [UNSW Physclips · Pitch, Loudness and Timbre](https://www.animations.physics.unsw.edu.au/jw/sound-pitch-loudness-timbre.htm) |
| daily-general-01 | 일반 | AFB 기본 6점 점자: 두 열, 세 행. 모든 점자 방식이 6점이라는 주장은 하지 않음. | [American Foundation for the Blind · What Is Braille?](https://www.afb.org/blindness-and-low-vision/braille/what-braille) |
| daily-general-02 | 일반 | FIDE Articles 3.2/3.5: 비숍 대각선 이동, 중간 말 넘기 금지. | [FIDE Handbook · Laws of Chess, Articles 3.2 and 3.5](https://handbook.fide.com/chapter/e012023) |
| daily-general-03 | 일반 | IOC Definition and meaning: 같은 크기의 고리 5개, 세계 선수들의 만남. | [IOC · Olympic Rings](https://www.olympics.com/ioc/olympic-rings) |
| daily-general-04 | 일반 | MDN RGB 정의: Red/Green/Blue 가산 색 모델. 물감 혼합과 구분. | [MDN · RGB](https://developer.mozilla.org/en-US/docs/Glossary/RGB) |
| daily-general-05 | 일반 | NOAA Compass FAQ: 현 위치 자기장 수평 성분을 따름. 항상 지리적 북극을 가리킨다고 하지 않음. | [NOAA NCEI · Geomagnetism Frequently Asked Questions](https://www.ncei.noaa.gov/products/geomagnetism-frequently-asked-questions) |

## 링크 접근 제한과 교차 확인

- 훈민정음: 국가유산포털 검색 본문의 창제자·연도 및 [국립한글박물관 상설 전시의 공식 검색 본문](https://www.hangeul.go.kr/renewal2023/pages/exhibition/daily/dailyExhibition.jsp)을 교차 확인했다. 국가유산포털 직접 열기는 403, 최초 후보 UNESCO 페이지는 Request Rejected였다. 설명은 확인된 창제·반포 사실에 한정했다.
- 로제타석: British Museum 공식 전시 PDF의 검색에 노출된 42–43쪽 본문에서 세 문자와 같은 칙령 내용을 확인했다. PDF 직접 열기는 403이었다. 검색 결과에 함께 나타난 비공식 박물관 모방 도메인은 사용하지 않았다.
- 나머지 항목도 각 기관 공식 자료와 기존 저장소 검토 기록을 대조했다. 후속 편집자는 질문의 정답뿐 아니라 해설에 새로 넣는 문장도 출처 범위 안에 있는지 확인해야 한다.

## 데이터 검증

Python으로 JSON 파싱, 총 35개/7분야별 5개, 고유 ID·질문, 선택지 4개와 중복 없음, 정답 범위, 비어 있지 않은 해설·출처, HTTPS URL, 검토일을 검사했다. 정답 위치는 0/1/2 각 9개, 3은 8개다. 실제 게임의 일일 출제·진행 저장·관리자 편집 흐름 검증은 이 콘텐츠 파일의 범위에 포함되지 않는다.
