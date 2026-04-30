import type { BattleState } from '../arena/types'
import type { ArenaSkin } from '../arena/skins'

export function formatScorecard(state: BattleState, skin: ArenaSkin): string {
  const deltas = state.deltas
    .map((delta) => {
      const sign = delta.points >= 0 ? '+' : ''
      return `${sign}${delta.points} ${state.agents[delta.agent].name}: ${delta.reason} [${delta.category}]`
    })
    .join('\n')

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
    ...state.highlights.map((highlight) => `- ${highlight}`),
    '',
    'Score changes:',
    deltas,
  ].join('\n')
}
