import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import { memo } from 'react'
import { BLOCK_MAP } from '../data/blocks'
import { fmtRps } from '../format'
import { useGame, type FlowRFEdge } from '../store/game'

export const FlowEdge = memo(function FlowEdge(props: EdgeProps<FlowRFEdge>) {
  const { id, source, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected } = props
  const [path, lx, ly] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  const flow = useGame((s) => (s.phase === 'build' ? null : (s.result?.sim.edges[id] ?? 0)))
  // после очереди — асинхронный поток, рисуем другим цветом и медленнее
  const isAsync = useGame((s) => {
    const n = s.nodes.find((x) => x.id === source)
    return n ? BLOCK_MAP[n.data.blockId].category === 'queue' : false
  })

  const live = flow !== null && flow > 0
  const count = live ? Math.max(1, Math.min(7, Math.round(1 + Math.log10(flow) * 1.4))) : 0
  const dur = isAsync ? 2.8 : 1.6
  const cls = ['flow-edge-base', selected && 'selected', flow === 0 && 'idle'].filter(Boolean).join(' ')

  return (
    <>
      {live && <path d={path} className="flow-edge-glow" />}
      <BaseEdge id={id} path={path} className={cls} markerEnd="url(#sc-arrow)" interactionWidth={18} />
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} r={2.6} className={`flow-particle${isAsync ? ' async' : ''}`}>
          <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={path} begin={`-${((i * dur) / count).toFixed(2)}s`} />
        </circle>
      ))}
      {live && (
        <EdgeLabelRenderer>
          <div className="edge-flow-label" style={{ transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)` }}>
            {fmtRps(flow)} rps
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
})
