import { memo, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sceneState } from '../../animation/sceneState'

const COUNT = 120

export const Particles = memo(function Particles() {
  const materialRef = useRef<THREE.PointsMaterial>(null!)

  const positions = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1
    }
    return positions
  }, [])

  useFrame(() => {
    const mat = materialRef.current
    if (!mat) return
    mat.opacity = 0.12 + sceneState.particleIntensity * 0.22
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.012}
        color="#e8c8d4"
        transparent
        opacity={0.12}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
})
