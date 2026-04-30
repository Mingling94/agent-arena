import { describe, expect, it } from 'vitest'
import { getMode } from './modes'
import { getTheme } from './themes'

describe('modes', () => {
  it('uses moba as the default mode', () => {
    expect(getMode().id).toBe('moba')
  })

  it('uses different vocabulary for moba and mmo', () => {
    expect(getMode('moba').labels.finalObjective).toBe('final objective')
    expect(getMode('mmo').labels.finalObjective).toBe('quest completion')
  })
})

describe('themes', () => {
  it('resolves bundled legally clean themes', () => {
    expect(getTheme('terminal').id).toBe('terminal')
    expect(getTheme('moba-default').id).toBe('moba-default')
    expect(getTheme('mmo-default').id).toBe('mmo-default')
  })

  it('falls back to moba-default when a local third-party moba theme is unavailable', () => {
    const theme = getTheme('./themes/missing-theme', 'moba')

    expect(theme.id).toBe('moba-default')
    expect(theme.warning).toContain('Falling back to moba-default')
  })
})
