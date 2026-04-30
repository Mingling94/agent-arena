import { describe, expect, it } from 'vitest'
import { buildBattleReplayState } from './engine'
import { buildEvalModel } from './evalModel'
import type { BattleState } from './types'
import demoBattle from '../web/demoBattle.json'

const exportedDemo = demoBattle as BattleState
const events = [...exportedDemo.events].sort((a, b) => a.at - b.at)

describe('web demo replay export', () => {
  it('uses the shared reducer from first frame to final scorecard', () => {
    const opening = buildBattleReplayState(events, exportedDemo.label, 0)
    const midReplay = buildBattleReplayState(events, exportedDemo.label, Math.ceil(events.length / 2))
    const finalReplay = buildBattleReplayState(events, exportedDemo.label, events.length)
    const finalEval = buildEvalModel(finalReplay)

    expect(events.length).toBeGreaterThan(6)
    expect(opening.winner).toBeNull()
    expect(midReplay.events.length).toBeGreaterThan(0)
    expect(finalReplay.winner).toBe('codex')
    expect(finalEval.trustLabel).not.toBe('Pending')
    expect(finalReplay.deltas.some((delta) => delta.category === 'outcome')).toBe(true)
  })
})
