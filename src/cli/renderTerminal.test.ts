import { describe, expect, it } from 'vitest'
import { demoEvents } from '../arena/demoEvents'
import { runBattle } from '../arena/engine'
import { formatScorecard } from './formatScorecard'
import { renderTerminal } from './renderTerminal'

describe('terminal arena demo', () => {
  it('renders the deterministic demo with both agents and Codex as winner', () => {
    const state = runBattle(demoEvents, 'Demo Mode')
    const output = renderTerminal(state)

    expect(state.winner).toBe('codex')
    expect(output).toContain('AGENT ARENA')
    expect(output).toContain('Mode: Demo Mode')
    expect(output).toContain('Winner: Codex')
    expect(output).toContain('Codex')
    expect(output).toContain('Claude Code')
    expect(output).toContain('Type Error Hydra appeared')
    expect(output).toContain('Test familiar summoned')
    expect(output).toContain('Codex landed a major hit')
  })

  it('formats an explainable scorecard with score deltas', () => {
    const state = runBattle(demoEvents, 'Demo Mode')
    const output = formatScorecard(state)

    expect(output).toContain('Scorecard (Demo Mode)')
    expect(output).toContain('Winner: Codex')
    expect(output).toContain('+500 Codex: Custom judge: custom judge accepted outcome [judge]')
    expect(output).toContain('-60 Claude Code: lint failed after patch [penalty]')
  })
})
