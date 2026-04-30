#!/usr/bin/env node
import { demoEvents } from '../arena/demoEvents'
import { runBattle } from '../arena/engine'
import { getSkin } from '../arena/skins'
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
  } else {
    printUsage()
    process.exit(1)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  printUsage()
  process.exit(1)
}

function readOption(args: string[], name: string, fallback: string): string {
  const index = args.indexOf(name)
  return index >= 0 ? (args[index + 1] ?? fallback) : fallback
}

function printUsage(): void {
  console.error('Usage: pnpm arena demo [--skin moba|oldschool-mmo|./path]')
  console.error('   or: pnpm arena demo [--mode moba|oldschool-mmo]')
  console.error('   or: pnpm arena scorecard [--skin moba|oldschool-mmo]')
}
