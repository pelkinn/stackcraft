import { BLOCK_MAP, USERS_ID } from '../data/blocks'
import type { BlockDef, Category, GNode, Graph, Tag } from '../types'

export type Pred = (b: BlockDef, n: GNode) => boolean

export const blockOf = (n: GNode) => BLOCK_MAP[n.blockId]

export const isCat = (c: Category): Pred => (b) => b.category === c
export const hasTag = (t: Tag): Pred => (b) => b.tags.includes(t)
export const isUsers: Pred = (b) => b.id === USERS_ID
export const and = (...ps: Pred[]): Pred => (b, n) => ps.every((p) => p(b, n))
export const not = (p: Pred): Pred => (b, n) => !p(b, n)
export const minReplicas = (k: number): Pred => (_b, n) => n.replicas >= k

export function nodesWhere(g: Graph, p: Pred): GNode[] {
  return g.nodes.filter((n) => p(blockOf(n), n))
}

export function has(g: Graph, p: Pred): boolean {
  return nodesWhere(g, p).length > 0
}

export function children(g: Graph, id: string): GNode[] {
  return g.edges.filter((e) => e.source === id).map((e) => g.nodes.find((n) => n.id === e.target)!).filter(Boolean)
}

export function parents(g: Graph, id: string): GNode[] {
  return g.edges.filter((e) => e.target === id).map((e) => g.nodes.find((n) => n.id === e.source)!).filter(Boolean)
}

/** есть прямое ребро из узла, подходящего под from, в узел, подходящий под to */
export function linked(g: Graph, from: Pred, to: Pred): boolean {
  return nodesWhere(g, from).some((n) => children(g, n.id).some((c) => to(blockOf(c), c)))
}

/** есть путь (любой длины) из from в to */
export function reaches(g: Graph, from: Pred, to: Pred): boolean {
  const start = nodesWhere(g, from)
  const seen = new Set<string>()
  const stack = start.flatMap((n) => children(g, n.id))
  while (stack.length) {
    const n = stack.pop()!
    if (seen.has(n.id)) continue
    seen.add(n.id)
    if (to(blockOf(n), n)) return true
    stack.push(...children(g, n.id))
  }
  return false
}
