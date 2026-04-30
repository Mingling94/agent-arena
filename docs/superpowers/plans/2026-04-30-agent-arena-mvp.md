# Agent Arena MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a terminal-first Agent Arena MVP that can run a deterministic Codex vs Claude Code match, explain the score, replay event files, export JSON, and optionally show the same match in a lightweight web spectator.

**Architecture:** Create a renderer-agnostic TypeScript core under `src/arena/` with normalized events, battle state, scoring, demo fixtures, and serialization. Add a Node CLI under `src/cli/` that uses the core and renders ANSI frames. Keep the React app as a web replay viewer that imports the same core data model.

**Tech Stack:** TypeScript, Vite, React, pnpm, Node CLI, Vitest for core tests, ANSI terminal output without heavy TUI dependencies.

---

## File Structure

- `src/arena/types.ts`: shared event, score, agent, judge, and battle-state types.
- `src/arena/scoring.ts`: maps normalized events to score deltas, damage, highlights, and judge overrides.
- `src/arena/engine.ts`: reduces event streams into battle snapshots and final summaries.
- `src/arena/demoEvents.ts`: deterministic Codex-vs-Claude demo event stream.
- `src/arena/io.ts`: JSONL parsing, JSON export, and fixture loading helpers.
- `src/arena/transcriptParser.ts`: heuristic parser for simple Codex/Claude transcript fixtures.
- `src/cli/main.ts`: command dispatcher for `demo`, `replay`, `export`, and `scorecard`.
- `src/cli/renderTerminal.ts`: ANSI terminal scoreboard/battle renderer.
- `src/cli/formatScorecard.ts`: text highlight reel and explainable score output.
- `src/web/demoBattle.json`: exported demo battle fixture for the web app.
- `src/App.tsx`: web replay/spectator surface.
- `src/App.css` and `src/index.css`: replace Vite starter UI with Agent Arena styling.
- `fixtures/demo-events.jsonl`: deterministic demo input.
- `fixtures/codex-sample.log` and `fixtures/claude-sample.log`: small parser fixtures.
- `docs/demo-script.md`: 2-minute pre-recorded demo script.
- `README.md`: update with CLI commands, judging framing, setup, and demo instructions.
- `package.json`: add CLI bin, scripts, and test/dev dependencies.

---

### Task 1: Test Harness And CLI Packaging

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.app.json`
- Create: `src/arena/types.ts`
- Create: `src/arena/engine.test.ts`

- [ ] **Step 1: Add test and CLI dependencies**

Update `package.json` scripts and dev dependencies:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "arena": "tsx src/cli/main.ts"
  },
  "bin": {
    "agent-arena": "./dist-cli/main.js"
  },
  "devDependencies": {
    "tsx": "^4.20.6",
    "vitest": "^4.0.15"
  }
}
```

Preserve existing dependencies and versions.

- [ ] **Step 2: Install dependencies**

Run:

```bash
pnpm install
```

Expected: lockfile updates and `tsx`/`vitest` are installed.

- [ ] **Step 3: Create core type definitions**

Create `src/arena/types.ts`:

```ts
export type AgentId = 'codex' | 'claude'

export type RaceLabel = 'Demo Mode' | 'Showcase Replay' | 'Matched Race'

export type BattleEventType =
  | 'agent_started'
  | 'tool_used'
  | 'file_changed'
  | 'blocker_detected'
  | 'subagent_spawned'
  | 'fix_applied'
  | 'test_failed'
  | 'test_passed'
  | 'build_passed'
  | 'judge_verdict'
  | 'task_completed'

export type JudgeVerdict = 'accepted' | 'partial' | 'regressed' | 'failed'

export interface BattleEvent {
  id: string
  type: BattleEventType
  agent: AgentId
  at: number
  label: string
  points?: number
  severity?: 'low' | 'medium' | 'high'
  verdict?: JudgeVerdict
}

export interface ScoreDelta {
  eventId: string
  agent: AgentId
  points: number
  reason: string
  category: 'outcome' | 'activity' | 'penalty' | 'judge'
}

export interface AgentState {
  id: AgentId
  name: string
  score: number
  health: number
  momentum: number
  familiars: string[]
}

export interface BattleState {
  label: RaceLabel
  agents: Record<AgentId, AgentState>
  blockers: string[]
  log: string[]
  deltas: ScoreDelta[]
  highlights: string[]
  winner: AgentId | 'tie' | null
}
```

