import { describe, expect, it } from 'vitest'
import { BLOCK_MAP, BLOCKS } from '../data/blocks'
import { LOGOS } from '../data/logos'
import { TECH } from '../data/tech'
import { LEVEL_MAP, LEVELS, startGraph } from '../data/levels'
import type { Graph } from '../types'
import { evaluate } from './evaluate'
import { canConnect } from './rules'
import { simulate } from './simulate'

describe('эталонные решения', () => {
  for (const level of LEVELS) {
    it(`уровень ${level.id} «${level.title}» — 3★`, () => {
      const g = level.reference
      for (const e of g.edges) {
        const s = g.nodes.find((n) => n.id === e.source)!
        const t = g.nodes.find((n) => n.id === e.target)!
        expect(canConnect(BLOCK_MAP[s.blockId], BLOCK_MAP[t.blockId]).ok, `${e.source}→${e.target}`).toBe(true)
      }
      for (const n of g.nodes) {
        const b = BLOCK_MAP[n.blockId]
        expect(n.replicas).toBeLessThanOrEqual(b.maxReplicas)
      }
      const r = evaluate(level, g)
      const failed = r.checks.filter((c) => !c.ok).map((c) => c.text)
      expect(failed).toEqual([])
      expect(r.tips, `servers ${r.sim.servers}/${level.budget}, p95 ${Math.round(r.sim.p95)}/${level.p95Ms}`).toEqual([])
      expect(r.stars).toBe(3)
    })

    it(`уровень ${level.id}: пустая доска не проходит`, () => {
      expect(evaluate(level, startGraph()).passed).toBe(false)
    })
  }
})

describe('цели уровней', () => {
  // цель описывает, чего хочет бизнес, а не какой блок поставить
  const SPOILERS = [
    'cdn', 'кеш', 'кэш', 'очеред', 'реплик', 'балансир', 'ssr', 'websocket', 'pub/sub', 'воркер', 'kafka', 'clickhouse',
    'elasticsearch', 's3', 'gateway', 'бэкенд', 'фронтенд', ' бд', 'база данных',
    ...BLOCKS.flatMap((b) => [b.label, b.stack]).map((s) => s.toLowerCase()).filter((s) => s.length > 3),
  ]
  for (const level of LEVELS) {
    it(`уровень ${level.id}: цели не подсказывают решение`, () => {
      const leaks = level.requirements.flatMap((r) => SPOILERS.filter((w) => r.text.toLowerCase().includes(w)).map((w) => `${r.id}: «${w}»`))
      expect(leaks).toEqual([])
    })
    it(`уровень ${level.id}: у каждой цели есть объяснение`, () => {
      expect(level.requirements.filter((r) => !r.explain.trim()).map((r) => r.id)).toEqual([])
    })
  }
})

describe('баланс: выбор стека решает', () => {
  const l3 = LEVEL_MAP[3]
  // Чёрная пятница: CDN → SPA → Nginx → бэк ×n → Redis + PostgreSQL
  const shop = (be: string, n: number): Graph => ({
    nodes: [
      { id: 'u', blockId: 'users', replicas: 1, x: 0, y: 0 },
      { id: 'cdn', blockId: 'inf-cdn', replicas: 1, x: 0, y: 0 },
      { id: 'fe', blockId: 'fe-react', replicas: 1, x: 0, y: 0 },
      { id: 'lb', blockId: 'inf-lb', replicas: 1, x: 0, y: 0 },
      { id: 'be', blockId: be, replicas: n, x: 0, y: 0 },
      { id: 'c', blockId: 'cache-redis', replicas: 1, x: 0, y: 0 },
      { id: 'db', blockId: 'db-pg', replicas: 1, x: 0, y: 0 },
    ],
    edges: [['u', 'cdn'], ['cdn', 'fe'], ['fe', 'lb'], ['lb', 'be'], ['be', 'c'], ['be', 'db']].map(([s, t]) => ({ id: `${s}-${t}`, source: s, target: t })),
  })

  it('Go укладывается в 5 серверов на 3★', () => {
    const r = evaluate(l3, shop('be-go', 2))
    expect(r.sim.servers).toBe(5)
    expect(r.stars).toBe(3)
  })
  it('Laravel ×6 не держит p95 — нужна седьмая реплика', () => {
    expect(evaluate(l3, shop('be-php', 6)).stars).toBeLessThan(2)
  })
  it('Laravel ×7 проходит, но съедает весь лимит', () => {
    const r = evaluate(l3, shop('be-php', 7))
    expect(r.sim.servers).toBe(l3.budget)
    expect(r.stars).toBeGreaterThanOrEqual(2)
  })
})

