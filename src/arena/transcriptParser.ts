import type { AgentId, BattleEvent, BattleEventType } from './types'

type Rule = {
  type: BattleEventType
  label: string
  match: (line: string) => boolean
}

const RULES: Rule[] = [
  { type: 'build_passed', label: 'build passed', match: (line) => /build (?:passed|succeeded|complete)/i.test(line) },
  { type: 'test_passed', label: 'tests passed', match: (line) => /(?:✓|passed|pass\b|all tests)/i.test(line) },
  { type: 'test_failed', label: 'tests failed', match: (line) => /(?:✗|failed|fail\b|error)/i.test(line) },
  { type: 'subagent_spawned', label: 'subagent spawned', match: (line) => /subagent|agent spawned|spawned/i.test(line) },
  { type: 'file_changed', label: 'file changed', match: (line) => /(?:modified|created|updated|patched|wrote|changed)/i.test(line) },
  { type: 'tool_used', label: 'tool used', match: (line) => /(?:pnpm|npm|yarn|rg\b|grep|sed|cat|git|tsx|node)/i.test(line) },
]

export function parseTranscript(agent: AgentId, input: string): BattleEvent[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.length > 0)
    .flatMap(({ line, index }) => {
      const rule = RULES.find((candidate) => candidate.match(line))
      if (!rule) return []

      return [
        {
          id: `${agent}-${index + 1}`,
          type: rule.type,
          agent,
          at: index + 1,
          label: rule.label,
        },
      ]
    })
}
