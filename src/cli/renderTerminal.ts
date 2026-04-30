import type { AgentState, BattleState } from '../arena/types'

export function renderTerminal(state: BattleState): string {
  const codex = renderAgent(state.agents.codex)
  const claude = renderAgent(state.agents.claude)
  const blockers = state.blockers.length > 0 ? state.blockers.join(' | ') : 'No active blockers'
  const log = state.log.slice(-8).map((line) => `  ${line}`).join('\n')
  const highlights = state.highlights.slice(-4).map((line) => `  * ${line}`).join('\n')
  const winner = state.winner ? `Winner: ${state.winner === 'tie' ? 'Tie' : state.agents[state.winner].name}` : 'Winner: pending'

  return [
    'AGENT ARENA',
    `Mode: ${state.label}  ${winner}`,
    '================================================================',
    codex,
    '-------------------------- BLOCKERS ----------------------------',
    `  ${blockers}`,
    '----------------------------------------------------------------',
    claude,
    '-------------------------- HIGHLIGHTS --------------------------',
    highlights || '  No highlights yet',
    '---------------------------- LOG -------------------------------',
    log || '  No events yet',
    '================================================================',
  ].join('\n')
}

export function renderAgent(agent: AgentState): string {
  const familiars = agent.familiars.length > 0 ? agent.familiars.join(', ') : 'none'
  return [
    `${agent.name}`,
    `  Score: ${agent.score}  Health: ${Math.round(agent.health)}  Momentum: ${agent.momentum}`,
    `  Familiars: ${familiars}`,
  ].join('\n')
}
