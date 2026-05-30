import { useEffect, useRef, useState } from 'react'
import { KLING_SCROLL_FRAMES, preloadImages } from '../../config/assets'

const SCROLL_SPACER_VH = 320

/**
 * Scroll ↔ kare indeksi (aşağı ileri, yukarı geri).
 */
export function ScrollKlingFrames() {
  const scrollYRef = useRef(0)
  const rafPendingRef = useRef(false)
  const lastIdxRef = useRef(-1)
  const [frameIdx, setFrameIdx] = useState(0)

  const maxIdx = KLING_SCROLL_FRAMES.length - 1

  useEffect(() => {
    preloadImages([...KLING_SCROLL_FRAMES])
  }, [])

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
    const flush = () => {
      rafPendingRef.current = false
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const p = Math.max(0, Math.min(1, scrollYRef.current / max))
      const idx = Math.min(maxIdx, Math.max(0, Math.floor(p * maxIdx + 1e-9)))
      if (idx !== lastIdxRef.current) {
        lastIdxRef.current = idx
        setFrameIdx(idx)
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
  }, [maxIdx])

  const src = KLING_SCROLL_FRAMES[frameIdx] ?? KLING_SCROLL_FRAMES[0]

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center bg-black">
        <img
          src={src}
          alt=""
          className="h-full w-full object-contain"
          draggable={false}
        />
        <p className="pointer-events-none absolute inset-x-0 bottom-8 z-10 text-center font-body text-[10px] font-light tracking-[0.28em] text-white/50 uppercase">
          Aşağı: ileri · Yukarı: geri
        </p>
      </div>

      <div
        className="relative z-10 w-full"
        style={{ minHeight: `${SCROLL_SPACER_VH}vh` }}
        aria-hidden="true"
      />
    </>
  )
}
