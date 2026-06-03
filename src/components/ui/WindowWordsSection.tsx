import { useCallback, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ASSETS } from '../../config/assets'
import { MartiFlyIn } from './MartiFlyIn'

gsap.registerPlugin(ScrollTrigger)

/** Beyaz zemin + harflerde resim */
const WORDS_PART1 = [
  'Hayatta',
  'her',
  'zaman',
  'aynı',
  'pencereden',
  'bakamadık',
] as const

/** Resim zemin + beyaz yazı */
const WORDS_PART2 = [
  'Ama',
  'en',
  'güzel',
  'sabahlar',
  'aynı',
  'pencereye',
  'uyandıklarımızdı',
] as const

const WORDS = [...WORDS_PART1, ...WORDS_PART2]
const PART1_LEN = WORDS_PART1.length

const SCALE_START = 0.72
const SCALE_END = 1
const FADE_EDGE = 0.28
/** Daha uzun scroll = kelimeler daha yavaş değişir */
const SECTION_SCROLL_VH = 560

/** Kalın uppercase — kelime tek satırda ekrana sığsın */
function fontSizePx(word: string, textScale: number) {
  const maxW = window.innerWidth * (word.length > 12 ? 0.88 : 0.9)
  const maxH = window.innerHeight * (word.length > 12 ? 0.16 : 0.2)
  const charW = 0.52 + Math.min(0.14, word.length * 0.007)
  const byWidth = maxW / (word.length * charW)
  const px = Math.min(maxH, byWidth) * textScale
  return `${Math.max(11, px)}px`
}

function wordOpacity(index: number, n: number, progress: number) {
  const slice = 1 / n
  const t = (progress - index * slice) / slice
  if (t < 0 || t > 1) return 0
  const fadeIn = Math.min(1, t / FADE_EDGE)
  const fadeOut = index === n - 1 ? 1 : Math.min(1, (1 - t) / FADE_EDGE)
  return fadeIn * fadeOut
}

function globalTextScale(progress: number) {
  return SCALE_START + (SCALE_END - SCALE_START) * progress
}

function activeWordIndex(n: number, progress: number) {
  let best = 0
  let maxOp = 0
  for (let i = 0; i < n; i++) {
    const op = wordOpacity(i, n, progress)
    if (op > maxOp) {
      maxOp = op
      best = i
    }
  }
  return best
}

export function WindowWordsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const bgFrameRef = useRef<HTMLDivElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])

  const syncPhotoFill = useCallback((index: number) => {
    const frame = bgFrameRef.current
    const el = wordRefs.current[index]
    if (!frame || !el || index >= PART1_LEN) return

    const bg = frame.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    const url = ASSETS.pencereMartisiz2k

    el.style.backgroundImage = `url(${url})`
    el.style.backgroundSize = `${bg.width}px ${bg.height}px`
    el.style.backgroundPosition = `${bg.left - r.left}px ${bg.top - r.top}px`
  }, [])

  const clearPhotoFill = useCallback((el: HTMLSpanElement) => {
    el.style.backgroundImage = 'none'
    el.style.backgroundSize = ''
    el.style.backgroundPosition = ''
  }, [])

  const applyScroll = useCallback(
    (progress: number) => {
      const n = WORDS.length
      const words = wordRefs.current
      const textScale = globalTextScale(progress)
      const active = activeWordIndex(n, progress)
      const part2Mode = active >= PART1_LEN

      const sticky = stickyRef.current
      const bgFrame = bgFrameRef.current
      if (sticky) {
        sticky.style.backgroundColor = part2Mode ? 'transparent' : '#ffffff'
      }
      if (bgFrame) {
        bgFrame.style.opacity = part2Mode ? '1' : '0'
      }

      for (let i = 0; i < n; i++) {
        const el = words[i]
        if (!el) continue
        const word = WORDS[i]!
        const op = wordOpacity(i, n, progress)
        const isPart2Word = i >= PART1_LEN

        el.style.opacity = String(op)
        el.style.fontSize = fontSizePx(word, textScale)
        el.style.transform = 'none'
        el.style.clipPath = 'none'

        if (isPart2Word) {
          el.classList.remove('pencere-word-fill')
          clearPhotoFill(el)
          el.style.color = '#ffffff'
          el.style.webkitTextFillColor = '#ffffff'
          el.style.textShadow = '0 2px 28px rgba(0,0,0,0.45)'
        } else {
          el.classList.add('pencere-word-fill')
          el.style.color = 'transparent'
          el.style.webkitTextFillColor = 'transparent'
          el.style.textShadow = 'none'
          if (op > 0.01) syncPhotoFill(i)
        }
      }

      if (!part2Mode) {
        for (let i = PART1_LEN; i < n; i++) {
          const el = words[i]
          if (el) clearPhotoFill(el)
        }
      }
    },
    [syncPhotoFill, clearPhotoFill],
  )

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduce) {
      applyScroll(1)
      return
    }

    applyScroll(0)

    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.85,
      onUpdate: (self) => applyScroll(self.progress),
    })

    const refresh = () => {
      ScrollTrigger.refresh()
      const n = WORDS.length
      const progress = st.progress ?? 0
      for (let i = 0; i < PART1_LEN; i++) {
        if (wordOpacity(i, n, progress) > 0.01) syncPhotoFill(i)
      }
    }

    window.addEventListener('resize', refresh)
    const ro = new ResizeObserver(refresh)
    if (bgFrameRef.current) ro.observe(bgFrameRef.current)

    const img = new Image()
    img.src = ASSETS.pencereMartisiz2k
    img.onload = refresh

    requestAnimationFrame(refresh)

    return () => {
      window.removeEventListener('resize', refresh)
      ro.disconnect()
      st.kill()
    }
  }, [applyScroll, syncPhotoFill])

  return (
    <section
      ref={sectionRef}
      id="pencere-soz"
      className="relative z-10 w-full shrink-0 bg-white"
      style={{ minHeight: `${SECTION_SCROLL_VH}dvh` }}
      aria-label="Pencere"
    >
      <div
        ref={stickyRef}
        className="sticky top-0 z-10 flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-white transition-colors duration-300"
      >
        <MartiFlyIn />

        {/* Resim — 1. bölümde gizli (yalnızca harf dolgusu), 2. bölümde tam ekran */}
        <div
          ref={bgFrameRef}
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500"
          aria-hidden
        >
          <img
            src={ASSETS.pencereMartisiz2k}
            alt=""
            className="h-full w-full min-w-full object-cover object-center"
            decoding="async"
            draggable={false}
            onLoad={() => ScrollTrigger.refresh()}
          />
        </div>

        <div className="relative z-20 grid w-full max-w-[96vw] place-items-center px-[2vw]">
          {WORDS.map((word, i) => (
            <span
              key={`${word}-${i}`}
              ref={(el) => {
                wordRefs.current[i] = el
              }}
              className={`col-start-1 row-start-1 max-w-[96vw] text-center font-body font-black uppercase leading-[0.95] tracking-tighter ${
                i < PART1_LEN ? 'pencere-word-fill' : ''
              }`}
              style={{
                fontSize: fontSizePx(word, SCALE_START),
                opacity: 0,
                color: i < PART1_LEN ? 'transparent' : '#ffffff',
                willChange: 'opacity, font-size',
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
