import { COUPLE_GALLERY } from '../../config/assets'

export function QuoteSection() {
  return (
    <section className="quote-section" aria-label="Alıntı ve galeri">
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
        Allah nasip etmeyeceğini hayal ettirmezmiş.
      </blockquote>
      <p className="quote-section__attrib font-body">Reverie</p>
    </section>
  )
}
