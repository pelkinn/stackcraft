import { BLOCK_MAP, USERS_ID } from '../data/blocks'
import type { BlockDef, GNode, Graph, Traffic } from '../types'

/** s — статика, r — чтения, w — записи (все в rps) */
export interface Flow {
  s: number
  r: number
  w: number
}

export interface NodeStat {
  load: number
  capacity: number
  util: number
  latency: number
  dropped: number
  /** запросы, которым некуда было идти дальше */
  unrouted: number
}

export interface SimResult {
  rps: number
  nodes: Record<string, NodeStat>
  edges: Record<string, number>
  errorRate: number
  p95: number
  /** сколько своих серверов занимает схема */
  servers: number
  slowPath: string[]
  dbLoad: number
}

const CDN_HIT = 0.95
const SEARCH_SHARE = 0.4
const WORKER_BATCH = 5

const zero = (): Flow => ({ s: 0, r: 0, w: 0 })
const sum = (f: Flow) => f.s + f.r + f.w

const acceptsStatic = (b: BlockDef) => b.category === 'frontend' || b.category === 'storage' || b.category === 'infra'
const acceptsDynamic = (b: BlockDef) => b.category === 'frontend' || b.category === 'backend' || b.category === 'infra'

export function simulate(g: Graph, t: Traffic): SimResult {
  const rps = t.rps * (t.spike ?? 1)
  const byId = new Map(g.nodes.map((n) => [n.id, n]))
  const out = new Map<string, { edgeId: string; node: GNode }[]>()
  for (const n of g.nodes) out.set(n.id, [])
  for (const e of g.edges) {
    const target = byId.get(e.target)
    if (target && out.has(e.source)) out.get(e.source)!.push({ edgeId: e.id, node: target })
  }

  const servers = g.nodes.reduce((acc, n) => acc + BLOCK_MAP[n.blockId].servers * n.replicas, 0)
  const users = g.nodes.find((n) => n.blockId === USERS_ID)
  const result: SimResult = { rps, nodes: {}, edges: {}, errorRate: 1, p95: 0, servers, slowPath: [], dbLoad: 0 }
  if (!users) return result

  const order = topoOrder(users.id, out)
  const inbox = new Map<string, Flow>()
  const done = new Set<string>()
  const dyn = rps * (1 - t.staticShare)
  inbox.set(users.id, { s: rps * t.staticShare, r: dyn * t.readRatio, w: dyn * (1 - t.readRatio) })
  let dropped = 0

  const send = (targets: { edgeId: string; node: GNode }[], f: Flow) => {
    if (!targets.length || sum(f) <= 0) return
    const k = 1 / targets.length
    for (const { edgeId, node } of targets) {
      if (done.has(node.id)) continue // обратное ребро цикла — поток теряется
      const box = inbox.get(node.id) ?? zero()
      box.s += f.s * k
      box.r += f.r * k
      box.w += f.w * k
      inbox.set(node.id, box)
      result.edges[edgeId] = (result.edges[edgeId] ?? 0) + sum(f) * k
    }
  }

  for (const id of order) {
    const n = byId.get(id)!
    const b = BLOCK_MAP[n.blockId]
    const f = inbox.get(id) ?? zero()
    const kids = out.get(id)!
    const cap = b.capacityRps * n.replicas

    // что из входящего реально нагружает узел
    const ssr = b.tags.includes('ssr')
    const counted: Flow =
      b.category === 'frontend' ? { s: f.s, r: ssr ? f.r : 0, w: 0 }
      : b.category === 'cache' ? { s: 0, r: f.r, w: 0 }
      : b.category === 'client' ? zero()
      : f
    const load = sum(counted)
    const served = load > cap ? cap / load : 1
    const drop = load - load * served
    dropped += drop
    // пропускаем дальше только обслуженную часть
    const pass: Flow = {
      s: f.s - counted.s * (1 - served),
      r: f.r - counted.r * (1 - served),
      w: f.w - counted.w * (1 - served),
    }

    let unrouted = 0
    const route = (targets: typeof kids, part: Flow, errIfNone: boolean) => {
      if (sum(part) <= 0) return
      if (!targets.length) {
        if (errIfNone) unrouted += sum(part)
        return
      }
      send(targets, part)
    }
    const kidsBy = (p: (kb: BlockDef) => boolean) => kids.filter((k) => p(BLOCK_MAP[k.node.blockId]))

    switch (b.category) {
      case 'client':
      case 'infra': {
        const isCdn = b.tags.includes('cdn')
        const s = isCdn ? pass.s * (1 - CDN_HIT) : pass.s
        route(kidsBy(acceptsStatic), { s, r: 0, w: 0 }, true)
        route(kidsBy(acceptsDynamic), { s: 0, r: pass.r, w: pass.w }, true)
        break
      }
      case 'frontend':
        route(kidsBy((kb) => kb.category === 'backend' || kb.category === 'infra'), { s: 0, r: pass.r, w: pass.w }, true)
        break
      case 'backend':
        routeBackend(b, pass, kidsBy, route)
        break
      case 'db': {
        const replicas = kidsBy((kb) => kb.tags.includes('replica'))
        if (replicas.length) route(replicas, { s: 0, r: (pass.r * replicas.length) / (replicas.length + 1), w: 0 }, false)
        break
      }
      case 'queue':
        // каждый потребитель получает все сообщения (consumer groups)
        if (!kids.length) unrouted += sum(pass)
        for (const k of kids) send([k], { s: 0, r: 0, w: sum(pass) })
        break
      default:
        break // cache, storage, search, external — поглощают
    }

    dropped += unrouted
    const util = cap === Infinity ? 0 : load / cap
    const latency = load <= 0 ? b.baseLatencyMs : util >= 1 ? b.baseLatencyMs * 20 : b.baseLatencyMs / (1 - Math.min(util, 0.95))
    result.nodes[id] = { load, capacity: cap, util, latency, dropped: drop, unrouted }
    if (b.category === 'db') result.dbLoad += load
    done.add(id)
  }

  result.errorRate = rps > 0 ? Math.min(1, dropped / rps) : 0
  const { total, path } = slowest(users.id, out, result, new Set())
  result.p95 = total
  result.slowPath = path
  return result
}

