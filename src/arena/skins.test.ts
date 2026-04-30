import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { describeEventForSkin, getSkin } from './skins'

describe('skins', () => {
  it('uses default as the built-in official skin', () => {
    expect(getSkin().id).toBe('default')
    expect(getSkin('default').id).toBe('default')
  })

  it('keeps old built-in skin names as compatibility aliases', () => {
    expect(getSkin('moba').id).toBe('default')
    expect(getSkin('oldschool-mmo').id).toBe('default')
    expect(describeEventForSkin('test_passed', getSkin('moba'))).toBe('check secured')
    expect(describeEventForSkin('test_passed', getSkin('oldschool-mmo'))).toBe('check secured')
  })

  it('falls back to default when a local third-party skin is unavailable', () => {
    const skin = getSkin('./themes/missing-skin')

    expect(skin.id).toBe('default')
    expect(skin.warning).toContain('Falling back to default')
  })

  it('loads presentation fields from a local skin manifest', () => {
    const tempSkinDir = mkdtempSync(join(tmpdir(), 'agent-arena-skin-'))

    try {
      writeFileSync(
        join(tempSkinDir, 'skin.json'),
        JSON.stringify({
          schemaVersion: 0,
          id: 'local-test-skin',
          displayName: 'Local Test Skin',
          labels: {
            score: 'score',
            momentum: 'momentum',
            blockers: 'blocker',
            subagents: 'assist',
            eventLog: 'feed',
            winner: 'finalResult',
          },
          glyphs: {
            codex: 'codex',
            claude: 'claude',
            blocker: 'blocker',
            subagent: 'assist',
            majorHit: 'score',
          },
          eventText: {
            test_passed: 'manifest test passed',
          },
          assets: {
            background: 'assets/missing-background.png',
            codexAvatar: 'assets/missing-codex.png',
          },
        }),
      )

      const skin = getSkin(tempSkinDir)

      expect(skin.id).toBe('local-test-skin')
      expect(skin.name).toBe('Local Test Skin')
      expect(skin.labels).toEqual({
        score: 'score',
        momentum: 'momentum',
        blocker: 'blocker',
        assist: 'assist',
        feed: 'feed',
        finalResult: 'finalResult',
      })
      expect(skin.glyphs).toEqual({
        codex: 'codex',
        claude: 'claude',
        blocker: 'blocker',
        assist: 'assist',
        score: 'score',
      })
      expect(describeEventForSkin('test_passed', skin)).toBe('manifest test passed')
    } finally {
      rmSync(tempSkinDir, { recursive: true, force: true })
    }
  })
})
