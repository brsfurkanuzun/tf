export const ASSETS = {
  /** Sabah salon — header retract sonrası beyazdan reveal */
  salonSabah: '/assets/salon_sabah.png',
  /** Aynı kare — gece; scroll ile sabaha bindirilir */
  salonGece: '/assets/salon_gece.png',
  /** Lottie — header giriş animasyonu */
  tulipLottie: '/assets/Tulip.json',
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
  /** Scroll ile başlatılan Kling videosu (araba) */
  scrollKlingHero: '/assets/scroll-kling-hero.mp4',
  /** Video ile birlikte kısık ses (Mor ve Ötesi — Daha Mutlu Olamam) */
  dahaMutluOlamam: '/assets/daha-mutlu-olamam.mp3',
  /** Arka plan müziği — tüm site boyunca loop */
  bgMusic: '/assets/sarki.mp3',
  /** Takvim bölümü — şeffaf arka planlı PNG (`public/assets/section-calendar-03.png`) */
  sectionCalendar03: '/assets/section-calendar-03.png',
  /** Anime konser kalabalığı — 2K arka plan */
  concertCrowdAnime: '/assets/concert-crowd-anime-2k.png',
  /** Anime band — transparan (önde, ilk görünen) */
  bandAnime: '/assets/band-anime.png',
  /** Anime band — sahne + konser arka planlı (scroll ile beliren) */
  bandStageBg: '/assets/band-stage-bg.png',
  /** Konser — scroll ile beliren tam genişlik arka plan */
  concert: '/assets/concert.png',
  /** Çardak — 3D render, şeffaf (istatistik bölümü) */
  sectionCardak: '/assets/section-cardak.png',
  /** Pencere manzarası — martısız, 2K (son bölüm) */
  pencereMartisiz2k: '/assets/pencere-martisiz-2k.png',
  /** Martı kafa — uçuş animasyonu */
  martiHead: '/assets/marti-head.png',
} as const

const CONCERT_FRAME_PREFIX =
  '/assets/concert_frames/kling_20260531_VIDEO_Using_the__261_0__1__'

/** Kare sayısını değiştirirsen klasördeki 001… dosyalarıyla eşle */
export const CONCERT_FRAME_COUNT = 91

export const CONCERT_FRAMES: readonly string[] = Array.from(
  { length: CONCERT_FRAME_COUNT },
  (_, i) => `${CONCERT_FRAME_PREFIX}${String(i + 1).padStart(3, '0')}.png`,
)

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

const ARABA_FRAME_PREFIX =
  '/assets/araba_frames/kling_20260529_VIDEO_Image1_Ima_5658_0__1__'

/** `public/assets/araba_frames` — 001…pad */
export const ARABA_FRAME_COUNT = 119

export const ARABA_FRAMES: readonly string[] = Array.from(
  { length: ARABA_FRAME_COUNT },
  (_, i) => `${ARABA_FRAME_PREFIX}${String(i + 1).padStart(3, '0')}.png`,
)

/** `public/assets/salon_gece` — salon_gece_001…100 (TV dahil tam kare) */
const SALON_GECE_FRAME_PREFIX = '/assets/salon_gece/salon_gece_'

export const SALON_GECE_FRAME_COUNT = 100

export const SALON_GECE_FRAMES: readonly string[] = Array.from(
  { length: SALON_GECE_FRAME_COUNT },
  (_, i) => `${SALON_GECE_FRAME_PREFIX}${String(i + 1).padStart(3, '0')}.png`,
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
