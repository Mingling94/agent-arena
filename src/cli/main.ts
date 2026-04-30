#!/usr/bin/env node
import { demoEvents } from '../arena/demoEvents'
import { runBattle } from '../arena/engine'
import { getMode } from '../arena/modes'
import { defaultThemeForMode, getTheme } from '../arena/themes'
import { formatScorecard } from './formatScorecard'
import { renderTerminal } from './renderTerminal'

declare const process: {
  argv: string[]
  exit(code?: number): never
}

const command = process.argv[2] ?? 'demo'
const args = process.argv.slice(3)

try {
  const mode = getMode(readOption(args, '--mode', 'moba'))
  const themeName = readOption(args, '--theme', defaultThemeForMode(mode.id))
  const theme = getTheme(themeName, mode.id)

  if (theme.warning) console.warn(theme.warning)

  if (command === 'demo') {
    const state = runBattle(demoEvents, 'Demo Mode')
    console.log(renderTerminal(state, mode, theme))
  } else if (command === 'scorecard') {
    const state = runBattle(demoEvents, 'Demo Mode')
    console.log(formatScorecard(state, mode))
  } else {
    console.error('Usage: pnpm arena demo [--mode moba|mmo] [--theme terminal|moba-default|mmo-default|./path]')
    console.error('   or: pnpm arena scorecard [--mode moba|mmo]')
    process.exit(1)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  console.error('Usage: pnpm arena demo [--mode moba|mmo] [--theme terminal|moba-default|mmo-default|./path]')
  console.error('   or: pnpm arena scorecard [--mode moba|mmo]')
  process.exit(1)
}

function readOption(args: string[], name: string, fallback: string): string {
  const index = args.indexOf(name)
  return index >= 0 ? (args[index + 1] ?? fallback) : fallback
}
