import { describe, expect, it } from 'vitest'
import { demoEvents } from '../arena/demoEvents'
import { runBattle } from '../arena/engine'
import { getMode } from '../arena/modes'
import { getTheme } from '../arena/themes'
import { formatScorecard } from './formatScorecard'
import { renderTerminal } from './renderTerminal'

describe('terminal arena demo', () => {
  it('renders the deterministic demo with both agents and Codex as winner', () => {
    const state = runBattle(demoEvents, 'Demo Mode')
    const mode = getMode('moba')
    const theme = getTheme('moba-default', mode.id)
    const output = renderTerminal(state, mode, theme)

    expect(state.winner).toBe('codex')
    expect(output).toContain('AGENT ARENA')
    expect(output).toContain('Mode: MOBA Mode')
    expect(output).toContain('Theme: MOBA Default')
    expect(output).toContain('Winner: Codex')
    expect(output).toContain('Codex')
    expect(output).toContain('Claude Code')
    expect(output).toContain('objective score')
    expect(output).toContain('tempo')
    expect(output).toContain('assist')
    expect(output).toContain('observer feed')
    expect(output).toContain('Type Error Hydra appeared')
    expect(output).toContain('Test familiar summoned')
    expect(output).toContain('Codex landed a major hit')
  })

  it('renders alternate mmo vocabulary', () => {
    const state = runBattle(demoEvents, 'Demo Mode')
    const mode = getMode('mmo')
    const theme = getTheme('mmo-default', mode.id)
    const output = renderTerminal(state, mode, theme)

    expect(output).toContain('Mode: MMO Mode')
    expect(output).toContain('Theme: MMO Default')
    expect(output).toContain('XP')
    expect(output).toContain('reputation')
    expect(output).toContain('party member')
    expect(output).toContain('adventure log')
  })

  it('formats an explainable scorecard with score deltas', () => {
    const state = runBattle(demoEvents, 'Demo Mode')
    const output = formatScorecard(state, getMode('moba'))

    expect(output).toContain('Scorecard (MOBA Mode)')
    expect(output).toContain('objective score')
    expect(output).toContain('observer feed')
    expect(output).toContain('Winner: Codex')
    expect(output).toContain('+500 Codex: Custom judge: custom judge accepted outcome [judge]')
    expect(output).toContain('-60 Claude Code: lint failed after patch [penalty]')
  })
})
