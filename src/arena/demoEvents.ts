import type { BattleEvent } from './types'

export const demoEvents: BattleEvent[] = [
  { id: 'd1', type: 'agent_started', agent: 'codex', at: 1, label: 'entered the repo' },
  { id: 'd2', type: 'agent_started', agent: 'claude', at: 1, label: 'entered the repo' },
  { id: 'd3', type: 'tool_used', agent: 'claude', at: 2, label: 'mapped the file tree' },
  { id: 'd4', type: 'tool_used', agent: 'codex', at: 3, label: 'read the spec and package scripts' },
  { id: 'd5', type: 'blocker_detected', agent: 'codex', at: 4, label: 'Type Error Hydra appeared' },
  { id: 'd6', type: 'subagent_spawned', agent: 'codex', at: 5, label: 'Test familiar summoned' },
  { id: 'd7', type: 'file_changed', agent: 'claude', at: 6, label: 'patched UI quickly' },
  { id: 'd8', type: 'test_failed', agent: 'claude', at: 7, label: 'lint failed after patch' },
  { id: 'd9', type: 'fix_applied', agent: 'codex', at: 8, label: 'fixed event reducer edge case' },
  { id: 'd10', type: 'test_passed', agent: 'codex', at: 9, label: 'unit tests passed' },
  { id: 'd11', type: 'build_passed', agent: 'codex', at: 10, label: 'production build passed' },
  {
    id: 'd12',
    type: 'judge_verdict',
    agent: 'codex',
    at: 11,
    label: 'custom judge accepted outcome',
    verdict: 'accepted',
  },
  { id: 'd13', type: 'task_completed', agent: 'codex', at: 12, label: 'match replay delivered' },
]
