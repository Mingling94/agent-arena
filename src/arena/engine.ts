import { scoreEvent } from './scoring'
import type { AgentId, BattleEvent, BattleState, RaceLabel } from './types'

export type ReplayFinalizationMode = 'all-events-visible' | 'final-event-visible' | 'never'

const AGENT_NAMES: Record<AgentId, string> = {
  codex: 'Codex',
  claude: 'Claude Code',
}

export function createInitialBattle(label: RaceLabel): BattleState {
  return {
    label,
    events: [],
    agents: {
      codex: { id: 'codex', name: AGENT_NAMES.codex, score: 0, health: 100, momentum: 0, familiars: [] },
      claude: { id: 'claude', name: AGENT_NAMES.claude, score: 0, health: 100, momentum: 0, familiars: [] },
    },
    blockers: [],
    log: [],
    deltas: [],
    highlights: [],
    winner: null,
  }
}

export function runBattle(events: BattleEvent[], label: RaceLabel): BattleState {
  return buildBattleReplayState(events, label, events.length)
}

export function buildBattleReplayState(
  events: BattleEvent[],
  label: RaceLabel,
  visibleEventCount: number,
  options: { finalizeWhen?: ReplayFinalizationMode } = {},
): BattleState {
  const state = createInitialBattle(label)
  const sortedEvents = sortEvents(events)
  const visibleEvents = sortedEvents.slice(0, Math.max(0, visibleEventCount))
  const finalizeWhen = options.finalizeWhen ?? 'all-events-visible'

  for (const event of visibleEvents) {
    applyBattleEvent(state, event)
  }

  if (shouldFinalizeReplay(visibleEvents, sortedEvents.length, finalizeWhen)) {
    finalizeBattle(state)
  }

  return state
}

export function applyBattleEvent(state: BattleState, event: BattleEvent): BattleState {
  const agent = state.agents[event.agent]
  const delta = scoreEvent(event)

  agent.score += delta.points
  agent.momentum = Math.max(-100, Math.min(100, agent.momentum + Math.sign(delta.points) * 10))

  if (delta.points < 0) {
    agent.health = Math.max(0, agent.health + delta.points / 3)
  }

  if (event.type === 'blocker_detected' || event.type === 'test_failed') {
    state.blockers = [event.label, ...state.blockers].slice(0, 3)
  }

  if (event.type === 'subagent_spawned') {
    agent.familiars = [event.label, ...agent.familiars].slice(0, 3)
  }

  if (event.type === 'test_passed' || event.type === 'build_passed' || event.type === 'task_completed') {
    state.highlights.push(`${agent.name} landed a major hit: ${event.label}`)
  }

  if (event.type === 'judge_verdict') {
    state.highlights.push(`${agent.name} received judge verdict: ${event.label}`)
  }

  state.deltas.push(delta)
  state.events.push(event)
  state.log.push(`${agent.name}: ${event.label} (${delta.points >= 0 ? '+' : ''}${delta.points})`)

  return state
}

export function finalizeBattle(state: BattleState): BattleState {
  state.winner = pickWinner(state)
  return state
}

export function pickWinner(state: BattleState): BattleState['winner'] {
  const codex = state.agents.codex.score
  const claude = state.agents.claude.score
  if (codex === claude) return 'tie'
  return codex > claude ? 'codex' : 'claude'
}

function sortEvents(events: BattleEvent[]): BattleEvent[] {
  return [...events].sort((a, b) => a.at - b.at)
}

function shouldFinalizeReplay(
  visibleEvents: BattleEvent[],
  totalEventCount: number,
  finalizeWhen: ReplayFinalizationMode,
): boolean {
  if (finalizeWhen === 'never') return false
  if (finalizeWhen === 'final-event-visible') {
    return visibleEvents.some((event) => event.type === 'task_completed' || event.type === 'judge_verdict')
  }

  return visibleEvents.length >= totalEventCount
}
