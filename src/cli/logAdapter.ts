import { existsSync, readFileSync, statSync } from 'node:fs'
import process from 'node:process'
import { appendLiveEvent, DEFAULT_LIVE_EVENTS_PATH } from '../arena/liveStream'
import { classifyTranscriptLine } from '../arena/transcriptParser'
import type { AgentId } from '../arena/types'

const DEFAULT_INTERVAL_MS = 500

export interface LogAdapterOptions {
  agent: AgentId
  inputPath: string
  eventsPath?: string
  intervalMs?: number
  once?: boolean
}

export async function runLogAdapter(options: LogAdapterOptions): Promise<void> {
  const eventsPath = options.eventsPath ?? DEFAULT_LIVE_EVENTS_PATH
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS
  let offset = 0
  let partial = ''
  let emitted = 0
  let stopped = false

  const poll = () => {
    const result = readNewLines(options.inputPath, offset, partial)
    offset = result.offset
    partial = result.partial

    for (const line of result.lines) {
      const event = classifyTranscriptLine(line)
      if (!event) continue

      appendLiveEvent(
        {
          agent: options.agent,
          type: event.type,
          label: event.label,
        },
        eventsPath,
      )
      emitted += 1
    }

    if (result.lines.length > 0 || emitted > 0) {
      process.stdout.write(`\rWatching ${options.inputPath} -> ${eventsPath} | emitted ${emitted}`)
    }
  }

  poll()
  if (options.once) {
    process.stdout.write('\n')
    return
  }

  await new Promise<void>((resolve) => {
    const timer = setInterval(poll, intervalMs)
    const stop = () => {
      if (stopped) return
      stopped = true
      clearInterval(timer)
      process.stdout.write('\n')
      resolve()
    }

    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
  })
}

function readNewLines(inputPath: string, offset: number, partial: string): { lines: string[]; offset: number; partial: string } {
  if (!existsSync(inputPath)) return { lines: [], offset, partial }

  const size = statSync(inputPath).size
  const nextOffset = size < offset ? 0 : offset
  if (size <= nextOffset) return { lines: [], offset: nextOffset, partial }

  const input = readFileSync(inputPath).subarray(nextOffset).toString('utf8')
  const pieces = `${partial}${input}`.split(/\r?\n/)
  const completeLines = pieces.slice(0, -1).filter(Boolean)

  return {
    lines: completeLines,
    offset: size,
    partial: pieces.at(-1) ?? '',
  }
}