- [ ] **Step 4: Write a failing engine test**

Create `src/arena/engine.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { runBattle } from './engine'
import type { BattleEvent } from './types'

describe('runBattle', () => {
  it('rewards verified outcomes more than raw activity', () => {
    const events: BattleEvent[] = [
      { id: 'c1', type: 'tool_used', agent: 'claude', at: 1, label: 'read files' },
      { id: 'c2', type: 'tool_used', agent: 'claude', at: 2, label: 'searched repo' },
      { id: 'x1', type: 'test_passed', agent: 'codex', at: 3, label: 'unit tests passed' },
    ]

    const result = runBattle(events, 'Matched Race')

    expect(result.agents.codex.score).toBeGreaterThan(result.agents.claude.score)
    expect(result.highlights).toContain('Codex landed a major hit: unit tests passed')
  })
})
```

- [ ] **Step 5: Verify the test fails**

Run:

```bash
pnpm test
```

Expected: FAIL because `src/arena/engine.ts` does not exist.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/arena/types.ts src/arena/engine.test.ts
git commit -m "test: add arena core harness"
```

---

### Task 2: Core Battle Engine And Scoring

**Files:**
- Create: `src/arena/scoring.ts`
- Create: `src/arena/engine.ts`
- Modify: `src/arena/engine.test.ts`

- [ ] **Step 1: Write scoring tests for penalties and judge overrides**

Append to `src/arena/engine.test.ts`:

```ts
it('lets custom judge verdicts override generic activity', () => {
  const result = runBattle(
    [
      { id: 'a1', type: 'tool_used', agent: 'claude', at: 1, label: 'many actions' },
      { id: 'a2', type: 'file_changed', agent: 'claude', at: 2, label: 'edited files' },
      {
        id: 'j1',
        type: 'judge_verdict',
        agent: 'codex',
        at: 3,
        label: 'maintainer accepted patch',
        verdict: 'accepted',
      },
    ],
    'Matched Race',
  )

  expect(result.agents.codex.score).toBeGreaterThan(result.agents.claude.score)
  expect(result.deltas.at(-1)?.category).toBe('judge')
})

it('penalizes regressions and repeated failures', () => {
  const result = runBattle(
    [
      { id: 'b1', type: 'test_failed', agent: 'claude', at: 1, label: 'tests failed' },
      { id: 'b2', type: 'test_failed', agent: 'claude', at: 2, label: 'same tests failed again' },
    ],
    'Showcase Replay',
  )

  expect(result.agents.claude.score).toBeLessThan(0)
  expect(result.agents.claude.health).toBeLessThan(100)
})
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm test
```

Expected: FAIL because scoring implementation is missing.

- [ ] **Step 3: Implement scoring**

Create `src/arena/scoring.ts`:

```ts
import type { BattleEvent, ScoreDelta } from './types'

const SCORE_BY_TYPE: Record<BattleEvent['type'], number> = {
  agent_started: 0,
  tool_used: 10,
  file_changed: 25,
  blocker_detected: -20,
  subagent_spawned: 35,
  fix_applied: 90,
  test_failed: -60,
  test_passed: 220,
  build_passed: 260,
  judge_verdict: 0,
  task_completed: 320,
}

const JUDGE_POINTS = {
  accepted: 500,
  partial: 160,
  regressed: -220,
  failed: -320,
} as const

export function scoreEvent(event: BattleEvent): ScoreDelta {
  if (event.type === 'judge_verdict' && event.verdict) {
    return {
      eventId: event.id,
      agent: event.agent,
      points: event.points ?? JUDGE_POINTS[event.verdict],
      reason: `Custom judge: ${event.label}`,
      category: 'judge',
    }
  }

  const points = event.points ?? SCORE_BY_TYPE[event.type]
  const category: ScoreDelta['category'] =
    points < 0
      ? 'penalty'
      : ['test_passed', 'build_passed', 'task_completed', 'fix_applied'].includes(event.type)
        ? 'outcome'
        : 'activity'

  return {
    eventId: event.id,
    agent: event.agent,
    points,
    reason: event.label,
    category,
  }
}
```

- [ ] **Step 4: Implement battle reducer**

Create `src/arena/engine.ts`:

```ts
import { scoreEvent } from './scoring'
import type { AgentId, BattleEvent, BattleState, RaceLabel } from './types'

