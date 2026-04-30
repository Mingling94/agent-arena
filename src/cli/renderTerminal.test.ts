import { describe, expect, it } from 'vitest'
import { demoEvents } from '../arena/demoEvents'
import { runBattle } from '../arena/engine'
import { getSkin } from '../arena/skins'
import { formatScorecard } from './formatScorecard'
import { renderTerminal } from './renderTerminal'

describe('terminal arena demo', () => {
  it('renders the deterministic demo with both agents and Codex as winner', () => {
    const state = runBattle(demoEvents, 'Demo Mode')
    const output = renderTerminal(state, getSkin('moba'))

    expect(state.winner).toBe('codex')
    expect(output).toContain('AGENT ARENA')
    expect(output).toContain('Skin: MOBA')
    expect(output).toContain('Winner: Codex')
    expect(output).toContain('Codex')
    expect(output).toContain('Claude Code')
    expect(output).toContain('objective score')
    expect(output).toContain('tempo')
    expect(output).toContain('assist')
    expect(output).toContain('observer feed')
    expect(output).toContain('objective contested')
    expect(output).toContain('Test familiar summoned')
    expect(output).toContain('objective secured')
  })

  it('renders alternate oldschool mmo vocabulary', () => {
    const state = runBattle(demoEvents, 'Demo Mode')
    const output = renderTerminal(state, getSkin('oldschool-mmo'))

    expect(output).toContain('Skin: Oldschool MMO')
    expect(output).toContain('XP / reputation')
    expect(output).toContain('reputation')
    expect(output).toContain('party helper')
    expect(output).toContain('adventure log')
    expect(output).toContain('quest milestone')
  })

  it('formats an explainable scorecard with score deltas', () => {
    const state = runBattle(demoEvents, 'Demo Mode')
    const output = formatScorecard(state, getSkin('moba'))

    expect(output).toContain('Scorecard (MOBA)')
    expect(output).toContain('objective score')
    expect(output).toContain('observer feed')
    expect(output).toContain('Winner: Codex')
    expect(output).toContain('+500 Codex: judge verdict - Custom judge: custom judge accepted outcome [judge]')
    expect(output).toContain('-60 Claude Code: lost tempo - lint failed after patch [penalty]')
  })
})
