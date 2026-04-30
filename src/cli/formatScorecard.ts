import type { BattleState } from '../arena/types'

export function formatScorecard(state: BattleState): string {
  const deltas = state.deltas
    .map((delta) => {
      const sign = delta.points >= 0 ? '+' : ''
      return `${sign}${delta.points} ${state.agents[delta.agent].name}: ${delta.reason} [${delta.category}]`
    })
    .join('\n')

  return [
    `Scorecard (${state.label})`,
    `Codex: ${state.agents.codex.score}`,
    `Claude Code: ${state.agents.claude.score}`,
    `Winner: ${state.winner === 'tie' ? 'Tie' : state.winner ? state.agents[state.winner].name : 'pending'}`,
    '',
    'Decisive moments:',
    ...state.highlights.map((highlight) => `- ${highlight}`),
    '',
    'Score changes:',
    deltas,
  ].join('\n')
}