const AGENT_NAMES: Record<AgentId, string> = {
  codex: 'Codex',
  claude: 'Claude Code',
}

export function createInitialBattle(label: RaceLabel): BattleState {
  return {
    label,
    agents: {
      codex: { id: 'codex', name: 'Codex', score: 0, health: 100, momentum: 0, familiars: [] },
      claude: { id: 'claude', name: 'Claude Code', score: 0, health: 100, momentum: 0, familiars: [] },
    },
    blockers: [],
    log: [],
    deltas: [],
    highlights: [],
    winner: null,
  }
}

export function runBattle(events: BattleEvent[], label: RaceLabel): BattleState {
  const state = createInitialBattle(label)
  const sortedEvents = [...events].sort((a, b) => a.at - b.at)

  for (const event of sortedEvents) {
    const agent = state.agents[event.agent]
    const delta = scoreEvent(event)

    agent.score += delta.points
    agent.momentum = Math.max(-100, Math.min(100, agent.momentum + Math.sign(delta.points) * 10))

    if (delta.points < 0) {
      agent.health = Math.max(0, agent.health + delta.points / 3)
    }

    if (event.type === 'blocker_detected' || event.type === 'test_failed') {
      state.blockers = [event.label, ...state.blockers].slice(0, 3)
    }

    if (event.type === 'subagent_spawned') {
      agent.familiars = [event.label, ...agent.familiars].slice(0, 3)
    }

    if (event.type === 'test_passed' || event.type === 'build_passed' || event.type === 'task_completed') {
      state.highlights.push(`${agent.name} landed a major hit: ${event.label}`)
    }

    if (event.type === 'judge_verdict') {
      state.highlights.push(`${agent.name} received judge verdict: ${event.label}`)
    }

    state.deltas.push(delta)
    state.log.push(`${agent.name}: ${event.label} (${delta.points >= 0 ? '+' : ''}${delta.points})`)
  }

  state.winner = pickWinner(state)
  return state
}

function pickWinner(state: BattleState): BattleState['winner'] {
  const codex = state.agents.codex.score
  const claude = state.agents.claude.score
  if (codex === claude) return 'tie'
  return codex > claude ? 'codex' : 'claude'
}
```

- [ ] **Step 5: Verify tests pass**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/arena/scoring.ts src/arena/engine.ts src/arena/engine.test.ts
git commit -m "feat: add battle scoring engine"
```

---

### Task 3: Demo Events And Terminal Renderer

**Files:**
- Create: `src/arena/demoEvents.ts`
- Create: `src/cli/renderTerminal.ts`
- Create: `src/cli/formatScorecard.ts`
- Create: `src/cli/main.ts`

- [ ] **Step 1: Create deterministic demo events**

Create `src/arena/demoEvents.ts`:

```ts
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
  { id: 'd12', type: 'judge_verdict', agent: 'codex', at: 11, label: 'custom judge accepted outcome', verdict: 'accepted' },
  { id: 'd13', type: 'task_completed', agent: 'codex', at: 12, label: 'match replay delivered' },
]
```

- [ ] **Step 2: Implement terminal renderer**

Create `src/cli/renderTerminal.ts`:

```ts
import type { AgentState, BattleState } from '../arena/types'

export function renderTerminal(state: BattleState): string {
  const codex = renderAgent(state.agents.codex)
  const claude = renderAgent(state.agents.claude)
  const blockers = state.blockers.length > 0 ? state.blockers.join(' | ') : 'No active blockers'
  const log = state.log.slice(-8).map((line) => `  ${line}`).join('\n')
  const highlights = state.highlights.slice(-4).map((line) => `  * ${line}`).join('\n')
  const winner = state.winner ? `Winner: ${state.winner === 'tie' ? 'Tie' : state.agents[state.winner].name}` : 'Winner: pending'

  return [
    'AGENT ARENA',
    `Mode: ${state.label}  ${winner}`,
    '================================================================',
    codex,
    '-------------------------- BLOCKERS ----------------------------',
    `  ${blockers}`,
    '----------------------------------------------------------------',
    claude,
    '-------------------------- HIGHLIGHTS --------------------------',
    highlights || '  No highlights yet',
    '---------------------------- LOG -------------------------------',
    log || '  No events yet',
    '================================================================',
  ].join('\n')
}

function renderAgent(agent: AgentState): string {
  const familiars = agent.familiars.length > 0 ? agent.familiars.join(', ') : 'none'
  return [
    `${agent.name}`,
    `  Score: ${agent.score}  Health: ${Math.round(agent.health)}  Momentum: ${agent.momentum}`,
    `  Familiars: ${familiars}`,
  ].join('\n')
}
```

