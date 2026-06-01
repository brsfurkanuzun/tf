import { useEffect, useId, useRef, useState } from 'react'
import { ASSETS, CONCERT_FRAME_COUNT, CONCERT_FRAMES } from '../../config/assets'
import { ComicScrollStrip } from './ComicScrollStrip'

function smoothstep(edge0: number, edge1: number, x: number) {
  if (x <= edge0) return 0
  if (x >= edge1) return 1
  const t = (x - edge0) / (edge1 - edge0)
  return t * t * (3 - 2 * t)
}

/** TV merkezi (living-room-hero’da ~%37 dikey) — kırpma için ince ayar */
const TV_ORIGIN = '50% 37%'
/** Tam zoom’da TV alanı tüm ekranı doldursun (~%18–20 genişlik → ~6.5+) */
const SCALE_AT_END = 6.75
/** Toplam scroll’un bu oranı: gündüz → gece (ilk faz) */
const NIGHT_PHASE_RATIO = 0.32
/** Gece tamamlandıktan sonra kalan scroll’un bu oranı: zoom bitişi (toplamda ~0.72) */
const ZOOM_END_OF_REMAINDER = 0.588
/** Tam zoom sonrası bu kadar px daha aşağı → video */
const UNLOCK_EXTRA_PX = 56
/** TV ekranı kabaca hero üzerinde (gündüz kareye göre ince ayar) */
const TV_SLOT = {
  left: '40%',
  top: '22.5%',
  width: '20%',
} as const
const SCROLL_SPACER_VH = 380
/** Video ile aynı anda; kısık */
const BGM_VOLUME = 0.22
/** Konser kare ping-pong: 0 → son → … → 0 → … */
const CONCERT_FRAME_MS = 1000 / 24
/** Konser klipi üst başlık (istediğin metni değiştir) */
const CONCERT_TITLE = 'Mor ve Ötesi — Canlı konser'

function getLivingRoomScrollLayout() {
  const totalMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  const endNightY = totalMax * NIGHT_PHASE_RATIO
  const startZoomY = endNightY
  const zoomSpan = totalMax * (1 - NIGHT_PHASE_RATIO) * ZOOM_END_OF_REMAINDER
  const endZoomY = startZoomY + zoomSpan
  return { totalMax, endNightY, startZoomY, zoomSpan, endZoomY }
}

/**
 * 1) Gündüz → gece. 2) TV’ye zoom. 3) Tam zoom + ek scroll → video.
 */
