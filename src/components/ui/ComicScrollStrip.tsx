import { useEffect, useRef, useState, type MutableRefObject } from 'react'

/** Tam ekran çizgi roman — scroll ile küçülme mesafesi */
const SHRINK_SCROLL_VH = 200

export type ComicScrollStripProps = {
  /** 0…1 — Salon’daki kalp konser ölçeği / opaklığı için */
  stripProgressOutRef?: MutableRefObject<number>
  stripUnlocked?: boolean
  comicSrc?: string
}

/**
 * Konser sonrası tam ekran çizgi roman; scroll ilerledikçe stripProgressOutRef güncellenir.
 */
export function ComicScrollStrip({
  stripProgressOutRef,
  stripUnlocked = false,
  comicSrc,
}: ComicScrollStripProps) {
  const pageRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef(0)

  useEffect(() => {
    const tick = () => {
      rafRef.current = 0
      if (!stripUnlocked) return
      const el = pageRef.current
      if (!el) return
      const y = window.scrollY
      const rect = el.getBoundingClientRect()
      const elTopDoc = rect.top + y
      const zone = el.offsetHeight - window.innerHeight * 0.4
      const raw = (y - elTopDoc + window.innerHeight * 0.2) / Math.max(1, zone)
      const t = Math.max(0, Math.min(1, raw))
      setProgress(t)
      if (stripProgressOutRef) stripProgressOutRef.current = t
    }

    const onScroll = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(tick)
    }

    tick()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (stripProgressOutRef) stripProgressOutRef.current = 0
    }
  }, [stripUnlocked, stripProgressOutRef])

  useEffect(() => {
    if (!stripUnlocked) {
      queueMicrotask(() => {
        setProgress(0)
        if (stripProgressOutRef) stripProgressOutRef.current = 0
      })
    }
  }, [stripUnlocked, stripProgressOutRef])

  const scale = 1 - progress * 0.72

  if (!stripUnlocked) {
    return (
      <section
        className="relative z-40 w-full bg-zinc-950"
        aria-label="Çizgi roman — henüz kilitli"
      >
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="font-body text-[10px] font-light uppercase tracking-[0.28em] text-white/35">
            Video bittikten sonra konser; aşağı kaydırınca çizgi roman tam ekran
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative z-40 w-full bg-black" aria-label="Konser — çizgi roman tam ekran">
      <div
        ref={pageRef}
        className="relative w-full"
        style={{ minHeight: `${SHRINK_SCROLL_VH}vh` }}
      >
        <div className="sticky top-0 flex min-h-[100dvh] w-full items-stretch justify-center overflow-hidden">
          <figure
            className="flex min-h-[100dvh] w-full max-w-none flex-col motion-safe:transition-transform motion-safe:duration-75 motion-safe:ease-out"
            style={{
              transform: `scale(${Math.max(0.2, scale)})`,
              transformOrigin: 'center center',
              willChange: 'transform',
            }}
          >
            <div className="relative flex min-h-[100dvh] w-full flex-1 bg-black">
              {comicSrc ? (
                <img
                  src={comicSrc}
                  alt="Konser — çizgi roman"
                  className="h-full min-h-[100dvh] w-full object-cover object-top"
                  draggable={false}
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full min-h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-neutral-950 px-8 py-16 text-center">
                  <p className="max-w-md font-body text-[12px] font-light leading-relaxed text-white/75">
                    Tam ekran çizgi roman alanı. Görseli <code className="text-white/90">comicSrc</code> ile
                    verebilirsin; yoksa konser kareleri kalp sahnesinde dönmeye devam eder.
                  </p>
                </div>
              )}
            </div>
            <figcaption className="pointer-events-none shrink-0 bg-black py-3 text-center font-body text-[10px] font-light uppercase tracking-[0.26em] text-white/40">
              Kaydır — sahne küçülür
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
