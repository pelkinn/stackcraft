import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { BriefPanel } from '../components/BriefPanel'
import { Canvas } from '../components/Canvas'
import { Palette } from '../components/Palette'
import { ResultModal } from '../components/ResultModal'
import { RUN_MS, SimHud } from '../components/SimHud'
import { TechModal } from '../components/TechModal'
import { LEVEL_MAP, LEVELS } from '../data/levels'
import { useGame } from '../store/game'

export function LevelScreen() {
  const levelId = useGame((s) => s.levelId)
  const phase = useGame((s) => s.phase)
  const toast = useGame((s) => s.toast)
  const canUndo = useGame((s) => s.history.length > 0)
  const muted = useGame((s) => s.muted)
  const viewingRef = useGame((s) => s.stash !== null)
  const techOpen = useGame((s) => s.techId !== null)
  const { finishRun, undo, goMap, toggleMute, restoreOwn } = useGame.getState()
  const level = LEVEL_MAP[levelId]

  useEffect(() => {
    if (phase !== 'running') return
    const t = setTimeout(finishRun, RUN_MS)
    return () => clearTimeout(t)
  }, [phase, finishRun])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const s = useGame.getState()
      if (s.techId) {
        if (e.key === 'Escape') s.closeTech()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        s.undo()
      } else if (e.code === 'Space' && (s.phase === 'build' || s.phase === 'review')) {
        e.preventDefault()
        s.launch()
      } else if (e.key === 'Escape' && s.phase === 'result') {
        s.closeResult()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="level">
      <header className="topbar">
        <button className="btn btn-ghost" onClick={goMap}>← Карта</button>
        <span className="label">Уровень {level.id}/{LEVELS.length}</span>
        <span className="title">{level.title}</span>
        <span style={{ color: 'var(--muted)' }}>{level.subtitle}</span>
        <div className="spacer" />
        <button className="btn" onClick={undo} disabled={!canUndo || viewingRef}>
          Отменить <kbd>Ctrl+Z</kbd>
        </button>
        <button className="btn" onClick={toggleMute}>{muted ? 'Звук: выкл' : 'Звук: вкл'}</button>
      </header>

      <Palette />

      <div className="canvas-wrap">
        <div className="canvas-title">
          <div className="label">Схема · {level.subtitle}</div>
          <div className="big">{level.title.toUpperCase()}</div>
        </div>
        <Canvas />
        {viewingRef && (
          <div className="ref-banner">
            <span>
              <b>Эталон</b> · только просмотр, можно запустить
            </span>
            <button className="btn" onClick={restoreOwn}>← Вернуть моё решение</button>
          </div>
        )}
        <SimHud />
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              className={`toast ${toast.kind}`}
              initial={{ opacity: 0, y: -10, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -10, x: '-50%' }}
            >
              {toast.kind === 'error' && <b>Нельзя.</b>}
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BriefPanel />

      <AnimatePresence>{phase === 'result' && <ResultModal />}</AnimatePresence>
      <AnimatePresence>{techOpen && <TechModal />}</AnimatePresence>
    </div>
  )
}
