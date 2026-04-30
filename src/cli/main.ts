#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { demoEvents } from '../arena/demoEvents'
import { runBattle } from '../arena/engine'
import { loadEventsJsonl, writeBattleJson } from '../arena/io'
import { appendLiveEvent, DEFAULT_LIVE_EVENTS_PATH } from '../arena/liveStream'
import { getSkin } from '../arena/skins'
import { parseTranscript } from '../arena/transcriptParser'
import type { AgentId, BattleEvent, BattleEventType, JudgeVerdict } from '../arena/types'
import { formatScorecard } from './formatScorecard'
import { runLogAdapter } from './logAdapter'
import { runLiveTerminal } from './liveTerminal'
import { renderTerminal } from './renderTerminal'
import type { TerminalRenderOptions, TerminalView } from './renderTerminal'
import { runCommandInLowerTmuxPane } from './tmuxLive'

declare const process: {
  argv: string[]
  exit(code?: number): never
}

const command = process.argv[2] ?? 'demo'
const args = process.argv.slice(3)

try {
  const skinName = readOption(args, '--skin', readOption(args, '--mode', 'default'))
  const skin = getSkin(skinName)
  const terminalOptions = readTerminalOptions(args)

  if (skin.warning) console.warn(skin.warning)

  if (command === 'demo') {
    const state = runBattle(demoEvents, 'Demo Mode')
    console.log(renderTerminal(state, skin, terminalOptions))
  } else if (command === 'live') {
    const liveArgs = splitLiveArgs(args)
    const eventsPath = readOption(liveArgs.options, '--events')
    if (liveArgs.command.length > 0) runCommandInLowerTmuxPane(liveArgs.command)

    await runLiveTerminal(skin, {
      ...readTerminalOptions(liveArgs.options),
      eventsPath,
      follow: liveArgs.options.includes('--follow') || eventsPath !== undefined,
      intervalMs: readPositiveInteger(readOption(liveArgs.options, '--interval'), 700),
    })
  } else if (command === 'emit') {
    const event = appendLiveEvent(readLiveEventInput(args), readOption(args, '--events', DEFAULT_LIVE_EVENTS_PATH))
    console.log(`Emitted ${event.type} for ${event.agent}: ${event.label}`)
  } else if (command === 'watch-log') {
    const inputPath = readOption(args, '--input')
    if (!inputPath) throw new Error('watch-log requires --input')

    await runLogAdapter({
      agent: readAgentId(readOption(args, '--agent', 'codex')),
      inputPath,
      eventsPath: readOption(args, '--events', DEFAULT_LIVE_EVENTS_PATH),
      intervalMs: readPositiveInteger(readOption(args, '--interval'), 500),
      once: args.includes('--once'),
    })
  } else if (command === 'scorecard') {
    const state = runBattle(demoEvents, 'Demo Mode')
    console.log(formatScorecard(state, skin))
  } else if (command === 'replay') {
    const eventsPath = readOption(args, '--events')

    if (eventsPath) {
      const state = runBattle(loadEventsJsonl(eventsPath), 'Showcase Replay')
      console.log(renderTerminal(state, skin, terminalOptions))
    } else {
      const transcripts = readPositionals(args)
      if (transcripts.length !== 2) throw new Error('replay requires --events or two transcript files')

      const state = runBattle(readTranscriptEvents(transcripts[0], transcripts[1]), 'Matched Race')
      console.log(renderTerminal(state, skin, terminalOptions))
    }
  } else if (command === 'export') {
    const outPath = readOption(args, '--out')
    const transcripts = readPositionals(args)

    if (!outPath) throw new Error('export requires --out')
    if (transcripts.length !== 2) throw new Error('export requires two transcript files')

    const state = runBattle(readTranscriptEvents(transcripts[0], transcripts[1]), 'Matched Race')
    writeBattleJson(outPath, state)
    console.log(`Wrote ${outPath}`)
  } else {
    printUsage()
    process.exit(1)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  printUsage()
  process.exit(1)
}

function readTerminalOptions(args: string[]): TerminalRenderOptions {
  const view = readOption(args, '--view', 'split')
  const agent = readOption(args, '--agent', 'codex')

  return {
    view: readTerminalView(view),
    agent: readAgentId(agent),
    soloAgent: readOptionalAgentId(readOption(args, '--solo')),
  }
}

function readTerminalView(view: string): TerminalView {
  if (view === 'scene' || view === 'split' || view === 'focus' || view === 'feed') return view
  throw new Error(`Unknown terminal view: ${view}`)
}

function readAgentId(agent: string): AgentId {
  if (agent === 'codex' || agent === 'claude') return agent
  throw new Error(`Unknown agent: ${agent}`)
}

function readOptionalAgentId(agent: string | undefined): AgentId | undefined {
  if (agent === undefined) return undefined
  return readAgentId(agent)
}

function readLiveEventInput(args: string[]) {
  const agent = readAgentId(readOption(args, '--agent', 'codex'))
  const type = readEventType(readOption(args, '--type', 'tool_used'))
  const label = readOption(args, '--label')
  const points = readOptionalNumber(readOption(args, '--points'))
  const severity = readSeverity(readOption(args, '--severity'))
  const verdict = readVerdict(readOption(args, '--verdict'))

  if (!label) throw new Error('emit requires --label')

  return {
    agent,
    type,
    label,
    ...(points === undefined ? {} : { points }),
    ...(severity === undefined ? {} : { severity }),
    ...(verdict === undefined ? {} : { verdict }),
  }
}

function readEventType(type: string): BattleEventType {
  const eventTypes: BattleEventType[] = [
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
  ]
  if (eventTypes.includes(type as BattleEventType)) return type as BattleEventType
  throw new Error(`Unknown event type: ${type}`)
}

function readOptionalNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`Expected numeric points, got: ${value}`)
  return parsed
}

