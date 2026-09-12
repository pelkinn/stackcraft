import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow, useReactFlow } from '@xyflow/react'
import { useEffect, type DragEvent } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { BLOCK_MAP, CATEGORY_META } from '../data/blocks'
import { useGame, type BlockNodeData } from '../store/game'
import { BlockNode } from './BlockNode'
import { FlowEdge } from './FlowEdge'
import { DND_MIME } from './Palette'

const nodeTypes = { block: BlockNode }
const edgeTypes = { flow: FlowEdge }

export function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, connect, addBlock, select, locked } = useGame(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      onNodesChange: s.onNodesChange,
      onEdgesChange: s.onEdgesChange,
      connect: s.connect,
      addBlock: s.addBlock,
      select: s.select,
      // во время прогона и при просмотре эталона схема только для чтения
      locked: s.phase === 'running' || s.stash !== null,
    })),
  )
  const rf = useReactFlow()
  const viewingRef = useGame((s) => s.stash !== null)

  // эталон и своё решение раскладываются по-разному — подгоняем вид при переключении
  useEffect(() => {
    const raf = requestAnimationFrame(() => rf.fitView({ padding: 0.35, maxZoom: 1, duration: 350 }))
    return () => cancelAnimationFrame(raf)
  }, [viewingRef, rf])

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    const blockId = e.dataTransfer.getData(DND_MIME)
    if (!blockId || locked) return
    const p = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY })
    addBlock(blockId, p.x - 88, p.y - 32)
  }

  return (
    <>
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden>
        <defs>
          <marker id="sc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill="#4fd1ff" />
          </marker>
        </defs>
      </svg>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={connect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onPaneClick={() => select(null)}
        nodesDraggable={!locked}
        nodesConnectable={!locked}
        elementsSelectable={!locked}
        deleteKeyCode={locked ? null : ['Delete', 'Backspace']}
        fitView
        fitViewOptions={{ padding: 0.35, maxZoom: 1 }}
        minZoom={0.3}
        maxZoom={1.6}
        snapToGrid
        snapGrid={[12, 12]}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background id="fine" variant={BackgroundVariant.Lines} gap={24} color="rgba(79,209,255,0.06)" />
        <Background id="major" variant={BackgroundVariant.Lines} gap={120} color="rgba(79,209,255,0.13)" />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          pannable
          zoomable
          position="top-right"
          maskColor="rgba(5,12,24,0.7)"
          nodeColor={(n) => CATEGORY_META[BLOCK_MAP[(n.data as BlockNodeData).blockId].category].color}
        />
      </ReactFlow>
    </>
  )
}
