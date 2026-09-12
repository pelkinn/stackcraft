import { BLOCK_MAP } from '../data/blocks'
import type { Graph, LevelDef } from '../types'
import { runFaults, simulate, type FaultReport, type SimResult } from './simulate'

export const MAX_ERROR_RATE = 0.05

export const LOAD_TEXT = 'Выдерживает нагрузку: ошибок не больше 5%'
export const FAULT_TEXT = 'Работает, даже если упадёт любой узел'

export interface Check {
  id: string
  text: string
  explain?: string
  ok: boolean
}

export interface EvalResult {
  passed: boolean
  stars: 0 | 1 | 2 | 3
  checks: Check[]
  sim: SimResult
  fault: FaultReport | null
  tips: string[]
}

export function checkRequirements(level: LevelDef, g: Graph): Check[] {
  return level.requirements.map((r) => ({ id: r.id, text: r.text, explain: r.explain, ok: safe(() => r.check(g)) }))
}

function safe(fn: () => boolean) {
  try {
    return fn()
  } catch {
    return false
  }
}

export function evaluate(level: LevelDef, g: Graph): EvalResult {
  const sim = simulate(g, level.traffic)
  const checks = checkRequirements(level, g)
  checks.push({
    id: 'load',
    text: LOAD_TEXT,
    explain: `Потеряно ${Math.round(sim.errorRate * 100)}% запросов: где-то не хватает мощности или запросам некуда идти.`,
    ok: sim.errorRate <= MAX_ERROR_RATE,
  })
  const fault = level.fault === 'none' ? null : runFaults(g, level.traffic, level.fault, sim)
  if (level.faultRequired && fault) {
    checks.push({
      id: 'fault',
      text: FAULT_TEXT,
      explain: 'Мы гасили узлы по одному, и на некоторых система ложилась. Каждому узлу нужен дублёр.',
      ok: fault.survived,
    })
  }
  const passed = checks.every((c) => c.ok)

  const inBudget = sim.servers <= level.budget
  const fast = sim.p95 <= level.p95Ms
  const third = fault ? fault.survived : sim.errorRate <= 0.001

  let stars: EvalResult['stars'] = 0
  if (passed) stars = 1
  if (passed && inBudget && fast) stars = 2
  if (stars === 2 && third) stars = 3

  return { passed, stars, checks, sim, fault, tips: buildTips(level, g, sim, fault) }
}

function buildTips(level: LevelDef, g: Graph, sim: SimResult, fault: FaultReport | null): string[] {
  const tips: string[] = []
  const label = (id: string) => {
    const n = g.nodes.find((x) => x.id === id)
    return n ? BLOCK_MAP[n.blockId].label : id
  }

  for (const [id, st] of Object.entries(sim.nodes)) {
    if (st.util > 1) {
      tips.push(`${label(id)} перегружен (${Math.round(st.util * 100)}%): добавь реплики, кеш перед ним или стек побыстрее.`)
    }
    if (st.unrouted > 0) {
      const n = g.nodes.find((x) => x.id === id)!
      const cat = BLOCK_MAP[n.blockId].category
      const why =
        cat === 'queue' ? 'у очереди нет потребителя — сообщения копятся и теряются'
        : cat === 'frontend' ? 'фронту некуда отправить API-запросы — нужен бэкенд'
        : cat === 'client' ? 'пользователям некуда идти'
        : 'дальше по цепочке нет получателя'
      tips.push(`${label(id)}: ${why}.`)
    }
  }

  if (sim.servers > level.budget) {
    const top = [...g.nodes]
      .sort((a, b) => BLOCK_MAP[b.blockId].servers * b.replicas - BLOCK_MAP[a.blockId].servers * a.replicas)
      .slice(0, 2)
      .map((n) => BLOCK_MAP[n.blockId].label)
    tips.push(
      `Серверов ${sim.servers} при лимите ${level.budget}. Больше всего занимают: ${top.join(', ')}. Стек побыстрее или кеш справятся меньшим числом реплик.`,
    )
  }

  if (sim.p95 > level.p95Ms && sim.slowPath.length) {
    const worst = sim.slowPath.reduce((a, b) => (sim.nodes[b].latency > sim.nodes[a].latency ? b : a))
    tips.push(
      `p95 ${Math.round(sim.p95)} мс при лимите ${level.p95Ms}. Самое медленное звено — ${label(worst)} (${Math.round(sim.nodes[worst].latency)} мс).`,
    )
  }

  if (fault && !fault.survived) {
    tips.push(`Точки отказа: ${fault.spofs.map((s) => s.label).join(', ')}. Падение одного инстанса кладёт систему — нужны реплики.`)
  }

  return tips
}
