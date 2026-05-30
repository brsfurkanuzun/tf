import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null
let tickerCallback: ((time: number) => void) | null = null

/** Tek Lenis örneği — yalnızca App.tsx içinden çağır */
export function useLenisScroll() {
  useEffect(() => {
    if (lenis) return

    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.2,
    })

    lenis.on('scroll', ScrollTrigger.update)

    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value) {
        if (arguments.length) {
          lenis!.scrollTo(value ?? 0, { immediate: true })
        }
        return lenis!.scroll
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

    tickerCallback = (time: number) => {
      lenis!.raf(time * 1000)
    }
    gsap.ticker.add(tickerCallback)
    gsap.ticker.lagSmoothing(0)

    const refresh = () => ScrollTrigger.refresh()
    refresh()
    window.addEventListener('load', refresh)

    return () => {
      window.removeEventListener('load', refresh)
      if (tickerCallback) gsap.ticker.remove(tickerCallback)
      lenis?.destroy()
      lenis = null
      tickerCallback = null
      ScrollTrigger.scrollerProxy(document.documentElement, {})
    }
  }, [])
}