- [ ] **Step 3: Implement scorecard formatter**

Create `src/cli/formatScorecard.ts`:

```ts
import type { BattleState } from '../arena/types'

export function formatScorecard(state: BattleState): string {
  const deltas = state.deltas
    .map((delta) => {
      const sign = delta.points >= 0 ? '+' : ''
      return `${sign}${delta.points} ${state.agents[delta.agent].name}: ${delta.reason} [${delta.category}]`
    })
    .join('\n')

  return [
    `Scorecard (${state.label})`,
    `Codex: ${state.agents.codex.score}`,
    `Claude Code: ${state.agents.claude.score}`,
    `Winner: ${state.winner === 'tie' ? 'Tie' : state.winner ? state.agents[state.winner].name : 'pending'}`,
    '',
    'Decisive moments:',
    ...state.highlights.map((highlight) => `- ${highlight}`),
    '',
    'Score changes:',
    deltas,
  ].join('\n')
}
```

- [ ] **Step 4: Implement CLI demo and scorecard commands**

Create `src/cli/main.ts`:

```ts
#!/usr/bin/env node
import { demoEvents } from '../arena/demoEvents'
import { runBattle } from '../arena/engine'
import { formatScorecard } from './formatScorecard'
import { renderTerminal } from './renderTerminal'

const command = process.argv[2] ?? 'demo'

if (command === 'demo') {
  const state = runBattle(demoEvents, 'Demo Mode')
  console.log(renderTerminal(state))
} else if (command === 'scorecard') {
  const state = runBattle(demoEvents, 'Demo Mode')
  console.log(formatScorecard(state))
} else {
  console.error(`Unknown command: ${command}`)
  console.error('Usage: pnpm arena demo | pnpm arena scorecard')
  process.exit(1)
}
```

- [ ] **Step 5: Verify terminal demo**

Run:

```bash
pnpm arena demo
pnpm arena scorecard
```

Expected: terminal output shows Codex, Claude Code, blockers, familiars, highlights, score deltas, and Codex as winner.

- [ ] **Step 6: Run checks**

Run:

```bash
pnpm test
pnpm lint
pnpm build
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/arena/demoEvents.ts src/cli/renderTerminal.ts src/cli/formatScorecard.ts src/cli/main.ts
git commit -m "feat: add terminal arena demo"
```

---

### Task 4: JSONL Replay, Transcript Fixtures, And Export

**Files:**
- Create: `src/arena/io.ts`
- Create: `src/arena/transcriptParser.ts`
- Create: `fixtures/demo-events.jsonl`
- Create: `fixtures/codex-sample.log`
- Create: `fixtures/claude-sample.log`
- Modify: `src/cli/main.ts`
- Create: `src/arena/io.test.ts`

- [ ] **Step 1: Write IO tests**

Create `src/arena/io.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseEventsJsonl } from './io'
import { parseTranscript } from './transcriptParser'

describe('parseEventsJsonl', () => {
  it('parses normalized event lines', () => {
    const events = parseEventsJsonl('{"id":"e1","type":"test_passed","agent":"codex","at":1,"label":"tests passed"}')
    expect(events).toHaveLength(1)
    expect(events[0]?.type).toBe('test_passed')
  })
})

describe('parseTranscript', () => {
  it('maps simple transcript lines to battle events', () => {
    const events = parseTranscript('codex', 'pnpm test\\n✓ tests passed\\n')
    expect(events.map((event) => event.type)).toContain('test_passed')
  })
})
```

- [ ] **Step 2: Verify tests fail**

Run:

