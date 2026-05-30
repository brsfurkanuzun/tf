export const ASSETS = {
  portraitLeft: '/assets/portrait-left.png',
  portraitRight: '/assets/portrait-right.png',
  tulipBase: '/assets/tulip/tulip.png',
  /** @deprecated legacy R3F scene */
  tulip: '/assets/tulip/tulip.png',
  floralBg: '/assets/floral-bg.png',
  livingRoomHero: '/assets/living-room-hero.png',
  /** `npm run render:night` — yalnızca hero.png üzerinde ton + TV (mobilya aynı piksel) */
  livingRoomHeroNightExport: '/assets/living-room-hero-night-export.png',
  /** AI gece karesi — ilk scroll ile gösterilir */
  livingRoomNightAiScroll: '/assets/living-room-night-ai-scroll.png',
  /** Scroll ile başlatılan Kling videosu */
  scrollKlingHero: '/assets/scroll-kling-hero.mp4',
} as const

export const COUPLE_GALLERY = [
  { src: '/assets/couple-kamelya/couple-kamelya-final-01.png', label: '03' },
  { src: '/assets/couple-kamelya/couple-kamelya-final-02.png', label: '06' },
  { src: '/assets/couple-kamelya/couple-kamelya-final-03.png', label: '23' },
] as const

const TULIP_FRAME_PREFIX =
  '/assets/tulip/vecteezy_a-close-up-studio-shot-of-a-single-vibrant-red-tulip_77103070_'

/** 40-frame tulip sequence (001–040) */
export const TULIP_FRAMES = Array.from(
  { length: 40 },
  (_, i) => `${TULIP_FRAME_PREFIX}${String(i + 1).padStart(3, '0')}.png`,
)

const KLING_SCROLL_PREFIX =
  '/assets/kling-scroll-frames/kling_20260529_VIDEO_Image1_Ima_5658_0__1__'

/** Kare sayısını azaltınca bu sayıyı ve klasördeki dosyaları güncelle (001…pad) */
export const KLING_SCROLL_FRAME_COUNT = 119

export const KLING_SCROLL_FRAMES: readonly string[] = Array.from(
  { length: KLING_SCROLL_FRAME_COUNT },
  (_, i) => `${KLING_SCROLL_PREFIX}${String(i + 1).padStart(3, '0')}.png`,
)

export const SCROLL = {
  distance: 600,
  /** Portreler + tulip.png + siyah; sonrası 40 kare */
  introEnd: 0.38,
} as const

export function preloadImages(urls: string[]) {
  urls.forEach((src) => {
    const img = new Image()
    img.src = src
  })
}
