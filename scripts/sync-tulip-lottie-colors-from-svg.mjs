/**
 * tulip.svg içindeki linearGradient duraklarını okur, tulip-lottie.json
 * içindeki gradient dolgulara (ty === "gf") depth-first sırayla uygular.
 *
 * Çalıştır: node scripts/sync-tulip-lottie-colors-from-svg.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function hexToRgb01(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function flatStops(stops) {
  const out = []
  for (const { offset, hex } of stops) {
    const [r, g, b] = hexToRgb01(hex)
    out.push(offset, r, g, b)
  }
  return out
}

function twoStopFromEnds(stops) {
  if (stops.length < 2) throw new Error('en az 2 durak gerekli')
  const a = stops[0]
  const b = stops[stops.length - 1]
  const [r0, g0, b0] = hexToRgb01(a.hex)
  const [r1, g1, b1] = hexToRgb01(b.hex)
  return [0, r0, g0, b0, 1, r1, g1, b1]
}

/** @returns {Record<string, { offset: number, hex: string }[]>} */
function parseSvgLinearGradients(svg) {
  const map = {}
  const blockRe = /<linearGradient\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/linearGradient>/g
  let bm
  while ((bm = blockRe.exec(svg))) {
    const id = bm[1]
    const inner = bm[2]
    const stops = []
    const stopRe = /<stop\b[^>]*>/g
    let sm
    while ((sm = stopRe.exec(inner))) {
      const tag = sm[0]
      const offM = /offset="([^"]+)"/.exec(tag)
      const colM = /stop-color="#([0-9A-Fa-f]{6})"/i.exec(tag)
      if (!colM) continue
      const offset = offM ? parseFloat(offM[1]) : 0
      stops.push({ offset, hex: `#${colM[1]}` })
    }
    map[id] = stops
  }
  return map
}

function stopsForPaint(gradMap, paintIndex) {
  const key = Object.keys(gradMap).find((k) => k.startsWith(`paint${paintIndex}_`))
  if (!key) throw new Error(`SVG’de paint${paintIndex} gradient bulunamadı`)
  return gradMap[key]
}

const svgPath = path.join(root, 'src', 'assets', 'tulip.svg')
const jsonPath = path.join(root, 'src', 'assets', 'tulip-lottie.json')

const svg = fs.readFileSync(svgPath, 'utf8')
const gradMap = parseSvgLinearGradients(svg)

const paint0 = flatStops(stopsForPaint(gradMap, 0))
const paint1 = flatStops(stopsForPaint(gradMap, 1))
const paint2 = flatStops(stopsForPaint(gradMap, 2))
const leaf2 = () => twoStopFromEnds(stopsForPaint(gradMap, 6))
const petal3 = () => twoStopFromEnds(stopsForPaint(gradMap, 3))
const petal45 = () => twoStopFromEnds(stopsForPaint(gradMap, 4))

/**
 * Lottie `shapes[4–6]` sırası SVG path sırasından farklı: orta taç (sarı uç
 * paint3) export’ta üçüncü grupta. Yanlar pembe (paint4/5 aynı uç renkleri).
 */
const PALETTE_BY_GF_INDEX = [
  leaf2(),
  leaf2(),
  leaf2(),
  leaf2(),
  petal45(),
  petal45(),
  petal3(),
  paint2,
  paint0,
  paint1,
]

function patchGf(obj, idxRef) {
  if (!obj || typeof obj !== 'object') return
  if (obj.ty === 'gf' && obj.g && typeof obj.g === 'object') {
    const pal = PALETTE_BY_GF_INDEX[idxRef.i]
    const p = obj.g.p
    const expectedLen = p * 4
    if (!Array.isArray(pal) || pal.length !== expectedLen) {
      console.warn('gf', idxRef.i, 'p=', p, 'beklenen uzunluk', expectedLen, 'pal', pal?.length)
    } else {
      if (!obj.g.k || typeof obj.g.k !== 'object') obj.g.k = { a: 0, k: [] }
      obj.g.k.a = 0
      obj.g.k.k = [...pal]
    }
    idxRef.i += 1
  }
  if (Array.isArray(obj)) {
    for (const x of obj) patchGf(x, idxRef)
  } else {
    for (const k of Object.keys(obj)) patchGf(obj[k], idxRef)
  }
}

const raw = fs.readFileSync(jsonPath, 'utf8')
const data = JSON.parse(raw)
const idxRef = { i: 0 }
patchGf(data, idxRef)
const nGf = PALETTE_BY_GF_INDEX.length
if (idxRef.i !== nGf) {
  console.warn('Uyarı: güncellenen gf sayısı', idxRef.i, 'beklenen', nGf)
}
fs.writeFileSync(jsonPath, JSON.stringify(data), 'utf8')
console.log('OK:', jsonPath, '←', svgPath)
