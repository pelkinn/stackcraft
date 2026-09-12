import { useState, type CSSProperties, type DragEvent } from 'react'
import type { BlockDef } from '../types'
import { BLOCKS, CATEGORY_META, PALETTE_ORDER } from '../data/blocks'
import { fmtRps } from '../format'
import { useGame } from '../store/game'
import { Logo } from './Logo'

export const DND_MIME = 'application/x-stackcraft-block'

export function Palette() {
  const openTech = useGame((s) => s.openTech)
  const readOnly = useGame((s) => s.phase === 'running' || s.stash !== null)

  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const match = (b: BlockDef) => !q || `${b.label} ${b.stack}`.toLowerCase().includes(q)

  const onDragStart = (e: DragEvent, blockId: string) => {
    e.dataTransfer.setData(DND_MIME, blockId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const groups = PALETTE_ORDER.map((cat) => ({ cat, items: BLOCKS.filter((b) => b.category === cat && match(b)) }))

  return (
    <aside className="panel palette">
      <div className="label" style={{ marginBottom: 10 }}>Клик — описание · тащи — на схему</div>
      <input
        className="palette-search"
        placeholder="Поиск: redis, go, kafka…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {groups.every((g) => !g.items.length) && <div className="palette-empty">Ничего не нашлось</div>}
      {groups.map(({ cat, items }) => {
        if (!items.length) return null
        return (
          <div key={cat} className="palette-group" style={{ '--cat': CATEGORY_META[cat].color } as CSSProperties}>
            <div className="label">{CATEGORY_META[cat].label}</div>
            {items.map((b) => (
              <button
                key={b.id}
                className={`palette-item${readOnly ? ' readonly' : ''}`}
                draggable={!readOnly}
                onDragStart={(e) => onDragStart(e, b.id)}
                onClick={() => openTech(b.id)}
                title="Клик — описание, перетащи — на схему"
              >
                <Logo id={b.id} size={20} />
                <span>
                  <div className="pi-name">{b.label}</div>
                  <div className="pi-meta">
                    {Number.isFinite(b.capacityRps) ? `${b.stack} · ${fmtRps(b.capacityRps)} rps${b.servers ? '' : ' · внешний'}` : `${b.stack} · файлы`}
                  </div>
                </span>
              </button>
            ))}
          </div>
        )
      })}
    </aside>
  )
}
