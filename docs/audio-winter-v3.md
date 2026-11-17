# Winter audio asset import — 2026-11-17

## Actual result and prior omission

All six requested recordings were acquired from Pixabay's official **Free download** controls and converted into complete playable AAC files. These are actual audio assets, not placeholder catalog entries. Playlist integration, in-game browser playback and deployment are separate root integration work; this bounded asset pass does not claim those checks.

At the beginning of this pass, `dist/winter-music.js` and `dist/audio/` contained only Scott Buckley's First Snow and Moonlight. The three unwanted Nutcracker recordings were already absent from both. The prior missing additions were an acquisition failure, not merely a stale playlist label or cache: `docs/audio-source-review.md` recorded no successfully downloaded new files.

The failure was resolved as follows:

1. Ordinary HTTP access to the Pixabay detail page returned 403 with `cf-mitigated: challenge`. No challenge was bypassed.
2. The same official pages loaded through normal Chrome. Their visible download controls were clicked.
3. Chrome navigated to each official public CDN MP3 URL but displayed `ERR_BLOCKED_BY_CLIENT`. The exact public URLs below came from that visible navigation, not guessed paths, player scraping, cookies or hidden application state.
4. Normal approved HTTP file downloads from those supplied public URLs succeeded. No browser, extension, safety, authentication or network protection setting was changed. The optional cookie banner was dismissed with rejection; no cookies or credentials were extracted or transferred. No CAPTCHA was solved and no account was created.
5. One browser tab became unresponsive after Warm Winter's download spinner. A fresh task tab completed the same official flow. This does not establish any login requirement.

## Runtime assets

All files are AAC-LC, stereo, 44,100 Hz, nominal 64 kb/s, with the MP4 metadata before media data for progressive playback. Full musical duration is preserved; no excerpts, repeated filler or substituted recordings were used. Constant gain attenuation preserves each recording's dynamics and brings measured loudness near -20 LUFS.

