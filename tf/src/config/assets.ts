export const ASSETS = {
  portraitLeft: '/assets/portrait-left.png',
  portraitRight: '/assets/portrait-right.png',
  tulipBase: '/assets/tulip/tulip.png',
  /** @deprecated legacy R3F scene */
  tulip: '/assets/tulip/tulip.png',
  floralBg: '/assets/floral-bg.png',
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
