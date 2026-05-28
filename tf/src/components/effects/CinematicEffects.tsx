import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Vignette,
} from '@react-three/postprocessing'
import type { BloomEffect, DepthOfFieldEffect } from 'postprocessing'
import { sceneState } from '../../animation/sceneState'

export const CinematicEffects = memo(function CinematicEffects() {
  const bloomRef = useRef<BloomEffect>(null!)
  const dofRef = useRef<DepthOfFieldEffect>(null!)

  useFrame(() => {
    const bloom = bloomRef.current
    if (bloom) {
      bloom.intensity = sceneState.bloomIntensity
    }

    const dof = dofRef.current
    if (dof) {
      dof.cocMaterial.uniforms.focusDistance.value =
        0.012 + sceneState.dofBlur * 0.035
      dof.cocMaterial.uniforms.focalLength.value =
        0.028 + sceneState.dofBlur * 0.012
    }
  })

  return (
    <EffectComposer multisampling={4}>
      <DepthOfField
        ref={dofRef}
        focusDistance={0.012}
        focalLength={0.028}
        bokehScale={1.2}
        height={480}
      />
      <Bloom
        ref={bloomRef}
        intensity={0.15}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette offset={0.3} darkness={0.25} eskil={false} />
    </EffectComposer>
  )
})
