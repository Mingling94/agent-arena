import { describe, expect, it } from 'vitest'
import { runBattle } from './engine'
import type { BattleEvent } from './types'

describe('runBattle', () => {
  it('rewards verified outcomes more than raw activity', () => {
    const events: BattleEvent[] = [
      { id: 'c1', type: 'tool_used', agent: 'claude', at: 1, label: 'read files' },
      { id: 'c2', type: 'tool_used', agent: 'claude', at: 2, label: 'searched repo' },
      { id: 'x1', type: 'test_passed', agent: 'codex', at: 3, label: 'unit tests passed' },
    ]

    const result = runBattle(events, 'Matched Race')

    expect(result.agents.codex.score).toBeGreaterThan(result.agents.claude.score)
    expect(result.highlights).toContain('Codex landed a major hit: unit tests passed')
  })

  it('lets custom judge verdicts override generic activity', () => {
    const result = runBattle(
      [
        { id: 'a1', type: 'tool_used', agent: 'claude', at: 1, label: 'many actions' },
        { id: 'a2', type: 'file_changed', agent: 'claude', at: 2, label: 'edited files' },
        {
          id: 'j1',
          type: 'judge_verdict',
          agent: 'codex',
          at: 3,
          label: 'maintainer accepted patch',
          verdict: 'accepted',
        },
      ],
      'Matched Race',
    )

    expect(result.agents.codex.score).toBeGreaterThan(result.agents.claude.score)
    expect(result.deltas.at(-1)?.category).toBe('judge')
  })

  it('penalizes regressions and repeated failures', () => {
    const result = runBattle(
      [
        { id: 'b1', type: 'test_failed', agent: 'claude', at: 1, label: 'tests failed' },
        { id: 'b2', type: 'test_failed', agent: 'claude', at: 2, label: 'same tests failed again' },
      ],
      'Showcase Replay',
    )

    expect(result.agents.claude.score).toBeLessThan(0)
    expect(result.agents.claude.health).toBeLessThan(100)
  })
})
