import gsap from 'gsap'
import lottie from 'lottie-web'
import {
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react'
import {
  TULIP_INTRO_LOTTIE_SPEED,
  TULIP_LOTTIE_JSON,
  TULIP_VECTOR_URL,
} from '../../config/tulipLogo'

const TULIP_LOTTIE = structuredClone(TULIP_LOTTIE_JSON) as object

const NAME_SHIFT = 56
const NAME_DURATION = 0.55
const NAME_EASE = 'power3.out'
const NAME_STAGGER = 0.08
const RETRACT_DURATION = 0.5
const RETRACT_EASE = 'power2.in'
const FLY_DURATION = 0.95
const LOTTIE_REPLAY_DELAY_MS = 3000

type LogoCenterFlyInProps = {
  anchorRef: React.RefObject<HTMLDivElement | null>
  /** İlk scroll / tekerlek: yan yazılar kapanır, logo header hedefine uçar */
  beginExit: boolean
  onDone: () => void
}

export function LogoCenterFlyIn({ anchorRef, beginExit, onDone }: LogoCenterFlyInProps) {
  const flyRef = useRef<HTMLDivElement>(null)
  const tubaRef = useRef<HTMLAnchorElement>(null)
  const furkanRef = useRef<HTMLAnchorElement>(null)
  const lottieHostRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<ReturnType<typeof lottie.loadAnimation> | null>(null)
  const replayTimerRef = useRef<number>(0)
  const exitStartedRef = useRef(false)
  const doneRef = useRef(false)

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    onDone()
  }, [onDone])

  const runFly = useCallback(() => {
    const fly = flyRef.current
    const anchor = anchorRef.current
    if (!fly || !anchor) {
      finish()
      return
    }

    gsap.set(fly, {
      transformOrigin: '50% 50%',
      x: 0,
      y: 0,
      scale: 1,
    })

    const f = fly.getBoundingClientRect()
    const a = anchor.getBoundingClientRect()
    const dx = a.left + a.width / 2 - (f.left + f.width / 2)
    const dy = a.top + a.height / 2 - (f.top + f.height / 2)
    const s = Math.min((a.height * 0.92) / f.height, (a.width * 0.92) / f.width)

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      gsap.set(fly, { x: dx, y: dy, scale: s })
      finish()
      return
    }

    gsap.to(fly, {
      x: dx,
      y: dy,
      scale: s,
      duration: FLY_DURATION,
      ease: 'power2.in',
      onComplete: () => finish(),
    })
  }, [anchorRef, finish])

  const clearReplayTimer = useCallback(() => {
    if (replayTimerRef.current) {
      window.clearTimeout(replayTimerRef.current)
      replayTimerRef.current = 0
    }
  }, [])

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const host = lottieHostRef.current
    if (!host) return

    const anim = lottie.loadAnimation({
      container: host,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      animationData: TULIP_LOTTIE,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
      },
    })
    animRef.current = anim

    let kicked = false
    const kick = () => {
      if (kicked) return
      kicked = true
      anim.setSubframe(true)
      anim.setSpeed(TULIP_INTRO_LOTTIE_SPEED)
      anim.goToAndPlay(0, true)
    }

    const scheduleReplay = () => {
      clearReplayTimer()
      if (exitStartedRef.current || doneRef.current) return
      replayTimerRef.current = window.setTimeout(() => {
        replayTimerRef.current = 0
        if (exitStartedRef.current || doneRef.current) return
        anim.goToAndPlay(0, true)
      }, LOTTIE_REPLAY_DELAY_MS)
    }

    const onComplete = () => {
      scheduleReplay()
    }

    anim.addEventListener('DOMLoaded', kick)
    anim.addEventListener('complete', onComplete)
    const fallback = window.setTimeout(kick, 0)

    return () => {
      window.clearTimeout(fallback)
      anim.removeEventListener('DOMLoaded', kick)
      anim.removeEventListener('complete', onComplete)
      clearReplayTimer()
      anim.destroy()
      animRef.current = null
    }
  }, [clearReplayTimer])

  useLayoutEffect(() => {
    const tuba = tubaRef.current
    const furkan = furkanRef.current
    if (!tuba || !furkan) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      gsap.set([tuba, furkan], { opacity: 1, x: 0, clearProps: 'transform' })
      return
    }

    gsap.set([tuba, furkan], { opacity: 0, x: 0 })

    const tl = gsap.timeline({ defaults: { duration: NAME_DURATION, ease: NAME_EASE } })
    tl.fromTo(
      tuba,
      { x: NAME_SHIFT, opacity: 0 },
      { x: 0, opacity: 1 },
      0,
    ).fromTo(
      furkan,
      { x: -NAME_SHIFT, opacity: 0 },
      { x: 0, opacity: 1 },
      NAME_STAGGER,
    )

    return () => {
      tl.kill()
    }
  }, [])

  useLayoutEffect(() => {
    if (!beginExit || exitStartedRef.current) return
    exitStartedRef.current = true
    clearReplayTimer()

    const tuba = tubaRef.current
    const furkan = furkanRef.current
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduce) {
      if (tuba && furkan) gsap.set([tuba, furkan], { opacity: 0, visibility: 'hidden', x: 0 })
      requestAnimationFrame(() => {
        requestAnimationFrame(runFly)
      })
      return
    }

    if (!tuba || !furkan) {
      requestAnimationFrame(() => {
        requestAnimationFrame(runFly)
      })
      return
    }

    const tl = gsap.timeline({
      defaults: { ease: RETRACT_EASE },
      onComplete: () => {
        gsap.set([tuba, furkan], { visibility: 'hidden', pointerEvents: 'none' })
        requestAnimationFrame(() => {
          requestAnimationFrame(runFly)
        })
      },
    })
    tl.to(tuba, { x: NAME_SHIFT, opacity: 0, duration: RETRACT_DURATION }, 0).to(
      furkan,
      { x: -NAME_SHIFT, opacity: 0, duration: RETRACT_DURATION },
      NAME_STAGGER,
    )

    return () => {
      tl.kill()
    }
  }, [beginExit, clearReplayTimer, runFly])

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[2000] flex items-center justify-center bg-gradient-to-b from-[#fefefe] via-white to-[#f8f6f3] pt-16 sm:pt-20 md:pt-24"
      aria-hidden
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_38%,transparent_0%,rgba(12,10,9,0.04)_100%)]"
        aria-hidden
      />
      <div className="relative flex max-w-[min(100vw-2rem,56rem)] flex-wrap items-center justify-center gap-3 sm:gap-7 md:gap-12">
        <a
          ref={tubaRef}
          href="/"
          className="font-display text-3xl font-medium tracking-[0.02em] text-[#141312] no-underline will-change-transform sm:text-4xl md:text-5xl"
        >
          Tuba
        </a>
        <div
          ref={flyRef}
          className="relative aspect-square w-[clamp(6.5rem,30vmin,9rem)] shrink-0 will-change-transform sm:w-[clamp(10rem,52vmin,15rem)] md:w-[clamp(11.5rem,62vmin,17.5rem)] lg:w-[clamp(12.5rem,70vmin,20rem)]"
        >
          <img
            src={TULIP_VECTOR_URL}
            alt=""
            width={512}
            height={512}
            decoding="async"
            draggable={false}
            className="pointer-events-none absolute inset-0 z-0 block h-full w-full object-contain"
          />
          <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center overflow-hidden">
            <div
              ref={lottieHostRef}
              className="h-full w-full [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:max-h-full [&_svg]:max-w-full"
            />
          </div>
        </div>
        <a
          ref={furkanRef}
          href="/"
          className="font-display text-3xl font-medium tracking-[0.02em] text-[#141312] no-underline will-change-transform sm:text-4xl md:text-5xl"
        >
          Furkan
        </a>
      </div>
    </div>
  )
}
