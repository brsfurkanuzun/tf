/**
 * Marka lale: vektör `tulip.svg` + `tulip-lottie.json`.
 * SVG renklerini Lottie’ye aktarmak: `npm run sync:tulip-lottie-colors`
 */
import tulipLottieJson from '../assets/tulip-lottie.json' with { type: 'json' }
import tulipVectorUrl from '../assets/tulip.svg?url'

export const TULIP_VECTOR_URL = tulipVectorUrl

export const TULIP_LOTTIE_JSON = tulipLottieJson as object

/** 1 = normal; düşük = daha yavaş — yalnızca intro Lottie */
export const TULIP_INTRO_LOTTIE_SPEED = 0.4
