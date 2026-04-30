export type AgentId = 'codex' | 'claude'

export type RaceLabel = 'Demo Mode' | 'Showcase Replay' | 'Matched Race'

export type BattleEventType =
  | 'agent_started'
  | 'tool_used'
  | 'file_changed'
  | 'blocker_detected'
  | 'subagent_spawned'
  | 'fix_applied'
  | 'test_failed'
  | 'test_passed'
  | 'build_passed'
  | 'judge_verdict'
  | 'task_completed'

export type JudgeVerdict = 'accepted' | 'partial' | 'regressed' | 'failed'

export interface BattleEvent {
  id: string
  type: BattleEventType
  agent: AgentId
  at: number
  label: string
  points?: number
  severity?: 'low' | 'medium' | 'high'
  verdict?: JudgeVerdict
}

export interface ScoreDelta {
  eventId: string
  agent: AgentId
  points: number
  reason: string
  category: 'outcome' | 'activity' | 'penalty' | 'judge'
}

export interface AgentState {
  id: AgentId
  name: string
  score: number
  health: number
  momentum: number
  familiars: string[]
}

export interface BattleState {
  label: RaceLabel
  events: BattleEvent[]
  agents: Record<AgentId, AgentState>
  blockers: string[]
  log: string[]
  deltas: ScoreDelta[]
  highlights: string[]
  winner: AgentId | 'tie' | null
}