```bash
pnpm test
```

Expected: FAIL because IO modules do not exist.

- [ ] **Step 3: Implement JSONL parser and export helper**

Create `src/arena/io.ts`:

```ts
import { readFileSync, writeFileSync } from 'node:fs'
import type { BattleEvent, BattleState } from './types'

export function parseEventsJsonl(input: string): BattleEvent[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as BattleEvent)
}

export function loadEventsJsonl(path: string): BattleEvent[] {
  return parseEventsJsonl(readFileSync(path, 'utf8'))
}

export function writeBattleJson(path: string, state: BattleState): void {
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`)
}
```

- [ ] **Step 4: Implement transcript parser**

Create `src/arena/transcriptParser.ts`:

```ts
import type { AgentId, BattleEvent } from './types'

export function parseTranscript(agent: AgentId, input: string): BattleEvent[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => lineToEvent(agent, line, index + 1))
}

function lineToEvent(agent: AgentId, line: string, at: number): BattleEvent {
  const lower = line.toLowerCase()
  if (lower.includes('test') && (lower.includes('pass') || lower.includes('✓'))) {
    return { id: `${agent}-${at}`, type: 'test_passed', agent, at, label: line }
  }
  if (lower.includes('build') && (lower.includes('pass') || lower.includes('✓'))) {
    return { id: `${agent}-${at}`, type: 'build_passed', agent, at, label: line }
  }
  if (lower.includes('fail') || lower.includes('error')) {
    return { id: `${agent}-${at}`, type: 'test_failed', agent, at, label: line }
  }
  if (lower.includes('edit') || lower.includes('patch') || lower.includes('modified')) {
    return { id: `${agent}-${at}`, type: 'file_changed', agent, at, label: line }
  }
  if (lower.includes('subagent') || lower.includes('spawn')) {
    return { id: `${agent}-${at}`, type: 'subagent_spawned', agent, at, label: line }
  }
  return { id: `${agent}-${at}`, type: 'tool_used', agent, at, label: line }
}
```

- [ ] **Step 5: Add fixtures**

Create `fixtures/demo-events.jsonl`:

```jsonl
{"id":"f1","type":"agent_started","agent":"codex","at":1,"label":"entered the repo"}
{"id":"f2","type":"agent_started","agent":"claude","at":1,"label":"entered the repo"}
{"id":"f3","type":"test_failed","agent":"claude","at":2,"label":"lint failed after quick patch"}
{"id":"f4","type":"subagent_spawned","agent":"codex","at":3,"label":"Verifier familiar summoned"}
{"id":"f5","type":"test_passed","agent":"codex","at":4,"label":"tests passed"}
{"id":"f6","type":"judge_verdict","agent":"codex","at":5,"label":"custom judge accepted outcome","verdict":"accepted"}
```

Create `fixtures/codex-sample.log`:

```text
codex read package scripts
spawn verifier subagent
patched scoring engine
✓ tests passed
✓ build passed
```

Create `fixtures/claude-sample.log`:

```text
claude mapped file tree
edited UI
error lint failed
patched again
test still failed
```

- [ ] **Step 6: Extend CLI replay and export commands**

Update `src/cli/main.ts`:

```ts
#!/usr/bin/env node
import { demoEvents } from '../arena/demoEvents'
import { runBattle } from '../arena/engine'
import { loadEventsJsonl, writeBattleJson } from '../arena/io'
import { parseTranscript } from '../arena/transcriptParser'
import { readFileSync } from 'node:fs'
import { formatScorecard } from './formatScorecard'
import { renderTerminal } from './renderTerminal'

const [command = 'demo', ...args] = process.argv.slice(2)

