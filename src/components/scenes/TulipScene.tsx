import { memo, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { sceneState } from '../../animation/sceneState'

export const TulipScene = memo(function TulipScene({ url }: { url: string }) {
  const groupRef = useRef<THREE.Group>(null!)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null!)
  const texture = useTexture(url)

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
  }, [texture])

  const { width, height } = useMemo(() => {
    const img = texture.image as HTMLImageElement | undefined
    const aspect = img?.width && img?.height ? img.width / img.height : 2 / 3
    const planeHeight = 4.2
    return { width: planeHeight * aspect, height: planeHeight }
  }, [texture])

  useFrame(() => {
    const group = groupRef.current
    const mat = materialRef.current
    if (!group || !mat) return

    group.position.y = sceneState.tulipY
    group.scale.setScalar(sceneState.tulipScale)
    group.rotation.z = 0

    mat.opacity = sceneState.tulipOpacity
    mat.transparent = mat.opacity < 0.995
  })

  return (
    <group ref={groupRef} position={[0, -0.85, -0.2]} scale={0.92}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          ref={materialRef}
          map={texture}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
})
