import { motion } from 'framer-motion'
import { useRef, type CSSProperties } from 'react'
import { BLOCK_MAP, CATEGORY_META } from '../data/blocks'
import { TECH } from '../data/tech'
import { fmtRps } from '../format'
import { useGame } from '../store/game'
import { Logo } from './Logo'

export function TechModal() {
  // во время exit-анимации techId уже сброшен — держим последний
  const live = useGame((s) => s.techId)
  const last = useRef(live)
  if (live) last.current = live
  const id = last.current!

  const closeTech = useGame((s) => s.closeTech)
  const addBlock = useGame((s) => s.addBlock)
  const readOnly = useGame((s) => s.phase === 'running' || s.stash !== null)

  const b = BLOCK_MAP[id]
  const t = TECH[id]
  const meta = CATEGORY_META[b.category]
  const isFiles = !Number.isFinite(b.capacityRps)

  const add = () => {
    addBlock(id, 320 + Math.random() * 120, 20 + Math.random() * 260)
    closeTech()
  }

  return (
    // на выходе backdrop сразу пропускает клики и быстро гаснет — палитра доступна без задержки
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: 'none', transition: { duration: 0.15 } }}
      onClick={closeTech}
    >
      <motion.div
        className="modal tech-modal"
        style={{ '--c': meta.color } as CSSProperties}
        initial={{ y: 16, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 8, opacity: 0, transition: { duration: 0.12 } }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tech-head">
          <div className="tech-logo">
            <Logo id={id} size={36} />
          </div>
          <div>
            <div className="label">
              {meta.label} · {b.stack}
            </div>
            <h2>{b.label}</h2>
          </div>
        </div>

        <p className="tech-about">{t?.about ?? b.description}</p>

        {isFiles && (
          <p className="tech-note">
            Это статические файлы: сами запросы они не принимают. Отдаёт их веб-сервер (Nginx) или CDN — у них и считается нагрузка.
          </p>
        )}

        <div className="tech-specs">
          <div className="stat">
            <div className="v">{isFiles ? '—' : fmtRps(b.capacityRps)}</div>
            <div className="k">{isFiles ? 'rps — у сервера' : 'rps / инстанс'}</div>
          </div>
          <div className="stat">
            <div className="v">{b.baseLatencyMs} мс</div>
            <div className="k">латентность</div>
          </div>
          <div className="stat">
            <div className="v">{b.servers}</div>
            <div className="k">{b.servers ? 'сервер на инстанс' : isFiles ? 'серверов: просто файлы' : 'серверов: внешний сервис'}</div>
          </div>
          <div className="stat">
            <div className="v">{isFiles ? '—' : b.maxReplicas === 1 ? '×1' : `до ×${b.maxReplicas}`}</div>
            <div className="k">{isFiles ? 'реплики не нужны' : b.maxReplicas === 1 ? 'один инстанс' : 'реплик'}</div>
          </div>
        </div>

        {t && (
          <div className="tech-cols">
            <div className="tech-col pros">
              <div className="label">Плюсы</div>
              <ul>
                {t.pros.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="tech-col cons">
              <div className="label">Минусы</div>
              <ul>
                {t.cons.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={closeTech}>Закрыть</button>
          <button className="btn-launch" onClick={add} disabled={readOnly} title={readOnly ? 'Сейчас схему менять нельзя' : undefined}>
            НА СХЕМУ
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
