import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { AgentId, BattleEvent, BattleEventType, BattleState, JudgeVerdict } from './types'

const EVENT_TYPES = new Set<BattleEventType>([
  'agent_started',
  'tool_used',
  'file_changed',
  'blocker_detected',
  'subagent_spawned',
  'fix_applied',
  'test_failed',
  'test_passed',
  'build_passed',
  'judge_verdict',
  'task_completed',
])

const AGENTS = new Set<AgentId>(['codex', 'claude'])
const VERDICTS = new Set<JudgeVerdict>(['accepted', 'partial', 'regressed', 'failed'])

export function parseEventsJsonl(input: string): BattleEvent[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => parseEventLine(line, index + 1))
}

export function loadEventsJsonl(path: string): BattleEvent[] {
  return parseEventsJsonl(readFileSync(path, 'utf8'))
}

export function writeBattleJson(path: string, state: BattleState): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}

export function appendEventJsonl(path: string, event: BattleEvent): void {
  mkdirSync(dirname(path), { recursive: true })
  appendFileSync(path, `${JSON.stringify(event)}\n`, 'utf8')
}

function parseEventLine(line: string, lineNumber: number): BattleEvent {
  const parsed: unknown = JSON.parse(line)

  if (!isRecord(parsed)) {
    throw new Error(`Invalid event on line ${lineNumber}: expected an object`)
  }

  const { id, type, agent, at, label, points, severity, verdict } = parsed

  if (typeof id !== 'string') throw new Error(`Invalid event on line ${lineNumber}: missing string id`)
  if (typeof type !== 'string' || !EVENT_TYPES.has(type as BattleEventType)) {
    throw new Error(`Invalid event on line ${lineNumber}: unknown type`)
  }
  if (typeof agent !== 'string' || !AGENTS.has(agent as AgentId)) {
    throw new Error(`Invalid event on line ${lineNumber}: unknown agent`)
  }
  if (typeof at !== 'number') throw new Error(`Invalid event on line ${lineNumber}: missing numeric at`)
  if (typeof label !== 'string') throw new Error(`Invalid event on line ${lineNumber}: missing string label`)
  if (points !== undefined && typeof points !== 'number') {
    throw new Error(`Invalid event on line ${lineNumber}: points must be numeric`)
  }
  if (severity !== undefined && severity !== 'low' && severity !== 'medium' && severity !== 'high') {
    throw new Error(`Invalid event on line ${lineNumber}: unknown severity`)
  }
  if (verdict !== undefined && (typeof verdict !== 'string' || !VERDICTS.has(verdict as JudgeVerdict))) {
    throw new Error(`Invalid event on line ${lineNumber}: unknown verdict`)
  }

  return {
    id,
    type: type as BattleEventType,
    agent: agent as AgentId,
    at,
    label,
    ...(points === undefined ? {} : { points }),
    ...(severity === undefined ? {} : { severity: severity as BattleEvent['severity'] }),
    ...(verdict === undefined ? {} : { verdict: verdict as JudgeVerdict }),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
