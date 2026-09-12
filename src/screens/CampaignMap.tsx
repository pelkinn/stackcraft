import { motion } from 'framer-motion'
import { useMemo, useRef, type CSSProperties, type MouseEvent } from 'react'
import { StarIcon } from '../components/Logo'
import { LEVELS } from '../data/levels'
import { isUnlocked, useGame } from '../store/game'

// координаты уровней в процентах экрана — «созвездие» слева направо
const POS: [number, number][] = [
  [9, 64], [18, 42], [27, 66], [36, 40], [45, 62], [54, 36], [63, 60], [72, 38], [80, 63], [88, 40],
]

const TITLE = ['STACK', 'CRAFT']

/** детерминированный «рандом»: искры не прыгают между рендерами */
function sparks(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const r = (k: number) => {
      const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
      return x - Math.floor(x)
    }
    return { left: r(1) * 100, top: r(2) * 100, size: 1 + r(3) * 2.2, delay: r(4) * 6, dur: 2.5 + r(5) * 4 }
  })
}

export function CampaignMap() {
  const progress = useGame((s) => s.progress)
  const openLevel = useGame((s) => s.openLevel)
  const muted = useGame((s) => s.muted)
  const toggleMute = useGame((s) => s.toggleMute)
  const rootRef = useRef<HTMLDivElement>(null)
  const dots = useMemo(() => sparks(46), [])

  const total = LEVELS.reduce((a, l) => a + (progress[l.id] ?? 0), 0)
  const current = LEVELS.find((l) => isUnlocked(progress, l.id) && !progress[l.id])?.id

  // параллакс через CSS-переменные, без ре-рендера React
  const onMove = (e: MouseEvent) => {
    const el = rootRef.current
    if (!el) return
    el.style.setProperty('--mx', (e.clientX / window.innerWidth - 0.5).toFixed(3))
    el.style.setProperty('--my', (e.clientY / window.innerHeight - 0.5).toFixed(3))
  }

  return (
    <div ref={rootRef} className="map" onMouseMove={onMove}>
      <div className="map-bg" style={{ '--map-bg': 'url(/map-bg.webp)' } as CSSProperties} />
      <div className="map-grid" />
      <div className="map-sparks" aria-hidden>
        {dots.map((d, i) => (
          <i
            key={i}
            style={{
              left: `${d.left}%`,
              top: `${d.top}%`,
              width: d.size,
              height: d.size,
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.dur}s`,
            }}
          />
        ))}
      </div>
      <div className="map-sweep" />
      <div className="map-vignette" />

      <header className="map-header">
        <div className="label">Симулятор системного дизайна</div>
        <h1 className="h-display">
          {TITLE.map((word, w) => (
            <span key={word} className={w ? 'accent' : undefined}>
              {[...word].map((ch, i) => (
                <motion.span
                  key={i}
                  className="ch"
                  initial={{ opacity: 0, y: -18, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.15 + (w * word.length + i) * 0.05, duration: 0.45 }}
                >
                  {ch}
                </motion.span>
              ))}
            </span>
          ))}
        </h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          Собирай архитектуру из блоков, пускай трафик и смотри, где рвётся.
        </motion.p>
      </header>

      <div className="map-total">
        <div className="label">Звёзды</div>
        <div className="v">{total} / {LEVELS.length * 3}</div>
      </div>

      {/* без viewBox: координаты в % от экрана, штрихи не растягиваются */}
      <svg className="map-svg" aria-hidden>
        {POS.slice(1).map(([x, y], i) => {
          const [px, py] = POS[i]
          const coords = { x1: `${px}%`, y1: `${py}%`, x2: `${x}%`, y2: `${y}%` }
          const done = (progress[i + 1] ?? 0) > 0
          const open = isUnlocked(progress, i + 2)
          return (
            <g key={i}>
              <line {...coords} className={`map-link${done ? ' done' : ''}`} />
              {/* pathLength=100 — пакет занимает одинаковую долю линии любой длины */}
              {open &&
                [0, 1].map((k) => (
                  <line
                    key={k}
                    {...coords}
                    pathLength={100}
                    className={`map-packet${done ? '' : ' dim'}`}
                    style={{ animationDelay: `${k * 1.4 + i * 0.3}s` }}
                  />
                ))}
            </g>
          )
        })}
      </svg>

      {LEVELS.map((l, i) => {
        const [x, y] = POS[i]
        const unlocked = isUnlocked(progress, l.id)
        const stars = progress[l.id] ?? 0
        const cls = ['map-node', l.id === current && 'current', stars > 0 && 'done'].filter(Boolean).join(' ')
        return (
          <motion.button
            key={l.id}
            className={cls}
            // якорь — центр ромба (64px), а не всей кнопки с подписью
            style={{ left: `${x}%`, top: `${y}%`, x: '-50%' }}
            disabled={!unlocked}
            onClick={() => openLevel(l.id)}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: unlocked ? 1 : 0.35, y: -32 }}
            transition={{ delay: 0.4 + 0.06 * i }}
            title={unlocked ? undefined : 'Пройди предыдущий уровень'}
          >
            {l.id === current && <span className="radar" />}
            <div className="ring"><span>{l.id}</span></div>
            <div className="cap">
              <div className="t">{l.title}</div>
              <div className="s">{l.subtitle}</div>
              <div className="mini-stars">
                {[0, 1, 2].map((k) => <StarIcon key={k} on={k < stars} />)}
              </div>
            </div>
            {unlocked && <span className="map-card">{l.brief}</span>}
          </motion.button>
        )
      })}

      <footer className="map-footer">
        <button className="btn" onClick={toggleMute}>{muted ? 'Звук: выкл' : 'Звук: вкл'}</button>
        <span>Прогресс сохраняется в браузере</span>
      </footer>
    </div>
  )
}
