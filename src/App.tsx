import gsap from 'gsap'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ASSETS, SALON_GECE_FRAME_COUNT, SALON_GECE_FRAMES } from './config/assets'
import { LogoCenterFlyIn } from './components/ui/LogoCenterFlyIn'
import { SiteHeader } from './components/ui/SiteHeader'

const VEIL_BG = 'linear-gradient(180deg, #121118 0%, #09090b 48%, #060508 100%)'
const REVEAL_BG = '#f7f4ef'
const VEIL_DURATION = 0.85
const VEIL_EASE = 'power2.inOut'
const SALON_WHITE_DURATION = 1.35
const SALON_WHITE_EASE = 'power2.out'
/** Bu kadar piksel dikey scroll ≈ tamamen gece katmanı (ilk kare üstüne bindirme) */
const SALON_NIGHT_SCROLL_RANGE_PX = 560

/** Gece kare sırası — scroll (px), tüm aralık (sabit; scrollHeight kullanma — layout oynayınca indeks sıçrar) */
const FRAME_SEQ_START_PX = 780
const FRAME_SEQ_SCROLL_RANGE_PX = 2400

/** Sabit scroll aralığı → 0…n-1 monoton; son pikselde n-1 */
function salonGeceFrameIndex(scrollY: number, n: number): number {
  const start = FRAME_SEQ_START_PX
  const range = FRAME_SEQ_SCROLL_RANGE_PX
  const span = Math.max(0, scrollY - start)
  if (span >= range) return n - 1
  return Math.min(n - 1, Math.floor((span / range) * n))
}

/** Gece salon sabit katmanı soldurma (px) */
const SALON_ROOM_FADE_START_PX = FRAME_SEQ_START_PX + FRAME_SEQ_SCROLL_RANGE_PX
const SALON_ROOM_FADE_RANGE_PX = 720

function salonRoomStackOpacity(scrollY: number): number {
  if (scrollY < SALON_ROOM_FADE_START_PX) return 1
  const u = (scrollY - SALON_ROOM_FADE_START_PX) / SALON_ROOM_FADE_RANGE_PX
  if (u >= 1) return 0
  return 1 - u
}

/** Fotoğrafa hafif dolly — scroll aralığı (px) */
const PHOTO_ZOOM_START_PX = 200
const PHOTO_ZOOM_RANGE_PX = 780
const PHOTO_ZOOM_EXTRA = 0.1
/** Yakınlaşma dönüş merkezi (TV civarı, % / %) */
const PHOTO_ZOOM_ORIGIN_X_PCT = 50
const PHOTO_ZOOM_ORIGIN_Y_PCT = 37

function salonNightProgress(scrollY: number) {
  return Math.min(1, Math.max(0, scrollY / SALON_NIGHT_SCROLL_RANGE_PX))
}

function salonPhotoZoomProgress(scrollY: number) {
  return Math.min(
    1,
    Math.max(0, (scrollY - PHOTO_ZOOM_START_PX) / PHOTO_ZOOM_RANGE_PX),
  )
}

/** Band bölümü: sticky içinde scroll ilerlemesi 0…1 (konser → transparan → sahne arka planı) */
const BAND_SCROLL_CONCERT_END = 0.22
const BAND_SCROLL_BAND_END = 0.42
/** band-stage-bg fade tamamlanışı; sonrasında kelimeler tek tek gelir */
const BAND_SCROLL_STAGE_END = 0.55

/** Görünür olunca 0'dan hedefe sayan sayaç */
function CountUp({
  to,
  duration = 1600,
  className,
}: {
  to: number
  duration?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        if (!e?.isIntersecting || startedRef.current) return
        startedRef.current = true
        const t0 = performance.now()
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / duration)
          const eased = 1 - Math.pow(1 - p, 3)
          setVal(Math.round(to * eased))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])

  return (
    <span ref={ref} className={className}>
      {val.toLocaleString('tr-TR')}
    </span>
  )
}

