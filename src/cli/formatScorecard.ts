import type { BattleState } from '../arena/types'
import type { GameMode } from '../arena/modes'

export function formatScorecard(state: BattleState, mode: GameMode): string {
  const deltas = state.deltas
    .map((delta) => {
      const sign = delta.points >= 0 ? '+' : ''
      return `${sign}${delta.points} ${state.agents[delta.agent].name}: ${delta.reason} [${delta.category}]`
    })
    .join('\n')

  return [
    `Scorecard (${mode.name})`,
    `Match: ${state.label}`,
    `Codex ${mode.labels.score}: ${state.agents.codex.score}`,
    `Claude Code ${mode.labels.score}: ${state.agents.claude.score}`,
    `${mode.labels.momentum}: Codex ${state.agents.codex.momentum}, Claude Code ${state.agents.claude.momentum}`,
    `Winner: ${state.winner === 'tie' ? 'Tie' : state.winner ? state.agents[state.winner].name : 'pending'}`,
    '',
    `${mode.labels.feed}:`,
    `Center ${mode.labels.objective}: ${mode.labels.finalObjective}`,
    `${mode.labels.assist}: ${state.agents.codex.familiars.length + state.agents.claude.familiars.length}`,
    '',
    'Decisive moments:',
    ...state.highlights.map((highlight) => `- ${highlight}`),
    '',
    'Score changes:',
    deltas,
  ].join('\n')
}
