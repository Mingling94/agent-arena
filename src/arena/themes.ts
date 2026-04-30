import type { GameModeId } from './modes'

export type ThemeId = 'terminal' | 'moba-default' | 'mmo-default'

export interface ArenaTheme {
  id: ThemeId | string
  name: string
  warning?: string
  colors: {
    codex: string
    claude: string
    accent: string
    danger: string
  }
  glyphs: {
    codex: string
    claude: string
    blocker: string
    assist: string
    objective: string
  }
  frame: {
    horizontal: string
    vertical: string
    corner: string
  }
}

const THEMES: Record<ThemeId, ArenaTheme> = {
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    colors: { codex: 'cyan', claude: 'magenta', accent: 'white', danger: 'red' },
    glyphs: { codex: 'C', claude: 'K', blocker: 'X', assist: '+', objective: '*' },
    frame: { horizontal: '=', vertical: '|', corner: '+' },
  },
  'moba-default': {
    id: 'moba-default',
    name: 'MOBA Default',
    colors: { codex: 'blue', claude: 'red', accent: 'yellow', danger: 'red' },
    glyphs: { codex: 'C', claude: 'K', blocker: 'O', assist: 'A', objective: '#' },
    frame: { horizontal: '=', vertical: '|', corner: '+' },
  },
  'mmo-default': {
    id: 'mmo-default',
    name: 'MMO Default',
    colors: { codex: 'green', claude: 'purple', accent: 'gold', danger: 'red' },
    glyphs: { codex: 'C', claude: 'K', blocker: 'B', assist: 'P', objective: 'Q' },
    frame: { horizontal: '-', vertical: '|', corner: '+' },
  },
}

export function defaultThemeForMode(mode: GameModeId | string = 'moba'): ThemeId {
  return mode === 'mmo' ? 'mmo-default' : 'moba-default'
}

export function getTheme(theme: string = 'moba-default', mode: GameModeId | string = 'moba'): ArenaTheme {
  if (theme === 'terminal' || theme === 'moba-default' || theme === 'mmo-default') {
    return THEMES[theme]
  }

  if (isPathLike(theme)) {
    const fallbackId = defaultThemeForMode(mode)
    return {
      ...THEMES[fallbackId],
      warning: `Could not load ${theme}. Falling back to ${fallbackId}.`,
    }
  }

  throw new Error(`Unknown theme: ${theme}`)
}

function isPathLike(theme: string): boolean {
  return theme.startsWith('.') || theme.startsWith('/') || theme.includes('/')
}
