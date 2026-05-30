import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ASSETS,
  SCROLL,
  TULIP_FRAMES,
  preloadImages,
} from '../../config/assets'
import { createScrollTimeline } from '../../animation/createTimeline'
import {
  chapterFromProgress,
  createScrollState,
  emitScrollUpdate,
  scrollRef,
} from '../../store/scrollStore'

gsap.registerPlugin(ScrollTrigger)

function syncScrollToDom(progress: number) {
  const chapter = chapterFromProgress(progress)
  scrollRef.current.progress = progress
  scrollRef.current.smoothProgress = progress
  scrollRef.current.chapter = chapter
  document.documentElement.dataset.chapter = chapter
  document.documentElement.style.setProperty('--scroll-progress', String(progress))
  emitScrollUpdate()
}

export function ScrollScene() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLImageElement>(null)
  const rightRef = useRef<HTMLImageElement>(null)
  const tulipBaseRef = useRef<HTMLImageElement>(null)
  const tulipFrameRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    preloadImages([ASSETS.tulipBase, ...TULIP_FRAMES])

    const section = sectionRef.current
    const canvas = canvasRef.current
    const left = leftRef.current
    const right = rightRef.current
    const tulipBase = tulipBaseRef.current
    const tulipFrame = tulipFrameRef.current
    if (!section || !canvas || !left || !right || !tulipBase || !tulipFrame) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tulipTransform = { xPercent: -50, transformOrigin: '50% 100%' }

    gsap.set(canvas, { backgroundColor: '#ffffff' })
    gsap.set(tulipBase, {
      ...tulipTransform,
      scale: 0.14,
      opacity: 0,
    })
    gsap.set(tulipFrame, {
      ...tulipTransform,
      scale: 1,
      opacity: 0,
      visibility: 'hidden',
    })
    gsap.set(left, { x: 0, scale: 1, opacity: 1, transformOrigin: '50% 100%' })
    gsap.set(right, { x: 0, scale: 1, opacity: 1, transformOrigin: '50% 100%' })

    const introTimeline = gsap.timeline({
      paused: true,
      defaults: { ease: 'power2.inOut' },
    })

    introTimeline.to(
      tulipBase,
      { scale: 1, opacity: 1, duration: 0.54, ease: 'power2.out' },
      0.08,
    )

    introTimeline.to(
      left,
      { x: '-58vw', scale: 1.38, opacity: 0, duration: 0.48, ease: 'power2.in' },
      0.16,
    )

    introTimeline.to(
      right,
      { x: '58vw', scale: 1.28, opacity: 0, duration: 0.48, ease: 'power2.in' },
      0.16,
    )

    introTimeline.to(
      canvas,
      { backgroundColor: '#000000', duration: 0.12, ease: 'power4.in' },
      0.64,
    )

    if (reducedMotion) {
      introTimeline.progress(1)
      gsap.set(canvas, { backgroundColor: '#000000' })
      gsap.set(tulipBase, { opacity: 0 })
      tulipFrame.src = TULIP_FRAMES[TULIP_FRAMES.length - 1]
      gsap.set(tulipFrame, { opacity: 1, visibility: 'visible' })
      const reducedTl = createScrollTimeline()
      reducedTl.progress(1)
      reducedTl.kill()
      syncScrollToDom(1)
      scrollRef.current.velocity = 0
      return () => {
        scrollRef.current = createScrollState()
        delete document.documentElement.dataset.chapter
        document.documentElement.style.setProperty('--scroll-progress', '0')
        emitScrollUpdate()
      }
    }

    const scrollTimeline = createScrollTimeline()

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.2,
    })

    lenis.on('scroll', ScrollTrigger.update)

    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value) {
        if (arguments.length) {
          lenis.scrollTo(value ?? 0, { immediate: true })
        }
        return lenis.scroll
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        }
      },
    })

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tickerCallback)
    gsap.ticker.lagSmoothing(0)

    let lastFrameIndex = -1

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: `+=${SCROLL.distance}%`,
      pin: true,
      scrub: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const progress = self.progress

        scrollRef.current.velocity = self.getVelocity()
        scrollTimeline.progress(progress)
        syncScrollToDom(progress)

        const introProgress = Math.min(progress / SCROLL.introEnd, 1)
        introTimeline.progress(introProgress)

        if (progress < SCROLL.introEnd) {
          gsap.set(tulipFrame, { opacity: 0, visibility: 'hidden' })
          lastFrameIndex = -1
          return
        }

        gsap.set(tulipBase, { opacity: 0 })
        gsap.set(tulipFrame, { opacity: 1, visibility: 'visible' })

        const frameProgress =
          (progress - SCROLL.introEnd) / (1 - SCROLL.introEnd)
        const frameIndex = Math.min(
          Math.floor(frameProgress * TULIP_FRAMES.length),
          TULIP_FRAMES.length - 1,
        )

        if (frameIndex !== lastFrameIndex) {
          tulipFrame.src = TULIP_FRAMES[frameIndex]
          lastFrameIndex = frameIndex
        }
      },
    })

    ScrollTrigger.refresh()
    syncScrollToDom(trigger.progress)
    scrollRef.current.velocity = 0

    return () => {
      trigger.kill()
      introTimeline.kill()
      scrollTimeline.kill()
      gsap.ticker.remove(tickerCallback)
      lenis.destroy()
      ScrollTrigger.scrollerProxy(document.documentElement, {})
      scrollRef.current = createScrollState()
      delete document.documentElement.dataset.chapter
      document.documentElement.style.setProperty('--scroll-progress', '0')
      emitScrollUpdate()
    }
  }, [])

  return (
    <section ref={sectionRef} className="scroll-scene" aria-label="Scroll sequence">
      <div ref={canvasRef} className="scene-canvas">
        <img
          ref={tulipBaseRef}
          src={ASSETS.tulipBase}
          alt=""
          className="tulip-image tulip-base"
          draggable={false}
        />

        <img
          ref={tulipFrameRef}
          alt=""
          className="tulip-image tulip-frame"
          draggable={false}
        />

        <div className="portraits-stage">
          <img
            ref={leftRef}
            src={ASSETS.portraitLeft}
            alt="Portrait left"
            className="portrait-image portrait-left"
            draggable={false}
          />
          <img
            ref={rightRef}
            src={ASSETS.portraitRight}
            alt="Portrait right"
            className="portrait-image portrait-right"
            draggable={false}
          />
        </div>
      </div>
    </section>
  )
}
