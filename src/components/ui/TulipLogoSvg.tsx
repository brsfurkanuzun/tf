import { TULIP_VECTOR_URL } from '../../config/tulipLogo'

type TulipLogoSvgProps = {
  className?: string
}

export function TulipLogoSvg({ className = '' }: TulipLogoSvgProps) {
  return (
    <img
      src={TULIP_VECTOR_URL}
      alt=""
      width={512}
      height={512}
      decoding="async"
      draggable={false}
      className={`tulip-logo-svg block max-h-16 max-w-16 shrink-0 object-contain object-center ${className}`.trim()}
      style={{
        width: 'auto',
        height: 'auto',
        maxWidth: '4rem',
        maxHeight: '4rem',
        display: 'block',
      }}
    />
  )
}
