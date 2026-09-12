import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { BLOCK_MAP } from '../data/blocks'
import { LEVEL_MAP } from '../data/levels'
import { fmtPct, fmtRps } from '../format'
import { useGame } from '../store/game'

export const RUN_MS = 6000

/** плавный набор числа от 0 до target — счётчики «раскручиваются» при запуске */
function useRamp(target: number, active: boolean, ms = 2600) {
  const [v, setV] = useState(active ? 0 : target)
  useEffect(() => {
    if (!active) {
      setV(target)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms)
      setV(target * (1 - Math.pow(1 - k, 3)))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, ms])
  return v
}

export function SimHud() {
  const phase = useGame((s) => s.phase)
  const result = useGame((s) => s.result)
  const nodes = useGame((s) => s.nodes)
  const level = useGame((s) => LEVEL_MAP[s.levelId])
  const launch = useGame((s) => s.launch)
  const openReport = useGame((s) => s.openReport)

  const running = phase === 'running'
  const hasRun = phase !== 'build' && result !== null
  const sim = result?.sim
  const liveCost = nodes.reduce((a, n) => a + BLOCK_MAP[n.data.blockId].servers * n.data.replicas, 0)

  const rps = useRamp(hasRun ? sim!.rps : level.traffic.rps * (level.traffic.spike ?? 1), running)
  const p95 = useRamp(hasRun ? sim!.p95 : 0, running)
  const err = useRamp(hasRun ? sim!.errorRate : 0, running, 3200)
  const cost = hasRun ? sim!.servers : liveCost

  return (
    <div className="hud">
      <div className="hud-metric">
        <div className="label">Нагрузка</div>
        <div className="v">{fmtRps(rps)} rps</div>
      </div>
      <div className="hud-metric">
        <div className="label">p95</div>
        <div className={`v ${hasRun ? (sim!.p95 > level.p95Ms ? 'bad' : 'good') : ''}`}>{hasRun ? `${Math.round(p95)} мс` : '—'}</div>
      </div>
      <div className="hud-metric">
        <div className="label">Ошибки</div>
        <div className={`v ${hasRun ? (sim!.errorRate > 0.05 ? 'bad' : 'good') : ''}`}>{hasRun ? fmtPct(err) : '—'}</div>
      </div>
      <div className="hud-metric">
        <div className="label">Серверы</div>
        <div className={`v ${cost > level.budget ? 'bad' : ''}`}>
          {cost} / {level.budget}
        </div>
      </div>
      <div className="hud-sep" />
      {phase === 'review' && (
        <button className="btn" onClick={openReport}>Отчёт</button>
      )}
      <button className="btn-launch" onClick={launch} disabled={running}>
        {running ? 'ИДЁТ ТРАФИК…' : hasRun ? 'ПЕРЕЗАПУСК' : 'ЗАПУСК'}
      </button>
      {!running && <kbd>Space</kbd>}
      {running && (
        <motion.div className="hud-progress" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: RUN_MS / 1000, ease: 'linear' }} />
      )}
    </div>
  )
}
