import { describe, expect, it } from 'vitest'
import { demoEvents } from '../arena/demoEvents'
import { runBattle } from '../arena/engine'
import { getSkin } from '../arena/skins'
import { formatScorecard } from './formatScorecard'
import { renderTerminal } from './renderTerminal'

describe('terminal arena demo', () => {
  it('renders the deterministic demo with both agents and Codex as winner', () => {
    const state = runBattle(demoEvents, 'Demo Mode')
    const output = renderTerminal(state, getSkin())

    expect(state.winner).toBe('codex')
    expect(output).toContain('AGENT ARENA')
    expect(output).toContain('Skin: Default Arena')
    expect(output).toContain('View: Default Arena replay')
    expect(output).toContain('Winner: Codex')
    expect(output).toContain('Codex wins by 1440 points')
    expect(output).toContain('Codex')
    expect(output).toContain('Claude Code')
    expect(output).toContain('ARENA VIEW')
    expect(output).toContain('THIRD-PERSON ARENA')
    expect(output).toContain('Codex Lane')
    expect(output).toContain('Claude Lane')
    expect(output).toContain('Center Blocker')
    expect(output).toContain('HP [')
    expect(output).toContain('Momentum [')
    expect(output).toContain('Units:')
    expect(output).toContain('Recent Caster Feed')
    expect(output).toContain('score')
    expect(output).toContain('Momentum')
    expect(output).toContain('helper')
    expect(output).toContain('event feed')
    expect(output).toContain('blocker spotted')
    expect(output).toContain('Test familiar summoned')
    expect(output).toContain('check secured')
  })

  it('renders a narrow focus view for one agent', () => {
    const state = runBattle(demoEvents, 'Demo Mode')
    const output = renderTerminal(state, getSkin(), { view: 'focus', agent: 'codex' })

    expect(output).toContain('FOCUS VIEW')
    expect(output).toContain('THIRD-PERSON ARENA')
    expect(output).toContain('Focused Agent: Codex')
    expect(output).toContain('Opponent: Claude Code')
    expect(output).toContain('Model: GPT-5.5')
    expect(output).toContain('Task: Implement and verify the arena replay')
    expect(output).toContain('Center Blocker')
    expect(output).toContain('Status: secured')
    expect(output).toContain('HP [')
    expect(output).toContain('Momentum [')
    expect(output).toContain('Units: + helper')
    expect(output).toContain('Recent Caster Feed')
    expect(output).toContain('check secured')
  })

  it('renders a compact feed view for small terminals', () => {
    const state = runBattle(demoEvents, 'Demo Mode')
    const output = renderTerminal(state, getSkin(), { view: 'feed' })

    expect(output).toContain('FEED VIEW')
    expect(output).toContain('Winner: Codex')
    expect(output).toContain('Score: Codex 1415 | Claude Code -25')
    expect(output).toContain('Codex wins by 1440 points')
    expect(output).toContain('Recent Caster Feed')
    expect(output).toContain('failed check')
    expect(output).toContain('check secured')
  })

  it('renders a solo live scene without showing the opponent lane', () => {
    const state = runBattle(demoEvents, 'Matched Race')
    const output = renderTerminal(state, getSkin(), {
      runtimeMode: 'live-session',
      view: 'scene',
      soloAgent: 'codex',
    })

    expect(output).toContain('CODEX LIVE SESSION')
    expect(output).toContain('SESSION CONTROL')
    expect(output).toContain('Codex tracking active work')
    expect(output).not.toContain('Claude Code')
    expect(output).not.toContain('lint failed after patch')
  })

  it('keeps oldschool mmo as a compatibility alias for the default skin', () => {
    const state = runBattle(demoEvents, 'Demo Mode')
    const output = renderTerminal(state, getSkin('oldschool-mmo'))

    expect(output).toContain('Skin: Default Arena')
    expect(output).toContain('score')
    expect(output).toContain('Momentum')
    expect(output).toContain('helper')
    expect(output).toContain('event feed')
    expect(output).toContain('check secured')
  })

  it('formats an explainable scorecard with score deltas', () => {
    const state = runBattle(demoEvents, 'Demo Mode')
    const output = formatScorecard(state, getSkin())

    expect(output).toContain('Scorecard (Default Arena)')
    expect(output).toContain('score')
    expect(output).toContain('event feed')
    expect(output).toContain('Winner: Codex')
    expect(output).toContain('+500 Codex: judge verdict - Custom judge: custom judge accepted outcome [judge]')
    expect(output).toContain('-60 Claude Code: failed check - lint failed after patch [penalty]')
  })
})
