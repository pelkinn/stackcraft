import { ReactFlowProvider } from '@xyflow/react'
import { AnimatePresence, motion } from 'framer-motion'
import { CampaignMap } from './screens/CampaignMap'
import { LevelScreen } from './screens/LevelScreen'
import { useGame } from './store/game'

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 } }

export default function App() {
  const screen = useGame((s) => s.screen)
  const levelId = useGame((s) => s.levelId)

  return (
    <>
      <AnimatePresence mode="wait">
        {screen === 'map' ? (
          <motion.div key="map" {...fade}>
            <CampaignMap />
          </motion.div>
        ) : (
          <motion.div key={`level-${levelId}`} {...fade}>
            <ReactFlowProvider>
              <LevelScreen />
            </ReactFlowProvider>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="fx-overlay" />
    </>
  )
}