if (command === 'demo') {
  const state = runBattle(demoEvents, 'Demo Mode')
  console.log(renderTerminal(state))
} else if (command === 'scorecard') {
  const state = runBattle(demoEvents, 'Demo Mode')
  console.log(formatScorecard(state))
} else if (command === 'replay') {
  const events = args[0] === '--events'
    ? loadEventsJsonl(args[1] ?? fail('Missing events path'))
    : [
        ...parseTranscript('codex', readFileSync(args[0] ?? fail('Missing Codex log'), 'utf8')),
        ...parseTranscript('claude', readFileSync(args[1] ?? fail('Missing Claude log'), 'utf8')),
      ]
  const state = runBattle(events, args[0] === '--events' ? 'Showcase Replay' : 'Matched Race')
  console.log(renderTerminal(state))
} else if (command === 'export') {
  const outIndex = args.indexOf('--out')
  const outPath = outIndex >= 0 ? args[outIndex + 1] : 'battle.json'
  const events = [
    ...parseTranscript('codex', readFileSync(args[0] ?? fail('Missing Codex log'), 'utf8')),
    ...parseTranscript('claude', readFileSync(args[1] ?? fail('Missing Claude log'), 'utf8')),
  ]
  writeBattleJson(outPath ?? fail('Missing output path'), runBattle(events, 'Matched Race'))
  console.log(`Wrote ${outPath}`)
} else {
  fail(`Unknown command: ${command}`)
}

function fail(message: string): never {
  console.error(message)
  console.error('Usage: pnpm arena demo | scorecard | replay --events fixtures/demo-events.jsonl | replay codex.log claude.log | export codex.log claude.log --out battle.json')
  process.exit(1)
}
```

- [ ] **Step 7: Verify replay paths**

Run:

```bash
pnpm test
pnpm arena replay --events fixtures/demo-events.jsonl
pnpm arena replay fixtures/codex-sample.log fixtures/claude-sample.log
pnpm arena export fixtures/codex-sample.log fixtures/claude-sample.log --out src/web/demoBattle.json
```

Expected: tests pass, replay commands render terminal output, and `src/web/demoBattle.json` is written.

- [ ] **Step 8: Commit**

```bash
git add src/arena/io.ts src/arena/transcriptParser.ts src/arena/io.test.ts src/cli/main.ts fixtures src/web/demoBattle.json
git commit -m "feat: add replay and export inputs"
```

---

### Task 5: Web Replay Viewer

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/index.css`
- Modify: `README.md`

- [ ] **Step 1: Replace starter app with replay viewer**

Update `src/App.tsx`:

```tsx
import battle from './web/demoBattle.json'
import './App.css'

function App() {
  const state = battle
  const winner = state.winner === 'tie' ? 'Tie' : state.winner ? state.agents[state.winner].name : 'Pending'

  return (
    <main className="arena-page">
      <header className="arena-header">
        <p>{state.label}</p>
        <h1>Agent Arena</h1>
        <span>Winner: {winner}</span>
      </header>

      <section className="scoreboard" aria-label="Battle scoreboard">
        <AgentPanel agent={state.agents.codex} />
        <div className="blocker-panel">
          <h2>Blockers</h2>
          {state.blockers.map((blocker) => (
            <p key={blocker}>{blocker}</p>
          ))}
        </div>
        <AgentPanel agent={state.agents.claude} />
      </section>

      <section className="replay-grid">
        <div>
          <h2>Highlights</h2>
          <ul>
            {state.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Score Changes</h2>
          <ul>
            {state.deltas.map((delta) => (
              <li key={delta.eventId}>
                {delta.points >= 0 ? '+' : ''}
                {delta.points} {state.agents[delta.agent].name}: {delta.reason}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}

function AgentPanel({ agent }: { agent: { name: string; score: number; health: number; momentum: number; familiars: string[] } }) {
  return (
    <article className="agent-panel">
      <h2>{agent.name}</h2>
      <strong>{agent.score}</strong>
      <p>Health {Math.round(agent.health)} / Momentum {agent.momentum}</p>
      <p>Familiars: {agent.familiars.join(', ') || 'none'}</p>
    </article>
  )
}

export default App
```

- [ ] **Step 2: Replace app CSS**

Update `src/App.css`:

```css
.arena-page {
  min-height: 100svh;
  padding: 32px;
  color: #e9eef8;
  background: #101316;
}

.arena-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  border-bottom: 1px solid #29313a;
  padding-bottom: 18px;
}

.arena-header h1 {
  margin: 0;
  font-size: 44px;
}

.scoreboard {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 0.7fr) minmax(0, 1fr);
  gap: 16px;
  margin: 28px 0;
}

.agent-panel,
.blocker-panel,
.replay-grid > div {
  border: 1px solid #29313a;
  border-radius: 8px;
  background: #171c21;
  padding: 20px;
}

.agent-panel strong {
  display: block;
  font-size: 64px;
  line-height: 1;
  margin: 16px 0;
}

.replay-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

li {
  margin-bottom: 10px;
}

@media (max-width: 800px) {
  .arena-page {
    padding: 18px;
  }

  .arena-header,
  .scoreboard,
  .replay-grid {
    display: flex;
    flex-direction: column;
  }
}
```

