import { describeEventForSkin } from '../arena/skins'
import type { ArenaSkin } from '../arena/skins'
import type { BattleEvent, BattleState } from '../arena/types'

export function formatScorecard(state: BattleState, skin: ArenaSkin): string {
  const eventById = new Map<string, BattleEvent>(state.events.map((event) => [event.id, event]))
  const deltas = state.deltas
    .map((delta) => {
      const event = eventById.get(delta.eventId)
      const text = event ? describeEventForSkin(event.type, skin) : delta.reason
      const sign = delta.points >= 0 ? '+' : ''
      return `${sign}${delta.points} ${state.agents[delta.agent].name}: ${text} - ${delta.reason} [${delta.category}]`
    })
    .join('\n')
  const highlights = state.events
    .filter((event) => event.type === 'test_passed' || event.type === 'build_passed' || event.type === 'task_completed' || event.type === 'judge_verdict')
    .map((event) => `- ${state.agents[event.agent].name}: ${describeEventForSkin(event.type, skin)} - ${event.label}`)

  return [
    `Scorecard (${skin.name})`,
    `Match: ${state.label}`,
    `Codex ${skin.labels.score}: ${state.agents.codex.score}`,
    `Claude Code ${skin.labels.score}: ${state.agents.claude.score}`,
    `${skin.labels.momentum}: Codex ${state.agents.codex.momentum}, Claude Code ${state.agents.claude.momentum}`,
    `Winner: ${state.winner === 'tie' ? 'Tie' : state.winner ? state.agents[state.winner].name : 'pending'}`,
    '',
    `${skin.labels.feed}:`,
    `Center ${skin.labels.blocker}: ${skin.labels.finalResult}`,
    `${skin.labels.assist}: ${state.agents.codex.familiars.length + state.agents.claude.familiars.length}`,
    '',
    'Decisive moments:',
    ...(highlights.length > 0 ? highlights : state.highlights.map((highlight) => `- ${highlight}`)),
    '',
    'Score changes:',
    deltas,
  ].join('\n')
}
