import { spawnSync } from 'node:child_process'
import process from 'node:process'

export function runCommandInLowerTmuxPane(command: string[]): void {
  if (!process.env.TMUX) {
    throw new Error('Running a command below the live HUD requires tmux. Use two terminal tabs, or run inside tmux.')
  }

  if (command.length === 0) return

  const shellCommand = command.map(shellQuote).join(' ')
  const result = spawnSync('tmux', ['split-window', '-v', '-p', '65', '-c', process.cwd(), shellCommand], {
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    throw new Error('Failed to create tmux pane for live command')
  }
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`
}
