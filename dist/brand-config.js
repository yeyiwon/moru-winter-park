// A single, public source for the proposed identity. No invite or account data belongs here.
export const BRAND = Object.freeze({
  name: 'SNOWHERE',
  nameKo: '스노웨어',
  description: '함께 트리를 꾸미고, 눈 내리는 밤을 걷는 겨울 공간.',
  url: 'https://moru-winter-park.vercel.app',
  colors: Object.freeze({ night: '#0b1423', ivory: '#fff2de', champagne: '#e9c48f' }),
  assets: Object.freeze({
    logo: '/brand/logo-primary.svg',
    logoCompact: '/brand/logo-compact.svg',
    logoMonochrome: '/brand/logo-monochrome.svg',
    favicon: '/brand/favicon.svg',
    favicon32: '/brand/favicon-32.png',
    icon192: '/brand/icon-192.png',
    icon512: '/brand/icon-512.png',
    appleTouchIcon: '/brand/apple-touch-icon.png',
    socialImage: '/brand/og-image.png',
    socialImageAlt: '빛의 리본으로 그린 트리와 SNOWHERE 워드마크',
  }),
});
