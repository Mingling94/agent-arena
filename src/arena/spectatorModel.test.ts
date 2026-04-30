import { describe, expect, it } from 'vitest'
import { buildSpectatorModel } from './spectatorModel'
import type { BattleState } from './types'

const battle: BattleState = {
  label: 'Matched Race',
  events: [
    { id: 'c1', type: 'test_passed', agent: 'codex', at: 1, label: 'tests passed' },
    { id: 'x1', type: 'test_failed', agent: 'claude', at: 2, label: 'tests failed' },
    { id: 'c2', type: 'subagent_spawned', agent: 'codex', at: 3, label: 'Explorer familiar' },
    { id: 'c3', type: 'build_passed', agent: 'codex', at: 4, label: 'build passed' },
  ],
  agents: {
    codex: {
      id: 'codex',
      name: 'Codex',
      score: 515,
      health: 100,
      momentum: 60,
      familiars: ['Explorer familiar'],
    },
    claude: {
      id: 'claude',
      name: 'Claude Code',
      score: -20,
      health: 80,
      momentum: 20,
      familiars: [],
    },
  },
  blockers: ['tests failed'],
  log: [
    'Codex: tests passed (+220)',
    'Claude Code: tests failed (-60)',
    'Codex: Explorer familiar (+35)',
    'Codex: build passed (+260)',
  ],
  deltas: [
    { eventId: 'c1', agent: 'codex', points: 220, reason: 'tests passed', category: 'outcome' },
    { eventId: 'x1', agent: 'claude', points: -60, reason: 'tests failed', category: 'penalty' },
    { eventId: 'c2', agent: 'codex', points: 35, reason: 'Explorer familiar', category: 'activity' },
    { eventId: 'c3', agent: 'codex', points: 260, reason: 'build passed', category: 'outcome' },
  ],
  highlights: ['Codex landed a major hit: tests passed', 'Codex landed a major hit: build passed'],
  winner: 'codex',
}

describe('buildSpectatorModel', () => {
  it('turns battle state into a renderer-neutral spectator model', () => {
    const model = buildSpectatorModel(battle)

    expect(model.runtime).toEqual({
      mode: 'demo-replay',
      label: 'Demo Replay',
      source: 'Deterministic arena event stream',
      detail: 'Reliable hackathon path shared by terminal and web',
    })
    expect(model.viewLabel).toBe('Default Arena replay')
    expect(model.title).toBe('Codex captures the objective')
    expect(model.objective).toEqual({
      label: 'tests failed',
      status: 'secured',
      detail: 'Codex resolved the shared objective',
    })
    expect(model.callouts).toEqual([
      'Codex: Explorer familiar (+35)',
      'Codex: build passed (+260)',
    ])
    expect(model.sides.codex.units).toEqual(['Explorer familiar'])
    expect(model.sides.claude.units).toEqual(['Solo run'])
    expect(model.sides.codex.meters).toEqual({ health: 100, momentum: 60, score: 515 })
    expect(model.sides.codex.runStats).toEqual({
      orchestrator: 'Codex',
      backingModel: 'GPT-5.5',
      repo: 'mission/codex-worktree',
      task: 'Implement and verify the arena replay',
    })
    expect(model.sides.claude.runStats).toEqual({
      orchestrator: 'Claude Code',
      backingModel: 'Claude Opus 4.7',
      repo: 'mission/claude-worktree',
      task: 'Solve the same mission from a parallel start',
    })
    expect(model.missions).toEqual([
      'Codex landed a major hit: tests passed',
      'Codex landed a major hit: build passed',
    ])
    expect(model.victoryLine).toBe('Codex wins by 535 points')
    expect(model.recommendedViews).toEqual(['scene', 'split', 'focus', 'feed'])
  })

  it('can reserve model space for live session renderers', () => {
    const model = buildSpectatorModel(battle, { runtimeMode: 'live-session' })

    expect(model.runtime).toEqual({
      mode: 'live-session',
      label: 'Live Session',
      source: 'Normalized arena event stream',
      detail: 'Reserved for active coding-agent sessions as events arrive',
    })
  })
})
