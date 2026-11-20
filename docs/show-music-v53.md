# v53 음악 확정·원본·라이선스·음향 측정

확인일: 2026-11-20 (Asia/Seoul). 최신 사용자 확정은 **공연 Love + Wedding Entrance**, 일반 BGM **5번째 Waltz of Snowflakes**다. Magic Wedding은 별도 상업 이용 허가가 없다는 사용자 확인에 따라 보류한다. 기존 Happy And Magical Dynamic을 새 공연에 사용하지 않는다. 재생 목록·서버 동기화·완곡 재생의 통합 결과는 릴리스 기록에서 확인한다.

## 사용자가 제공한 원본

| 용도 | 제목 / 제작자 | 공식 출처 | 페이지 표시 / 실제 디코딩 길이 | 배포 소스 |
| --- | --- | --- | --- | --- |
| 공연 A | Love / AtlasAudio | [Pixabay 631208](https://pixabay.com/music/wedding-love-631208/) | 2:15 / **134.81795918367348초** | `dist/audio/show/love.mp3` |
| 공연 B | Wedding Entrance / AtlasAudio | [Pixabay 621618](https://pixabay.com/pl/music/%C5%9Blub-wedding-entrance-621618/) | 2:03 / **123.24571428571429초** | `dist/audio/show/wedding-entrance.mp3` |
| 일반 BGM 5번 | Waltz of Snowflakes / Grand_Project | [Pixabay 442484](https://pixabay.com/music/modern-classical-waltz-of-snowflakes-442484/) | 1:57 / **116.7673469387755초** | `dist/audio/waltz-of-snowflakes.mp3` |

원본 이름은 `atlasaudio-love-631208.mp3`, `atlasaudio-wedding-entrance-621618.mp3`, `grand_project-waltz-of-snowflakes-442484.mp3`다. 세 파일을 **변환·절단·속도 변경 없이 그대로 복사**했다. 기존 BGM 1–4번과 저장된 track ID를 보존하고, 기존 5번 이후 곡은 한 칸씩 뒤로 옮긴다. 후보곡을 임의로 활성화하지 않는다.

| 파일 | bytes | SHA-256 |
| --- | ---: | --- |
| Love | 4,314,174 | `1f6e808fa064bff24ef4ad5b6b53579b921201e330adaec2a60f5c60556a7545` |
| Wedding Entrance | 3,943,862 | `aedea3d673ee67c18086bbfc5f8344eb46ed1e2c33099f24fb93a23dace95f21` |
| Waltz of Snowflakes | 3,736,555 | `182871ca36c9e97463855c22f6a69b8d8287039e508f94fce37b8ef3c7ad98c3` |

공연 두 곡 합계는 **8,258,036 bytes**, 새 활성 원본 세 곡 합계는 **11,994,591 bytes**다. 모두 44.1 kHz stereo MP3, 256 kbps로 확인했다. 디코딩 sample count는 각각 5,945,472 / 5,435,136 / 5,149,440이다. 반올림된 공식 페이지 길이를 타임라인의 정확한 길이로 사용하지 않는다.

## 출처와 이용 조건

세 공식 페이지는 Pixabay Content License로 이용 가능하다고 표시한다. Love의 게시일은 2026-11-11, Wedding Entrance는 2026-10-20, Waltz of Snowflakes는 2025-11-26이다. Wedding Entrance의 영문 주소를 웹 도구로 읽는 과정에서 오류가 발생해 검색 결과의 공식 폴란드어 동일 ID 페이지로 제목·작곡가·길이·라이선스를 대조했다. 다운로드 접근 제어를 우회한 것이 아니다.

[Pixabay 약관](https://pixabay.com/service/terms/) 2026-10-20 갱신본은 금지된 이용을 제외한 상업·비상업적 사용과 각색을 허용한다. 원본 음원만 독립 상품으로 판매·배포하는 것은 금지된다. 독자적인 인터랙티브 월드·3D 공연의 일부로 사용하는 것은 더 큰 창작물에 결합하는 이용에 부합한다는 **공식 문서에 근거한 적용 판단**이다. 제3자 권리까지 별도로 보증했다는 뜻은 아니다. 원작자·출처를 유지하고 독립 음원 다운로드 상품이나 재판매 기능을 추가하지 않는다.

Love와 Waltz의 Content ID 등록 표시는 확인했다. Wedding Entrance는 읽은 공식 페이지에 등록 배지가 없었으므로 **등록 여부 UNKNOWN**이며 미등록이라고 단정하지 않는다. [공식 FAQ](https://pixabay.com/service/faq/)에 따라 외부 영상 플랫폼에 공연 녹화물을 게시하면 자동 권리 주장이 생길 수 있다. 사용자의 원본 제공 날짜는 2026-11-20이며 **별도 다운로드 증명서는 미제공**이다.

처음 Love·Waltz 페이지를 일반 Chrome으로 열었을 때 두 페이지 모두 HTTP 403 / `Just a moment...` 보안 확인으로 파일을 받지 못했다. 이후 사용자가 직접 제공한 원본을 사용했다. 보안 확인을 우회하거나 CDN 주소를 추측하지 않았다.

## 실제 음향 분석과 타임라인 근거

[전체 측정 JSON](show-music-analysis-v53.json)에 원본 해시, 실제 길이, RMS, sample peak, 0.5초 에너지, spectral flux, 180개 attack 후보, 악구 경계 및 tempo 후보를 기록했다.

분석 방법:

- 설치된 Chrome의 `decodeAudioData`로 44.1 kHz 원본을 디코딩했다. macOS `afinfo`로 codec·channel·sample rate·container duration을 독립 확인했다. `ffprobe`는 설치되어 있지 않아 실행하지 않았다.
- 분석용으로만 mono 22.05 kHz를 만들고 Hann STFT 1024 / hop 256, 양의 log spectral flux와 41-frame 국소 평균 차이를 이용했다. 배포 원본은 downsample하지 않았다.
- 악구 변화는 2초 전후의 8개 주파수 대역 차이로, tempo는 자기상관 후 75–178 BPM / 0.05 BPM 간격의 attack phase 정합으로 추정했다.
- 이 수치는 **기계적 분석 후보**다. 사람이 전곡을 청취해 악기 진입을 판별한 악보 또는 작곡가의 공식 BPM이라고 표현하지 않는다. 특히 “피아노·현악 진입”은 스펙트럼 증가만으로 확정할 수 없으므로 연출 구간의 설계 명칭과 구분한다.

### Love

정밀 tempo 후보는 **134 BPM**, offset **0.3806초**다. 강한 attack 180개 중 114개가 이 격자 ±35ms 안에 들어오며 나머지는 세분박·다른 악기의 attack일 수 있다. 단순 자기상관은 89.1 BPM도 강하게 반환하므로 실제 악보상의 박자와 동일하다고 단정하지 않는다.

| 측정 구간 | 분석에 근거한 연출 후보 |
| --- | --- |
| 0–15초 | 낮은 spectral flux의 도입: 외벽 조명과 작은 불꽃 |
| 15–28.5초 | 스펙트럼 활동 증가: 좌우 작은 코멧·서치라이트 확장 |
| 28.5–52초 | 에너지 상승: 중간 높이의 다양한 공중 불꽃 |
| 52–57.5초 | 강한 절정: 53.5초 창에 최고 RMS, 큰 입체 폭발 |
| 57.5–80.5초 | 고밀도와 숨 고르기 교차 |
| 80.5–88초 | 추가 상승: 80.538 / 81.874초 등의 강한 attack |
| 88–107.5초 | 비교적 안정적인 고에너지: 색·높이 대비 |
| 107.5–116.5초 | 마지막 강한 악구: 107.845초 attack을 포함한 피날레 |
| 116.5–131초 | 스펙트럼 활동 급감: 새로운 대형 발사 중단, 잔광·외벽 여운 |
| 131–134.817959초 | 음악 감쇠·마지막 자연스러운 종료 |

최대 0.5초 mono RMS 창은 53.5초, 의미 있는 음량 범위(RMS > 0.002)는 약 0.360–132.598초다. 이 구간 밖의 무음도 **원본에서 잘라내지 않는다**. 단순히 마지막 몇 초에 피날레를 몰아넣으면 이미 조용해진 coda와 충돌하므로 마지막 강한 악구 뒤에는 잔광을 둔다.

### Wedding Entrance

정밀 tempo 후보는 **150 BPM**, offset **0.030초**다. 75 BPM의 half-time 후보도 강하다. 주요 attack 예시는 40.031 / 52.825 / 65.631 / 76.823 / 88.038 / 97.628초다. 강한 attack 180개 중 109개가 격자 ±35ms 안에 들어온다.

| 측정 구간 | 분석에 근거한 연출 후보 |
| --- | --- |
| 0–8초 | 천천히 나타나는 외벽 조명 |
| 8–27초 | 작은 공중 별·코멧, 낮은 밀도 |
| 27–40초 | 첫 확장과 좌우 대비 |
| 40–52.5초 | spectral flux 증가: 넓은 빔·중간 불꽃 |
| 52.5–65.5초 | 더 강한 음향층: 부채꼴·분수·구형 폭발 |
| 65.5–77초 | 높이와 패턴 교차 |
| 77–88초 | 다음 절정으로 상승 |
| 88–105초 | 88초 최고 RMS를 포함한 피날레, 97.628초 강한 attack |
| 105–118초 | 음향층 급감: 빛의 커튼과 외벽 여운 |
| 118–123.245714초 | 끝부분 감쇠, 조명과 음향 자연 종료 |

의미 있는 음량 범위는 약 0.534–121.092초다. Love와 구간 길이·밀도 분포가 다르므로 같은 공연 이벤트를 단순 비례 확대하지 않는다.

### 음량 균형

| 곡 | 전체 stereo RMS | sample peak | 측정 해석 |
| --- | ---: | ---: | --- |
| Love | −13.672 dBFS | 0 dBFS | 원본 디코딩 63 sample이 1.0에 도달 |
| Wedding Entrance | −16.112 dBFS | −0.018 dBFS | Love보다 평균 에너지 약 2.44 dB 작음 |
| Waltz of Snowflakes | −13.761 dBFS | −0.016 dBFS | 일반 BGM gain과 함께 조절 |

이는 무가중 전체 RMS/sample peak이며 LUFS 또는 oversampling true peak가 아니다. Love 재생 gain 약 0.755, Wedding Entrance 1.0을 상대값으로 쓰면 평균 에너지를 맞추는 출발점이 된다. 원본 파일의 destructive normalization은 하지 않는다. 실제 출력 체감과 효과음 밸런스는 통합 검사 대상이다.

## 보류곡 — 운영 파일과 재생 목록에 미포함

| 후보 | 확인 내용 | 유지 방식 |
| --- | --- | --- |
| Magic Wedding / ArtIssizm | [공식 페이지](https://pixabay.com/music/wedding-magic-wedding-120021/)의 Content License 표기와 **작가의 별도 상업 이용 허가 요구가 충돌**한다. 사용자는 별도 허가가 없다고 답했다. | 원본은 사용자 Downloads에 보존. 로컬 분석만 수행하고 `dist`에 복사하지 않음. |
| Romantic Tale / Alex_MakeMusic | [Pixabay 216756](https://pixabay.com/music/main-title-romantic-tale-216756/), 페이지 2:01, 부드러운 피아노·현악 설명. 원본 제공됨. | 일반 BGM/공연 비교 후보만, 미활성 |
| Inspiring Cinematic Weeding / WestDream_Music | [Pixabay 180995](https://pixabay.com/music/wedding-inspiring-cinematic-weeding-180995/), 페이지 3:45. 사용자 표기 Wedding과 공식 제목 Weeding은 같은 ID다. 원본 제공됨. | 일반 BGM 후보만, 미활성 |
| First Love / MagalyStudio | 사용자 제공 파일 `magalystudio-first-love-563200.mp3`. 제목·제작자는 파일명 기준이며 이번에 공식 상세 페이지를 확인하지 못했다. | 후보 보존, 출처/권리 검증 전 미활성 |

Magic Wedding의 실제 파일은 4,403,618 bytes, SHA-256 `4a8d7f0828def1a5c4b97e4a805074386df44cc020dc713c7451741e651c1a74`, 디코딩 **137.613061초**다. 140 BPM 후보·0.0268초 offset·RMS −15.242 dBFS를 분석했지만, 이는 이용 허가나 운영 배포 가능 판정이 아니다. 동일 공식 페이지의 작가 안내에 별도 상업 허가 요구가 있어 운영에 넣지 않는다.

## 확인 범위

원본 동일 해시 복사, 실제 디코딩·메타데이터·에너지·attack 분석을 완료했다. 원본 자르기·합성·대체곡 추가는 없다. 완곡 실제 재생, 서버 음악 선택·늦은 입장 보정, 음악별 VFX 구간, BGM 5번 삽입과 저장 설정 호환, 운영 업로드·Range 응답은 별도 통합 검증 결과에 따라 기록한다. 이 자산 분석만으로 실제 공연 또는 운영 검증을 완료 처리하지 않는다.
