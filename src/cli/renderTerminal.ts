import type { AgentState, BattleState } from '../arena/types'
import type { GameMode } from '../arena/modes'
import type { ArenaTheme } from '../arena/themes'

export function renderTerminal(state: BattleState, mode: GameMode, theme: ArenaTheme): string {
  const codex = renderAgent(state.agents.codex, mode)
  const claude = renderAgent(state.agents.claude, mode)
  const blockers = state.blockers.length > 0 ? state.blockers.join(' | ') : 'No active blockers'
  const log = state.log.slice(-8).map((line) => `  ${line}`).join('\n')
  const highlights = state.highlights.slice(-4).map((line) => `  * ${line}`).join('\n')
  const winner = state.winner ? `Winner: ${state.winner === 'tie' ? 'Tie' : state.agents[state.winner].name}` : 'Winner: pending'
  const divider = theme.frame.horizontal.repeat(64)

  return [
    'AGENT ARENA',
    `Mode: ${mode.name}  Theme: ${theme.name}  Match: ${state.label}  ${winner}`,
    divider,
    codex,
    `---------------------- ${mode.labels.blocker} ----------------------`,
    `  ${blockers}`,
    `  ${theme.glyphs.objective} Center ${mode.labels.objective}: ${mode.labels.finalObjective}`,
    divider,
    claude,
    '-------------------------- HIGHLIGHTS --------------------------',
    highlights || '  No highlights yet',
    `------------------------ ${mode.labels.feed} ------------------------`,
    log || '  No events yet',
    divider,
  ].join('\n')
}

export function renderAgent(agent: AgentState, mode: GameMode): string {
  const assists = agent.familiars.length > 0 ? agent.familiars.join(', ') : 'none'
  return [
    `${agent.name}`,
    `  ${mode.labels.score}: ${agent.score}  Health: ${Math.round(agent.health)}  ${mode.labels.momentum}: ${agent.momentum}`,
    `  ${mode.labels.assist}: ${assists}`,
  ].join('\n')
}
