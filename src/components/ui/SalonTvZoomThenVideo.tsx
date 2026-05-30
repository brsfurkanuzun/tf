import { useEffect, useRef, useState } from 'react'
import { ASSETS } from '../../config/assets'

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
const SCROLL_SPACER_VH = 380

/**
 * 1) Gündüz → gece. 2) TV’ye zoom. 3) Tam zoom + ek scroll → video.
 */
export function SalonTvZoomThenVideo() {
  const heroWrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scrollYRef = useRef(0)
  const rafPendingRef = useRef(false)
  const videoStartedRef = useRef(false)
  const [videoOn, setVideoOn] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const nightLayerRef = useRef<HTMLImageElement>(null)
  const dayLayerRef = useRef<HTMLImageElement>(null)
  const rewindRafRef = useRef(0)
  const rewindLastTsRef = useRef(0)

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

  useEffect(() => {
    const v = videoRef.current
    if (v) {
      v.pause()
      v.currentTime = 0
    }
    setVideoEnded(false)
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

  /** Bitti: yukarı scroll → 2x geri sar */
  useEffect(() => {
    if (!videoEnded) return
    const vid = videoRef.current
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
  }, [videoEnded])

  useEffect(() => {
    const flush = () => {
      rafPendingRef.current = false
      const y = scrollYRef.current
      const totalMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const endNightY = totalMax * NIGHT_PHASE_RATIO
      const startZoomY = endNightY
      const zoomSpan = totalMax * (1 - NIGHT_PHASE_RATIO) * ZOOM_END_OF_REMAINDER
      const endZoomY = startZoomY + zoomSpan
      const wrap = heroWrapRef.current
      const nightEl = nightLayerRef.current
      const dayEl = dayLayerRef.current

      let nightMix = 0
      if (y <= endNightY && endNightY > 0) {
        const t = y / endNightY
        nightMix = smoothstep(0.05, 0.95, t)
      } else {
        nightMix = 1
      }
      const dayOpacity = 1 - nightMix
      const nightOpacity = nightMix
      if (nightEl) nightEl.style.opacity = String(nightOpacity)
      if (dayEl) dayEl.style.opacity = String(dayOpacity)

      if (wrap) {
        let s = 1
        if (y <= startZoomY) {
          s = 1
        } else if (y >= endZoomY) {
          s = SCALE_AT_END
        } else {
          const p = zoomSpan > 0 ? (y - startZoomY) / zoomSpan : 1
          const u = Math.max(0, Math.min(1, p))
          s = 1 + u * (SCALE_AT_END - 1)
        }
        wrap.style.transform = `scale(${s})`

        if (!videoStartedRef.current && y > endZoomY + UNLOCK_EXTRA_PX) {
          videoStartedRef.current = true
          setVideoOn(true)
          const vid = videoRef.current
          if (vid) void vid.play().catch(() => {})
        }
      }
    }

    const onScroll = () => {
      scrollYRef.current = window.scrollY
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
      <div className="fixed inset-0 z-0 bg-black">
        <div
          ref={heroWrapRef}
          className={`absolute inset-0 will-change-transform motion-safe:transition-opacity motion-safe:duration-700 motion-safe:ease-out ${
            videoOn ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
          style={{
            transform: 'scale(1)',
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
        </div>

        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-contain motion-safe:transition-opacity motion-safe:duration-700 motion-safe:ease-out ${
            videoOn ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          src={ASSETS.scrollKlingHero}
          muted
          playsInline
          preload="auto"
          onEnded={() => setVideoEnded(true)}
        />

        {!videoOn && (
          <p className="pointer-events-none absolute inset-x-0 bottom-10 z-10 text-center font-body text-[10px] font-light leading-relaxed tracking-[0.22em] text-white/55 uppercase">
            Gece · TV · video — aşağı kaydır
          </p>
        )}
      </div>

      <div
        className="relative z-10 w-full"
        style={{ minHeight: `${SCROLL_SPACER_VH}vh` }}
        aria-hidden="true"
      />
    </>
  )
}
