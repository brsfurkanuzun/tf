import { useRef } from 'react'

type SiteHeaderProps = {
  logoAnchorRef?: React.RefObject<HTMLDivElement | null>
  showHeaderLogo?: boolean
}

export function SiteHeader({ logoAnchorRef: logoAnchorRefProp }: SiteHeaderProps) {
  const fallbackRef = useRef<HTMLDivElement>(null)
  const logoAnchorRef = logoAnchorRefProp ?? fallbackRef

  return (
    <header className="fixed inset-x-0 top-0 z-[5000] flex h-[4.5rem] items-center justify-center">
      <div
        ref={logoAnchorRef}
        className="grid size-16 shrink-0 place-items-center"
        style={{ minWidth: '4rem', minHeight: '4rem' }}
      />
    </header>
  )
}
