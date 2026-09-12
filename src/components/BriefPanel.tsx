import { BLOCK_MAP } from '../data/blocks'
import { LEVEL_MAP } from '../data/levels'
import { FAULT_TEXT, LOAD_TEXT } from '../engine/evaluate'
import { fmtRps, fmtServers } from '../format'
import { useGame } from '../store/game'
import { Inspector } from './Inspector'

export function BriefPanel() {
  const levelId = useGame((s) => s.levelId)
  const nodes = useGame((s) => s.nodes)
  const best = useGame((s) => s.progress[s.levelId] ?? 0)
  const failedOnce = useGame((s) => s.result !== null && !s.result.passed)
  const loadReference = useGame((s) => s.loadReference)
  const clearBoard = useGame((s) => s.clearBoard)
  const viewingRef = useGame((s) => s.stash !== null)
  const restoreOwn = useGame((s) => s.restoreOwn)
  const level = LEVEL_MAP[levelId]

  // статус целей виден только после запуска — иначе их можно «подобрать» перебором
  const shown = useGame((s) => (s.phase === 'build' ? null : (s.result?.checks ?? null)))
  const goals = shown ?? [
    ...level.requirements.map((r) => ({ id: r.id, text: r.text, ok: false })),
    { id: 'load', text: LOAD_TEXT, ok: false },
    ...(level.faultRequired ? [{ id: 'fault', text: FAULT_TEXT, ok: false }] : []),
  ]
  const cost = nodes.reduce((a, n) => a + BLOCK_MAP[n.data.blockId].servers * n.data.replicas, 0)
  const t = level.traffic

  return (
    <aside className="panel side">
      <Inspector />

      <section className="brief">
        <div className="label">Бриф заказчика</div>
        <h2>{level.title}</h2>
        <p>{level.brief}</p>
      </section>

      <section className="stat-grid">
        <div className="stat">
          <div className="v">{fmtRps(t.rps * (t.spike ?? 1))}</div>
          <div className="k">rps{t.spike ? ` · пик ×${t.spike}` : ''}</div>
        </div>
        <div className="stat">
          <div className="v">{Math.round(t.readRatio * 100)}%</div>
          <div className="k">чтений</div>
        </div>
        <div className="stat">
          <div className="v">{level.p95Ms}</div>
          <div className="k">p95, мс</div>
        </div>
      </section>

      <section>
        <div className="label" style={{ marginBottom: 8 }}>
          Цели{shown ? '' : ' · проверятся при запуске'}
        </div>
        <ul className="req-list">
          {goals.map((c) => (
            <li key={c.id} className={shown ? (c.ok ? 'ok' : 'fail') : ''}>
              <span className="box" />
              {c.text}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="meter-row">
          <span className="label">Серверы</span>
          <span style={{ color: cost > level.budget ? 'var(--danger)' : 'var(--text)' }}>
            {cost} / {level.budget}
          </span>
        </div>
        <div className={`meter${cost > level.budget ? ' over' : ''}`}>
          <i style={{ width: `${Math.min(100, (cost / level.budget) * 100)}%` }} />
        </div>
      </section>

      <section>
        <div className="label" style={{ marginBottom: 8 }}>Звёзды</div>
        <div className="star-legend">
          <span>★ все цели достигнуты</span>
          <span>
            ★★ не больше {fmtServers(level.budget)} и p95 ≤ {level.p95Ms} мс
          </span>
          <span>
            ★★★{' '}
            {level.fault === 'none'
              ? 'без единой ошибки'
              : level.fault === 'full'
                ? 'переживает падение любого узла, включая БД'
                : 'переживает падение любого stateless-узла'}
          </span>
        </div>
      </section>

      <section style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        {viewingRef ? (
          <button className="btn" onClick={restoreOwn}>← Вернуть моё решение</button>
        ) : (
          <>
            <button className="btn" onClick={clearBoard}>Очистить</button>
            {(best > 0 || failedOnce) && (
              <button className="btn" onClick={loadReference} title="Твоя схема сохранится — к ней можно вернуться">
                Показать эталон
              </button>
            )}
          </>
        )}
      </section>
    </aside>
  )
}
