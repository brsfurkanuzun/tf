import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ASSETS } from '../../config/assets'

const GULL_COUNT = 5
const MAX_PER_EDGE = 2

const EDGES: Edge[] = ['left', 'right', 'top', 'bottom']
const SIDE_EDGES: Edge[] = ['left', 'right']
const START_EDGES: Edge[] = ['left', 'right', 'left', 'right', 'right']
const START_ALONG = [14, 78, 28, 68, 52]

/** public/assets/marti-head.png — 181×227 */
const MARTI_ASPECT = 227 / 181

type Edge = 'left' | 'right' | 'top' | 'bottom'

const activeOnEdge: Record<Edge, number> = { left: 0, right: 0, top: 0, bottom: 0 }

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function resetEdgeCounts() {
  for (const e of EDGES) activeOnEdge[e] = 0
}

function claimEdge(preferred?: Edge): Edge {
  const sideFirst = Math.random() < 0.88
  const sidePool = SIDE_EDGES.filter((e) => activeOnEdge[e] < MAX_PER_EDGE)
  const allPool = EDGES.filter((e) => activeOnEdge[e] < MAX_PER_EDGE)
  const pool = sideFirst && sidePool.length > 0 ? sidePool : allPool

  const tryOrder = preferred
    ? [preferred, ...shuffle((pool.length > 0 ? pool : EDGES).filter((e) => e !== preferred))]
    : shuffle(pool.length > 0 ? pool : EDGES)

  for (const e of tryOrder) {
    if (activeOnEdge[e] < MAX_PER_EDGE) {
      activeOnEdge[e]++
      return e
    }
  }

  const least = [...EDGES].sort((a, b) => activeOnEdge[a] - activeOnEdge[b])[0]!
  activeOnEdge[least]++
  return least
}

function releaseEdge(edge: Edge | null) {
  if (!edge) return
  activeOnEdge[edge] = Math.max(0, activeOnEdge[edge] - 1)
}

function pickAlong(edge: Edge, countOnEdge: number, fallback?: number): number {
  if (fallback != null) return fallback
  if (countOnEdge <= 1) return rand(10, 90)
  return rand(0, 1) < 0.5 ? rand(8, 32) : rand(68, 92)
}

type Layout = {
  anchor: gsap.TweenVars
  clip: gsap.TweenVars
  rotation: number
  ax: number
  ay: number
}

type Motion = {
  hidden: { x: number; y: number }
  mid: { x: number; y: number }
  shown: { x: number; y: number }
  retreat: { x: number; y: number }
}

/**
 * Görünür alan = fotoğrafın giriş eksenindeki boyunun %20–30’u (clip penceresi).
 * img kaydırması: tamamen dışarı ↔ yalnızca peek kadar içeride.
 */
function getMotion(edge: Edge, size: number, aspect: number): Motion {
  const h = size * aspect
  const depth = edge === 'left' || edge === 'right' ? size : h
  const peekFrac = rand(0.2, 0.3)
  const peek = depth * peekFrac
  const pad = depth * 0.05
  const back = depth * 2.1

  let hidden = { x: 0, y: 0 }
  let shown = { x: 0, y: 0 }
  let retreatPos = { x: 0, y: 0 }

  switch (edge) {
    case 'left':
      hidden = { x: -(depth + pad), y: 0 }
      shown = { x: -depth + peek, y: 0 }
      retreatPos = { x: -(depth + back), y: 0 }
      break
    case 'right':
      hidden = { x: peek + pad, y: 0 }
      shown = { x: peek - depth, y: 0 }
      retreatPos = { x: peek + back, y: 0 }
      break
    case 'top':
      hidden = { x: 0, y: -(depth + pad) }
      shown = { x: 0, y: -depth + peek }
      retreatPos = { x: 0, y: -(depth + back) }
      break
    case 'bottom':
      hidden = { x: 0, y: peek + pad }
      shown = { x: 0, y: peek - depth }
      retreatPos = { x: 0, y: peek + back }
      break
  }

  return {
    hidden,
    mid: {
      x: hidden.x + (shown.x - hidden.x) * 0.52,
      y: hidden.y + (shown.y - hidden.y) * 0.52,
    },
    shown,
    retreat: retreatPos,
  }
}