describe('каталог', () => {
  it('у каждого блока есть логотип', () => {
    expect(BLOCKS.filter((b) => !LOGOS[b.id]).map((b) => b.id)).toEqual([])
  })
  it('у каждой технологии есть описание, плюсы и минусы', () => {
    const bad = BLOCKS.filter((b) => b.id !== 'users')
      .filter((b) => {
        const t = TECH[b.id]
        return !t || !t.about.trim() || t.pros.length < 2 || t.cons.length < 2
      })
      .map((b) => b.id)
    expect(bad).toEqual([])
  })
  it('в справочнике нет лишних технологий', () => {
    expect(Object.keys(TECH).filter((id) => !BLOCK_MAP[id])).toEqual([])
  })
  it('id блоков уникальны', () => {
    expect(new Set(BLOCKS.map((b) => b.id)).size).toBe(BLOCKS.length)
  })
})

describe('правила связей', () => {
  it('фронт не ходит в БД', () => {
    const v = canConnect(BLOCK_MAP['fe-react'], BLOCK_MAP['db-pg'])
    expect(v.ok).toBe(false)
  })
  it('SPA и статику отдаёт сервер, а не они сами', () => {
    expect(canConnect(BLOCK_MAP.users, BLOCK_MAP['fe-react']).ok).toBe(false)
    expect(canConnect(BLOCK_MAP.users, BLOCK_MAP['fe-static']).ok).toBe(false)
    expect(canConnect(BLOCK_MAP['inf-lb'], BLOCK_MAP['fe-react']).ok).toBe(true)
    expect(canConnect(BLOCK_MAP['inf-cdn'], BLOCK_MAP['fe-vue']).ok).toBe(true)
    expect(canConnect(BLOCK_MAP['inf-traefik'], BLOCK_MAP['fe-vue']).ok).toBe(false)
    expect(canConnect(BLOCK_MAP['inf-traefik'], BLOCK_MAP['inf-lb']).ok).toBe(true)
    // SSR — сам сервер, к нему можно напрямую
    expect(canConnect(BLOCK_MAP.users, BLOCK_MAP['fe-next']).ok).toBe(true)
  })
  it('бэк ходит в БД', () => {
    expect(canConnect(BLOCK_MAP['be-php'], BLOCK_MAP['db-mysql']).ok).toBe(true)
  })
})

const traffic = { rps: 1000, readRatio: 1, staticShare: 0 }
const chain = (...ids: [string, string, number][]): Graph => ({
  nodes: [{ id: 'u', blockId: 'users', replicas: 1, x: 0, y: 0 }, ...ids.map(([id, blockId, replicas]) => ({ id, blockId, replicas, x: 0, y: 0 }))],
  edges: [],
})

describe('симуляция', () => {
  it('перегруженный узел отбрасывает излишек', () => {
    const g = chain(['fe', 'fe-react', 1], ['be', 'be-python', 1])
    g.edges = [{ id: 'a', source: 'u', target: 'fe' }, { id: 'b', source: 'fe', target: 'be' }]
    const r = simulate(g, traffic)
    expect(r.nodes.be.util).toBeCloseTo(4)
    expect(r.errorRate).toBeCloseTo(0.75)
  })

  it('кеш снимает чтения с БД', () => {
    const g = chain(['fe', 'fe-react', 1], ['be', 'be-go', 1], ['c', 'cache-redis', 1], ['db', 'db-pg', 1])
    g.edges = [
      { id: 'a', source: 'u', target: 'fe' }, { id: 'b', source: 'fe', target: 'be' },
      { id: 'c', source: 'be', target: 'c' }, { id: 'd', source: 'be', target: 'db' },
    ]
    const r = simulate(g, traffic)
    expect(r.nodes.db.load).toBeCloseTo(150)
  })

  it('очередь без потребителя теряет сообщения', () => {
    const g = chain(['fe', 'fe-react', 1], ['be', 'be-go', 1], ['q', 'q-rabbit', 1])
    g.edges = [{ id: 'a', source: 'u', target: 'fe' }, { id: 'b', source: 'fe', target: 'be' }, { id: 'c', source: 'be', target: 'q' }]
    const r = simulate(g, { rps: 1000, readRatio: 0, staticShare: 0 })
    expect(r.errorRate).toBeCloseTo(1)
  })
})
