import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sceneState } from '../../animation/sceneState'

export const AtmosphericHaze = memo(function AtmosphericHaze() {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null!)

  useFrame(() => {
    const mat = materialRef.current
    if (!mat) return
    mat.opacity = sceneState.hazeOpacity
  })

  return (
    <mesh position={[0, 0, 0.8]}>
      <planeGeometry args={[20, 14]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#ffffff"
        transparent
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  )
})
