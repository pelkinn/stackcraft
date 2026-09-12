import type { CSSProperties } from 'react'
import { LOGOS } from '../data/logos'

export function Logo({ id, size = 24 }: { id: string; size?: number }) {
  const logo = LOGOS[id]
  if (!logo) return null
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ '--logo': logo.color } as CSSProperties} aria-hidden>
      {logo.brand ? (
        <path d={logo.path} fill={logo.color} />
      ) : (
        <path d={logo.path} fill="none" stroke={logo.color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

export const STAR_PATH = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z'

export function StarIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={on ? 'on' : 'off'} aria-hidden>
      <path d={STAR_PATH} />
    </svg>
  )
}
