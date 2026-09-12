import { BLOCK_MAP } from '../data/blocks'
import type { BlockDef, Category, Graph } from '../types'

type Verdict = { ok: true } | { ok: false; reason: string }

const ALLOWED: Record<Category, Category[]> = {
  client: ['frontend', 'infra'],
  frontend: ['backend', 'infra', 'storage'],
  backend: ['backend', 'db', 'cache', 'queue', 'storage', 'search', 'external', 'infra'],
  db: ['db'],
  cache: [],
  queue: ['backend', 'search'],
  storage: [],
  search: [],
  infra: ['frontend', 'backend', 'storage', 'infra'],
  external: [],
}

const REASONS: Partial<Record<`${Category}>${Category}`, string>> = {
  'frontend>db': 'Фронт не ходит в БД напрямую: креды утекут в браузер, а валидация будет на клиенте.',
  'frontend>cache': 'Кеш живёт за бэкендом. Браузер не должен знать про Redis.',
  'frontend>queue': 'Публиковать в брокер из браузера — дыра в безопасности. Пусть это делает бэк.',
  'client>backend': 'Пользователь приходит на фронт или через CDN/балансировщик, а не прямо в сервис.',
  'client>db': 'Открывать БД в интернет — худшее, что можно сделать.',
  'db>backend': 'Стрелка показывает, кто кого вызывает. БД не вызывает бэк — наоборот.',
  'cache>db': 'Кеш не ходит в БД сам. Бэк читает кеш, при промахе идёт в БД (cache-aside).',
  'queue>db': 'Очередь не пишет в БД сама — нужен воркер-потребитель.',
  'external>backend': 'Вебхуки провайдера рисуем как вызов нашего бэка из бэка — для игры упростим.',
}

export function canConnect(from: BlockDef, to: BlockDef): Verdict {
  if (from.id === to.id && from.category === 'client') return { ok: false, reason: 'Петля на пользователях.' }
  if (to.category === 'client') return { ok: false, reason: 'Пользователи — только источник трафика.' }

  // SPA и статика — это файлы: запросы принимает сервер, который их отдаёт
  if (to.category === 'frontend' && !to.tags.includes('ssr')) {
    if (from.category === 'client')
      return { ok: false, reason: `${to.label} — это просто файлы, сами они запросы не принимают. Поставь перед ними сервер, который их отдаёт: Nginx или CDN.` }
    if (from.category === 'infra' && !from.tags.includes('cdn') && !from.tags.includes('webserver'))
      return { ok: false, reason: `${from.label} проксирует запросы, но не хранит файлы. Статику отдают Nginx или CDN.` }
  }
  if (ALLOWED[from.category].includes(to.category)) {
    if (from.category === 'db' && !to.tags.includes('replica'))
      return { ok: false, reason: 'БД может реплицироваться только в read-реплику.' }
    return { ok: true }
  }
  const key = `${from.category}>${to.category}` as const
  return {
    ok: false,
    reason: REASONS[key] ?? `${from.label} → ${to.label}: такая связь в реальной архитектуре не встречается.`,
  }
}

export function validateEdge(g: Graph, source: string, target: string): Verdict {
  if (source === target) return { ok: false, reason: 'Узел не может вызывать сам себя.' }
  if (g.edges.some((e) => e.source === source && e.target === target))
    return { ok: false, reason: 'Такая связь уже есть.' }
  const s = g.nodes.find((n) => n.id === source)
  const t = g.nodes.find((n) => n.id === target)
  if (!s || !t) return { ok: false, reason: 'Узел не найден.' }
  return canConnect(BLOCK_MAP[s.blockId], BLOCK_MAP[t.blockId])
}
