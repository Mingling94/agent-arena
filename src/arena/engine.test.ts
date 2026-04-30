import { describe, expect, it } from 'vitest'
import { buildBattleReplayState, runBattle } from './engine'
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

  it('classifies explicit judge points without a verdict as judge scoring', () => {
    const result = runBattle(
      [
        {
          id: 'j2',
          type: 'judge_verdict',
          agent: 'claude',
          at: 1,
          label: 'manual rubric bonus',
          points: 75,
        },
      ],
      'Matched Race',
    )

    expect(result.deltas.at(-1)?.category).toBe('judge')
    expect(result.agents.claude.score).toBe(75)
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

  it('uses the same reducer path for incremental live state and replay state', () => {
    const events: BattleEvent[] = [
      { id: 'c1', type: 'tool_used', agent: 'codex', at: 1, label: 'read files' },
      { id: 'c2', type: 'test_passed', agent: 'codex', at: 2, label: 'tests passed' },
      { id: 'k1', type: 'test_failed', agent: 'claude', at: 3, label: 'tests failed' },
    ]

    const replay = runBattle(events, 'Matched Race')
    const live = buildBattleReplayState(events, 'Matched Race', events.length)

    expect(live).toEqual(replay)
  })

  it('builds partial replay state without declaring a winner early', () => {
    const events: BattleEvent[] = [
      { id: 'c1', type: 'tool_used', agent: 'codex', at: 1, label: 'read files' },
      { id: 'c2', type: 'task_completed', agent: 'codex', at: 2, label: 'finished' },
    ]

    const partial = buildBattleReplayState(events, 'Matched Race', 1)
    const final = buildBattleReplayState(events, 'Matched Race', 2)

    expect(partial.events).toHaveLength(1)
    expect(partial.winner).toBeNull()
    expect(final.winner).toBe('codex')
  })

  it('can finalize live state as soon as a final event is visible', () => {
    const events: BattleEvent[] = [
      { id: 'c1', type: 'task_completed', agent: 'codex', at: 1, label: 'finished' },
      { id: 'c2', type: 'tool_used', agent: 'claude', at: 2, label: 'late activity' },
    ]

    const live = buildBattleReplayState(events, 'Matched Race', 1, {
      finalizeWhen: 'final-event-visible',
    })

    expect(live.events).toHaveLength(1)
    expect(live.winner).toBe('codex')
  })
})
