import { memo } from 'react'

export const EditorialOverlay = memo(function EditorialOverlay() {
  return (
    <>
      <div
        className="scroll-progress pointer-events-none absolute inset-x-0 top-0 z-30 h-px origin-left bg-[var(--color-accent)]"
        aria-hidden="true"
      />

      <aside
        className="pointer-events-none absolute left-6 top-1/2 z-20 hidden -translate-y-1/2 md:block lg:left-10"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="chapter-label font-body uppercase" />
      </aside>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center pt-10 md:pt-14">
        <p className="font-display text-[clamp(1.125rem,2.5vw,1.5rem)] font-normal tracking-[0.08em] text-[var(--color-primary)]">
          Reverie
        </p>
        <p className="chapter-label mt-3 font-body uppercase md:hidden" />
      </header>

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-4 pb-10 md:pb-14">
        <div className="scroll-cue flex flex-col items-center gap-2 opacity-[var(--cue-opacity,0.45)]">
          <div className="h-10 w-px bg-gradient-to-b from-[var(--color-secondary)] to-transparent opacity-40" />
          <p className="font-body text-[9px] font-light tracking-[0.32em] text-[var(--color-secondary)] uppercase">
            Scroll
          </p>
        </div>
      </footer>

      <div className="grain pointer-events-none absolute inset-0 z-[15] opacity-[0.035]" aria-hidden="true" />
    </>
  )
})
