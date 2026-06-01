/** salon_gece içindeki yer tutucu — #0DFF16 (RGB 13,255,22) */
const CHROMA = { r: 13, g: 255, b: 22 } as const

export type NormalizedRect = { nx: number; ny: number; nw: number; nh: number }

/**
 * PNG içinde parlak yeşil dikdörtgenin sınırlarını bulur (0–1 normalize).
 * Aynı köken (same-origin) için canvas okuması gerekir.
 */
export function detectChromaBoundingBox(
  imageSrc: string,
  tolerance = 95,
): Promise<NormalizedRect | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      try {
        const W = img.naturalWidth
        const H = img.naturalHeight
        if (W < 32 || H < 32) {
          resolve(null)
          return
        }
        const canvas = document.createElement('canvas')
        canvas.width = W
        canvas.height = H
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0)
        const { data } = ctx.getImageData(0, 0, W, H)
        let minX = W
        let minY = H
        let maxX = 0
        let maxY = 0
        let found = false
        const step = Math.max(1, Math.floor(Math.min(W, H) / 1000))
        const t = tolerance
        for (let y = 0; y < H; y += step) {
          for (let x = 0; x < W; x += step) {
            const i = (y * W + x) * 4
            const r = data[i]!
            const g = data[i + 1]!
            const b = data[i + 2]!
            if (
              Math.abs(r - CHROMA.r) < t &&
              Math.abs(g - CHROMA.g) < t &&
              Math.abs(b - CHROMA.b) < t
            ) {
              found = true
              if (x < minX) minX = x
              if (y < minY) minY = y
              if (x > maxX) maxX = x
              if (y > maxY) maxY = y
            }
          }
        }
        if (!found || maxX <= minX || maxY <= minY) {
          resolve(null)
          return
        }
        const exp = Math.max(4, Math.round(Math.min(W, H) * 0.004))
        minX = Math.max(0, minX - exp)
        minY = Math.max(0, minY - exp)
        maxX = Math.min(W - 1, maxX + exp)
        maxY = Math.min(H - 1, maxY + exp)
        if (maxX <= minX || maxY <= minY) {
          resolve(null)
          return
        }
        resolve({
          nx: minX / W,
          ny: minY / H,
          nw: (maxX - minX) / W,
          nh: (maxY - minY) / H,
        })
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = imageSrc
  })
}

/** Kenar çizgisi / yeşil sızıntısını kapatmak için hafif büyütme */
const MARKER_BLEED = 1.032

/** object-cover img üzerinde normalize dikdörtgen → % stilleri */
export function objectCoverMarkerPercentStyle(
  img: HTMLImageElement,
  rect: NormalizedRect,
): Record<string, string> {
  const wc = img.clientWidth
  const hc = img.clientHeight
  const w0 = img.naturalWidth
  const h0 = img.naturalHeight
  if (!wc || !hc || !w0 || !h0) {
    return { visibility: 'hidden' }
  }
  const scale = Math.max(wc / w0, hc / h0)
  const dw = w0 * scale
  const dh = h0 * scale
  const ox = (wc - dw) / 2
  const oy = (hc - dh) / 2
  let left = ((ox + rect.nx * w0 * scale) / wc) * 100
  let top = ((oy + rect.ny * h0 * scale) / hc) * 100
  let width = ((rect.nw * w0 * scale) / wc) * 100
  let height = ((rect.nh * h0 * scale) / hc) * 100
  const bw = width * MARKER_BLEED
  const bh = height * MARKER_BLEED
  left -= (bw - width) / 2
  top -= (bh - height) / 2
  width = bw
  height = bh
  return {
    position: 'absolute',
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
    visibility: 'visible',
    zIndex: '2',
  }
}
