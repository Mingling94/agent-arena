import type { BattleEvent, ScoreDelta } from './types'

const SCORE_BY_TYPE: Record<BattleEvent['type'], number> = {
  agent_started: 0,
  tool_used: 10,
  file_changed: 25,
  blocker_detected: -20,
  subagent_spawned: 35,
  fix_applied: 90,
  test_failed: -60,
  test_passed: 220,
  build_passed: 260,
  judge_verdict: 0,
  task_completed: 320,
}

const JUDGE_POINTS = {
  accepted: 500,
  partial: 160,
  regressed: -220,
  failed: -320,
} as const

export function scoreEvent(event: BattleEvent): ScoreDelta {
  if (event.type === 'judge_verdict') {
    return {
      eventId: event.id,
      agent: event.agent,
      points: event.points ?? (event.verdict ? JUDGE_POINTS[event.verdict] : 0),
      reason: `Custom judge: ${event.label}`,
      category: 'judge',
    }
  }

  const points = event.points ?? SCORE_BY_TYPE[event.type]
  const category: ScoreDelta['category'] =
    points < 0
      ? 'penalty'
      : ['test_passed', 'build_passed', 'task_completed', 'fix_applied'].includes(event.type)
        ? 'outcome'
        : 'activity'

  return {
    eventId: event.id,
    agent: event.agent,
    points,
    reason: event.label,
    category,
  }
}
