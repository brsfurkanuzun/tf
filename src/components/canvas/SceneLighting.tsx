import { memo } from 'react'

export const SceneLighting = memo(function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.85} color="#fff8f6" />
      <directionalLight
        position={[2, 4, 5]}
        intensity={0.55}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      <directionalLight
        position={[-3, 2, 2]}
        intensity={0.25}
        color="#fce8ef"
      />
      <pointLight position={[0, 1, 3]} intensity={0.15} color="#fff0f4" />
      <spotLight
        position={[0, 3, 1]}
        angle={0.4}
        penumbra={1}
        intensity={0.2}
        color="#ffffff"
      />
    </>
  )
})
