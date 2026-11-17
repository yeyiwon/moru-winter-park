# Audio source review — 2026-11-17

## Result

All six requested title/artist pairs were found on Pixabay. No new recording has been imported into the game: the official download flow did not produce a verifiable local file. No placeholder playlist items, guessed media URLs, scraped player URLs or substitute recordings were added.

The initial direct page request returned HTTP 403 with `cf-mitigated: challenge`. The same official track page opened through the normal browser; its visible **Free download** control was used. No download event completed, and the subsequent page-state read timed out. This does not establish whether a login or CAPTCHA is mandatory for every track. It establishes that the audio file and its playback have not been verified in this environment. Restricted access was not bypassed.

## Requested music

| Recording | Artist | Duration shown | Content ID shown | Verified source |
|---|---|---:|---|---|
| Cinematic Christmas Piano Strings Bells Beautiful Instrumental Music | Denis-Pavlov-Music | 6:38 | Registered | [Pixabay 424394](https://pixabay.com/music/christmas-cinematic-christmas-piano-strings-bells-beautiful-instrumental-music-424394/) |
| Christmas Cinematic Dream Piano | Good_B_Music | 2:09 | Registered | [Pixabay 9784](https://pixabay.com/music/christmas-christmas-cinematic-dream-piano-9784/) |
| Warm Winter | AtlasAudio | 2:05 | Registered | [Pixabay 625743](https://pixabay.com/es/music/cl%C3%A1sico-moderno-warm-winter-625743/) |
| Snow fall winter | u_zdem8ky3wd | 1:37 | No badge in reviewed page; absence is not proof of no registration | [Pixabay 485887](https://pixabay.com/music/modern-classical-snow-fall-winter-485887/) |
| Winter Jazz | No-Copyright-Music-2026 | 1:05 | Registered; page also labels the recording AI-generated | [Pixabay 632290](https://pixabay.com/nl/music/vlotte-jazz-winter-jazz-632290/) |
| Winter Waltz | TwoTwice | 1:52 | Registered | [Pixabay 458104](https://pixabay.com/music/modern-classical-winter-waltz-458104/) |

The localized official pages above identify the exact requested artist and track; their audio IDs are not inferred from similarly named tracks. The English page requests for Warm Winter and Winter Jazz were not readable in the search tool, so the verified localized URLs are retained.

## Usage conditions

The official [Content License Summary](https://pixabay.com/service/license-summary/) permits free use, modification and adaptation without mandatory attribution, subject to prohibited uses. The full [Terms of Service](https://pixabay.com/service/terms/) (updated 20 October 2026) permit commercial and noncommercial use and prohibit distribution of substantially unchanged content on a standalone basis. Incorporating music into the interactive game is a use within a larger creative work; a separate music-download catalog or public asset redistribution is not the intended use. Credits should still be retained for provenance. Do not describe these tracks as public domain.

The [official FAQ](https://pixabay.com/service/faq/) explains that legal use can still receive automated Content ID claims. A claim can affect a recorded gameplay video's monetization, visibility or regional availability and is distinct from a strike. Keep the official download record and, for registered tracks, the available license certificate. A shield badge is not a guarantee of claim-free usage. Source/performer names should not imply endorsement.

## Requested sound-effect pages

The following official pages resolve to matching recordings. Only page existence and attribution were checked; downloaded file, decoding, loop quality, loudness and in-game playback remain **unverified**. These are a research list, not runtime assets.

| Use | Recording / contributor | Source |
|---|---|---|
| Tree decoration bell | Clear Bell Chime / Universfield | [487898](https://pixabay.com/sound-effects/film-special-effects-clear-bell-chime-487898/) |
| Snow walk | Footsteps in Snow / DRAGON-STUDIO | [335506](https://pixabay.com/sound-effects/nature-footsteps-in-snow-335506/) |
| Snow run | Fast Footsteps on Snow / DRAGON-STUDIO | [335509](https://pixabay.com/sound-effects/nature-fast-footsteps-on-snow-335509/) |
| Mountain wind | Winter Wind / DRAGON-STUDIO | [402331](https://pixabay.com/sound-effects/nature-winter-wind-402331/) |
| Bath water | Hot Water Bubbling Ambience / Alex_Jauk | [198509](https://pixabay.com/sound-effects/household-hot-water-bubbling-ambience-198509/) |
| Waterfall | Waterfall Ambient Sounds / SoundsForYou | [116395](https://pixabay.com/sound-effects/nature-waterfall-ambient-sounds-116395/) |
| Stream | Water Stream SFX / SoundReality | [525009](https://pixabay.com/sound-effects/film-special-effects-water-stream-sfx-525009/) |
| Park background | Amusement Park (Ambience) / freesound_community | [24787](https://pixabay.com/sound-effects/film-special-effects-amusement-park-ambience-24787/) |
| Distant crowd | Murmullos / contributor not verified | [98443](https://pixabay.com/sound-effects/film-special-effects-murmullos-98443/) |
| Greenhouse birds | Birds Forest Nature / SoundReality | [445379](https://pixabay.com/sound-effects/nature-birds-forest-nature-445379/) |
| Quiz feedback | Ding SFX / DRAGON-STUDIO | [472366](https://pixabay.com/sound-effects/technology-ding-sfx-472366/) |

The skiing search URL is a category, not a chosen licensed recording. No skiing sample was silently substituted.

## Available fallback and implementation boundary

The repository already contains verified recordings [First Snow](https://www.scottbuckley.com.au/library/first-snow/) and [Moonlight](https://www.scottbuckley.com.au/library/moonlight/) by Scott Buckley under CC BY 4.0. These can remain the playable fallback while requested files are unavailable. They are not represented as the six requested Pixabay recordings.

The existing Web Audio effects can be improved without downloading third-party recordings: filtered noise for snow friction/wind/water, low resonances for wood contact and machine movement, and a softly decaying bell envelope for tree/quiz feedback. Such sounds must be described as original procedural audio, not as the recorded Pixabay effects. Realistic crowd conversations and bird field recordings should not be claimed unless an actual licensed recording is secured and auditioned.

For later approved file import, preserve complete musical recordings, verify decoding and duration, keep source/license/download evidence, normalize conservatively, and fit the aggregate audio budget before publishing. The six requested durations total 15 minutes 26 seconds; even AAC 48 kb/s would use roughly 5.6 MB before container overhead, exceeding the current approximately 4 MB allowance for new bundled audio. A separate permitted media store or a revised Worker packaging strategy is preferable to silently truncating tracks or adding poor-quality encodes.