export const App = function App() {
  const logoAnchorRef = useRef<HTMLDivElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const salonWhiteRef = useRef<HTMLDivElement>(null)
  const salonNightRef = useRef<HTMLDivElement>(null)
  const salonNightZoomRef = useRef<HTMLDivElement>(null)
  const salonScrollStageRef = useRef<HTMLDivElement>(null)
  const geceFrameARef = useRef<HTMLImageElement>(null)
  const geceFrameBRef = useRef<HTMLImageElement>(null)
  const geceShowARef = useRef(true)
  const geceFrameSwapGenRef = useRef(0)
  /** Yalnızca decode + swap bittikten sonra güncellenir (ara kare atlama / takılma önlemi) */
  const displayedGeceFrameIdxRef = useRef(0)
  const [introDone, setIntroDone] = useState(false)
  /** Lottie header’a konduktan sonra logo prop’u bir daha false olmasın */
  const [headerLogoLocked, setHeaderLogoLocked] = useState(false)
  const [firstScrollDone, setFirstScrollDone] = useState(false)
  const veilPlayedRef = useRef(false)
  const salonRevealPlayedRef = useRef(false)
  const mainRef = useRef<HTMLElement>(null)
  const concertBgRef = useRef<HTMLImageElement>(null)
  const bandSectionRef = useRef<HTMLElement>(null)
  const bandAnimeRef = useRef<HTMLImageElement>(null)
  const happyWordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const cardakRef = useRef<HTMLImageElement | null>(null)
  const [calendarLeadSpacerPx, setCalendarLeadSpacerPx] = useState(1)
  const [letterSectionMounted, setLetterSectionMounted] = useState(false)
  const bgMusicStartedRef = useRef(false)

  const handleIntroDone = useCallback(() => {
    setHeaderLogoLocked(true)
    setIntroDone(true)
  }, [])

  // Birliktelik istatistikleri — bugünün tarihine göre dinamik
  const relStartDate = new Date(2023, 5, 3) // 03.06.2023
  const relToday = new Date()
  const daysTogether = Math.max(
    0,
    Math.floor((relToday.getTime() - relStartDate.getTime()) / 86_400_000),
  )
  const dateFmt = new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const relStartLabel = dateFmt.format(relStartDate)
  const relTodayLabel = dateFmt.format(relToday)

  useEffect(() => {
    if (!letterSectionMounted) return
    const el = cardakRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        if (!e?.isIntersecting) return
        el.style.opacity = '1'
        el.style.transform = 'translateX(0)'
        io.disconnect()
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [letterSectionMounted])

  useEffect(() => {
    if (!firstScrollDone) return
    SALON_GECE_FRAMES.slice(0, 48).forEach((src) => {
      const im = new Image()
      im.src = src
    })
    const last = new Image()
    last.src = SALON_GECE_FRAMES[SALON_GECE_FRAME_COUNT - 1]!
  }, [firstScrollDone])

  useEffect(() => {
    const audio = new Audio(ASSETS.bgMusic)
    audio.loop = true
    audio.volume = 0.35
    audio.preload = 'auto'

    const startBgMusic = () => {
      if (bgMusicStartedRef.current) return
      void audio
        .play()
        .then(() => {
          bgMusicStartedRef.current = true
        })
        .catch(() => {})
    }

    window.addEventListener('pointerdown', startBgMusic, { passive: true })
    window.addEventListener('keydown', startBgMusic, { passive: true })
    window.addEventListener('wheel', startBgMusic, { passive: true })
    window.addEventListener('touchstart', startBgMusic, { passive: true })

    return () => {
      audio.pause()
      audio.src = ''
      bgMusicStartedRef.current = false
      window.removeEventListener('pointerdown', startBgMusic)
      window.removeEventListener('keydown', startBgMusic)
      window.removeEventListener('wheel', startBgMusic)
      window.removeEventListener('touchstart', startBgMusic)
    }
  }, [])

  useEffect(() => {
    if (firstScrollDone) return

    let committed = false
    const tryTrigger = () => {
      if (committed) return
      committed = true
      setFirstScrollDone(true)
    }

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 4) return
      tryTrigger()
    }

    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop
      if (y > 12) tryTrigger()
    }

    let touchY0 = 0
    const onTouchStart = (e: TouchEvent) => {
      touchY0 = e.touches[0]?.clientY ?? 0
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? touchY0
      if (Math.abs(y - touchY0) > 28) tryTrigger()
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [firstScrollDone])

  useLayoutEffect(() => {
    if (!firstScrollDone || veilPlayedRef.current) return
    const veil = veilRef.current
    if (!veil) return

    veilPlayedRef.current = true
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduce) {
      gsap.set(veil, { yPercent: -100, visibility: 'hidden' })
      return
    }

    gsap.to(veil, {
      yPercent: -100,
      duration: VEIL_DURATION,
      ease: VEIL_EASE,
      onComplete: () => {
        gsap.set(veil, { visibility: 'hidden' })
      },
    })
  }, [firstScrollDone])

  useLayoutEffect(() => {
    if (!introDone || !firstScrollDone || salonRevealPlayedRef.current) return
    const white = salonWhiteRef.current
    if (!white) return

    salonRevealPlayedRef.current = true
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduce) {
      gsap.set(white, { opacity: 0, visibility: 'hidden' })
      return
    }

    gsap.fromTo(
      white,
      { opacity: 1 },
      {
        opacity: 0,
        duration: SALON_WHITE_DURATION,
        ease: SALON_WHITE_EASE,
        onComplete: () => {
          gsap.set(white, { visibility: 'hidden' })
        },
      },
    )
  }, [introDone, firstScrollDone])

  useLayoutEffect(() => {
    if (!introDone || !firstScrollDone) return
    const frameEndScrollY = FRAME_SEQ_START_PX + FRAME_SEQ_SCROLL_RANGE_PX
    const measure = () => {
      const m = mainRef.current
      if (!m) return
      const docTop = m.getBoundingClientRect().top + window.scrollY
      const ih = window.innerHeight
      /** Son kare tam ekran (sabit katman) iken mektup bölümünün üstü viewport altına değsin: docTop + spacer - Y = ih → Y = frameEnd iken spacer = frameEnd - docTop + ih */
      const base = Math.max(0, frameEndScrollY - docTop)
      setCalendarLeadSpacerPx(base + ih)
    }
    measure()
    const id = window.requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => {
      window.cancelAnimationFrame(id)
      window.removeEventListener('resize', measure)
    }
  }, [introDone, firstScrollDone])

  const FRAME_END_SCROLL_PX = FRAME_SEQ_START_PX + FRAME_SEQ_SCROLL_RANGE_PX

  useEffect(() => {
    if (!firstScrollDone) {
      setLetterSectionMounted(false)
      return
    }
    if (letterSectionMounted) return
    const check = () => {
      const y = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0)
      if (y >= FRAME_END_SCROLL_PX) setLetterSectionMounted(true)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [firstScrollDone, letterSectionMounted])

  useEffect(() => {
    if (!firstScrollDone) return

    let raf = 0
    let smoothedPhotoScale = 1

    const tick = () => {
      if (document.visibilityState === 'hidden') {
        raf = 0
        return
      }

      const y = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0)

      const concertBg = concertBgRef.current
      const bandAnime = bandAnimeRef.current
      const bandSec = bandSectionRef.current
      const words = happyWordRefs.current
      if (bandSec) {
        const vh = window.innerHeight
        const rect = bandSec.getBoundingClientRect()
        const denom = Math.max(1, bandSec.offsetHeight - vh)
        const p = Math.max(0, Math.min(1, -rect.top / denom))
        const beforeSticky = rect.top > 0
        const afterSticky = rect.bottom <= vh
        const progress = afterSticky ? 1 : p

        if (beforeSticky) {
          if (bandAnime) {
            bandAnime.style.opacity = '0'
            bandAnime.style.transform = 'translateX(-70%) scale(0.55)'
          }
          if (concertBg) {
            concertBg.style.opacity = '0'
          }
        } else if (progress < BAND_SCROLL_CONCERT_END) {
          if (bandAnime) {
            bandAnime.style.opacity = '0'
            bandAnime.style.transform = 'translateX(-70%) scale(0.55)'
          }
          if (concertBg) {
            concertBg.style.opacity = '0'
          }
        } else if (progress < BAND_SCROLL_BAND_END) {
          const u =
            (progress - BAND_SCROLL_CONCERT_END) / (BAND_SCROLL_BAND_END - BAND_SCROLL_CONCERT_END)
          if (bandAnime) {
            bandAnime.style.opacity = '1'
            // soldan kayarak + orijinal boyutuna büyüyerek: X -70%→0, scale 0.55→1
            bandAnime.style.transform = `translateX(${-70 + u * 70}%) scale(${0.55 + u * 0.45})`
          }
          if (concertBg) {
            concertBg.style.opacity = '0'
          }
        } else {
          const u = Math.max(
            0,
            Math.min(
              1,
              (progress - BAND_SCROLL_BAND_END) / (BAND_SCROLL_STAGE_END - BAND_SCROLL_BAND_END),
            ),
          )
          if (bandAnime) {
            bandAnime.style.opacity = '1'
            bandAnime.style.transform = 'translateX(0) scale(1)'
          }
          if (concertBg) {
            concertBg.style.opacity = String(u)
          }
        }

        // band-stage-bg belirdikten SONRA (STAGE_END → 1) kelimeler tek tek değişir
        const n = words.length
        for (let i = 0; i < n; i++) {
          const el = words[i]
          if (!el) continue
          let op = 0
          if (!beforeSticky && progress >= BAND_SCROLL_STAGE_END && n > 0) {
            const span = 1 - BAND_SCROLL_STAGE_END
            const slice = span / n
            const local = progress - BAND_SCROLL_STAGE_END
            const t = (local - i * slice) / slice
            if (t >= 0 && t <= 1) {
              // son kelime sabit kalsın, diğerleri fade-in/out
              const fadeOut = i === n - 1 ? 1 : Math.min(1, (1 - t) / 0.18)
              op = Math.max(0, Math.min(1, Math.min(t / 0.18, fadeOut)))
            }
          }
          el.style.opacity = String(op)
        }
      }

      const ne = salonNightRef.current
      if (ne) ne.style.opacity = String(salonNightProgress(y))

      const stage = salonScrollStageRef.current
      if (stage) stage.style.opacity = String(salonRoomStackOpacity(y))

      const zp = salonPhotoZoomProgress(y)
      const targetScale = 1 + zp * PHOTO_ZOOM_EXTRA
      smoothedPhotoScale += (targetScale - smoothedPhotoScale) * 0.1
      const zoomEl = salonNightZoomRef.current
      if (zoomEl) {
        zoomEl.style.transformOrigin = `${PHOTO_ZOOM_ORIGIN_X_PCT}% ${PHOTO_ZOOM_ORIGIN_Y_PCT}%`
        zoomEl.style.transform = `scale(${smoothedPhotoScale})`
      }

      const frameA = geceFrameARef.current
      const frameB = geceFrameBRef.current
      if (frameA && frameB) {
        const n = SALON_GECE_FRAME_COUNT
        const idx = salonGeceFrameIndex(y, n)
        if (idx !== displayedGeceFrameIdxRef.current) {
          const targetIdx = idx
          const url = SALON_GECE_FRAMES[targetIdx]!
          const showA = geceShowARef.current
          const vis = showA ? frameA : frameB
          const hid = showA ? frameB : frameA
          const gen = ++geceFrameSwapGenRef.current
          const applySwap = () => {
            if (gen !== geceFrameSwapGenRef.current) return
            hid.style.opacity = '1'
            requestAnimationFrame(() => {
              if (gen !== geceFrameSwapGenRef.current) return
              vis.style.opacity = '0'
              geceShowARef.current = !showA
              displayedGeceFrameIdxRef.current = targetIdx
            })
          }
          const tryApply = () => {
            if (gen !== geceFrameSwapGenRef.current) return
            const yNow = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0)
            if (salonGeceFrameIndex(yNow, n) !== targetIdx) return
            applySwap()
          }
          hid.src = url
          void hid
            .decode()
            .then(() => {
              tryApply()
            })
            .catch(() => {
              tryApply()
            })
        }
      }

      raf = window.requestAnimationFrame(tick)
    }

    const onVis = () => {
      if (document.visibilityState === 'visible' && raf === 0) {
        raf = window.requestAnimationFrame(tick)
      } else if (document.visibilityState === 'hidden') {
        window.cancelAnimationFrame(raf)
        raf = 0
      }
    }

    raf = window.requestAnimationFrame(tick)
    document.addEventListener('visibilitychange', onVis)

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.cancelAnimationFrame(raf)
    }
  }, [firstScrollDone, letterSectionMounted])

  return (
    <div className="relative min-h-dvh overflow-x-clip text-zinc-50">
      <a
        href="#main-content"
        className="sr-only font-body focus:fixed focus:left-4 focus:top-4 focus:z-[3000] focus:block focus:rounded-md focus:border focus:border-zinc-200/90 focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:text-zinc-900 focus:shadow-xl focus:outline-none"
      >
        İçeriğe geç
      </a>

      <div className="pointer-events-none fixed inset-0 z-0" style={{ backgroundColor: REVEAL_BG }} aria-hidden />

      <div
        ref={veilRef}
        className="pointer-events-none fixed inset-0 z-[1] will-change-transform"
        style={{ background: VEIL_BG }}
        aria-hidden
      />

      {firstScrollDone ? (
        <div
          ref={salonScrollStageRef}
          className="pointer-events-none fixed inset-0 z-[2] will-change-[opacity]"
          style={{ opacity: 1 }}
          aria-hidden
        >
          <img
            src={ASSETS.salonSabah}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            decoding="async"
            fetchPriority="high"
          />
          <div
            ref={salonNightRef}
            className="absolute inset-0 overflow-hidden will-change-[opacity]"
            style={{ opacity: 0, backgroundColor: '#0a0a0a' }}
          >
            <div
              ref={salonNightZoomRef}
              className="absolute inset-0 isolate will-change-transform"
              style={{
                transformOrigin: `${PHOTO_ZOOM_ORIGIN_X_PCT}% ${PHOTO_ZOOM_ORIGIN_Y_PCT}%`,
                transform: 'scale(1)',
                backgroundColor: '#0a0a0a',
              }}
            >
              <img
                ref={geceFrameARef}
                src={SALON_GECE_FRAMES[0]}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{ opacity: 1 }}
                decoding="async"
                fetchPriority="low"
                draggable={false}
              />
              <img
                ref={geceFrameBRef}
                src={SALON_GECE_FRAMES[0]}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{ opacity: 0 }}
                decoding="async"
                fetchPriority="low"
                draggable={false}
              />
            </div>
          </div>
          <div
            ref={salonWhiteRef}
            className="absolute inset-0 bg-white will-change-[opacity]"
          />
          <div className="app-vignette" aria-hidden />
          <div className="app-grain-fine" aria-hidden />
        </div>
      ) : null}

      <div
        className={`relative isolate z-[30] flex min-h-dvh flex-col font-body transition-[color] duration-700 ease-out ${firstScrollDone ? 'text-zinc-900' : 'text-zinc-50'}`}
        style={{
          minHeight: '100vh',
        }}
      >
        <SiteHeader
          logoAnchorRef={logoAnchorRef}
          showHeaderLogo={introDone || headerLogoLocked}
        />
        {!introDone ? (
          <LogoCenterFlyIn
            anchorRef={logoAnchorRef}
            beginExit={firstScrollDone}
            onDone={handleIntroDone}
          />
        ) : null}
        <main
          id="main-content"
          ref={mainRef}
          className={
            introDone && firstScrollDone
              ? 'relative flex w-full shrink-0 flex-col'
              : 'relative flex min-h-0 flex-1 flex-col'
          }
          style={introDone && firstScrollDone ? undefined : { minHeight: '2rem' }}
        >
          {introDone && firstScrollDone ? (
            <>
              <div
                className="pointer-events-none shrink-0"
                style={{ minHeight: calendarLeadSpacerPx }}
                aria-hidden
              />
              {letterSectionMounted ? (
              <section
                id="takvim-bolumu"
                className="relative z-10 flex min-h-dvh w-full shrink-0 items-center justify-center border-y border-zinc-200/70 bg-white"
              >
                <div className="flex w-full max-w-5xl flex-row items-center gap-8 px-8 sm:gap-16 sm:px-16">
                  <img
                    src={ASSETS.sectionCalendar03}
                    alt=""
                    className="h-auto w-72 shrink-0 object-contain sm:w-96"
                    width={280}
                    height={280}
                    decoding="async"
                    style={{ animation: 'letterFadeUp 0.7s ease-out both' }}
                  />
                  <article
                    className="min-w-0 space-y-4 font-body text-sm leading-[1.85] text-zinc-600 sm:text-[0.9375rem]"
                    style={{ animation: 'letterFadeUp 0.7s 0.2s ease-out both' }}
                  >
                    <p>
                      Seviyorum demenin binlerce yolu var.
                    </p>
                    <p>Bazen bir bakışta saklıdır, bazen saatler süren bir sohbette, bazen de hiçbir şey söylemeden aynı manzarayı izleyebilmekte.</p>
                    <p>Bu hikâye sadece bir yıl dönümünün hikâyesi değil. Birlikte kurduğumuz hayallerin, atlattığımız zorlukların, kahkahalarımızın, gözyaşlarımızın ve her şeye rağmen birbirimizi seçmeye devam edişimizin hikâyesi.</p>
                    <p>3 Haziran'da başlayan bu yolculuk bana tek bir şey öğretti: bir insan kendini bir yerde değil, bir kişinin yanında evinde hissedebiliyormuş.</p>
                    <p>Bu yüzden burada gördüğün ev sadece duvarlardan oluşmuyor. İçinde anılarımız, umutlarımız, geleceğe dair kurduğumuz tüm hayaller var.</p>
                    <p>Ve bu sayfadaki her sahne, sana söylemek istediğim tek cümlenin farklı bir hali:</p>
                    <p className="font-display text-base font-semibold tracking-wide text-zinc-900 sm:text-lg">
                      İyi ki varsın. İyi ki benim hikâyemsin. İyi ki seni seviyorum.
                    </p>
                    <p>Şimdi en sevdiğinle devam edebiliriz</p>
                  </article>
                </div>
              </section>
              ) : null}
              {letterSectionMounted ? (
              <section
                ref={bandSectionRef}
                className="relative z-10 w-full shrink-0 overflow-x-clip bg-white min-h-[340dvh]"
              >
                <div className="sticky top-0 z-10 relative flex h-dvh w-full flex-col items-center justify-end overflow-hidden bg-white">
                {/* 1) Tam ekran konser — sticky ile altta scroll payı */}
                <img
                  src={ASSETS.concert}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  decoding="async"
                  aria-hidden
                />
                {/* 3) Sahne + arka planlı — transparan bitince scroll ile */}
                <img
                  ref={concertBgRef}
                  src={ASSETS.bandStageBg}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ opacity: 0 }}
                  decoding="async"
                  aria-hidden
                />
                {/* 2) Transparan — konser scroll’u bittikten sonra soldan sağa */}
                <img
                  ref={bandAnimeRef}
                  src={ASSETS.bandAnime}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  decoding="async"
                  style={{ opacity: 0, transform: 'translateX(-70%) scale(0.55)' }}
                />
                {/* Konserin üstünde tek tek değişen kelimeler */}
                <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center px-[4vw]">
                  {['DAHA', 'MUTLU', 'OLAMAM'].map((w, i) => (
                    <span
                      key={w}
                      ref={(el) => {
                        happyWordRefs.current[i] = el
                      }}
                      className="col-start-1 row-start-1 font-body font-black uppercase leading-[0.9] tracking-tighter text-white"
                      style={{
                        fontSize: 'min(26vw, 30vh)',
                        opacity: 0,
                        textShadow: '0 4px 40px rgba(0,0,0,0.55)',
                        willChange: 'opacity',
                      }}
                    >
                      {w}
                    </span>
                  ))}
                </div>
                </div>
              </section>
              ) : null}
              {letterSectionMounted ? (
              <section className="relative z-10 flex min-h-dvh w-full shrink-0 items-center justify-center bg-white px-6 py-24 sm:px-12">
                <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-12 sm:grid-cols-2 sm:gap-8">
                  {/* Sol — sayı + söz */}
                  <div className="flex flex-col items-start gap-4 text-left">
                    <p className="font-body text-sm font-medium uppercase tracking-[0.3em] text-zinc-400">
                      {relStartLabel} — {relTodayLabel}
                    </p>
                    <div className="flex items-baseline gap-3">
                      <CountUp
                        to={daysTogether}
                        className="font-body text-7xl font-black leading-none tracking-tighter text-zinc-900 sm:text-8xl"
                      />
                      <span className="font-body text-2xl font-semibold uppercase tracking-[0.2em] text-zinc-400 sm:text-3xl">
                        gün önce
                      </span>
                    </div>
                    <p className="font-display text-2xl font-semibold leading-snug text-zinc-700 sm:text-3xl">
                      birbirimize verdiğimiz bir söz
                    </p>
                  </div>

                  {/* Sağ — scroll ile beliren çardak */}
                  <div className="flex items-center justify-center sm:justify-end">
                    <img
                      ref={(el) => {
                        cardakRef.current = el
                      }}
                      src={ASSETS.sectionCardak}
                      alt="Çardak"
                      className="h-auto w-full max-w-md object-contain"
                      decoding="async"
                      style={{
                        opacity: 0,
                        transform: 'translateX(40px)',
                        transition: 'opacity 0.9s ease-out, transform 0.9s cubic-bezier(0.22,1,0.36,1)',
                      }}
                    />
                  </div>
                </div>
              </section>
              ) : null}
            </>
          ) : null}
        </main>
      </div>
    </div>
  )
}
