import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { sfx } from '../audio/sfx'
import { LEVEL_MAP, LEVELS } from '../data/levels'
import { fmtPct } from '../format'
import { useGame } from '../store/game'
import { StarIcon } from './Logo'

export function ResultModal() {
  // во время exit-анимации result в сторе уже может быть сброшен — держим последний
  const live = useGame((s) => s.result)
  const last = useRef(live)
  if (live) last.current = live
  const result = last.current!
  const level = useGame((s) => LEVEL_MAP[s.levelId])
  const closeResult = useGame((s) => s.closeResult)
  const loadReference = useGame((s) => s.loadReference)
  const openLevel = useGame((s) => s.openLevel)
  const goMap = useGame((s) => s.goMap)

  const { sim, stars, fault } = result
  const hasNext = level.id < LEVELS.length
  const [showHints, setShowHints] = useState(false)
  const failed = result.checks.filter((c) => !c.ok)
  const hasHints = result.tips.length > 0 || failed.some((c) => c.explain)

  useEffect(() => {
    const timers = Array.from({ length: stars }, (_, i) => setTimeout(() => sfx.star(i), 500 + i * 350))
    return () => timers.forEach(clearTimeout)
  }, [stars])

  const third =
    level.fault === 'none'
      ? `Без единой ошибки (${fmtPct(sim.errorRate)})`
      : `Переживает падение ${level.fault === 'full' ? 'любого узла' : 'stateless-узла'}${fault && !fault.survived ? ` — упало на: ${fault.spofs.map((s) => s.label).join(', ')}` : ''}`

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: 'none', transition: { duration: 0.15 } }}
      onClick={closeResult}
    >
      <motion.div
        className="modal"
        initial={{ y: 24, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 12, opacity: 0, transition: { duration: 0.12 } }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="label">Уровень {level.id} · {level.title}</div>
        <h2 className={`verdict ${result.passed ? 'ok' : 'fail'}`}>
          {result.passed ? 'Архитектура принята' : 'Прод упал'}
        </h2>

        <div className="stars">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0.3, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.4 + i * 0.35, type: 'spring', damping: 12 }}
            >
              <StarIcon on={i < stars} />
            </motion.span>
          ))}
        </div>

        <div className="star-legend">
          <span className={stars >= 1 ? 'got' : ''}>★ Все цели достигнуты</span>
          <span className={stars >= 2 ? 'got' : ''}>
            ★★ Серверы {sim.servers}/{level.budget} · p95 {Math.round(sim.p95)}/{level.p95Ms} мс
          </span>
          <span className={stars >= 3 ? 'got' : ''}>★★★ {third}</span>
        </div>

        {!result.passed && (
          <div className="modal-section">
            <div className="label">Цели не достигнуты</div>
            <ul>
              {failed.map((c) => (
                <li key={c.id}>
                  {showHints ? (
                    <>
                      <b>{c.text}.</b> {c.explain}
                    </>
                  ) : (
                    c.text
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* подсказки скрыты по умолчанию — сначала игрок думает сам */}
        {hasHints && (
          <div className="modal-section">
            {showHints ? (
              result.tips.length > 0 && (
                <>
                  <div className="label">Разбор</div>
                  <ul>
                    {result.tips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </>
              )
            ) : (
              <div className="hints-locked">
                <span>Разбор скрыт — попробуй сначала найти проблему сам.</span>
                <button className="btn" onClick={() => setShowHints(true)}>Показать разбор</button>
              </div>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={goMap}>К карте</button>
          {stars < 3 && (
            <button className="btn" onClick={loadReference}>Показать эталон</button>
          )}
          <button className="btn" onClick={closeResult}>Доработать</button>
          {result.passed && hasNext && (
            <button className="btn-launch" onClick={() => openLevel(level.id + 1)}>ДАЛЬШЕ →</button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