function routeBackend(
  b: BlockDef,
  f: Flow,
  kidsBy: (p: (kb: BlockDef) => boolean) => { edgeId: string; node: GNode }[],
  route: (t: { edgeId: string; node: GNode }[], part: Flow, errIfNone: boolean) => void,
) {
  const isWorker = b.tags.includes('worker')
  const cache = kidsBy((k) => k.category === 'cache')
  const db = kidsBy((k) => k.category === 'db')
  const queue = kidsBy((k) => k.category === 'queue')
  const search = kidsBy((k) => k.category === 'search')
  const storage = kidsBy((k) => k.category === 'storage')
  const external = kidsBy((k) => k.category === 'external')
  const downstream = kidsBy((k) => k.category === 'backend' || k.category === 'infra')

  // статика, случайно дошедшая до бэка, обслуживается как чтение
  const reads = f.r + f.s
  const writes = f.w

  if (downstream.length) route(downstream, { s: 0, r: reads, w: writes }, false)

  let rRest = reads
  if (search.length && !isWorker) {
    route(search, { s: 0, r: reads * SEARCH_SHARE, w: 0 }, false)
    rRest = reads * (1 - SEARCH_SHARE)
  }
  let miss = rRest
  if (cache.length) {
    route(cache, { s: 0, r: rRest, w: 0 }, false)
    const hit = cache.reduce((a, k) => a + (BLOCK_MAP[k.node.blockId].hitRatio ?? 0.8), 0) / cache.length
    miss = rRest * (1 - hit)
  }

  if (isWorker) {
    route(db, { s: 0, r: miss, w: writes / WORKER_BATCH }, false)
    route(search, { s: 0, r: 0, w: writes }, false)
    route(storage, { s: 0, r: 0, w: writes }, false)
    route(external, { s: 0, r: 0, w: writes }, false)
    return
  }

  if (queue.length) {
    route(queue, { s: 0, r: 0, w: writes }, false)
    route(db, { s: 0, r: miss, w: 0 }, false)
  } else {
    route(db, { s: 0, r: miss, w: writes }, false)
    route(storage, { s: 0, r: 0, w: writes }, false)
  }
  route(external, { s: 0, r: 0, w: writes }, false)
}

