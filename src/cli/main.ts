#!/usr/bin/env node
import { demoEvents } from '../arena/demoEvents'
import { runBattle } from '../arena/engine'
import { formatScorecard } from './formatScorecard'
import { renderTerminal } from './renderTerminal'

declare const process: {
  argv: string[]
  exit(code?: number): never
}

const command = process.argv[2] ?? 'demo'

if (command === 'demo') {
  const state = runBattle(demoEvents, 'Demo Mode')
  console.log(renderTerminal(state))
} else if (command === 'scorecard') {
  const state = runBattle(demoEvents, 'Demo Mode')
  console.log(formatScorecard(state))
} else {
  console.error('Usage: pnpm arena demo | pnpm arena scorecard')
  process.exit(1)
}
