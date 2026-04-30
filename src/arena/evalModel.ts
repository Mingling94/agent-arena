import type { AgentId, BattleEvent, BattleState, ScoreDelta } from './types'

export interface EvalCheck {
  label: string
  codex: boolean
  claude: boolean
  inverted?: boolean
}

export interface EvalModel {
  categories: ScoreDelta['category'][]
  checks: EvalCheck[]
  trustLabel: 'Pending' | 'Verified' | 'Review' | 'Low confidence'
  trustVerdict: string
  totals: Record<ScoreDelta['category'], Record<AgentId, number>>
}

export function buildEvalModel(state: BattleState): EvalModel {
  const categories: ScoreDelta['category'][] = ['outcome', 'judge', 'penalty', 'activity']
  const totals = Object.fromEntries(
    categories.map((category) => [
      category,
      {
        codex: sumDeltas(state.deltas, 'codex', category),
        claude: sumDeltas(state.deltas, 'claude', category),
      },
    ]),
  ) as EvalModel['totals']

  return {
    categories,
    checks: buildChecks(state.events),
    totals,
    ...getTrustVerdict(state, totals),
  }
}

function sumDeltas(deltas: ScoreDelta[], agent: AgentId, category: ScoreDelta['category']) {
  return deltas
    .filter((delta) => delta.agent === agent && delta.category === category)
    .reduce((total, delta) => total + delta.points, 0)
}

function hasEvent(events: BattleEvent[], agent: AgentId, predicate: (event: BattleEvent) => boolean) {
  return events.some((event) => event.agent === agent && predicate(event))
}

function buildChecks(events: BattleEvent[]): EvalCheck[] {
  return [
    {
      label: 'Tests',
      codex: hasEvent(events, 'codex', (event) => event.type === 'test_passed'),
      claude: hasEvent(events, 'claude', (event) => event.type === 'test_passed'),
    },
    {
      label: 'Build',
      codex: hasEvent(events, 'codex', (event) => event.type === 'build_passed'),
      claude: hasEvent(events, 'claude', (event) => event.type === 'build_passed'),
    },
    {
      label: 'Task',
      codex: hasEvent(events, 'codex', (event) => event.type === 'task_completed'),
      claude: hasEvent(events, 'claude', (event) => event.type === 'task_completed'),
    },
    {
      label: 'Judge',
      codex: hasEvent(events, 'codex', (event) => event.type === 'judge_verdict'),
      claude: hasEvent(events, 'claude', (event) => event.type === 'judge_verdict'),
    },
    {
      label: 'Penalty',
      codex: hasEvent(events, 'codex', (event) => event.type === 'test_failed' || event.type === 'blocker_detected'),
      claude: hasEvent(events, 'claude', (event) => event.type === 'test_failed' || event.type === 'blocker_detected'),
      inverted: true,
    },
  ]
}

function getTrustVerdict(
  state: BattleState,
  totals: EvalModel['totals'],
): Pick<EvalModel, 'trustLabel' | 'trustVerdict'> {
  if (!state.winner || state.winner === 'tie') {
    return {
      trustLabel: 'Pending',
      trustVerdict: 'Pending: replay is still collecting evidence.',
    }
  }

  const winner = state.agents[state.winner]
  const winnerTotals = {
    judge: totals.judge[state.winner],
    outcome: totals.outcome[state.winner],
    penalty: totals.penalty[state.winner],
  }

  if (winnerTotals.judge > 0 && winnerTotals.outcome > 0) {
    return {
      trustLabel: 'Verified',
      trustVerdict: `Trust ${winner.name}: verified checks cleared and custom judge accepted the result.`,
    }
  }

  if (winnerTotals.outcome > 0 && winnerTotals.penalty >= 0) {
    return {
      trustLabel: 'Verified',
      trustVerdict: `Trust ${winner.name}: verified outcomes lead the score with no active penalty drag.`,
    }
  }

  if (winnerTotals.outcome > 0) {
    return {
      trustLabel: 'Review',
      trustVerdict: `Review ${winner.name}: outcome score leads, with penalties visible in the ledger.`,
    }
  }

  return {
    trustLabel: 'Low confidence',
    trustVerdict: `Low-confidence lead: ${winner.name} is ahead mostly on activity signals.`,
  }
}
