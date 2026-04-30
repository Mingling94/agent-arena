import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import process from 'node:process'

export function runCommandInLowerTmuxPane(command: string[]): void {
  if (!process.env.TMUX) {
    throw new Error('Running a command below the live HUD requires tmux. Use two terminal tabs, or run inside tmux.')
  }

  if (command.length === 0) return

  const shellCommand = command.map(shellQuote).join(' ')
  const lowerPanePercent = process.env.AGENT_ARENA_LOWER_PANE_PERCENT ?? '40'
  const result = spawnSync('tmux', ['split-window', '-v', '-p', lowerPanePercent, '-c', process.cwd(), '-P', '-F', '#{pane_id}', shellCommand], {
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    throw new Error('Failed to create tmux pane for live command')
  }

  const paneId = result.stdout.trim()
  if (paneId && process.env.AGENT_ARENA_LOWER_PANE_FILE) {
    writeFileSync(process.env.AGENT_ARENA_LOWER_PANE_FILE, paneId)
  }
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`
}
