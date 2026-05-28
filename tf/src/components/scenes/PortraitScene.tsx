import { memo, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { sceneState } from '../../animation/sceneState'

interface PortraitPlaneProps {
  url: string
  position: [number, number, number]
}

const PortraitPlane = memo(function PortraitPlane({
  url,
  position,
}: PortraitPlaneProps) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null!)
  const texture = useTexture(url)

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
  }, [texture])

  const { width, height } = useMemo(() => {
    const img = texture.image as HTMLImageElement | undefined
    const aspect = img?.width && img?.height ? img.width / img.height : 1
    const planeHeight = 2.8
    return { width: planeHeight * aspect, height: planeHeight }
  }, [texture])

  useFrame(() => {
    const mat = materialRef.current
    if (!mat) return
    mat.opacity = sceneState.portraitOpacity
    mat.transparent = sceneState.portraitOpacity < 1
    mat.depthWrite = sceneState.portraitOpacity >= 0.99
  })

  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          ref={materialRef}
          map={texture}
          transparent
          opacity={1}
          toneMapped={false}
          depthWrite
        />
      </mesh>
    </group>
  )
})

export const PortraitScene = memo(function PortraitScene({
  leftUrl,
  rightUrl,
}: {
  leftUrl: string
  rightUrl: string
}) {
  return (
    <group>
      <PortraitPlane url={leftUrl} position={[-1.05, 0, 0.15]} />
      <PortraitPlane url={rightUrl} position={[1.05, 0, -0.08]} />
    </group>
  )
})
