/** Mutable scene state — updated by GSAP timeline, read by R3F useFrame (no React state) */
export interface SceneState {
  portraitOpacity: number
  portraitBlur: number
  hazeOpacity: number
  cameraPush: number
  tulipOpacity: number
  tulipY: number
  tulipScale: number
  tulipFocus: number
  floralOpacity: number
  bloomIntensity: number
  dofBlur: number
  particleIntensity: number
}

export function createInitialSceneState(): SceneState {
  return {
    portraitOpacity: 1,
    portraitBlur: 0,
    hazeOpacity: 0,
    cameraPush: 0,
    tulipOpacity: 0,
    tulipY: -0.85,
    tulipScale: 0.92,
    tulipFocus: 0,
    floralOpacity: 0,
    bloomIntensity: 0.15,
    dofBlur: 0,
    particleIntensity: 0.3,
  }
}

export const sceneState: SceneState = createInitialSceneState()
