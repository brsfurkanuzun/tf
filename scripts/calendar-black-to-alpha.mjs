/**
 * Takvim PNG: düz siyah arka planı şeffaf yapar (kenar anti-alias için eşik).
 * Kullanım: node scripts/calendar-black-to-alpha.mjs <giriş.png> <çıkış.png>
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const THRESH = 38 // saf siyah + hafif fringe; takvim gövdesindeki koyu gölgeler genelde üstünde

const input = process.argv[2]
const output = process.argv[3]
if (!input || !output) {
  console.error('Kullanım: node scripts/calendar-black-to-alpha.mjs <giriş.png> <çıkış.png>')
  process.exit(1)
}

if (!fs.existsSync(input)) {
  console.error('Bulunamadı:', input)
  process.exit(1)
}

const buf = await sharp(input).ensureAlpha().raw().toBuffer()
const meta = await sharp(input).metadata()
const { width, height } = meta
if (!width || !height) {
  console.error('Geçersiz boyut')
  process.exit(1)
}

const out = Buffer.from(buf)

for (let i = 0; i < out.length; i += 4) {
  const r = out[i]
  const g = out[i + 1]
  const b = out[i + 2]
  if (r <= THRESH && g <= THRESH && b <= THRESH) {
    out[i + 3] = 0
  }
}

await fs.promises.mkdir(path.dirname(output), { recursive: true })
await sharp(out, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(output)

console.log('Yazıldı:', output)
