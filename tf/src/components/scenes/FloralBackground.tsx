import { memo, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { sceneState } from '../../animation/sceneState'

export const FloralBackground = memo(function FloralBackground({
  url,
}: {
  url: string
}) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null!)
  const texture = useTexture(url)

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
  }, [texture])

  useFrame(() => {
    const mat = materialRef.current
    if (!mat) return
    mat.opacity = sceneState.floralOpacity
  })

  return (
    <mesh position={[0, 0.1, -2.8]} scale={[14, 10, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  )
})
