# Reverie

An ultra-premium cinematic scroll experience — Apple-inspired product reveal meets luxury editorial design.

## Stack

- **Vite** + **React** + **TypeScript**
- **React Three Fiber** + **Drei** + **Postprocessing**
- **GSAP ScrollTrigger** timeline orchestration
- **Lenis** smooth scrolling
- **Tailwind CSS v4**

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and scroll slowly.

## Replace Assets

Drop your production assets into `public/assets/` and update paths in `src/config/assets.ts`:

| File | Purpose |
|------|---------|
| `portrait-left.jpg` | Left portrait (studio, white seamless) |
| `portrait-right.jpg` | Right portrait |
| `tulip.png` | Transparent tulip PNG |
| `floral-bg.jpg` | Soft floral atmosphere background |

Placeholder SVGs are included for immediate preview.

## Architecture

```
src/
├── animation/          GSAP timeline + mutable scene state
├── components/
│   ├── camera/         Cinematic camera breathing + push
│   ├── canvas/         R3F Canvas shell
│   ├── effects/        Bloom, DOF, particles, haze
│   └── scenes/         Portraits, tulip, floral background
├── hooks/              Lenis + ScrollTrigger integration
└── store/              Scroll progress refs (no React rerenders)
```

Scroll progress drives a **GSAP timeline** (`createTimeline.ts`) which writes to a shared `sceneState` object. All 3D components read from this via `useFrame` + exponential dampening — zero React rerenders during scroll.

## Performance

- Lazy-loaded Three.js bundle
- Ref-based animation (no state updates per frame)
- Adaptive DPR capped at 1.75
- Memoized scene components
- Texture anisotropy tuned for quality/perf balance
