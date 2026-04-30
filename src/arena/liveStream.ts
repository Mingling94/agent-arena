import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { applyBattleEvent, createInitialBattle, finalizeBattle } from './engine'
import { parseEventsJsonl } from './io'
import type { AgentId, BattleEvent, BattleEventType, BattleState, JudgeVerdict } from './types'

export const DEFAULT_LIVE_EVENTS_PATH = '.agent-arena/live/events.jsonl'

export interface LiveBattleSnapshot {
  state: BattleState
  eventsPath: string
  warning?: string
}

export interface LiveEventInput {
  agent: AgentId
  type: BattleEventType
  label: string
  points?: number
  severity?: BattleEvent['severity']
  verdict?: JudgeVerdict
}

export function readLiveBattleSnapshot(eventsPath = DEFAULT_LIVE_EVENTS_PATH): LiveBattleSnapshot {
  const state = createInitialBattle('Matched Race')
  state.winner = null

  if (!existsSync(eventsPath)) {
    return {
      state,
      eventsPath,
      warning: `Waiting for ${eventsPath}`,
    }
  }

  try {
    const events = parseEventsJsonl(readFileSync(eventsPath, 'utf8'))
    return { state: buildLiveBattleState(events), eventsPath }
  } catch {
    return {
      state,
      eventsPath,
      warning: `Waiting for complete JSONL write from ${eventsPath}`,
    }
  }
}

export function buildLiveBattleState(events: BattleEvent[]): BattleState {
  const state = createInitialBattle('Matched Race')
  for (const event of events) applyBattleEvent(state, event)

  if (hasFinalEvent(events)) {
    finalizeBattle(state)
  } else {
    state.winner = null
  }

  return state
}

export function appendLiveEvent(input: LiveEventInput, eventsPath = DEFAULT_LIVE_EVENTS_PATH): BattleEvent {
  mkdirSync(dirname(eventsPath), { recursive: true })
  const existingEvents = existsSync(eventsPath)
    ? parseEventsJsonl(readFileSync(eventsPath, 'utf8'))
    : []
  const nextIndex = existingEvents.length + 1
  const uniqueSuffix = Math.random().toString(36).slice(2, 8)
  const event: BattleEvent = {
    id: `live-${Date.now()}-${nextIndex}-${uniqueSuffix}`,
    agent: input.agent,
    type: input.type,
    at: nextIndex,
    label: input.label,
    ...(input.points === undefined ? {} : { points: input.points }),
    ...(input.severity === undefined ? {} : { severity: input.severity }),
    ...(input.verdict === undefined ? {} : { verdict: input.verdict }),
  }

  appendFileSync(eventsPath, `${JSON.stringify(event)}\n`, 'utf8')
  return event
}

function hasFinalEvent(events: BattleEvent[]): boolean {
  return events.some((event) => event.type === 'task_completed' || event.type === 'judge_verdict')
}
