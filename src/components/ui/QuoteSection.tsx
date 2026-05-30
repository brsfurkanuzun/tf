import { useEffect, useRef, useState } from 'react'
import { COUPLE_GALLERY } from '../../config/assets'

export function QuoteSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.06) setRevealed(true)
      },
      { threshold: [0, 0.06, 0.15] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className={`quote-section${revealed ? ' quote-section--revealed' : ''}`}
      aria-label="Alıntı ve galeri"
    >
      <div className="quote-section__gallery">
        {COUPLE_GALLERY.map(({ src, label }) => (
          <figure key={label} className="quote-section__frame">
            <span className="quote-section__label font-display" aria-hidden="true">
              {label}
            </span>
            <img src={src} alt="" className="quote-section__image" draggable={false} />
          </figure>
        ))}
      </div>

      <blockquote className="quote-section__text font-display">
       
      </blockquote>
      <p className="quote-section__attrib font-body">Reverie</p>
    </section>
  )
}
