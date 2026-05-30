import gsap from 'gsap'
import { sceneState, createInitialSceneState } from './sceneState'

/** Scroll-driven timeline — paused, never autoplays */
export function createScrollTimeline(): gsap.core.Timeline {
  Object.assign(sceneState, createInitialSceneState())

  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: 'none' },
  })

  tl.to(sceneState, { particleIntensity: 0.45, duration: 0.3 }, 0)

  // Cinematic dissolve — whole PNG fades out, no shader/color hacks
  tl.to(
    sceneState,
    {
      hazeOpacity: 0.2,
      cameraPush: 0.35,
      dofBlur: 0.25,
      duration: 0.12,
      ease: 'power1.inOut',
    },
    0.28,
  )
  tl.to(
    sceneState,
    {
      portraitOpacity: 0,
      hazeOpacity: 0.55,
      cameraPush: 1,
      dofBlur: 0.65,
      duration: 0.24,
      ease: 'power2.inOut',
    },
    0.34,
  )
  tl.to(
    sceneState,
    {
      hazeOpacity: 0.25,
      duration: 0.1,
      ease: 'power1.out',
    },
    0.56,
  )

  tl.to(
    sceneState,
    {
      tulipOpacity: 1,
      tulipY: 0.05,
      tulipScale: 1.06,
      tulipFocus: 1,
      bloomIntensity: 0.52,
      dofBlur: 0,
      hazeOpacity: 0.18,
      floralOpacity: 0.58,
      particleIntensity: 0.75,
      duration: 0.35,
      ease: 'power2.inOut',
    },
    0.52,
  )

  tl.to(
    sceneState,
    {
      bloomIntensity: 0.42,
      particleIntensity: 0.55,
      duration: 0.13,
      ease: 'power1.inOut',
    },
    0.87,
  )

  tl.progress(0)
  return tl
}
