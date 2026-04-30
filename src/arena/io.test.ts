import { describe, expect, it } from 'vitest'
import { parseEventsJsonl } from './io'
import { classifyTranscriptLine, parseTranscript } from './transcriptParser'

describe('arena io', () => {
  it('parseEventsJsonl parses a normalized event line into a test_passed BattleEvent', () => {
    const events = parseEventsJsonl(
      '{"id":"e1","type":"test_passed","agent":"codex","at":7,"label":"unit tests passed"}\n',
    )

    expect(events).toEqual([
      {
        id: 'e1',
        type: 'test_passed',
        agent: 'codex',
        at: 7,
        label: 'unit tests passed',
      },
    ])
  })

  it("parseTranscript maps Codex's passing test output to a test_passed event", () => {
    const events = parseTranscript('codex', 'pnpm test\n✓ tests passed\n')

    expect(events).toContainEqual({
      id: 'codex-2',
      type: 'test_passed',
      agent: 'codex',
      at: 2,
      label: 'tests passed',
    })
  })

  it('classifyTranscriptLine maps one log line into a normalized live event shape', () => {
    expect(classifyTranscriptLine('pnpm build passed')).toEqual({
      type: 'build_passed',
      label: 'build passed',
    })

    expect(classifyTranscriptLine('no interesting signal')).toBeNull()
  })
})
