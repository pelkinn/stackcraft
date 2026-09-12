import {
  applyEdgeChanges, applyNodeChanges, type Connection, type Edge, type EdgeChange, type Node, type NodeChange,
} from '@xyflow/react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { sfx, setMuted } from '../audio/sfx'
import { BLOCK_MAP, USERS_ID } from '../data/blocks'
import { LEVEL_MAP, startGraph } from '../data/levels'
import { evaluate, type EvalResult } from '../engine/evaluate'
import { validateEdge } from '../engine/rules'
import type { Graph } from '../types'

export type BlockNodeData = { blockId: string; replicas: number }
export type BlockRFNode = Node<BlockNodeData, 'block'>
export type FlowRFEdge = Edge<Record<string, never>, 'flow'>

export function toGraph(nodes: BlockRFNode[], edges: FlowRFEdge[]): Graph {
  return {
    nodes: nodes.map((n) => ({ id: n.id, blockId: n.data.blockId, replicas: n.data.replicas, x: n.position.x, y: n.position.y })),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
  }
}

function fromGraph(g: Graph): { nodes: BlockRFNode[]; edges: FlowRFEdge[] } {
  return {
    nodes: g.nodes.map((n) => ({
      id: n.id,
      type: 'block',
      position: { x: n.x, y: n.y },
      data: { blockId: n.blockId, replicas: n.replicas },
      deletable: n.blockId !== USERS_ID,
    })),
    edges: g.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: 'flow' })),
  }
}

/** review — отчёт закрыт, но метрики прогона ещё видны на схеме */
export type Phase = 'build' | 'running' | 'result' | 'review'

interface Toast {
  id: number
  text: string
  kind: 'error' | 'info'
}

interface GameState {
  screen: 'map' | 'level'
  levelId: number
  nodes: BlockRFNode[]
  edges: FlowRFEdge[]
  history: Graph[]
  selectedId: string | null
  phase: Phase
  result: EvalResult | null
  toast: Toast | null
  progress: Record<number, number>
  drafts: Record<number, Graph>
  muted: boolean
  /** своё решение, отложенное на время просмотра эталона; не null — эталон открыт только для чтения */
  stash: Graph | null
  /** открытая карточка технологии */
  techId: string | null

  openLevel: (id: number) => void
  goMap: () => void
  onNodesChange: (changes: NodeChange<BlockRFNode>[]) => void
  onEdgesChange: (changes: EdgeChange<FlowRFEdge>[]) => void
  connect: (c: Connection) => void
  addBlock: (blockId: string, x: number, y: number) => void
  setReplicas: (id: string, replicas: number) => void
  removeNode: (id: string) => void
  select: (id: string | null) => void
  undo: () => void
  clearBoard: () => void
  loadReference: () => void
  restoreOwn: () => void
  openTech: (id: string) => void
  closeTech: () => void
  launch: () => void
  finishRun: () => void
  closeResult: () => void
  openReport: () => void
  toggleMute: () => void
  showToast: (text: string, kind?: Toast['kind']) => void
}