function topoOrder(start: string, out: Map<string, { node: GNode }[]>): string[] {
  const reach = new Set<string>([start])
  const stack = [start]
  while (stack.length) {
    const id = stack.pop()!
    for (const { node } of out.get(id) ?? []) if (!reach.has(node.id)) { reach.add(node.id); stack.push(node.id) }
  }
  const indeg = new Map<string, number>([...reach].map((id) => [id, 0]))
  for (const id of reach) for (const { node } of out.get(id) ?? []) indeg.set(node.id, indeg.get(node.id)! + 1)

  const order: string[] = []
  const ready = [start]
  indeg.set(start, 0)
  const left = new Set(reach)
  while (left.size) {
    if (!ready.length) {
      // цикл: берём узел с минимальной входящей степенью
      const next = [...left].sort((a, b) => indeg.get(a)! - indeg.get(b)!)[0]
      ready.push(next)
    }
    const id = ready.shift()!
    if (!left.has(id)) continue
    left.delete(id)
    order.push(id)
    for (const { node } of out.get(id) ?? []) {
      if (!left.has(node.id)) continue
      indeg.set(node.id, indeg.get(node.id)! - 1)
      if (indeg.get(node.id) === 0) ready.push(node.id)
    }
  }
  return order
}

/** самый медленный синхронный путь; очередь — граница асинхронности */
function slowest(
  id: string,
  out: Map<string, { edgeId: string; node: GNode }[]>,
  r: SimResult,
  onPath: Set<string>,
): { total: number; path: string[] } {
  const stat = r.nodes[id]
  if (!stat) return { total: 0, path: [] }
  onPath.add(id)
  let best = { total: 0, path: [] as string[] }
  for (const { edgeId, node: kid } of out.get(id) ?? []) {
    if (onPath.has(kid.id) || !(r.edges[edgeId] > 0)) continue
    if (BLOCK_MAP[kid.blockId].category === 'queue') {
      const q = r.nodes[kid.id]
      if (q && q.latency > best.total) best = { total: q.latency, path: [kid.id] }
      continue
    }
    const sub = slowest(kid.id, out, r, onPath)
    if (sub.total > best.total) best = sub
  }
  onPath.delete(id)
  return { total: stat.latency + best.total, path: [id, ...best.path] }
}

// ---------- fault injection ----------

const COMPUTE = new Set(['frontend', 'backend', 'queue'])

export function faultCandidates(g: Graph, mode: 'compute' | 'full'): GNode[] {
  return g.nodes.filter((n) => {
    const b = BLOCK_MAP[n.blockId]
    if (b.category === 'infra') return !b.tags.includes('cdn')
    // файлы не падают — падает сервер, который их отдаёт
    if (b.category === 'frontend' && !b.tags.includes('ssr')) return false
    if (COMPUTE.has(b.category)) return true
    return mode === 'full' && (b.category === 'db' || b.category === 'cache')
  })
}

/** роняем один инстанс: реплик меньше на одну, или узел целиком (для БД с репликой — failover) */
export function injectFault(g: Graph, nodeId: string): Graph {
  const n = g.nodes.find((x) => x.id === nodeId)
  if (!n) return g
  if (n.replicas > 1) {
    return { nodes: g.nodes.map((x) => (x.id === nodeId ? { ...x, replicas: x.replicas - 1 } : x)), edges: g.edges }
  }
  const edges = g.edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
  const b = BLOCK_MAP[n.blockId]
  if (b.category === 'db') {
    const promoted = g.edges
      .filter((e) => e.source === nodeId)
      .map((e) => g.nodes.find((x) => x.id === e.target)!)
      .find((x) => x && BLOCK_MAP[x.blockId].tags.includes('replica'))
    if (promoted) {
      for (const e of g.edges.filter((e) => e.target === nodeId)) {
        edges.push({ id: `${e.id}-failover`, source: e.source, target: promoted.id })
      }
    }
  }
  return { nodes: g.nodes.filter((x) => x.id !== nodeId), edges }
}

export interface FaultReport {
  survived: boolean
  spofs: { nodeId: string; label: string; errorRate: number }[]
}

export function runFaults(g: Graph, t: Traffic, mode: 'compute' | 'full', base: SimResult): FaultReport {
  const spofs: FaultReport['spofs'] = []
  for (const n of faultCandidates(g, mode)) {
    const sim = simulate(injectFault(g, n.id), t)
    const lostData = base.dbLoad > 0 && sim.dbLoad === 0
    if (sim.errorRate > 0.05 || lostData) {
      spofs.push({ nodeId: n.id, label: BLOCK_MAP[n.blockId].label, errorRate: lostData ? 1 : sim.errorRate })
    }
  }
  return { survived: spofs.length === 0, spofs }
}
