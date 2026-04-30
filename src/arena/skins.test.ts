import { describe, expect, it } from 'vitest'
import { describeEventForSkin, getSkin } from './skins'

describe('skins', () => {
  it('uses moba as the default skin', () => {
    expect(getSkin().id).toBe('moba')
  })

  it('uses different presentation for the same event stream', () => {
    expect(describeEventForSkin('test_passed', getSkin('moba'))).toBe('objective secured')
    expect(describeEventForSkin('test_passed', getSkin('oldschool-mmo'))).toBe('quest milestone')
  })

  it('falls back to moba when a local third-party skin is unavailable', () => {
    const skin = getSkin('./themes/missing-skin')

    expect(skin.id).toBe('moba')
    expect(skin.warning).toContain('Falling back to moba')
  })
})
