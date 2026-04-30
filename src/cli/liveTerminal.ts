import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'
import { demoEvents } from '../arena/demoEvents'
import { applyBattleEvent, createInitialBattle, finalizeBattle } from '../arena/engine'
import { parseEventsJsonl } from '../arena/io'
import type { ArenaSkin } from '../arena/skins'
import type { BattleEvent, BattleState } from '../arena/types'
import { renderTerminal } from './renderTerminal'
import type { TerminalRenderOptions } from './renderTerminal'

const DEFAULT_INTERVAL_MS = 700

export interface LiveTerminalOptions extends TerminalRenderOptions {
  eventsPath?: string
  follow?: boolean
  intervalMs?: number
}

interface LiveState {
  events: BattleEvent[]
  battle: BattleState
  appliedCount: number
  status: string
}

export async function runLiveTerminal(skin: ArenaSkin, options: LiveTerminalOptions = {}): Promise<void> {
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS
  const liveState: LiveState = {
    events: options.follow ? readEventsFromPath(options.eventsPath).events : readInitialReplayEvents(options.eventsPath),
    battle: createInitialBattle('Matched Race'),
    appliedCount: 0,
    status: options.follow ? 'following live event stream' : 'playing deterministic stream as live telemetry',
  }

  let replayCount = options.follow ? liveState.events.length : 0
  let finished = false
  let renderTimer: ReturnType<typeof setInterval> | undefined
  let replayTimer: ReturnType<typeof setInterval> | undefined
  let resolveRun: (() => void) | undefined

  enterLiveScreen()
  syncLiveBattle(liveState, replayCount)
  renderHud(skin, options, liveState, replayCount)

  if (options.follow) {
    renderTimer = setInterval(() => {
      const result = readEventsFromPath(options.eventsPath, liveState.events)
      liveState.events = result.events
      liveState.status = result.warning ?? `following ${options.eventsPath ?? 'event stream'}`
      replayCount = liveState.events.length
      syncLiveBattle(liveState, replayCount)
      renderHud(skin, options, liveState, replayCount)
    }, intervalMs)
  } else {
    replayTimer = setInterval(() => {
      replayCount = Math.min(replayCount + 1, liveState.events.length)
      liveState.status = replayCount >= liveState.events.length ? 'replay complete; terminal HUD still active' : 'playing deterministic stream as live telemetry'
      syncLiveBattle(liveState, replayCount)
      renderHud(skin, options, liveState, replayCount)

      if (replayCount >= liveState.events.length) {
        clearInterval(replayTimer)
        setTimeout(() => finish(0), intervalMs)
      }
    }, intervalMs)
  }

  await new Promise<void>((resolve) => {
    resolveRun = resolve

    process.once('SIGINT', () => {
      finish(130)
    })
    process.once('SIGTERM', () => {
      finish(143)
    })

    if (!options.follow && liveState.events.length === 0) finish(0)
  })

  function finish(code = 0): void {
    if (finished) return
    finished = true
    if (renderTimer) clearInterval(renderTimer)
    if (replayTimer) clearInterval(replayTimer)
    leaveLiveScreen()
    process.exitCode = code
    resolveRun?.()
  }
}

function renderHud(
  skin: ArenaSkin,
  options: LiveTerminalOptions,
  liveState: LiveState,
  eventCount: number,
): void {
  const rows = process.stdout.rows ?? 30
  const output = renderTerminal(liveState.battle, skin, {
    view: options.view ?? 'split',
    agent: options.agent,
    runtimeMode: 'live-session',
  })
  const hudLines = [
    ...output.split('\n'),
    `Live controls: Ctrl-C exits | ${liveState.status} | events: ${eventCount}`,
  ]
  const hudHeight = Math.min(hudLines.length, rows - 1)

  process.stdout.write('\x1b[H\x1b[J')
  process.stdout.write(hudLines.slice(0, hudHeight).map(clearLine).join('\n'))
}

function enterLiveScreen(): void {
  process.stdout.write('\x1b[?1049h\x1b[?25l')
  process.stdout.write('\x1b[2J\x1b[1;1H')
}

function leaveLiveScreen(): void {
  process.stdout.write('\x1b[?25h\x1b[?1049l')
}

function readInitialReplayEvents(eventsPath?: string): BattleEvent[] {
  if (!eventsPath) return demoEvents
  return readEventsFromPath(eventsPath).events
}

function readEventsFromPath(eventsPath?: string, fallback: BattleEvent[] = []): { events: BattleEvent[]; warning?: string } {
  if (!eventsPath) return { events: fallback, warning: 'waiting for event stream path' }
  if (!existsSync(eventsPath)) return { events: fallback, warning: `waiting for ${eventsPath}` }

  try {
    const input = readFileSync(eventsPath, 'utf8')
    return { events: parseEventsJsonl(input) }
  } catch {
    return { events: fallback, warning: `waiting for complete JSONL write from ${eventsPath}` }
  }
}

function syncLiveBattle(liveState: LiveState, eventCount: number): void {
  if (eventCount < liveState.appliedCount) {
    liveState.battle = createInitialBattle('Matched Race')
    liveState.appliedCount = 0
  }

  const nextEvents = liveState.events.slice(liveState.appliedCount, eventCount)
  for (const event of nextEvents) applyBattleEvent(liveState.battle, event)
  liveState.appliedCount = eventCount

  const visibleEvents = liveState.events.slice(0, eventCount)
  const hasFinalEvent = visibleEvents.some((event) => event.type === 'task_completed' || event.type === 'judge_verdict')
  if (hasFinalEvent) {
    finalizeBattle(liveState.battle)
  } else {
    liveState.battle.winner = null
  }
}

function clearLine(line: string): string {
  return `${line}\x1b[0K`
}