- [ ] **Step 3: Simplify global CSS**

Update `src/index.css`:

```css
:root {
  font: 16px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #e9eef8;
  background: #101316;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

h1,
h2,
p {
  margin-top: 0;
}
```

- [ ] **Step 4: Update README demo commands**

In `README.md`, replace planned CLI text with real commands:

```markdown
## Demo Commands

```bash
pnpm arena demo
pnpm arena scorecard
pnpm arena replay --events fixtures/demo-events.jsonl
pnpm arena replay fixtures/codex-sample.log fixtures/claude-sample.log
pnpm arena export fixtures/codex-sample.log fixtures/claude-sample.log --out src/web/demoBattle.json
pnpm dev
```
```

- [ ] **Step 5: Verify web build**

Run:

```bash
pnpm lint
pnpm build
```

Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.css src/index.css README.md
git commit -m "feat: add web replay viewer"
```

---

### Task 6: Demo Script And Submission Polish

**Files:**
- Create: `docs/demo-script.md`
- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Write 2-minute demo script**

Create `docs/demo-script.md`:

```markdown
# Agent Arena 2-Minute Demo Script

## 0:00-0:20 Problem

AI coding sessions produce long transcripts, but transcripts hide the match:
where an agent got blocked, recovered, passed checks, or only looked busy.

## 0:20-0:55 Terminal Match

Run:

```bash
pnpm arena demo
```

Say: Agent Arena turns Codex and Claude Code work into a terminal-first match
replay. The center shows blockers, each side shows score and familiars, and the
log explains every score change.

## 0:55-1:25 Explainable Scorecard

Run:

```bash
pnpm arena scorecard
```

Say: Activity creates motion, but outcomes decide the match. Codex wins here
because it recovers, clears checks, and receives the custom judge verdict.

## 1:25-1:45 Replay Inputs

Run:

```bash
pnpm arena replay --events fixtures/demo-events.jsonl
```

Say: The same engine can replay normalized events or parsed transcripts.
Project-specific judges can override generic scoring.

## 1:45-2:00 Web Spectator

Show the web replay if ready. Otherwise show the README and GitHub repo.

Close: Agent Arena is a match replay system for AI coding work, built with Codex
for a Codex hackathon.
```

- [ ] **Step 2: Add README submission section**

Add to `README.md`:

```markdown
## Hackathon Pitch

Agent Arena addresses four judging dimensions:

- Impact: makes AI coding sessions inspectable as match replays.
- Quality/readiness: deterministic demo, fixtures, build/lint commands, MIT license.
- Creative Codex use: Codex appears in the match and helped plan/build/test the repo.
- Demo/pitch: terminal-first 2-minute demo with optional web spectator.
```

- [ ] **Step 3: Update AGENTS verification**

Add to `AGENTS.md`:

```markdown
## Verification Before Submission

Run:

```bash
pnpm test
pnpm lint
pnpm build
pnpm arena demo
pnpm arena scorecard
```
```

- [ ] **Step 4: Final verification**

Run:

```bash
pnpm test
pnpm lint
pnpm build
pnpm arena demo
pnpm arena scorecard
```

Expected: all pass and CLI output is demo-ready.

- [ ] **Step 5: Commit and push**

```bash
git add docs/demo-script.md README.md AGENTS.md
git commit -m "docs: add hackathon demo script"
git push
```

---

## Self-Review

Spec coverage:

- Terminal-first demo: Tasks 3 and 6.
- Renderer-agnostic event model: Tasks 1 and 2.
- Outcome-weighted scorecard: Tasks 2 and 3.
- Custom judge events: Task 2.
- Replay and transcript fixtures: Task 4.
- Web spectator path: Task 5.
- GitHub/readiness/demo script: Task 6.

Known gap:

- Live tmux watching is intentionally out of MVP scope and remains a stretch goal.
