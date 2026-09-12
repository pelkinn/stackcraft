import { Handle, Position, type NodeProps } from '@xyflow/react'
import { memo, type CSSProperties } from 'react'
import { BLOCK_MAP, CATEGORY_META, USERS_ID } from '../data/blocks'
import { LEVEL_MAP } from '../data/levels'
import { fmtRps, fmtServers, utilColor } from '../format'
import { useGame, type BlockRFNode } from '../store/game'
import { Logo } from './Logo'

export const BlockNode = memo(function BlockNode({ id, data, selected }: NodeProps<BlockRFNode>) {
  const b = BLOCK_MAP[data.blockId]
  const stat = useGame((s) => (s.phase === 'build' ? undefined : s.result?.sim.nodes[id]))
  const traffic = useGame((s) => LEVEL_MAP[s.levelId].traffic)
  const isUsers = b.id === USERS_ID
  const isFiles = !isUsers && !Number.isFinite(b.capacityRps)
  const color = CATEGORY_META[b.category].color

  const util = stat && Number.isFinite(stat.capacity) && stat.load > 0 ? stat.util : null
  const hot = util !== null && util > 1
  const cls = ['block-node', selected && 'selected', isUsers && 'users', hot && 'hot'].filter(Boolean).join(' ')

  return (
    <div className={cls} style={{ '--c': color, '--u': util === null ? color : utilColor(util) } as CSSProperties}>
      <span className="corner-b" />
      {!isUsers && <Handle type="target" position={Position.Left} className="bn-handle" />}

      <div className="bn-row">
        <div className="bn-logo">
          <Logo id={b.id} />
        </div>
        <div className="bn-text">
          <div className="bn-stack">{b.stack}</div>
          <div className="bn-label">{b.label}</div>
        </div>
      </div>

      <div className="bn-meta">
        {isUsers ? (
          <span>
            {fmtRps(traffic.rps * (traffic.spike ?? 1))} rps{traffic.spike ? ` (×${traffic.spike})` : ''}
          </span>
        ) : isFiles ? (
          <span>статические файлы</span>
        ) : (
          <>
            <span>{b.servers ? fmtServers(b.servers * data.replicas) : 'внешний сервис'}</span>
            <span className="bn-reps">
              ×{data.replicas}
              {Array.from({ length: Math.min(data.replicas, 8) }, (_, i) => (
                <i key={i} className="pip" />
              ))}
            </span>
          </>
        )}
      </div>

      {util !== null && (
        <>
          <div className="bn-badge">{Math.round(util * 100)}%</div>
          <div className="bn-util">
            <i style={{ width: `${Math.min(util, 1) * 100}%` }} />
          </div>
        </>
      )}

      <Handle type="source" position={Position.Right} className="bn-handle" />
    </div>
  )
})
