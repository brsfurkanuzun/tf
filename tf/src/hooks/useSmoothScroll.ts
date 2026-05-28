import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { scrollRef } from '../store/scrollStore'
import { damp } from '../utils/math'

/** Smooths scroll progress each frame — no React rerenders */
export function useSmoothScroll() {
  const velocityRef = useRef(0)

  useFrame((_, delta) => {
    const state = scrollRef.current
    state.smoothProgress = damp(
      state.smoothProgress,
      state.progress,
      5.5,
      delta,
    )
    velocityRef.current = damp(velocityRef.current, state.velocity, 8, delta)
  })

  return velocityRef
}

export function useScrollProgress() {
  return scrollRef
}
