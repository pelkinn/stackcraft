export type Category =
  | 'client'
  | 'frontend'
  | 'backend'
  | 'db'
  | 'cache'
  | 'queue'
  | 'storage'
  | 'search'
  | 'infra'
  | 'external'

export type Tag =
  | 'ssr'
  | 'spa'
  | 'static'
  | 'websocket'
  | 'pubsub'
  | 'worker'
  | 'replica'
  | 'lb'
  | 'webserver'
  | 'cdn'
  | 'gateway'
  | 'olap'
  | 'stream'
  | 'payments'
  | 'notify'

export interface BlockDef {
  id: string
  category: Category
  stack: string
  label: string
  description: string
  /** сколько своих серверов занимает один инстанс: 0 — файлы, CDN, внешний или managed-сервис */
  servers: number
  /** сколько rps держит один инстанс */
  capacityRps: number
  baseLatencyMs: number
  tags: Tag[]
  maxReplicas: number
  /** для кешей и CDN — доля запросов, которые не идут дальше */
  hitRatio?: number
}

export interface GNode {
  id: string
  blockId: string
  replicas: number
  x: number
  y: number
}

export interface GEdge {
  id: string
  source: string
  target: string
}

export interface Graph {
  nodes: GNode[]
  edges: GEdge[]
}

export interface Traffic {
  rps: number
  /** доля чтений среди динамических запросов */
  readRatio: number
  /** доля статики (картинки, js, css) */
  staticShare: number
  /** множитель пика, например 10 для Чёрной пятницы */
  spike?: number
}

export interface Requirement {
  id: string
  /** цель глазами бизнеса — не должна называть решение */
  text: string
  /** что было не так — показывается только после провала */
  explain: string
  check: (g: Graph) => boolean
}

export interface LevelDef {
  id: number
  title: string
  subtitle: string
  brief: string
  traffic: Traffic
  budget: number
  p95Ms: number
  /** compute — роняем stateless-узлы, full — ещё и БД с кешем */
  fault: 'none' | 'compute' | 'full'
  /** выживание при падениях — обязательная цель, а не звезда */
  faultRequired?: boolean
  requirements: Requirement[]
  reference: Graph
}
