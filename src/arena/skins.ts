import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
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
    const manifestPath = resolveSkinManifestPath(skin)

    if (manifestPath) {
      try {
        return loadSkinManifest(manifestPath)
      } catch {
        return fallbackSkin(skin)
      }
    }

    return fallbackSkin(skin)
  }

  throw new Error(`Unknown skin: ${skin}`)
}

export function describeEventForSkin(type: BattleEventType, skin: ArenaSkin): string {
  return skin.eventText[type] ?? type.replaceAll('_', ' ')
}

function isPathLike(skin: string): boolean {
  return skin.startsWith('.') || skin.startsWith('/') || skin.includes('/')
}

function resolveSkinManifestPath(skin: string): string | null {
  const manifestPath = join(skin, 'skin.json')

  if (existsSync(manifestPath)) return manifestPath

  return resolveExternalSidecarManifestPath(skin)
}

function resolveExternalSidecarManifestPath(skin: string): string | null {
  const pathParts = skin.split(/[\\/]+/)
  const externalSkinsIndex = pathParts.lastIndexOf('external-skins')

  if (externalSkinsIndex === -1) return null

  const sidecarPathParts = pathParts.slice(externalSkinsIndex + 1)
  let currentDirectory = process.cwd()

  while (true) {
    const candidatePath = join(currentDirectory, 'external-skins', ...sidecarPathParts, 'skin.json')
    if (existsSync(candidatePath)) return candidatePath

    const parentDirectory = dirname(currentDirectory)
    if (parentDirectory === currentDirectory) return null

    currentDirectory = parentDirectory
  }
}

function fallbackSkin(skin: string): ArenaSkin {
  return {
    ...SKINS.moba,
    warning: `Could not load ${skin}. Falling back to moba.`,
  }
}

function loadSkinManifest(manifestPath: string): ArenaSkin {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown

  if (!isRecord(manifest)) throw new Error('Invalid skin manifest')
  if (manifest.schemaVersion !== 0) throw new Error('Unsupported skin manifest schema')
  if (typeof manifest.id !== 'string') throw new Error('Invalid skin manifest id')
  if (typeof manifest.displayName !== 'string') throw new Error('Invalid skin displayName')
  if (!isRecord(manifest.labels)) throw new Error('Invalid skin labels')
  if (!isRecord(manifest.glyphs)) throw new Error('Invalid skin glyphs')
  if (!isRecord(manifest.eventText)) throw new Error('Invalid skin eventText')

  const labels = manifest.labels
  const glyphs = manifest.glyphs

  return {
    id: manifest.id,
    name: manifest.displayName,
    labels: {
      score: readString(labels, 'score'),
      momentum: readString(labels, 'momentum'),
      blocker: readString(labels, 'blockers'),
      assist: readString(labels, 'subagents'),
      feed: readString(labels, 'eventLog'),
      finalResult: readString(labels, 'winner'),
    },
    glyphs: {
      codex: readString(glyphs, 'codex'),
      claude: readString(glyphs, 'claude'),
      blocker: readString(glyphs, 'blocker'),
      assist: readString(glyphs, 'subagent'),
      score: readString(glyphs, 'majorHit'),
    },
    eventText: readEventText(manifest.eventText),
  }
}

function readEventText(eventText: Record<string, unknown>): Partial<Record<BattleEventType, string>> {
  return Object.fromEntries(
    Object.entries(eventText).filter((entry): entry is [BattleEventType, string] => {
      const [, value] = entry
      return typeof value === 'string'
    }),
  )
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key]

  if (typeof value !== 'string') throw new Error(`Invalid skin manifest field: ${key}`)

  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
