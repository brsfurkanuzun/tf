import { memo } from 'react'

export const LoadingFallback = memo(function LoadingFallback() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--color-background)]">
      <div className="flex flex-col items-center gap-6">
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-60" />
        <p className="font-body text-[10px] font-light tracking-[0.35em] text-[var(--color-secondary)] uppercase">
          Loading
        </p>
      </div>
    </div>
  )
})