function getLayout(edge: Edge, alongPct: number, vw: number, vh: number, size: number, aspect: number): Layout {
  const cx = vw / 2
  const cy = vh / 2
  const h = size * aspect
  let ax = 0
  let ay = 0
  let anchor: gsap.TweenVars = {}
  let clip: gsap.TweenVars = {}

  switch (edge) {
    case 'left':
      ay = (alongPct / 100) * vh
      anchor = { left: 0, top: ay, right: 'auto', bottom: 'auto', xPercent: 0, yPercent: -50 }
      clip = { width: size * 0.3, height: h, overflow: 'hidden' }
      ax = 0
      break
    case 'right':
      ay = (alongPct / 100) * vh
      anchor = {
        right: 0,
        top: ay,
        left: 'auto',
        bottom: 'auto',
        xPercent: 0,
        yPercent: -50,
        justifyContent: 'flex-end',
      }
      clip = { width: size * 0.3, height: h, overflow: 'hidden' }
      ax = vw
      break
    case 'top':
      ax = (alongPct / 100) * vw
      anchor = { left: ax, top: 0, right: 'auto', bottom: 'auto', xPercent: -50, yPercent: 0 }
      clip = { width: size, height: h * 0.3, overflow: 'hidden' }
      ay = 0
      break
    case 'bottom':
      ax = (alongPct / 100) * vw
      anchor = { left: ax, bottom: 0, top: 'auto', xPercent: -50, yPercent: 0 }
      clip = { width: size, height: h * 0.3, overflow: 'hidden', marginTop: 'auto' }
      ay = vh
      break
  }

  const rotation = (Math.atan2(cy - ay, cx - ax) * 180) / Math.PI + 90

  return { anchor, clip, rotation, ax, ay }
}

type BirdCtrl = { gen: number; edge: Edge | null }

function startPeekLoop(
  anchorEl: HTMLElement,
  clipEl: HTMLElement,
  imgEl: HTMLImageElement,
  ctrl: BirdCtrl,
  preferredEdge?: Edge,
  along?: number,
) {
  const myGen = ctrl.gen

  releaseEdge(ctrl.edge)

  const frame = anchorEl.parentElement?.getBoundingClientRect()
  const vw = frame?.width ?? window.innerWidth
  const vh = frame?.height ?? window.innerHeight

  const e = claimEdge(preferredEdge)
  ctrl.edge = e

  const a = pickAlong(e, activeOnEdge[e], along)
  const size = Math.round(rand(82, 108))
  const aspect =
    imgEl.naturalWidth > 0 ? imgEl.naturalHeight / imgEl.naturalWidth : MARTI_ASPECT
  const h = size * aspect
  const depth = e === 'left' || e === 'right' ? size : h
  const peekFrac = rand(0.2, 0.3)
  const peek = depth * peekFrac

  const { anchor, clip, rotation, ax, ay } = getLayout(e, a, vw, vh, size, aspect)
  const { hidden, mid, shown, retreat } = getMotion(e, size, aspect)

  const cx = vw / 2
  const cy = vh / 2
  const tilt = peek * rand(0.12, 0.22)
  const dx = cx - ax
  const dy = cy - ay
  const dist = Math.hypot(dx, dy) || 1
  const nudgeX = (dx / dist) * tilt
  const nudgeY = (dy / dist) * tilt

  const shownNudged = { x: shown.x + nudgeX, y: shown.y + nudgeY }
  const midNudged = {
    x: hidden.x + (shownNudged.x - hidden.x) * 0.5,
    y: hidden.y + (shownNudged.y - hidden.y) * 0.5,
  }

  gsap.killTweensOf([clipEl, imgEl])

  gsap.set(anchorEl, {
    ...anchor,
    right: anchor.right ?? 'auto',
    bottom: anchor.bottom ?? 'auto',
    display: 'flex',
    flexDirection: e === 'top' || e === 'bottom' ? 'column' : 'row',
    justifyContent:
      e === 'right' || e === 'bottom' ? 'flex-end' : 'flex-start',
    alignItems: e === 'top' || e === 'bottom' ? 'flex-end' : 'center',
  })

  const clipW = e === 'left' || e === 'right' ? peek : size
  const clipH = e === 'top' || e === 'bottom' ? peek : h

  gsap.set(clipEl, {
    ...clip,
    width: clipW,
    height: clipH,
    overflow: 'hidden',
    transformOrigin: '50% 50%',
    rotation,
  })

  const rotIn = rotation + rand(-6, 4)
  const rotPeak = rotation + rand(3, 9)

  gsap.set(imgEl, {
    width: size,
    height: 'auto',
    display: 'block',
    opacity: 0,
    x: hidden.x,
    y: hidden.y,
  })

  const in1 = rand(0.5, 0.72)
  const in2 = rand(0.38, 0.58)
  const hold = rand(0.15, 0.35)
  const back = rand(0.58, 0.82)
  const pause = rand(0.9, 2.2)

  gsap
    .timeline({
      delay: rand(0, 0.5),
      onComplete: () => {
        if (myGen !== ctrl.gen) return
        releaseEdge(ctrl.edge)
        ctrl.edge = null
        startPeekLoop(anchorEl, clipEl, imgEl, ctrl)
      },
    })
    .to(imgEl, {
      opacity: 1,
      x: midNudged.x,
      y: midNudged.y,
      duration: in1,
      ease: 'power3.out',
    })
    .to(clipEl, { rotation: rotPeak, duration: in2 * 0.6, ease: 'sine.out' }, '<')
    .to(imgEl, {
      x: shownNudged.x,
      y: shownNudged.y,
      duration: in2,
      ease: 'sine.inOut',
    })
    .to({}, { duration: hold })
    .to(imgEl, {
      opacity: 0,
      x: retreat.x,
      y: retreat.y,
      duration: back,
      ease: 'power3.in',
    })
    .to(clipEl, { rotation: rotIn, duration: back * 0.85, ease: 'power3.in' }, '<')
    .to({}, { duration: pause })
}

