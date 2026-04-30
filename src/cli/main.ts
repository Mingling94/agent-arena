#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { demoEvents } from '../arena/demoEvents'
import { runBattle } from '../arena/engine'
import { loadEventsJsonl, writeBattleJson } from '../arena/io'
import { getSkin } from '../arena/skins'
import { parseTranscript } from '../arena/transcriptParser'
import { formatScorecard } from './formatScorecard'
import { renderTerminal } from './renderTerminal'

declare const process: {
  argv: string[]
  exit(code?: number): never
}

const command = process.argv[2] ?? 'demo'
const args = process.argv.slice(3)

try {
  const skinName = readOption(args, '--skin', readOption(args, '--mode', 'moba'))
  const skin = getSkin(skinName)

  if (skin.warning) console.warn(skin.warning)

  if (command === 'demo') {
    const state = runBattle(demoEvents, 'Demo Mode')
    console.log(renderTerminal(state, skin))
  } else if (command === 'scorecard') {
    const state = runBattle(demoEvents, 'Demo Mode')
    console.log(formatScorecard(state, skin))
  } else if (command === 'replay') {
    const eventsPath = readOption(args, '--events')

    if (eventsPath) {
      const state = runBattle(loadEventsJsonl(eventsPath), 'Showcase Replay')
      console.log(renderTerminal(state, skin))
    } else {
      const transcripts = readPositionals(args)
      if (transcripts.length !== 2) throw new Error('replay requires --events or two transcript files')

      const state = runBattle(readTranscriptEvents(transcripts[0], transcripts[1]), 'Matched Race')
      console.log(renderTerminal(state, skin))
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
  console.error('Usage: pnpm arena demo [--skin moba|oldschool-mmo|./path]')
  console.error('   or: pnpm arena scorecard [--skin moba|oldschool-mmo]')
  console.error('   or: pnpm arena replay --events fixtures/demo-events.jsonl [--skin moba|oldschool-mmo]')
  console.error('   or: pnpm arena replay fixtures/codex-sample.log fixtures/claude-sample.log [--skin moba|oldschool-mmo]')
  console.error('   or: pnpm arena export fixtures/codex-sample.log fixtures/claude-sample.log --out src/web/demoBattle.json [--skin moba|oldschool-mmo]')
  console.error('Legacy alias: --mode moba|oldschool-mmo')
}
