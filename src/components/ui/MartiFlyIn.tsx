import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ASSETS } from '../../config/assets'

/**
 * Whac-A-Mole martı — container kenarlarından kafa/boyun uzatır, merkeze gitmez.
 * PNG: şeffaf arka plan, kafa üstte (marti-head.png 181×227).
 */
const MARTI_ASPECT = 227 / 181
const BASE_SIZE = 100

const EDGES = ['left', 'right', 'top', 'bottom'] as const
type Edge = (typeof EDGES)[number]

/** Giriş kenarındaki pivot */
const FACE_ORIGIN: Record<Edge, string> = {
  left: '100% 50%',
  right: '0% 50%',
  top: '50% 100%',
  bottom: '50% 0%',
}

export const MARTI_WHAC_DEFAULTS = {
  poolSize: 3,
  maxActive: 3,
  peekMin: 0.5,
  peekMax: 0.5,
  scaleMin: 0.95,
  scaleMax: 1.75,
  outsidePadFrac: 0.05,
} as const

export type MartiWhacConfig = {
  poolSize: number
  maxActive: number
  peekMin: number
  peekMax: number
  scaleMin: number
  scaleMax: number
  outsidePadFrac: number
}

export type MartiFlyInProps = {
  config?: Partial<MartiWhacConfig>
}

type Slot = {
  anchor: HTMLElement
  img: HTMLImageElement
  busy: boolean
  gen: number
}

/** Kenar başına giriş çarpanı — üst fazla, yan/alt dengeli */
const PEEK_EDGE_SCALE: Record<Edge, number> = {
  left: 1.12,
  right: 1.12,
  top: 0.72,
  bottom: 1.12,
}

type CyclePlan = {
  edge: Edge
  along: number
  size: number
  imgH: number
  rotation: number
  depth: number
  peek: number
  pad: number
  enterDur: number
  holdDur: number
  exitDur: number
  gapDur: number
}

