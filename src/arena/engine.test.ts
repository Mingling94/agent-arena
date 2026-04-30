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
})
