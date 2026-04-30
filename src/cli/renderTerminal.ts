import { describeEventForSkin } from '../arena/skins'
import type { ArenaSkin } from '../arena/skins'
import type { AgentState, BattleState, BattleEvent } from '../arena/types'

export function renderTerminal(state: BattleState, skin: ArenaSkin): string {
  const codex = renderAgent(state.agents.codex, skin)
  const claude = renderAgent(state.agents.claude, skin)
  const blockers = formatBlockers(state, skin)
  const log = formatFeed(state, skin)
  const highlights = formatHighlights(state, skin)
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

function formatBlockers(state: BattleState, skin: ArenaSkin): string {
  const blockerEvents = state.events.filter((event) => event.type === 'blocker_detected' || event.type === 'test_failed')
  if (blockerEvents.length === 0) return 'No active blockers'

  return blockerEvents
    .slice(-3)
    .reverse()
    .map((event) => `${describeEventForSkin(event.type, skin)}: ${event.label}`)
    .join(' | ')
}

function formatHighlights(state: BattleState, skin: ArenaSkin): string {
  const highlightEvents = state.events.filter(
    (event) => event.type === 'test_passed' || event.type === 'build_passed' || event.type === 'task_completed' || event.type === 'judge_verdict',
  )

  return highlightEvents
    .slice(-4)
    .map((event) => `  * ${state.agents[event.agent].name}: ${describeEventForSkin(event.type, skin)} - ${event.label}`)
    .join('\n')
}

function formatFeed(state: BattleState, skin: ArenaSkin): string {
  const eventById = new Map<string, BattleEvent>(state.events.map((event) => [event.id, event]))

  return state.deltas
    .slice(-8)
    .map((delta) => {
      const event = eventById.get(delta.eventId)
      const text = event ? describeEventForSkin(event.type, skin) : delta.reason
      const sign = delta.points >= 0 ? '+' : ''
      return `  ${state.agents[delta.agent].name}: ${text} - ${delta.reason} (${sign}${delta.points})`
    })
    .join('\n')
}
