export function fmtRps(v: number): string {
  if (!Number.isFinite(v)) return '∞'
  if (v >= 10000) return `${Math.round(v / 1000)}k`
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return `${Math.round(v)}`
}

/** 1 сервер, 2 сервера, 5 серверов */
export function fmtServers(n: number): string {
  const m10 = n % 10
  const m100 = n % 100
  const word = m10 === 1 && m100 !== 11 ? 'сервер' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'сервера' : 'серверов'
  return `${n} ${word}`
}

export const fmtPct = (v: number) => `${v < 0.1 && v > 0 ? (v * 100).toFixed(1) : Math.round(v * 100)}%`

export const utilColor = (u: number) => (u < 0.6 ? 'var(--ok)' : u < 0.9 ? 'var(--warn)' : 'var(--danger)')