| File under `dist/audio/` | Recording / contributor | Duration | Bytes | Final LUFS / true peak | Source and Content ID |
|---|---|---:|---:|---|---|
| `cinematic-christmas-piano-strings-bells.m4a` | Cinematic Christmas Piano Strings Bells Beautiful Instrumental Music / Denis-Pavlov-Music | 398.080 s | 3,274,060 | -20.1 / -7.0 dBFS | [424394](https://pixabay.com/music/christmas-cinematic-christmas-piano-strings-bells-beautiful-instrumental-music-424394/), registered |
| `christmas-cinematic-dream-piano.m4a` | Christmas Cinematic Dream Piano / Good_B_Music | 129.045 s | 1,062,268 | -20.6 / -3.0 dBFS | [9784](https://pixabay.com/music/christmas-christmas-cinematic-dream-piano-9784/), registered |
| `warm-winter.m4a` | Warm Winter / AtlasAudio | 124.970 s | 1,027,446 | -20.1 / -7.1 dBFS | [625743](https://pixabay.com/es/music/cl%C3%A1sico-moderno-warm-winter-625743/), registered |
| `snow-fall-winter.m4a` | Snow fall winter / u_zdem8ky3wd | 97.104 s | 803,141 | -20.1 / -5.5 dBFS | [485887](https://pixabay.com/music/modern-classical-snow-fall-winter-485887/), no badge shown; not proof of no registration |
| `winter-jazz.m4a` | Winter Jazz / No-Copyright-Music-2026 | 65.097 s | 537,879 | -19.9 / -8.0 dBFS | [632290](https://pixabay.com/nl/music/vlotte-jazz-winter-jazz-632290/), registered; **AI-generated label** |
| `winter-waltz.m4a` | Winter Waltz / TwoTwice | 112.143 s | 924,876 | -20.0 / -5.0 dBFS | [458104](https://pixabay.com/music/modern-classical-winter-waltz-458104/), registered |

The six additions total **7,629,670 bytes**. The two priority tracks total **4,336,328 bytes**. The existing two files add 3,848,298 bytes. Consequently the total audio binary size is 11,477,968 bytes before Worker source/Base64/container overhead; the root build must verify platform packaging limits. Do not silently trim recordings or claim a successful deployment without checking the actual package.

## License and use

Each listed official recording page explicitly showed Pixabay Content License. The [license summary](https://pixabay.com/service/license-summary/) and [full terms](https://pixabay.com/service/terms/) were checked on 2026-11-17 (terms dated 20 October 2026). They allow free commercial/noncommercial use, adaptation and incorporation into a larger creative work, subject to prohibited uses. Attribution is optional, but contributor/source credits should remain. The [official FAQ](https://pixabay.com/service/faq/) expressly lists incorporation into an app or game as a larger creative work. Use here is background music inside the interactive winter world; do not offer a standalone music-download service or imply artist endorsement. These recordings are not public domain.

Content ID registration may produce claims on recorded gameplay; retain source/download evidence. A separate account-bound license certificate was **not obtained** in this pass. The public download evidence and hashes below document the assets actually received. The artist name No-Copyright-Music-2026 does not override the displayed Content ID badge or license.

## Acquisition provenance

The following are the exact public file URLs exposed by the official download buttons on 2026-11-17. They are recorded for provenance, not used for runtime hotlinking. Original MP3s were 256 kb/s stereo. Original temporary files remain under `/tmp/` with the respective slug and Pixabay ID; they are not part of the game package.

| Pixabay ID | Download URL | Original SHA-256 |
|---|---|---|
| 424394 | `https://cdn.pixabay.com/download/audio/2025/10/23/audio_a0a0dea670.mp3?filename=denis-pavlov-music-cinematic-christmas-piano-strings-bells-beautiful-instrumental-music-424394.mp3` | `d115e2fbd90d746709971a5c449100201d7e2fb08123e565032e064aeacedc70` |
| 9784 | `https://cdn.pixabay.com/download/audio/2021/10/23/audio_15e5f8466c.mp3?filename=good_b_music-christmas-cinematic-dream-piano-9784.mp3` | `cdfe37452f0c7b9b771852cdd78df85edb743cc097cee8a86f6d10db7700866d` |
| 625743 | `https://cdn.pixabay.com/download/audio/2026/10/23/audio_25c682b07f.mp3?filename=atlasaudio-warm-winter-625743.mp3` | `3e191aa4f6c9dffb1900e529a9b1b22893294b367e82aa426f6d2d08b6c25e4b` |
| 485887 | `https://cdn.pixabay.com/download/audio/2026/02/16/audio_4622786e97.mp3?filename=u_zdem8ky3wd-snow-fall-winter-485887.mp3` | `06b64fc2b998bbbfe9553c9340b561c039015c1808f63905fd4bf3df196ac184` |
| 632290 | `https://cdn.pixabay.com/download/audio/2026/11/05/audio_410c9ca21a.mp3?filename=no-copyright-music-2026-winter-jazz-632290.mp3` | `e94092e261e871f5e5ca261488e69d68d8a3ae67579f63cb2c9c195d0d97a2ad` |
| 458104 | `https://cdn.pixabay.com/download/audio/2025/12/28/audio_dad11820af.mp3?filename=twotwice-winter-waltz-458104.mp3` | `46921a51579388e55550ad1fa0ddcc3266cadd3eb4b6dc22f0c9d4320a29675f` |

## Processing and validation

FFmpeg 7.1 was already available in the user's workspace; no new dependency was added. Constant gain reductions for IDs 424394, 9784, 625743, 485887, 632290 and 458104 were respectively 8, 3, 8.1, 1, 9.6 and 5.2 dB. AAC conversion uses `-c:a aac -b:a 64000 -ar 44100 -movflags +faststart` and embedded title, contributor and provenance metadata.

Every final file passed full decoding with `-xerror` to completion (exit 0), `afinfo` format/duration inspection and MP4 `moov`-before-`mdat` verification. Final EBU R128 measurements are in the table. No clipping was detected. These are technical audio-file checks; subjective listening, browser next/previous transitions, mobile audio unlock, mute/volume and deployed playback remain integration checks.

| Final file | SHA-256 |
|---|---|
| `cinematic-christmas-piano-strings-bells.m4a` | `152db3856c92fc036848576780bd638b096d095a601083321f47deafefe41009` |
| `christmas-cinematic-dream-piano.m4a` | `1237bb9ee60811b7574443a0e94341666c08b0a84d8ff44e303b64ac2e841e69` |
| `warm-winter.m4a` | `22abd54bd35552af7b855ec19b1feb656edebc14393000c740c7f2c8565a7188` |
| `snow-fall-winter.m4a` | `b94e10728e47859472354a6f4b046504ac3dda7e6deedd622ae8bed9988a906e` |
| `winter-jazz.m4a` | `a900bf465c52fded97d7f5a556d4d5aec8c5edd26253fdfc94fe14d49c6f1ccf` |
| `winter-waltz.m4a` | `f13547c11ac90741edb6dc5f41726b15429a4e6ff4b862f34f87ff5c356cd760` |

No recorded environmental effects were added by this bounded pass. Existing original Web Audio environmental/action sounds are not represented as third-party Pixabay recordings.
