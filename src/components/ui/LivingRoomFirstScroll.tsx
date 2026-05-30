import { useEffect, useState } from 'react'
import { ASSETS } from '../../config/assets'

function smoothstep(edge0: number, edge1: number, x: number) {
  if (x <= edge0) return 0
  if (x >= edge1) return 1
  const t = (x - edge0) / (edge1 - edge0)
  return t * t * (3 - 2 * t)
}

/** TV merkezi (hero’da ~%37 dikey) — kırpıma göre ince ayar */
const TV_ORIGIN = '50% 37%' as const
const SCALE_AT_END = 6.75
/** 0…SPLIT scroll: sadece gündüz→gece; SPLIT…1: sadece zoom (gece tam) */
const SPLIT = 0.4

/**
 * Aşağı scroll: (1) önce fotoğraf karışır, (2) sonra TV’ye zoom.
 * Yukarı: ters sıra (önce zoom geri, sonra gündüz).
 */
export function LivingRoomFirstScroll() {
  const [scrollRaw, setScrollRaw] = useState(0)

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
    const update = () => {
      const doc = document.documentElement
      const max = Math.max(1, doc.scrollHeight - window.innerHeight)
      const raw = Math.max(0, Math.min(1, window.scrollY / max))
      setScrollRaw(raw)
    }

    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const raw = scrollRaw
  let nightMix = 0
  let scale = 1
  if (raw <= SPLIT) {
    const t = SPLIT > 0 ? raw / SPLIT : 0
    nightMix = smoothstep(0.05, 0.95, t)
    scale = 1
  } else {
    nightMix = 1
    const denom = 1 - SPLIT
    const t = denom > 0 ? (raw - SPLIT) / denom : 0
    const u = Math.max(0, Math.min(1, t))
    scale = 1 + (SCALE_AT_END - 1) * Math.pow(u, 1.02)
  }

  const dayOpacity = 1 - nightMix
  const nightOpacity = nightMix

  let hint = ''
  if (raw < SPLIT * 0.97 && nightMix < 0.97) {
    hint = 'Aşağı — önce görsel değişir'
  } else if (raw >= SPLIT && scale < SCALE_AT_END - 0.25) {
    hint = 'Aşağı — TV’ye yaklaş'
  } else if (raw > 0.9) {
    hint = 'Yukarı — önce uzaklaş, sonra gündüz'
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black">
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: TV_ORIGIN,
          }}
        >
          <img
            src={ASSETS.livingRoomNightAiScroll}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center motion-safe:transition-[opacity] motion-safe:duration-150 motion-safe:ease-out"
            style={{ opacity: nightOpacity }}
            draggable={false}
            fetchPriority="low"
          />
          <img
            src={ASSETS.livingRoomHero}
            alt="Salon"
            className="absolute inset-0 h-full w-full object-cover object-center motion-safe:transition-[opacity] motion-safe:duration-150 motion-safe:ease-out"
            style={{ opacity: dayOpacity }}
            draggable={false}
            fetchPriority="high"
          />
        </div>

        {hint && (
          <p className="absolute inset-x-0 bottom-10 z-10 text-center font-body text-[10px] font-light tracking-[0.28em] text-white/55 uppercase">
            {hint}
          </p>
        )}
      </div>

      <div className="relative z-10 min-h-[280vh] w-full" aria-hidden="true" />
    </>
  )
}
