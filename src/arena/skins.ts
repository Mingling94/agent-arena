import type { BattleEventType } from './types'

export type SkinId = 'moba' | 'oldschool-mmo'

export interface ArenaSkin {
  id: SkinId | string
  name: string
  warning?: string
  labels: {
    blocker: string
    assist: string
    score: string
    momentum: string
    feed: string
    finalResult: string
  }
  glyphs: {
    codex: string
    claude: string
    blocker: string
    assist: string
    score: string
  }
  eventText: Partial<Record<BattleEventType, string>>
}

const SKINS: Record<SkinId, ArenaSkin> = {
  moba: {
    id: 'moba',
    name: 'MOBA',
    labels: {
      blocker: 'objective',
      assist: 'assist',
      score: 'objective score',
      momentum: 'tempo',
      feed: 'observer feed',
      finalResult: 'victory',
    },
    glyphs: { codex: 'C', claude: 'K', blocker: 'O', assist: 'A', score: '#' },
    eventText: {
      blocker_detected: 'objective contested',
      tool_used: 'vision gained',
      subagent_spawned: 'assist joined',
      file_changed: 'tempo play',
      fix_applied: 'objective captured',
      test_failed: 'lost tempo',
      test_passed: 'objective secured',
      build_passed: 'objective secured',
      task_completed: 'victory',
    },
  },
  'oldschool-mmo': {
    id: 'oldschool-mmo',
    name: 'Oldschool MMO',
    labels: {
      blocker: 'encounter',
      assist: 'party helper',
      score: 'XP / reputation',
      momentum: 'reputation',
      feed: 'adventure log',
      finalResult: 'quest complete',
    },
    glyphs: { codex: 'C', claude: 'K', blocker: 'E', assist: 'F', score: '*' },
    eventText: {
      blocker_detected: 'encounter discovered',
      tool_used: 'exploration',
      subagent_spawned: 'familiar joined',
      file_changed: 'crafting',
      fix_applied: 'encounter cleared',
      test_failed: 'encounter setback',
      test_passed: 'quest milestone',
      build_passed: 'quest milestone',
      task_completed: 'quest complete',
    },
  },
}

export function getSkin(skin: string = 'moba'): ArenaSkin {
  if (skin === 'moba' || skin === 'oldschool-mmo') return SKINS[skin]

  if (isPathLike(skin)) {
    return {
      ...SKINS.moba,
      warning: `Could not load ${skin}. Falling back to moba.`,
    }
  }

  throw new Error(`Unknown skin: ${skin}`)
}

export function describeEventForSkin(type: BattleEventType, skin: ArenaSkin): string {
  return skin.eventText[type] ?? type.replaceAll('_', ' ')
}

function isPathLike(skin: string): boolean {
  return skin.startsWith('.') || skin.startsWith('/') || skin.includes('/')
}
