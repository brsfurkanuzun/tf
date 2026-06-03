/**
 * Sadece public/assets/living-room-hero.png kaynağından:
 * global loş gece + sağ pencere kararması + TV bölgesi parlama (ek mobilya yok).
 *
 * Çıktı: public/assets/living-room-hero-night-export.png
 */
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const input = path.join(root, 'public', 'assets', 'living-room-hero.png')
const output = path.join(root, 'public', 'assets', 'living-room-hero-night-export.png')

if (!fs.existsSync(input)) {
  console.warn('Atlandı (kaynak yok):', input)
  process.exit(0)
}

const meta = await sharp(input).metadata()
const W = meta.width ?? 1920
const H = meta.height ?? 1080

const baseBuf = await sharp(input)
  .ensureAlpha()
  .modulate({ brightness: 0.5, saturation: 0.84 })
  .png()
  .toBuffer()

const x1 = Math.round(0.42 * W)
const windowSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="win" x1="${x1}" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="rgb(255,255,255)" stop-opacity="0"/>
      <stop offset="100%" stop-color="rgb(10,12,28)" stop-opacity="0.88"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#win)"/>
</svg>`
const windowBuf = await sharp(Buffer.from(windowSvg)).png().toBuffer()

const cx = W * 0.5
const cy = H * 0.23
const r = Math.min(W, H) * 0.2
const tvSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="tv" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="rgb(210,232,255)" stop-opacity="0.92"/>
      <stop offset="40%" stop-color="rgb(130,170,230)" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="rgb(40,60,100)" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#tv)"/>
</svg>`
const tvBuf = await sharp(Buffer.from(tvSvg)).png().toBuffer()

const cx2 = W * 0.5
const cy2 = H * 0.37
const r2 = Math.min(W, H) * 0.28
const spillSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="sp" cx="${cx2}" cy="${cy2}" r="${r2}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="rgb(160,195,240)" stop-opacity="0.38"/>
      <stop offset="100%" stop-color="rgb(40,50,80)" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sp)"/>
</svg>`
const spillBuf = await sharp(Buffer.from(spillSvg)).png().toBuffer()

const vigSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="v" cx="50%" cy="50%" r="70%" gradientUnits="userSpaceOnUse">
      <stop offset="35%" stop-color="rgb(0,0,0)" stop-opacity="0"/>
      <stop offset="100%" stop-color="rgb(0,0,0)" stop-opacity="0.42"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#v)"/>
</svg>`
const vigBuf = await sharp(Buffer.from(vigSvg)).png().toBuffer()

await sharp(baseBuf)
  .composite([
    { input: windowBuf, blend: 'multiply' },
    { input: tvBuf, blend: 'screen' },
    { input: spillBuf, blend: 'soft-light' },
    { input: vigBuf, blend: 'multiply' },
  ])
  .png()
  .toFile(output)

console.log('Yazıldı:', output, fs.statSync(output).size)