export function SalonTvZoomThenVideo() {
  const heroWrapRef = useRef<HTMLDivElement>(null)
  const carVideoRef = useRef<HTMLVideoElement>(null)
  const tvPeekRef = useRef<HTMLVideoElement>(null)
  const vignetteRef = useRef<HTMLDivElement>(null)
  const tvSlotWrapRef = useRef<HTMLDivElement>(null)
  const scrollYRef = useRef(0)
  const rafPendingRef = useRef(false)
  const videoStartedRef = useRef(false)
  const [videoOn, setVideoOn] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [showConcertLoop, setShowConcertLoop] = useState(false)
  const [concertFrameIdx, setConcertFrameIdx] = useState(0)
  const stripProgressRef = useRef(0)
  const heartShellRef = useRef<HTMLDivElement>(null)
  const heartAnimStartRef = useRef<number | null>(null)
  const heartClipId = useId().replace(/:/g, '')
  const nightLayerRef = useRef<HTMLImageElement>(null)
  const dayLayerRef = useRef<HTMLImageElement>(null)
  const rewindRafRef = useRef(0)
  const rewindLastTsRef = useRef(0)
  const concertAnimRafRef = useRef(0)
  const concertAnimLastRef = useRef(0)
  const concertDirRef = useRef(1)
  const audioRef = useRef<HTMLAudioElement>(null)
  /** Chrome: scroll jesti ses için yetmez; ilk pointer/wheel ile açılır */
  const audioUnlockedRef = useRef(false)

  useEffect(() => {
    const prevBody = document.body.style.backgroundColor
    const prevHtml = document.documentElement.style.backgroundColor
    document.body.style.backgroundColor = '#000000'
    document.documentElement.style.backgroundColor = '#000000'
    return () => {
      document.body.style.backgroundColor = prevBody
      document.documentElement.style.backgroundColor = prevHtml
    }
  }, [])

  /** Chrome: scroll tek başına ses play() için yetmez; ilk tık veya tekerle jesti */
  useEffect(() => {
    const primeAudio = () => {
      const aud = audioRef.current
      if (!aud || audioUnlockedRef.current) return
      try {
        aud.muted = true
        aud.volume = 0
        aud.currentTime = 0
        void aud.play()
        aud.pause()
        aud.currentTime = 0
        aud.muted = false
        aud.volume = BGM_VOLUME
        audioUnlockedRef.current = true
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('pointerdown', primeAudio, { capture: true, passive: true })
    window.addEventListener('wheel', primeAudio, { capture: true, passive: true })
    window.addEventListener('keydown', primeAudio, { capture: true, passive: true })
    return () => {
      window.removeEventListener('pointerdown', primeAudio, true)
      window.removeEventListener('wheel', primeAudio, true)
      window.removeEventListener('keydown', primeAudio, true)
    }
  }, [])

  useEffect(() => {
    const car = carVideoRef.current
    const peek = tvPeekRef.current
    if (car) {
      car.pause()
      car.currentTime = 0
    }
    if (peek) {
      peek.pause()
      peek.currentTime = 0
    }
    const a = audioRef.current
    if (a) {
      a.pause()
      a.currentTime = 0
    }
    queueMicrotask(() => {
      setVideoEnded(false)
      setShowConcertLoop(false)
      setConcertFrameIdx(0)
      stripProgressRef.current = 0
    })
  }, [])

  /** Video oynarken sayfa scroll’u kapat; bitince geri aç */
  useEffect(() => {
    if (!videoOn || videoEnded) return

    const lockY = window.scrollY
    const prev = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
    }
    document.body.style.position = 'fixed'
    document.body.style.top = `-${lockY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    const blockWheel = (e: WheelEvent) => {
      e.preventDefault()
    }
    const blockTouch = (e: TouchEvent) => {
      e.preventDefault()
    }
    window.addEventListener('wheel', blockWheel, { passive: false })
    document.addEventListener('touchmove', blockTouch, { passive: false })

    return () => {
      window.removeEventListener('wheel', blockWheel)
      document.removeEventListener('touchmove', blockTouch)
      document.body.style.position = prev.position
      document.body.style.top = prev.top
      document.body.style.left = prev.left
      document.body.style.right = prev.right
      document.body.style.width = prev.width
      document.body.style.overflow = prev.overflow
      document.documentElement.style.overflow = prev.htmlOverflow
      window.scrollTo(0, lockY)
    }
  }, [videoOn, videoEnded])

  /** Araba klibi bitti; konser döngüsünde bu geri sarma kapalı */
  useEffect(() => {
    if (!videoEnded || showConcertLoop) return
    const vid = carVideoRef.current
    if (!vid) return

    const stopRewindLoop = () => {
      if (rewindRafRef.current) {
        cancelAnimationFrame(rewindRafRef.current)
        rewindRafRef.current = 0
      }
    }

    const stepRewind = (now: number) => {
      if (!vid) {
        stopRewindLoop()
        return
      }
      if (vid.currentTime <= 0) {
        stopRewindLoop()
        vid.currentTime = 0
        return
      }
      const last = rewindLastTsRef.current || now
      rewindLastTsRef.current = now
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000))
      vid.currentTime = Math.max(0, vid.currentTime - dt * 2)
      if (vid.currentTime <= 0) {
        stopRewindLoop()
        rewindLastTsRef.current = 0
        return
      }
      rewindRafRef.current = requestAnimationFrame(stepRewind)
    }

    const startRewindIfNeeded = () => {
      if (vid.currentTime <= 0) return
      vid.pause()
      rewindLastTsRef.current = 0
      if (!rewindRafRef.current) {
        rewindRafRef.current = requestAnimationFrame(stepRewind)
      }
    }

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY >= 0) return
      startRewindIfNeeded()
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      stopRewindLoop()
      rewindLastTsRef.current = 0
    }
  }, [videoEnded, showConcertLoop])

  useEffect(() => {
    if (!showConcertLoop) {
      heartAnimStartRef.current = null
      stripProgressRef.current = 0
      return
    }
    heartAnimStartRef.current = performance.now()
  }, [showConcertLoop])

  /** Konser kareleri + kalp ölçeği (scroll ile küçülür); video bitince hemen başlar */
  useEffect(() => {
    if (!showConcertLoop) {
      if (concertAnimRafRef.current) {
        cancelAnimationFrame(concertAnimRafRef.current)
        concertAnimRafRef.current = 0
      }
      queueMicrotask(() => setConcertFrameIdx(0))
      concertDirRef.current = 1
      return
    }
    carVideoRef.current?.pause()
    queueMicrotask(() => setConcertFrameIdx(0))
    concertDirRef.current = 1
    concertAnimLastRef.current = performance.now()

    const loop = (now: number) => {
      const tStrip = stripProgressRef.current
      const t0 = heartAnimStartRef.current
      let grow = 1
      if (t0 != null) {
        const u = Math.min(1, (now - t0) / 1300)
        grow = 1 - (1 - u) ** 2
      }
      const shrink = Math.max(0.06, 1 - tStrip * 0.94)
      const pulse = 1 + 0.032 * Math.sin(now * 0.0033)
      const sc = Math.max(0.04, grow * shrink * pulse)
      const el = heartShellRef.current
      if (el) {
        el.style.transform = `scale(${sc})`
        const fade = 1 - Math.max(0, Math.min(1, (tStrip - 0.34) / 0.66))
        el.style.opacity = String(fade)
      }

      if (tStrip < 0.985 && now - concertAnimLastRef.current >= CONCERT_FRAME_MS) {
        concertAnimLastRef.current = now
        setConcertFrameIdx((i) => {
          const d = concertDirRef.current
          const n = i + d
          if (n >= CONCERT_FRAME_COUNT - 1) {
            concertDirRef.current = -1
            return CONCERT_FRAME_COUNT - 1
          }
          if (n <= 0) {
            concertDirRef.current = 1
            return 0
          }
          return n
        })
      }
      concertAnimRafRef.current = requestAnimationFrame(loop)
    }
    concertAnimRafRef.current = requestAnimationFrame(loop)
    return () => {
      if (concertAnimRafRef.current) {
        cancelAnimationFrame(concertAnimRafRef.current)
        concertAnimRafRef.current = 0
      }
    }
  }, [showConcertLoop])

  useEffect(() => {
    const flush = () => {
      rafPendingRef.current = false
      const y = scrollYRef.current
      const { endNightY, startZoomY, zoomSpan, endZoomY } = getLivingRoomScrollLayout()
      const wrap = heroWrapRef.current
      const nightEl = nightLayerRef.current
      const dayEl = dayLayerRef.current

      const nightMix =
        y <= endNightY && endNightY > 0 ? smoothstep(0.05, 0.95, y / endNightY) : 1
      const dayOpacity = 1 - nightMix
      const nightOpacity = nightMix
      if (nightEl) nightEl.style.opacity = String(nightOpacity)
      if (dayEl) dayEl.style.opacity = String(dayOpacity)

      let zoomU = 0
      if (y > startZoomY && y < endZoomY && zoomSpan > 0) {
        zoomU = Math.max(0, Math.min(1, (y - startZoomY) / zoomSpan))
      } else if (y >= endZoomY) {
        zoomU = 1
      }

      if (wrap) {
        let s = 1
        if (y > startZoomY && y < endZoomY) {
          const p = zoomSpan > 0 ? (y - startZoomY) / zoomSpan : 1
          const u = Math.max(0, Math.min(1, p))
          s = 1 + u * (SCALE_AT_END - 1)
        } else if (y >= endZoomY) {
          s = SCALE_AT_END
        }
        const dive = smoothstep(0.72, 1, zoomU) * 2.4
        wrap.style.transform = `perspective(1100px) rotateX(${dive}deg) scale(${s})`
      }

      if (videoStartedRef.current) {
        if (vignetteRef.current) vignetteRef.current.style.opacity = '0'
      } else {
        const vig = smoothstep(0.35, 1, zoomU) * (0.35 + 0.65 * nightMix)
        if (vignetteRef.current) {
          vignetteRef.current.style.opacity = String(Math.min(0.9, vig * 0.95))
        }
      }
      const slotVis = videoStartedRef.current
        ? 0
        : smoothstep(0.82, 0.995, nightMix) * smoothstep(0.08, 0.42, zoomU)
      if (tvSlotWrapRef.current) {
        tvSlotWrapRef.current.style.opacity = String(slotVis)
      }
    }

    const tryStartMediaSync = (y: number) => {
      if (videoStartedRef.current) return
      const { endZoomY } = getLivingRoomScrollLayout()
      if (y <= endZoomY + UNLOCK_EXTRA_PX) return
      videoStartedRef.current = true
      setVideoOn(true)
      const vid = carVideoRef.current
      const peek = tvPeekRef.current
      const aud = audioRef.current
      if (peek) {
        peek.pause()
        peek.currentTime = 0
      }
      if (aud) {
        aud.currentTime = 0
        aud.volume = BGM_VOLUME
        aud.muted = false
        void aud.play().catch(() => {})
      }
      if (vid) void vid.play().catch(() => {})
    }

    const onScroll = () => {
      const y = window.scrollY
      scrollYRef.current = y
      tryStartMediaSync(y)
      if (rafPendingRef.current) return
      rafPendingRef.current = true
      requestAnimationFrame(flush)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <>
      <audio
        ref={audioRef}
        src={ASSETS.dahaMutluOlamam}
        preload="auto"
        className="pointer-events-none fixed h-px w-px overflow-hidden opacity-0"
        style={{ zIndex: -1 }}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-30 bg-black">
        <div
          ref={vignetteRef}
          className="pointer-events-none absolute inset-0 z-[5] transition-opacity duration-500 ease-out"
          style={{
            opacity: 0,
            background:
              'radial-gradient(ellipse 58% 52% at 50% 37%, transparent 0%, transparent 32%, rgba(0,0,0,0.2) 52%, rgba(0,0,0,0.88) 100%)',
          }}
          aria-hidden
        />
        <div
          ref={heroWrapRef}
          className={`absolute inset-0 z-[4] will-change-transform motion-safe:transition-opacity motion-safe:duration-700 motion-safe:ease-out ${
            videoOn ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
          style={{
            transform: 'perspective(1100px) rotateX(0deg) scale(1)',
            transformOrigin: TV_ORIGIN,
          }}
        >
          <img
            ref={nightLayerRef}
            src={ASSETS.livingRoomNightAiScroll}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            style={{ opacity: 0 }}
            draggable={false}
            fetchPriority="low"
          />
          <img
            ref={dayLayerRef}
            src={ASSETS.livingRoomHero}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            style={{ opacity: 1 }}
            draggable={false}
            fetchPriority="high"
          />
          <div
            ref={tvSlotWrapRef}
            className="pointer-events-none absolute z-[6] transition-opacity duration-500 ease-out"
            style={{
              left: TV_SLOT.left,
              top: TV_SLOT.top,
              width: TV_SLOT.width,
              aspectRatio: '16 / 9',
              opacity: 0,
              borderRadius: 3,
              boxShadow:
                '0 0 0 1px rgba(255,255,255,0.15), 0 0 32px rgba(120,170,255,0.22), inset 0 0 28px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
            aria-hidden
          >
            <video
              ref={tvPeekRef}
              className="h-full w-full object-cover object-center"
              src={ASSETS.scrollKlingHero}
              muted
              playsInline
              preload="auto"
              onLoadedData={(e) => {
                e.currentTarget.currentTime = 0
                e.currentTarget.pause()
              }}
            />
          </div>
        </div>

        <video
          ref={carVideoRef}
          className={`absolute inset-0 h-full w-full object-cover object-center motion-safe:transition-opacity motion-safe:duration-700 motion-safe:ease-out ${
            videoOn && !showConcertLoop ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          src={ASSETS.scrollKlingHero}
          muted
          playsInline
          preload="auto"
          onEnded={() => {
            carVideoRef.current?.pause()
            setVideoEnded(true)
            setShowConcertLoop(true)
          }}
        />

        {showConcertLoop && (
          <>
            <div className="pointer-events-none absolute inset-0 z-[14] bg-black" aria-hidden />
            <svg className="salon-heart-clip-svg" aria-hidden>
              <defs>
                <clipPath id={heartClipId} clipPathUnits="objectBoundingBox">
                  <path d="M0.5,0.9 C0.15,0.55 0,0.38 0.18,0.18 C0.3,0.04 0.45,0.1 0.5,0.26 C0.55,0.1 0.7,0.04 0.82,0.18 C1,0.38 0.85,0.55 0.5,0.9 Z" />
                </clipPath>
              </defs>
            </svg>
            <div className="pointer-events-none absolute inset-0 z-[18] flex items-center justify-center">
              <div
                ref={heartShellRef}
                className="relative will-change-[transform,opacity]"
                style={{
                  width: 'min(220vmin, 220vmax)',
                  height: 'min(220vmin, 220vmax)',
                  clipPath: `url(#${heartClipId})`,
                  transformOrigin: '50% 55%',
                  transform: 'scale(0.04)',
                  opacity: 1,
                }}
              >
                <img
                  src={CONCERT_FRAMES[concertFrameIdx] ?? CONCERT_FRAMES[0]}
                  alt=""
                  className="h-full w-full scale-110 object-cover object-center"
                  draggable={false}
                />
              </div>
            </div>
            <p className="pointer-events-none absolute top-6 right-0 left-0 z-[19] text-center font-body text-[11px] font-light tracking-[0.24em] text-white/90 uppercase drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]">
              {CONCERT_TITLE}
            </p>
          </>
        )}

        {!videoOn && (
          <p className="pointer-events-none absolute inset-x-0 bottom-10 z-10 text-center font-body text-[10px] font-light leading-relaxed tracking-[0.2em] text-white/50 uppercase">
            Işıklar söner, TV açılır — yaklaş; içeri girince klip ve müzik başlar. Sonra konser, en altta çizgi roman.
          </p>
        )}
      </div>

      <div
        className="relative z-0 w-full"
        style={{ minHeight: `${SCROLL_SPACER_VH}vh` }}
        aria-hidden="true"
      />
      <ComicScrollStrip stripUnlocked={showConcertLoop} stripProgressOutRef={stripProgressRef} />
    </>
  )
}
