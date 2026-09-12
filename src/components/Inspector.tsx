import type { CSSProperties } from 'react'
import { BLOCK_MAP, CATEGORY_META, USERS_ID } from '../data/blocks'
import { fmtRps, fmtServers, utilColor } from '../format'
import { useGame } from '../store/game'
import { Logo } from './Logo'

export function Inspector() {
  const node = useGame((s) => s.nodes.find((n) => n.id === s.selectedId))
  const stat = useGame((s) => (node && s.phase !== 'build' ? s.result?.sim.nodes[node.id] : undefined))
  const setReplicas = useGame((s) => s.setReplicas)
  const removeNode = useGame((s) => s.removeNode)
  const openTech = useGame((s) => s.openTech)
  if (!node) return null

  const b = BLOCK_MAP[node.data.blockId]
  const reps = node.data.replicas
  const isUsers = b.id === USERS_ID
  const isFiles = !Number.isFinite(b.capacityRps)

  return (
    <section className="inspector" style={{ '--c': CATEGORY_META[b.category].color } as CSSProperties}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Logo id={b.id} size={28} />
        <div>
          <div className="label">{CATEGORY_META[b.category].label} · {b.stack}</div>
          <h3>{b.label}</h3>
        </div>
      </div>
      <p>
        {b.description}{' '}
        {!isUsers && (
          <button className="link-btn" onClick={() => openTech(b.id)}>
            Подробнее →
          </button>
        )}
      </p>

      {!isUsers && (
        <>
          <div className="specs">
            <span>rps / инстанс</span>
            <b>{isFiles ? 'у сервера перед ним' : fmtRps(b.capacityRps)}</b>
            <span>latency</span>
            <b>{b.baseLatencyMs} мс</b>
            <span>занимает</span>
            <b>{b.servers ? fmtServers(b.servers * reps) : isFiles ? 'просто файлы' : 'внешний сервис'}</b>
            {stat && stat.load > 0 && Number.isFinite(stat.capacity) && (
              <>
                <span>нагрузка</span>
                <b style={{ color: utilColor(stat.util) }}>
                  {fmtRps(stat.load)} / {fmtRps(stat.capacity)} ({Math.round(stat.util * 100)}%)
                </b>
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {b.maxReplicas > 1 ? (
              <div className="stepper">
                <span className="label">Реплики</span>
                <button className="btn" onClick={() => setReplicas(node.id, reps - 1)} disabled={reps <= 1}>−</button>
                <span className="n">{reps}</span>
                <button className="btn" onClick={() => setReplicas(node.id, reps + 1)} disabled={reps >= b.maxReplicas}>+</button>
              </div>
            ) : (
              <span className="label">{isFiles ? 'Масштабирует сервер перед ним' : 'Одним инстансом'}</span>
            )}
            <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => removeNode(node.id)}>
              Удалить
            </button>
          </div>
        </>
      )}
    </section>
  )
}