type Motion = {
  hiddenX: number
  hiddenY: number
  shownX: number
  shownY: number
  retreatX: number
  retreatY: number
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function pickEdge(): Edge {
  return EDGES[Math.floor(Math.random() * EDGES.length)]!
}

function resolveConfig(partial?: Partial<MartiWhacConfig>): MartiWhacConfig {
  return {
    poolSize: partial?.poolSize ?? MARTI_WHAC_DEFAULTS.poolSize,
    maxActive: partial?.maxActive ?? MARTI_WHAC_DEFAULTS.maxActive,
    peekMin: partial?.peekMin ?? MARTI_WHAC_DEFAULTS.peekMin,
    peekMax: partial?.peekMax ?? MARTI_WHAC_DEFAULTS.peekMax,
    scaleMin: partial?.scaleMin ?? MARTI_WHAC_DEFAULTS.scaleMin,
    scaleMax: partial?.scaleMax ?? MARTI_WHAC_DEFAULTS.scaleMax,
    outsidePadFrac: partial?.outsidePadFrac ?? MARTI_WHAC_DEFAULTS.outsidePadFrac,
  }
}

/** Anchor noktası (container px) — kenar + along% */
function anchorPoint(edge: Edge, along: number, cw: number, ch: number) {
  const t = along / 100
  switch (edge) {
    case 'left':
      return { x: 0, y: ch * t }
    case 'right':
      return { x: cw, y: ch * t }
    case 'top':
      return { x: cw * t, y: 0 }
    case 'bottom':
      return { x: cw * t, y: ch }
  }
}

function rotationTowardCenter(ax: number, ay: number, cw: number, ch: number) {
  const dx = cw * 0.5 - ax
  const dy = ch * 0.5 - ay
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90
}

function edgeNormal(edge: Edge) {
  switch (edge) {
    case 'left':
      return { nx: 1, ny: 0 }
    case 'right':
      return { nx: -1, ny: 0 }
    case 'top':
      return { nx: 0, ny: 1 }
    case 'bottom':
      return { nx: 0, ny: -1 }
  }
}

/** Kenara dik eksende döndürülmüş bbox derinliği */
function ingressDepth(
  size: number,
  imgH: number,
  rotationDeg: number,
  nx: number,
  ny: number,
) {
  const rad = (rotationDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return (
    size * Math.abs(cos * nx + sin * ny) +
    imgH * Math.abs(-sin * nx + cos * ny)
  )
}

function buildPlan(
  edge: Edge,
  aspect: number,
  cfg: MartiWhacConfig,
  cw: number,
  ch: number,
): CyclePlan {
  const along = rand(14, 86)
  const scale = rand(cfg.scaleMin, cfg.scaleMax)
  const size = Math.round(BASE_SIZE * scale)
  const imgH = Math.round(size * aspect)
  const { x, y } = anchorPoint(edge, along, cw, ch)
  const rotation = rotationTowardCenter(x, y, cw, ch)
  const { nx, ny } = edgeNormal(edge)
  const depth = ingressDepth(size, imgH, rotation, nx, ny)
  const peekFrac = rand(cfg.peekMin, cfg.peekMax)
  const peek = Math.round(depth * peekFrac * PEEK_EDGE_SCALE[edge])
  const pad = Math.max(8, Math.round(depth * cfg.outsidePadFrac))

  return {
    edge,
    along,
    size,
    imgH,
    rotation,
    depth,
    peek,
    pad,
    enterDur: rand(0.42, 0.82),
    holdDur: rand(0.32, 0.72),
    exitDur: rand(0.38, 0.78),
    gapDur: rand(0.28, 0.95),
  }
}

/**
 * Kafa merkeze bakar; hareket kenara dik (çapraz değil) — dört kenarda eşit giriş.
 */
function motionAlongEdge(edge: Edge, depth: number, peek: number, pad: number): Motion {
  const outside = depth + pad
  const inside = depth - peek
  const retreat = outside + pad * 0.5
  switch (edge) {
    case 'left':
      return {
        hiddenX: -outside,
        hiddenY: 0,
        shownX: -inside,
        shownY: 0,
        retreatX: -retreat,
        retreatY: 0,
      }
    case 'right':
      return {
        hiddenX: outside,
        hiddenY: 0,
        shownX: inside,
        shownY: 0,
        retreatX: retreat,
        retreatY: 0,
      }
    case 'top':
      return {
        hiddenX: 0,
        hiddenY: -outside,
        shownX: 0,
        shownY: -inside,
        retreatX: 0,
        retreatY: -retreat,
      }
    case 'bottom':
      return {
        hiddenX: 0,
        hiddenY: outside,
        shownX: 0,
        shownY: inside,
        retreatX: 0,
        retreatY: retreat,
      }
  }
}

function resetAnchor(anchor: HTMLElement) {
  gsap.set(anchor, {
    left: 'auto',
    right: 'auto',
    top: 'auto',
    bottom: 'auto',
    x: 0,
    y: 0,
    xPercent: 0,
    yPercent: 0,
  })
}

function placeAnchor(anchor: HTMLElement, edge: Edge, along: number) {
  resetAnchor(anchor)
  switch (edge) {
    case 'left':
      gsap.set(anchor, { left: 0, top: `${along}%`, yPercent: -50 })
      break
    case 'right':
      gsap.set(anchor, { right: 0, top: `${along}%`, yPercent: -50 })
      break
    case 'top':
      gsap.set(anchor, { left: `${along}%`, top: 0, xPercent: -50 })
      break
    case 'bottom':
      gsap.set(anchor, { left: `${along}%`, bottom: 0, xPercent: -50 })
      break
  }
}

function applyImgBase(
  img: HTMLImageElement,
  plan: CyclePlan,
) {
  const { edge, size } = plan
  const base: gsap.TweenVars = {
    position: 'absolute',
    display: 'block',
    width: size,
    height: 'auto',
    maxWidth: 'none',
    opacity: 1,
    visibility: 'visible',
    rotation: plan.rotation,
    transformOrigin: FACE_ORIGIN[edge],
    x: 0,
    y: 0,
    force3D: true,
  }

  switch (edge) {
    case 'left':
      gsap.set(img, { ...base, left: 0, top: '50%', yPercent: -50 })
      break
    case 'right':
      gsap.set(img, { ...base, right: 0, top: '50%', yPercent: -50 })
      break
    case 'top':
      gsap.set(img, { ...base, left: '50%', top: 0, xPercent: -50 })
      break
    case 'bottom':
      gsap.set(img, { ...base, left: '50%', bottom: 0, xPercent: -50 })
      break
  }
}

export function MartiFlyIn({ config: configProp }: MartiFlyInProps = {}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const cfgRef = useRef(resolveConfig(configProp))
  cfgRef.current = resolveConfig(configProp)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const cfg = cfgRef.current
    const slots: Slot[] = []

    root.querySelectorAll<HTMLElement>('[data-marti-slot]').forEach((anchor) => {
      const img = anchor.querySelector<HTMLImageElement>('[data-marti-img]')
      if (img) slots.push({ anchor, img, busy: false, gen: 0 })
    })
    if (!slots.length) return

    const loopCount = Math.min(cfg.poolSize, cfg.maxActive)
    let disposed = false

    const scheduleNext = (slot: Slot, gap: number) => {
      if (disposed) return
      gsap.delayedCall(gap, () => runPeek(slot))
    }

    const runPeek = (slot: Slot) => {
      if (disposed || slot.busy) return
      const gen = ++slot.gen
      slot.busy = true

      if (root.clientWidth < 8 || root.clientHeight < 8) {
        slot.busy = false
        gsap.delayedCall(0.08, () => runPeek(slot))
        return
      }

      const aspect =
        slot.img.naturalWidth > 0
          ? slot.img.naturalHeight / slot.img.naturalWidth
          : MARTI_ASPECT

      const cw = root.clientWidth
      const ch = root.clientHeight
      const plan = buildPlan(pickEdge(), aspect, cfg, cw, ch)
      const motion = motionAlongEdge(plan.edge, plan.depth, plan.peek, plan.pad)

      gsap.killTweensOf(slot.img)
      gsap.set(slot.anchor, { position: 'absolute', overflow: 'visible' })
      placeAnchor(slot.anchor, plan.edge, plan.along)
      applyImgBase(slot.img, plan)
      gsap.set(slot.img, { x: motion.hiddenX, y: motion.hiddenY })

      gsap
        .timeline({
          onComplete: () => {
            if (gen !== slot.gen || disposed) return
            slot.busy = false
            scheduleNext(slot, plan.gapDur)
          },
        })
        .to(slot.img, {
          x: motion.shownX,
          y: motion.shownY,
          duration: plan.enterDur,
          ease: 'power2.out',
        })
        .to({}, { duration: plan.holdDur })
        .to(slot.img, {
          x: motion.retreatX,
          y: motion.retreatY,
          duration: plan.exitDur,
          ease: 'power2.in',
        })
    }

    const startLoops = () => {
      if (disposed) return
      slots.slice(0, loopCount).forEach((slot, i) => {
        gsap.delayedCall(i * 0.28 + rand(0.02, 0.22), () => runPeek(slot))
      })
    }

    const ctx = gsap.context(() => {
      const imgs = slots.map((s) => s.img)
      const ready = () => imgs.every((im) => im.complete && im.naturalWidth > 0)
      if (ready()) startLoops()
      else {
        let left = imgs.length
        const tick = () => {
          left -= 1
          if (left <= 0) startLoops()
        }
        imgs.forEach((im) => {
          if (im.complete && im.naturalWidth > 0) tick()
          else im.addEventListener('load', tick, { once: true })
        })
        gsap.delayedCall(0.55, startLoops)
      }

      // Boşta kalan slot varsa doldur (sonsuz döngü güvencesi)
      const pump = () => {
        if (disposed) return
        slots.slice(0, loopCount).forEach((slot) => {
          if (!slot.busy) runPeek(slot)
        })
        gsap.delayedCall(1.2, pump)
      }
      gsap.delayedCall(1.5, pump)
    }, root)

    const onResize = () => {
      slots.forEach((s) => {
        s.gen += 1
        s.busy = false
      })
      gsap.killTweensOf(root.querySelectorAll('[data-marti-img]'))
      gsap.delayedCall(0.12, startLoops)
    }

    const ro = new ResizeObserver(onResize)
    ro.observe(root)
    window.addEventListener('resize', onResize)

    return () => {
      disposed = true
      ro.disconnect()
      window.removeEventListener('resize', onResize)
      slots.forEach((s) => {
        s.gen += 1
        s.busy = false
      })
      ctx.revert()
    }
  }, [configProp])

  const poolSize = resolveConfig(configProp).poolSize

  return (
    <div
      ref={rootRef}
      data-marti-root
      className="pointer-events-none absolute inset-0 z-[12] overflow-hidden"
      aria-hidden
    >
      {Array.from({ length: poolSize }, (_, i) => (
        <div key={i} data-marti-slot className="absolute">
          <img
            data-marti-img
            src={ASSETS.martiHead}
            alt=""
            className="marti-peek-img block max-w-none select-none"
            draggable={false}
            decoding="async"
          />
        </div>
      ))}
    </div>
  )
}
