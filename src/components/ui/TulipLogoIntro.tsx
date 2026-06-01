import gsap from 'gsap'
import Lottie from 'lottie-react'
import { useCallback, useEffect, useRef, useState } from 'react'

type TulipLogoIntroProps = {
  animationData: object
  anchorRef: React.RefObject<HTMLDivElement | null>
  onDocked: () => void
}

const INTRO_SIZE = 280
/** onComplete tetiklenmezse uçuşa geç (ms) */
const FLY_FALLBACK_MS = 5200

export function TulipLogoIntro({ animationData, anchorRef, onDocked }: TulipLogoIntroProps) {
  const [phase, setPhase] = useState<'play' | 'fly' | 'gone'>('play')
  const flyRef = useRef<HTMLDivElement>(null)
  const flyStartedRef = useRef(false)

  const runFly = useCallback(() => {
    const fly = flyRef.current
    const anchor = anchorRef.current
    if (!fly || !anchor) {
      onDocked()
      setPhase('gone')
      return
    }
    setPhase('fly')
    const f = fly.getBoundingClientRect()
    const a = anchor.getBoundingClientRect()
    const dx = a.left + a.width / 2 - (f.left + f.width / 2)
    const dy = a.top + a.height / 2 - (f.top + f.height / 2)
    const s = Math.min((a.height * 0.92) / f.height, (a.width * 0.92) / f.width)

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(fly, { clearProps: 'transform' })
        onDocked()
        setPhase('gone')
      },
    })
    tl.to(
      fly,
      {
        x: dx,
        y: dy,
        scale: s,
        duration: 1.15,
        ease: 'power3.inOut',
      },
      0.05,
    )
  }, [anchorRef, onDocked])

  const startFlySafely = useCallback(() => {
    if (flyStartedRef.current) return
    flyStartedRef.current = true
    requestAnimationFrame(() => runFly())
  }, [runFly])

  const handleLottieComplete = useCallback(() => {
    if (phase !== 'play') return
    startFlySafely()
  }, [phase, startFlySafely])

  useEffect(() => {
    const fly = flyRef.current
    if (!fly || phase !== 'play') return
    gsap.set(fly, {
      transformOrigin: '50% 50%',
      x: 0,
      y: 0,
      scale: 1,
    })
  }, [phase])

  useEffect(() => {
    if (phase !== 'play') return
    const t = window.setTimeout(startFlySafely, FLY_FALLBACK_MS)
    return () => window.clearTimeout(t)
  }, [phase, startFlySafely])

  if (phase === 'gone') return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
      <div
        ref={flyRef}
        className="will-change-transform"
        style={{ width: INTRO_SIZE, height: INTRO_SIZE }}
      >
        <Lottie
          animationData={animationData}
          loop={false}
          style={{ width: INTRO_SIZE, height: INTRO_SIZE }}
          className="[&_svg]:!h-full [&_svg]:!w-full"
          onComplete={handleLottieComplete}
        />
      </div>
    </div>
  )
}

export function HeaderLottieLogo({ animationData }: { animationData: object }) {
  return (
    <Lottie
      animationData={animationData}
      loop
      style={{ width: 120, height: 44 }}
      className="max-h-9 max-w-[7rem] md:max-h-11 md:max-w-[8.5rem]"
    />
  )
}
