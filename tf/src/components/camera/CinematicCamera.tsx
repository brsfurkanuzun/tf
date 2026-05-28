import { memo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { sceneState } from '../../animation/sceneState'

export const CinematicCamera = memo(function CinematicCamera() {
  const { camera } = useThree()

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera
    const baseZ = 5.2
    const pushZ = baseZ - sceneState.cameraPush * 2.2

    cam.position.set(0, 0, pushZ)
    cam.lookAt(0, 0, 0)
    cam.fov = 38 - sceneState.cameraPush * 2
    cam.updateProjectionMatrix()
  })

  return null
})
