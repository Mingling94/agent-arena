import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { BattleEventType } from './types'

export type SkinId = 'default'

export interface ArenaSkin {
  id: SkinId | string
  name: string
  warning?: string
  description?: string
  labels: {
    battleTitle?: string
    blocker: string
    assist: string
    score: string
    health?: string
    momentum: string
    feed: string
    scorecard?: string
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
  presentation?: {
    licenseNote?: string
    palette?: Partial<Record<'background' | 'panel' | 'accent' | 'accentAlt' | 'codex' | 'claude' | 'positive' | 'negative' | 'muted', string>>
  }
}

const SKINS: Record<SkinId, ArenaSkin> = {
  default: {
    id: 'default',
    name: 'Default Arena',
    description: 'Official generic Agent Arena presentation.',
    labels: {
      blocker: 'blocker',
      assist: 'helper',
      score: 'score',
      momentum: 'momentum',
      feed: 'event feed',
      finalResult: 'victory',
    },
    glyphs: { codex: 'C', claude: 'K', blocker: 'B', assist: '+', score: '*' },
    eventText: {
      blocker_detected: 'blocker spotted',
      tool_used: 'context gathered',
      subagent_spawned: 'helper joined',
      file_changed: 'file updated',
      fix_applied: 'blocker resolved',
      test_failed: 'failed check',
      test_passed: 'check secured',
      build_passed: 'check secured',
      task_completed: 'victory',
    },
  },
}

export function getSkin(skin: string = 'default'): ArenaSkin {
  if (skin === 'default' || skin === 'moba' || skin === 'oldschool-mmo') {
    return SKINS.default
  }

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
    ...SKINS.default,
    warning: `Could not load ${skin}. Falling back to default.`,
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
    description: readOptionalString(manifest, 'description'),
    labels: {
      ...readOptionalLabel(labels, 'battleTitle'),
      score: readString(labels, 'score'),
      ...readOptionalLabel(labels, 'health'),
      momentum: readString(labels, 'momentum'),
      blocker: readString(labels, 'blockers'),
      assist: readString(labels, 'subagents'),
      feed: readString(labels, 'eventLog'),
      ...readOptionalLabel(labels, 'scorecard'),
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
    presentation: {
      licenseNote: readOptionalString(manifest, 'licenseNote'),
      palette: isRecord(manifest.palette) ? readPalette(manifest.palette) : undefined,
    },
  }
}

function readOptionalLabel(record: Record<string, unknown>, key: 'battleTitle' | 'health' | 'scorecard'): Partial<ArenaSkin['labels']> {
  const value = readOptionalString(record, key)
  return value === undefined ? {} : { [key]: value }
}

function readPalette(palette: Record<string, unknown>): NonNullable<ArenaSkin['presentation']>['palette'] {
  const keys = ['background', 'panel', 'accent', 'accentAlt', 'codex', 'claude', 'positive', 'negative', 'muted'] as const

  return Object.fromEntries(
    keys.flatMap((key) => {
      const value = palette[key]
      return typeof value === 'string' ? [[key, value]] : []
    }),
  )
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

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key]

  return typeof value === 'string' ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
