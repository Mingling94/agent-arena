import { describe, expect, it } from 'vitest'
import { buildBattleReplayState } from './engine'
import { buildEvalModel } from './evalModel'
import type { BattleEvent } from './types'

describe('buildEvalModel', () => {
  it('separates outcome, judge, activity, and penalty signals', () => {
    const events: BattleEvent[] = [
      { id: 'a1', type: 'tool_used', agent: 'codex', at: 1, label: 'tool used' },
      { id: 'a2', type: 'test_passed', agent: 'codex', at: 2, label: 'tests passed' },
      { id: 'a3', type: 'judge_verdict', agent: 'codex', at: 3, label: 'accepted', verdict: 'accepted' },
      { id: 'b1', type: 'test_failed', agent: 'claude', at: 4, label: 'tests failed' },
    ]
    const state = buildBattleReplayState(events, 'Matched Race', events.length)
    const model = buildEvalModel(state)

    expect(model.totals.activity.codex).toBe(10)
    expect(model.totals.outcome.codex).toBe(220)
    expect(model.totals.judge.codex).toBe(500)
    expect(model.totals.penalty.claude).toBe(-60)
    expect(model.trustLabel).toBe('Verified')
    expect(model.checks.find((check) => check.label === 'Penalty')?.claude).toBe(true)
  })

  it('keeps trust pending before a replay winner is available', () => {
    const events: BattleEvent[] = [
      { id: 'a1', type: 'tool_used', agent: 'codex', at: 1, label: 'tool used' },
    ]
    const state = buildBattleReplayState(events, 'Matched Race', 1, { finalizeWhen: 'never' })
    const model = buildEvalModel(state)

    expect(model.trustLabel).toBe('Pending')
    expect(model.trustVerdict).toContain('collecting evidence')
  })
})