export function MartiFlyIn() {
  const layerRef = useRef<HTMLDivElement>(null)
  const ctrlsRef = useRef<BirdCtrl[]>([])

  useLayoutEffect(() => {
    const layer = layerRef.current
    if (!layer) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const anchors = Array.from(layer.querySelectorAll<HTMLElement>('[data-marti-anchor]'))
    resetEdgeCounts()
    ctrlsRef.current = anchors.map(() => ({ gen: 0, edge: null }))

    const boot = (edge?: Edge, along?: number, i?: number) => {
      const anchorEl = anchors[i ?? 0]
      if (!anchorEl) return
      const clipEl = anchorEl.querySelector<HTMLElement>('[data-marti-clip]')
      const imgEl = anchorEl.querySelector<HTMLImageElement>('[data-marti-peek]')
      const ctrl = ctrlsRef.current[i ?? 0]
      if (!clipEl || !imgEl || !ctrl) return
      startPeekLoop(anchorEl, clipEl, imgEl, ctrl, edge, along)
    }

    anchors.forEach((_, i) => {
      gsap.delayedCall(i * 0.4, () => boot(START_EDGES[i], START_ALONG[i], i))
    })

    const onResize = () => {
      resetEdgeCounts()
      ctrlsRef.current.forEach((c) => {
        releaseEdge(c.edge)
        c.edge = null
        c.gen += 1
      })
      gsap.killTweensOf(layer.querySelectorAll('[data-marti-peek], [data-marti-clip]'))
      anchors.forEach((_, i) => {
        gsap.delayedCall(i * 0.12, () => boot(START_EDGES[i], START_ALONG[i], i))
      })
    }
    window.addEventListener('resize', onResize)

    return () => {
      resetEdgeCounts()
      ctrlsRef.current.forEach((c) => {
        releaseEdge(c.edge)
        c.edge = null
        c.gen += 1
      })
      window.removeEventListener('resize', onResize)
      gsap.killTweensOf(layer.querySelectorAll('[data-marti-peek], [data-marti-clip]'))
    }
  }, [])

  return (
    <div
      ref={layerRef}
      className="pointer-events-none absolute inset-0 z-[15] overflow-hidden"
      aria-hidden
    >
      {Array.from({ length: GULL_COUNT }, (_, i) => (
        <div key={i} data-marti-anchor className="absolute">
          <div data-marti-clip className="relative shrink-0">
            <img
              data-marti-peek
              src={ASSETS.martiHead}
              alt=""
              className="marti-peek-img max-w-none"
              draggable={false}
              decoding="async"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