let nodeSeq = 0
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(nodeSeq++).toString(36)}`

export const isUnlocked = (progress: Record<number, number>, id: number) => id === 1 || (progress[id - 1] ?? 0) > 0

export const useGame = create<GameState>()(
  persist(
    (set, get) => {
      /** снимок для undo + сброс результата: любое изменение схемы делает прогон неактуальным */
      const snapshot = () => {
        const { nodes, edges, history } = get()
        set({ history: [...history.slice(-49), toGraph(nodes, edges)], phase: 'build', result: null })
      }
      const saveDraft = () => {
        const { nodes, edges, levelId, drafts, stash } = get()
        if (stash) return // на экране эталон — черновик игрока не трогаем
        set({ drafts: { ...drafts, [levelId]: toGraph(nodes, edges) } })
      }

      return {
        screen: 'map',
        levelId: 1,
        nodes: [],
        edges: [],
        history: [],
        selectedId: null,
        phase: 'build',
        result: null,
        toast: null,
        progress: {},
        drafts: {},
        muted: false,
        stash: null,
        techId: null,

        openLevel: (id) => {
          const g = get().drafts[id] ?? startGraph()
          set({ screen: 'level', levelId: id, ...fromGraph(g), history: [], selectedId: null, phase: 'build', result: null, stash: null, techId: null })
          sfx.click()
        },

        goMap: () => {
          saveDraft()
          set({ screen: 'map', selectedId: null, phase: 'build', result: null, stash: null, techId: null })
          sfx.click()
        },

        onNodesChange: (changes) => {
          const safe = changes.filter((c) => !(c.type === 'remove' && get().nodes.find((n) => n.id === c.id)?.data.blockId === USERS_ID))
          if (safe.some((c) => c.type === 'remove')) {
            snapshot()
            sfx.remove()
          }
          set({ nodes: applyNodeChanges(safe, get().nodes) })
          const sel = safe.find((c) => c.type === 'select' && c.selected)
          if (sel && sel.type === 'select') set({ selectedId: sel.id })
          if (safe.some((c) => c.type === 'remove' || (c.type === 'position' && !c.dragging))) saveDraft()
        },

        onEdgesChange: (changes) => {
          if (changes.some((c) => c.type === 'remove')) {
            snapshot()
            sfx.remove()
          }
          set({ edges: applyEdgeChanges(changes, get().edges) })
          if (changes.some((c) => c.type === 'remove')) saveDraft()
        },

        connect: ({ source, target }) => {
          if (!source || !target || get().stash) return
          const verdict = validateEdge(toGraph(get().nodes, get().edges), source, target)
          if (!verdict.ok) {
            get().showToast(verdict.reason, 'error')
            sfx.error()
            return
          }
          snapshot()
          set({ edges: [...get().edges, { id: uid('e'), source, target, type: 'flow' }] })
          sfx.connect()
          saveDraft()
        },

        addBlock: (blockId, x, y) => {
          if (get().stash) return
          snapshot()
          const node: BlockRFNode = { id: uid('n'), type: 'block', position: { x, y }, data: { blockId, replicas: 1 } }
          set({ nodes: [...get().nodes, node], selectedId: node.id })
          sfx.place()
          saveDraft()
        },

        setReplicas: (id, replicas) => {
          const n = get().nodes.find((x) => x.id === id)
          if (!n || get().stash) return
          const max = BLOCK_MAP[n.data.blockId].maxReplicas
          const next = Math.max(1, Math.min(max, replicas))
          if (next === n.data.replicas) return
          snapshot()
          set({ nodes: get().nodes.map((x) => (x.id === id ? { ...x, data: { ...x.data, replicas: next } } : x)) })
          sfx.click()
          saveDraft()
        },

        removeNode: (id) => {
          const n = get().nodes.find((x) => x.id === id)
          if (!n || n.data.blockId === USERS_ID || get().stash) return
          snapshot()
          set({
            nodes: get().nodes.filter((x) => x.id !== id),
            edges: get().edges.filter((e) => e.source !== id && e.target !== id),
            selectedId: null,
          })
          sfx.remove()
          saveDraft()
        },

        select: (id) => set({ selectedId: id }),

        openTech: (id) => {
          set({ techId: id })
          sfx.click()
        },

        closeTech: () => set({ techId: null }),

        undo: () => {
          const { history, stash } = get()
          if (stash) return
          const prev = history[history.length - 1]
          if (!prev) return
          set({ ...fromGraph(prev), history: history.slice(0, -1), phase: 'build', result: null })
          sfx.click()
          saveDraft()
        },

        clearBoard: () => {
          if (get().stash) return
          snapshot()
          set({ ...fromGraph(startGraph()), selectedId: null })
          saveDraft()
        },

        loadReference: () => {
          const { nodes, edges, stash, levelId } = get()
          if (stash) return
          set({
            stash: toGraph(nodes, edges),
            ...fromGraph(LEVEL_MAP[levelId].reference),
            selectedId: null,
            phase: 'build',
            result: null,
          })
          sfx.click()
        },

        restoreOwn: () => {
          const { stash } = get()
          if (!stash) return
          set({ ...fromGraph(stash), stash: null, selectedId: null, phase: 'build', result: null })
          sfx.click()
        },

        launch: () => {
          if (get().phase === 'running') return
          const { nodes, edges, levelId } = get()
          const result = evaluate(LEVEL_MAP[levelId], toGraph(nodes, edges))
          set({ phase: 'running', result, selectedId: null })
          sfx.launch()
          if (result.sim.errorRate > 0.05) setTimeout(() => sfx.alarm(), 1800)
        },

        finishRun: () => {
          const { result, levelId, progress } = get()
          if (!result) return
          const best = Math.max(progress[levelId] ?? 0, result.stars)
          set({ phase: 'result', progress: { ...progress, [levelId]: best } })
          if (result.passed) sfx.success()
          else sfx.fail()
        },

        closeResult: () => set({ phase: 'review' }),

        openReport: () => {
          if (get().result) set({ phase: 'result' })
        },

        toggleMute: () => {
          const muted = !get().muted
          setMuted(muted)
          set({ muted })
        },

        showToast: (text, kind = 'info') => {
          const id = Date.now()
          set({ toast: { id, text, kind } })
          setTimeout(() => {
            if (get().toast?.id === id) set({ toast: null })
          }, 3800)
        },
      }
    },
    {
      name: 'stackcraft-v1',
      partialize: (s) => ({ progress: s.progress, drafts: s.drafts, muted: s.muted }),
      onRehydrateStorage: () => (s) => {
        if (s) setMuted(s.muted)
      },
    },
  ),
)