function readSeverity(value: string | undefined): BattleEvent['severity'] | undefined {
  if (value === undefined) return undefined
  if (value === 'low' || value === 'medium' || value === 'high') return value
  throw new Error(`Unknown severity: ${value}`)
}

function readVerdict(value: string | undefined): JudgeVerdict | undefined {
  if (value === undefined) return undefined
  if (value === 'accepted' || value === 'partial' || value === 'regressed' || value === 'failed') return value
  throw new Error(`Unknown verdict: ${value}`)
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`Expected positive integer, got: ${value}`)
  return parsed
}

function splitLiveArgs(args: string[]): { options: string[]; command: string[] } {
  const separator = args.indexOf('--')
  if (separator < 0) return { options: args, command: [] }
  return {
    options: args.slice(0, separator),
    command: args.slice(separator + 1),
  }
}

function readOption(args: string[], name: string): string | undefined
function readOption(args: string[], name: string, fallback: string): string
function readOption(args: string[], name: string, fallback?: string): string | undefined {
  const index = args.indexOf(name)
  return index >= 0 ? (args[index + 1] ?? fallback) : fallback
}

function readPositionals(args: string[]): string[] {
  const values: string[] = []

  for (let index = 0; index < args.length; index += 1) {
    if (args[index].startsWith('--')) {
      index += 1
    } else {
      values.push(args[index])
    }
  }

  return values
}

function readTranscriptEvents(codexPath: string, claudePath: string) {
  return [
    ...parseTranscript('codex', readFileSync(codexPath, 'utf8')),
    ...parseTranscript('claude', readFileSync(claudePath, 'utf8')),
  ]
}

function printUsage(): void {
  console.error('Usage: pnpm arena demo [--skin default|./path] [--view scene|split|focus|feed] [--agent codex|claude] [--solo codex|claude]')
  console.error('   or: pnpm arena live [--events .agent-arena/live/events.jsonl] [--follow] [--interval 700] [--view scene|split|focus|feed] [--agent codex|claude] [--solo codex|claude] [-- <tmux-pane-command>]')
  console.error('   or: pnpm arena emit --agent codex --type test_passed --label "tests passed" [--events .agent-arena/live/events.jsonl]')
  console.error('   or: pnpm arena watch-log --agent codex --input .agent-arena/live/codex.log [--events .agent-arena/live/events.jsonl] [--once]')
  console.error('   or: pnpm arena scorecard [--skin default|./path]')
  console.error('   or: pnpm arena replay --events fixtures/demo-events.jsonl [--skin default|./path] [--view scene|split|focus|feed] [--agent codex|claude]')
  console.error('   or: pnpm arena replay fixtures/codex-sample.log fixtures/claude-sample.log [--skin default|./path] [--view scene|split|focus|feed] [--agent codex|claude]')
  console.error('   or: pnpm arena export fixtures/codex-sample.log fixtures/claude-sample.log --out src/web/demoBattle.json [--skin default|./path]')
  console.error('Compatibility aliases: --skin moba, --skin oldschool-mmo, --mode <skin>')
}
