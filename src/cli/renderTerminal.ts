import type { AgentState, BattleState } from '../arena/types'
import type { ArenaSkin } from '../arena/skins'

export function renderTerminal(state: BattleState, skin: ArenaSkin): string {
  const codex = renderAgent(state.agents.codex, skin)
  const claude = renderAgent(state.agents.claude, skin)
  const blockers = state.blockers.length > 0 ? state.blockers.join(' | ') : 'No active blockers'
  const log = state.log.slice(-8).map((line) => `  ${line}`).join('\n')
  const highlights = state.highlights.slice(-4).map((line) => `  * ${line}`).join('\n')
  const winner = state.winner ? `Winner: ${state.winner === 'tie' ? 'Tie' : state.agents[state.winner].name}` : 'Winner: pending'
  const divider = '='.repeat(64)

  return [
    'AGENT ARENA',
    `Skin: ${skin.name}  Match: ${state.label}  ${winner}`,
    divider,
    codex,
    `---------------------- ${skin.labels.blocker} ----------------------`,
    `  ${blockers}`,
    `  ${skin.glyphs.blocker} Center ${skin.labels.blocker}: ${skin.labels.finalResult}`,
    divider,
    claude,
    '-------------------------- HIGHLIGHTS --------------------------',
    highlights || '  No highlights yet',
    `------------------------ ${skin.labels.feed} ------------------------`,
    log || '  No events yet',
    divider,
  ].join('\n')
}

export function renderAgent(agent: AgentState, skin: ArenaSkin): string {
  const assists = agent.familiars.length > 0 ? agent.familiars.join(', ') : 'none'
  return [
    `${agent.name}`,
    `  ${skin.glyphs.score} ${skin.labels.score}: ${agent.score}  Health: ${Math.round(agent.health)}  ${skin.labels.momentum}: ${agent.momentum}`,
    `  ${skin.glyphs.assist} ${skin.labels.assist}: ${assists}`,
  ].join('\n')
}
