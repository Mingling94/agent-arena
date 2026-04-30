import type { BattleEventType } from './types'

export type GameModeId = 'moba' | 'mmo'

export interface GameMode {
  id: GameModeId
  name: string
  labels: {
    objective: string
    blocker: string
    finalObjective: string
    assist: string
    momentum: string
    score: string
    feed: string
  }
  eventVocabulary: Partial<Record<BattleEventType, string>>
}

const MODES: Record<GameModeId, GameMode> = {
  moba: {
    id: 'moba',
    name: 'MOBA Mode',
    labels: {
      objective: 'objective',
      blocker: 'enemy objective',
      finalObjective: 'final objective',
      assist: 'assist',
      momentum: 'tempo',
      score: 'objective score',
      feed: 'observer feed',
    },
    eventVocabulary: {
      task_completed: 'final objective secured',
      test_passed: 'major objective secured',
      build_passed: 'final objective opened',
      test_failed: 'enemy objective appeared',
      blocker_detected: 'enemy objective contested',
      subagent_spawned: 'assist joined',
      tool_used: 'objective scouted',
      file_changed: 'tempo play made',
      fix_applied: 'objective captured',
      judge_verdict: 'observer ruling',
    },
  },
  mmo: {
    id: 'mmo',
    name: 'MMO Mode',
    labels: {
      objective: 'quest',
      blocker: 'encounter',
      finalObjective: 'quest completion',
      assist: 'party member',
      momentum: 'reputation',
      score: 'XP',
      feed: 'adventure log',
    },
    eventVocabulary: {
      task_completed: 'quest completed',
      test_passed: 'encounter cleared',
      build_passed: 'quest gate opened',
      test_failed: 'encounter escalated',
      blocker_detected: 'encounter discovered',
      subagent_spawned: 'party member joined',
      tool_used: 'quest scouted',
      file_changed: 'XP gained',
      fix_applied: 'encounter solved',
      judge_verdict: 'adventure log verdict',
    },
  },
}

export function getMode(mode: string = 'moba'): GameMode {
  if (mode === 'moba' || mode === 'mmo') return MODES[mode]
  throw new Error(`Unknown mode: ${mode}`)
}

export function describeEventForMode(type: BattleEventType, mode: GameMode): string {
  return mode.eventVocabulary[type] ?? type.replaceAll('_', ' ')
}
