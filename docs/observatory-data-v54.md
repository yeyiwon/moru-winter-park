# v54 천문대 별 데이터 출처와 검증

## 포함 데이터

`dist/observatory-catalog.js`에는 HYG v4.1에서 추출한 실제 별 5,041개를 담았다. HIP 번호가 있고 겉보기 V등급이 6.0 이하인 행만 사용한다. 임의 위치의 별을 만들거나 카탈로그 좌표를 미술적으로 재배치하지 않았다. 이 수치는 전천 데이터 수이며, 관측자의 지평선 위에 동시에 보이는 별의 수가 아니다. 육안 가시성도 대기·광공해·개인 시력에 따라 달라진다.

| Export | 형식 / 의미 |
| --- | --- |
| `starCatalog` | `[HIP, RA도, Dec도, V등급, B−V 또는 null]` 배열 |
| `constellationCatalog` | `{id, name, stars: HIP[], edges: [HIP, HIP][]}` 6개 |
| `namedStarLabels` | 선택한 별자리 구성별의 HYG 이름 또는 Bayer/Flamsteed 표기 |
| `catalogMetadata` | 출처, 좌표 기준, 라이선스, 원본 해시, 누락값 |

RA·Dec의 **epoch와 equinox는 모두 J2000.0**이다. HYG의 RA 시간을 15배 하여 도 단위로 바꾸고 RA·Dec를 소수점 여섯 자리로 반올림했다. 겉보기 등급 오름차순, 동률은 HIP 번호순으로 정렬하여 렌더러가 앞부분만 표시할 수 있다. `ci`(B−V)가 없는 HIP 26220, 32609는 `null`을 유지한다. 렌더러는 이를 수치 0으로 간주하지 말고 중성 흰색으로 표시해야 한다. B−V에 따른 화면 색상은 관측된 RGB 사진이 아니라 색지수의 시각적 근사다. [HYG 필드·기준 설명](https://github.com/astronexus/HYG-Database/blob/c7f7f883fe678cc7680169a50ccd7dcc49b060ce/hyg/README.md)

## 원본과 이용 조건

- 별 데이터: **HYG Database v4.1**, David Nash / Astronexus and contributors. [원본 CSV](https://github.com/astronexus/HYG-Database/blob/c7f7f883fe678cc7680169a50ccd7dcc49b060ce/hyg/CURRENT/hygdata_v41.csv), [제작자 라이선스](https://github.com/astronexus/HYG-Database/blob/c7f7f883fe678cc7680169a50ccd7dcc49b060ce/hyg/CURRENT/LICENSE). 해당 별 데이터와 이 파일의 추출·변환 데이터는 **CC BY-SA 4.0**으로 제공한다. 원본 전체를 재배포하지 않고 필요한 행과 열을 추출했고, 위에 기술한 단위 변경·반올림·정렬을 적용했다.
- HYG는 Hipparcos, Yale, Gliese 자료를 통합한 파생 카탈로그다. HIP 식별자가 있는 별만 선택했다고 해서 모든 광도·색지수가 단일 관측에서 나온다는 의미는 아니다. 기초 Hipparcos 자료의 ID, Johnson V, B−V, 좌표 체계는 [NASA HEASARC의 Hipparcos 원본 설명](https://heasarc.gsfc.nasa.gov/W3Browse/all/hipparcos.html)과 대조했다. **원본 Hipparcos의 J1991.25 epoch와 HYG의 J2000.0 epoch를 혼동하지 않는다.**
- 별자리 연결: **Stellarium team, Western sky culture**의 [HIP 연결 데이터](https://github.com/Stellarium/stellarium-skycultures/blob/2d80ce70984c14bba7da2d31a0f9b27e292861c9/western/index.json)를 선택하고 path를 두 별 사이 edge로 변환했다. [해당 자료의 Authors / License](https://github.com/Stellarium/stellarium-skycultures/blob/2d80ce70984c14bba7da2d31a0f9b27e292861c9/western/description.md)는 text/data를 **CC BY-SA**로 명시하며 버전 번호는 기재하지 않는다. 이 원문 조건과 저자 표기를 유지한다. Stellarium 프로그램 코드, 경계 데이터, 삽화는 포함하지 않았다.
- 배포 데이터 파일의 저자·출처·라이선스 표기를 제거하지 않는다. [CC BY-SA 4.0 조건](https://creativecommons.org/licenses/by-sa/4.0/)에 따라 수정 사실과 동일조건변경허락 표시를 유지한다. 프로젝트 다른 코드의 라이선스를 이 문서에서 변경하지 않는다.

원본 고정값:

```text
HYG commit: c7f7f883fe678cc7680169a50ccd7dcc49b060ce
HYG CSV bytes: 33932548
HYG CSV SHA-256: d9f69fd86bbf90a4e4d52b4c5c53eacfa6dfc0bfdef85bfd94f095e0bebe4ebd
Stellarium skycultures commit: 2d80ce70984c14bba7da2d31a0f9b27e292861c9
```

NASA가 호스팅한다는 이유만으로 다른 카탈로그를 public domain으로 간주하지 않았다. 검토했던 BSC5의 [호스팅 안내](https://heasarc.gsfc.nasa.gov/W3Browse/all/bsc5p.html)에는 별도 저작권·상업 이용 확인이 필요하다고 명시되어 있어, 그 원본을 이번 배포 데이터로 사용하지 않았다.

## 별자리 연결 검증

IAU의 공식 별자리는 하늘의 영역이며, 별을 잇는 선은 유일한 공식 규격이 아니다. 이번 연결은 출처가 명시된 현대 서양식 식별 보조선이다. [IAU 설명](https://iauarchive.eso.org/public/themes/constellations/)

| 표시 | 구성 확인 |
| --- | --- |
| 오리온자리 | Betelgeuse(27989), Bellatrix(25336), Rigel(24436), Saiph(27366), Meissa(26207), 허리띠 Mintaka(25930)–Alnilam(26311)–Alnitak(26727)를 포함하는 19별 |
| 카시오페이아자리 | Segin(8886)–Ruchbah(6686)–γ Cas(4427)–Schedar(3179)–Caph(746), 5별 W형 |
| 큰곰자리 · 북두칠성 | Alkaid(67301)–Mizar(65378)–Alioth(62956)–Megrez(59774)–Dubhe(54061)–Merak(53910)–Phecda(58001)–Megrez. 큰곰자리 전체가 아닌 7별 asterism만 추출 |
| 페가수스자리 | Markab(113963), Scheat(113881), Algenib(1067), Alpheratz(677)의 사각형을 포함하는 14별. Alpheratz는 안드로메다자리 별이지만 페가수스 대사각형의 꼭짓점 |
| 백조자리 | Deneb(102098), Sadr(100453), Albireo(95947), Fawaris(97165), Aljanah(102488)를 포함하는 10별 |
| 거문고자리 | Vega(91262), ζ¹ Lyr(91971), Sheliak(92420), Sulafat(93194), δ² Lyr(92791)의 5별 |

이름은 HYG 표기를 보존하며 모든 별의 이름이 현재 IAU 승인 명칭이라고 주장하지 않는다. 예를 들어 γ Cas의 카탈로그 이름은 Cih다. 위치는 이름 문자열이 아니라 HIP 번호로 연결한다. 선택 구성별 60개는 모두 등급 제한 내의 실제 행을 참조하고, 60개 edge의 두 끝점이 존재하며 각 그래프가 연결되어 있음을 실행 검사했다.

## 하늘 좌표 연결 시 주의점

이 파일은 카탈로그이며 현재 시각의 하늘 계산기는 아니다. 시간·관측 위도·경도에 따른 변환은 별도 렌더러에서 수행한다.

- 항성시 참고: [USNO Computing Approximate Sidereal Time](https://aa.usno.navy.mil/faq/GAST). 계산 날짜의 JD, UT1, TT, 정오/자정 기준을 혼동하지 않는다. 동경은 local sidereal time에 더한다. UTC를 UT1 대신 쓰는 경우 근사임을 명시한다.
- 수평 좌표 참고: [USNO Altitude and Azimuth](https://aa.usno.navy.mil/faq/alt_az). 북쪽 0°, 동쪽 90°인 방위각을 사용한다. 시간각 H = LST − RA, 고도는 `asin(cos(H) cos(Dec) cos(latitude) + sin(Dec) sin(latitude))`, 방위각은 `atan2(-sin(H), tan(Dec) cos(latitude) - sin(latitude) cos(H))`이며 0–360°로 정규화한다. 삼각함수에는 radian을 전달한다.
- USNO의 apparent sidereal time 공식과 **J2000 좌표를 바로 결합하면 현재 날짜의 정밀 apparent 위치가 되지 않는다.** 별도 구현이 J2000→관측일 세차·장동 등을 보정했는지 명시해야 한다.
- 이 데이터 모듈은 세차, 장동, 연주광행차, 고유운동, 시차, 대기 굴절, 지형 가림, 소광을 계산하지 않는다. 특히 수평선 부근의 관측 위치·가시성은 굴절을 포함한 실측과 다를 수 있다.
- 태양·달·행성 좌표나 관측 가능한 천체 사진을 제공하는 데이터가 아니다. 해당 대상에는 별도의 신뢰 가능한 ephemeris / 이미지 출처가 필요하다.

### J2000 → 관측일 세차 구현 참고

[IAU SOFA](https://www.iausofa.org/)에 기반한 ERFA의 공식 [`prec76.c`](https://github.com/liberfa/erfa/blob/master/src/prec76.c)와 [`pmat76.c`](https://github.com/liberfa/erfa/blob/master/src/pmat76.c)를 대조했다. 그 구현은 Lieske, J. H. (1979), *Astronomy & Astrophysics* **73**, 282, 식 (6), (7), p.283을 원전으로 명시한다. J2000.0을 시작일로 놓아 `t0 = 0`으로 줄인 IAU 1976 식은 아래와 같다. 여기서 `T = (JD_TT − 2451545.0) / 36525`이고 각도는 **arcsecond**이다.

```text
ζ = 2306.2181 T + 0.30188 T² + 0.017998 T³
z = 2306.2181 T + 1.09468 T² + 0.018203 T³
θ = 2004.3109 T − 0.42665 T² − 0.041833 T³
```

삼각함수 입력에는 위 값을 `π / (180 × 3600)`으로 곱해 radian으로 바꾼다. `pmat76`의 방향은 `V(date) = P × V(J2000)`이며 결과는 **관측일의 평균 적도 좌표**다. 이 결과에는 GMST를 사용하고, 장동을 적용하지 않은 채 GAST와 혼합하지 않는다. J2000 입력에서 ICRS/FK5 frame bias를 정밀하게 보정하는 작업도 이 단순 모델의 범위 밖이다.

IAU 1976은 최신 IAU 2006 모델을 대체하는 정밀 계산이 아니다. 이 계수로 구현한 교육용 관측 장면에 SOFA 라이브러리 전체의 정확도나 인증을 주장하지 않는다. UTC를 TT와 UT1 대신 쓰면 해당 시간척도 근사를 명시한다. 연주시차·연주광행차·고유운동·장동·대기 굴절을 생략하면 해당 오차가 남는다. 여기서는 공식과 출처만 제공했고 세차 코드는 카탈로그 모듈에 포함하지 않았다.

## 실제 검증과 한계

Node ESM으로 모듈을 import하여 다음을 검증했다.

- 5,041개 행의 HIP 양의 정수·유일성, RA 0≤RA<360, Dec −90≤Dec≤90, 유한 수치, V≤6.0 통과.
- 밝기순 정렬, 누락 B−V 2개를 `null`로 보존한 것 통과.
- 6개 별자리의 구성별 존재, edge 중복·자기 연결 없음, 그래프 연결성 통과.
- 전처리된 카탈로그 208,987 bytes, gzip 90,926 bytes. 350KB 예산 이내.
- LOD 후보: V≤4.5 919개 / V≤5.0 1,625개 / V≤5.5 2,848개 / V≤6.0 5,041개. 실제 품질 단계 선택은 화면 측정에 따른다.

재생성은 위 고정 commit의 CSV를 읽고 `hip`가 비지 않았고 `mag <= 6`인 행을 선택한 뒤, `ra * 15`, `dec`, `mag`, `ci` 열을 위 형식으로 변환하면 된다. 별자리의 `lines`를 인접한 두 HIP의 edge로 분해하며 UMa는 첫 번째 path(북두칠성)만 선택한다. 런타임 네트워크 요청이나 새 production dependency는 없다.

이 문서의 검증은 **카탈로그 데이터 검사**다. 렌더링·FPS·멀티플레이 통합 결과는 [천문대 설계와 검증](observatory-v54.md)에 별도로 기록했다. 광학적 색 재현과 현장 하늘의 정밀 각거리 오차, 실제 Windows·휴대전화 검증은 UNKNOWN이다.
