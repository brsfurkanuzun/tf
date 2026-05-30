import { Suspense, memo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import { ASSETS } from '../../config/assets'
import { PortraitScene } from '../scenes/PortraitScene'
import { TulipScene } from '../scenes/TulipScene'
import { FloralBackground } from '../scenes/FloralBackground'
import { Particles } from '../effects/Particles'
import { AtmosphericHaze } from '../effects/AtmosphericHaze'
import { CinematicCamera } from '../camera/CinematicCamera'
import { CinematicEffects } from '../effects/CinematicEffects'
import { SceneLighting } from './SceneLighting'

function SceneContent() {
  return (
    <>
      <color attach="background" args={['#ffffff']} />
      <fog attach="fog" args={['#faf8f9', 8, 18]} />

      <SceneLighting />
      <Environment preset="studio" environmentIntensity={0.35} />

      <Suspense fallback={null}>
        <FloralBackground url={ASSETS.floralBg} />
        <TulipScene url={ASSETS.tulip} />
        <PortraitScene
          leftUrl={ASSETS.portraitLeft}
          rightUrl={ASSETS.portraitRight}
        />
      </Suspense>

      <ContactShadows
        position={[0, -1.55, 0]}
        opacity={0.28}
        scale={12}
        blur={2.8}
        far={4}
        color="#c8b8b0"
      />

      <Particles />
      <AtmosphericHaze />
      <CinematicCamera />
      <CinematicEffects />
    </>
  )
}

export const Experience = memo(function Experience() {
  return (
    <Canvas
      className="absolute inset-0 z-10 h-full w-full"
      style={{ background: '#ffffff' }}
      camera={{ position: [0, 0, 5.2], fov: 38, near: 0.1, far: 30 }}
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
      }}
      performance={{ min: 0.5 }}
    >
      <SceneContent />
    </Canvas>
  )
})
