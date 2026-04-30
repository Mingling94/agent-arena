# Agent Arena Design

Date: 2026-04-30

## Summary

Agent Arena is a lightweight battle visualizer for AI coding sessions. It turns
Codex and Claude Code activity into a terminal-native and web-replayable game:
agents fight project blockers, summon subagents as familiars, land major hits
when checks pass, and take damage from regressions, loops, and unresolved
errors.

The hackathon version should optimize for a reliable 2-minute demo and a clear
Codex-centered story. The product should support serious Codex vs Claude Code
comparisons when sessions are matched, but it should avoid claiming scientific
benchmark rigor unless the inputs are controlled.

## Goals

- Run fully in the terminal, including inside iTerm and tmux.
- Provide a flashier web spectator/replay path without making it a blocker.
- Ship first-class built-in skins: `moba` as the default demo skin and
  `oldschool-mmo` as the alternate built-in skin.
- Separate skin, adapter, engine, and renderer responsibilities.
- Support Codex vs Claude Code comparison as the headline demo.
- Represent subagents as familiars or summons under their parent agent.
- Use an outcome-weighted scoring model that rewards correctness over raw
  activity.
- Include deterministic demo mode so the hackathon pitch is reliable.
- Be ready for public GitHub release under an open-source license.

## Contest Strategy

The Bellevue Community Codex Hackathon judging rubric is evenly weighted:

- 25% impact
- 25% quality and readiness
- 25% creative use of the Codex app
- 25% demo and pitch

Submissions are due at 2:30 PM. The pitch includes a 2-minute demo, live or
pre-recorded, followed by 3 minutes of judge Q&A. Agent Arena should therefore
optimize for a short, controlled story rather than a broad feature set.

### Impact

The impact story is that coding-agent work is hard to inspect. Agent Arena makes
agent progress, failures, recovery, verification, and final outcomes visible to
humans. This helps developers, teams, and evaluators understand what happened in
an AI coding session instead of only seeing a final diff.

The demo should say: "When agents are doing real work, we need a match replay,
not just a transcript."

### Quality And Readiness

Readiness should be demonstrated through a small set of reliable commands:

- install
- run terminal demo
- replay an event file
- export or open a web replay if available
- build/lint

The repository should include fixtures, deterministic demo data, clear README
steps, and an MIT license. Avoid features that cannot be shown reliably in two
minutes.

### Creative Use Of Codex

The project must visibly use Codex as more than a generic code generator. Good
evidence:

- The repository contains planning docs produced with Codex.
- The demo shows Codex as one side of the match.
- The scoring highlights Codex recovery, verification, and subagent/familiar
  use.
- The pitch can explain how Codex helped plan, build, test, and prepare the
  project during the hackathon.

The Codex-favorable demo should remain honest: Codex wins because it clears
checks and recovers faster, not because the scoreboard is arbitrary.

### Demo And Pitch

Pre-recording is preferred unless the live version is already proven stable.
The 2-minute demo should be scripted as:

1. Problem: transcripts hide the real story of agent work.
2. Input: a Codex vs Claude Code event replay for the same task.
3. Action: Agent Arena scores outcomes, detects blockers, and shows turning
   points in terminal.
4. Result: Codex wins on verified progress and recovery.
5. Bonus: the same replay can be exported to a web spectator view if available.

The recording should show the terminal demo first. The web spectator is a
bonus shot, not the dependency for the pitch.

## Non-Goals

- A full scientific benchmark suite.
- Live terminal capture as a day-one requirement.
- Heavy game engine, GPU dependency, or resource-intensive animation.
- Deep integration with every coding agent.
- A permanent hosted service.
- Named-game skins, assets, commands, examples, screenshots, or bundled themes.
- League of Legends, RuneScape, Riot, or Jagex branding in official product
  assets, except a short contributor note that branded skins do not ship in core.

## Product Modes

### Serious Race

Serious Race compares Codex and Claude Code on the same task, same repository,
and comparable start conditions. The UI labels this as a `Matched Race`.

The race can be built from saved transcripts and explicit event files. Live tmux
or terminal watching is a stretch goal after the event model is stable.

### Showcase Replay

Showcase Replay visualizes one or two saved sessions without claiming fairness.
It is useful for demos, sharing, and understanding what happened in a session.

### Demo Mode

Demo Mode emits deterministic scripted events that create a polished battle. It
must remain available throughout development so the live pitch does not depend
on brittle transcript parsing or external tools.

## Architecture

Agent Arena should be renderer-agnostic.

1. Input adapters ingest saved Codex and Claude Code transcripts and explicit
   event JSONL.
2. The event normalizer converts raw input into a shared battle event schema.
3. The selected skin maps normalized events into presentation vocabulary,
   labels, glyphs, colors, animation flavor, and scoreboard wording.
4. The battle engine applies scoring, damage, status effects, assists, outcomes,
   fairness labels, and replay timing. It remains generic and skin-independent.
5. The terminal renderer consumes battle state and skin presentation tokens to
   render a compact arena.
7. The web spectator consumes the same exported battle state or event stream.
8. The demo driver emits scripted normalized events.

Terminal and web renderers must not parse agent transcripts directly. They only
consume normalized events or battle state.

## Skin, Adapter, Engine, Renderer

Agent Arena separates four concerns:

- `skin`: presentation language, labels, colors, glyphs, sprites, layout flavor,
  animation flavor, event text, and scoreboard wording.
- `adapter`: transcript and event ingestion.
- `engine`: normalized battle state, scoring, timing, fairness labels, and
  outcomes.
- `renderer`: terminal and web rendering.

The battle engine must remain generic and outcome-weighted. A skin cannot change
scoring logic, fairness labels, normalized event semantics, transcript parsing,
or benchmark claims.

Official bundled skins:

- `moba`
- `oldschool-mmo`

Third-party skins can later be loaded from a local path or package through a
generic skin API. They are independently maintained and responsible for their
own licensing.

When a requested third-party skin is unavailable, Agent Arena should warn and
fall back to the official `moba` skin so the hackathon demo remains reliable.
This fallback must be original and generic; it is not a branded replacement or
bundled clone of any named game.

## Built-In Skins

### `moba` Skin

`moba` is the default hackathon and demo skin. It uses original, legally clean
terminology and assets while borrowing familiar structural patterns from
competitive objective-control games.

Coding activity maps to `moba` presentation vocabulary:

- blocker = objective
- subagent = assist
- search/read/context gathering = vision
- failed loop = lost tempo
- test/build/typecheck passed = objective secured
- regression = counterpush
- task completed = victory

The terminal UI should feel like an esports observer overlay: two sides, center
objective/blocker, momentum bars, assists, recent event feed, and final
scorecard.

The `moba` skin must use generic terms only. It must not use Riot or League of
Legends names, including champion, Summoner's Rift, Nexus, Baron, dragon,
turret names, item names, ability names, icons, or visual trade dress.

### `oldschool-mmo` Skin

`oldschool-mmo` is a built-in alternate skin and should use the same event
stream and scoring as `moba`. It is useful for longer sessions and
replay/storytelling.

Coding activity maps to `oldschool-mmo` presentation vocabulary:

- blocker = encounter
- subagent = familiar or party helper
- search/read/context gathering = exploration
- file edit = crafting
- test/build/typecheck passed = quest milestone
- score = XP or reputation
- task completed = quest complete

The `oldschool-mmo` skin must use generic old-school MMO language and original
visuals. It must not use RuneScape or Jagex names, assets, fonts, items, icons,
maps, music, or visual trade dress.

## Inputs

### Transcript Parser

The MVP parser should support saved transcript/log files from Codex and Claude
Code. It can begin with heuristic patterns for:

- tool calls
- command execution
- file edits
- failed checks
- passing checks
- spawned subagents
- final completion signals
- commits

The parser should degrade gracefully. Unrecognized lines can become neutral log
events or be ignored.

### Manual Event API

The CLI should accept explicit events through JSONL or a small emit command.
This gives wrappers and demo scripts a reliable path.

Example normalized events:

```json
{"type":"agent_started","agent":"codex","timestamp":"2026-04-30T10:34:00Z"}
{"type":"blocker_detected","agent":"claude","kind":"test_failure","label":"7 failing tests"}
{"type":"subagent_spawned","agent":"codex","name":"Explorer familiar"}
{"type":"test_passed","agent":"codex","label":"unit tests passed"}
{"type":"task_completed","agent":"codex","label":"feature implemented"}
```

### Live Watching

Watching a live tmux pane or terminal log file is a stretch goal. The design
should not block it, but the hackathon build should not depend on it.

## Battle Model

Agents are the player characters. In the default hackathon skin, Codex and
Claude Code stand on opposite sides of a generic objective-control observer
arena.

Project problems are monsters or hazards:

- failing tests
- type errors
- lint failures
- build errors
- missing context
- repeated failed commands
- deadline pressure

Subagents appear as familiars. A familiar can add chip damage, shields, or
status effects when it returns useful output. Failed or irrelevant delegated
work should not receive meaningful score.

In the `moba` skin, subagents are presented as assists. In the `oldschool-mmo`
skin, subagents can be presented as familiars or party helpers. This vocabulary
is skin-level copy, not scoring logic.

## Scoring

Scoring is hybrid and outcome-weighted.

Major score events:

- tests pass after failing
- build/typecheck/lint clears
- task completed
- meaningful commit created
- blocker resolved

Minor score events:

- useful file read
- successful edit
- relevant search
- productive tool call
- subagent/familiar returns useful work

Negative events:

- repeated failed command
- regression after prior success
- unresolved error
- obvious loop
- long blocker duration

Raw activity cannot win by itself. The score should make correctness and
verified progress dominate.

## Custom Judges

Agent Arena should treat project-supplied judging as a first-class concept. A
generic score can make a replay fun, but real software-development evaluation
depends on the repository, task, acceptance tests, and maintainer expectations.

The MVP should support a simple judge manifest or event file that can add
project-specific outcomes:

- required commands, such as `pnpm test`, `pnpm build`, or `cargo test`
- hidden or maintainer-provided checks when available
- task-specific acceptance criteria
- manual judge notes
- severity weights for regressions, security issues, performance, or UX
- final verdict labels such as `accepted`, `partial`, `regressed`, or `failed`

In the battle UI, project-supplied judge events should be visibly distinct from
heuristic activity scoring. A custom judge verdict should be able to override
generic activity points.

## Labels And Fairness

The UI must show one of these comparison labels:

- `Matched Race`: same task, same repository, comparable starting conditions.
- `Showcase Replay`: useful visualization, not a fair benchmark claim.
- `Demo Mode`: scripted events for presentation and testing.

This avoids overstating Codex vs Claude Code claims while still letting the
hackathon demo show a clear winner.

## Terminal Renderer

The terminal renderer is the first-class MVP.

Required display:

- Codex and Claude Code status panels.
- A center monster/blocker area.
- Familiar/subagent row below each agent.
- Score, health, or momentum meters.
- Recent event log.
- Race label.
- Selected skin label.
- Low-resource animation that works inside iTerm and tmux.

The terminal renderer should use simple ANSI/Unicode graphics and avoid heavy
dependencies. It should still be readable in plain terminal environments.

For the `moba` skin, the display should prioritize a generic esports observer overlay:
two sides, center objective/blocker, momentum bars, assists, recent event feed,
and final scorecard.

## Web Spectator

The web spectator is important but later in the build order because it is the
riskiest leg.

MVP target:

- Load exported battle JSON or consume normalized events.
- Render a richer replay of the same battle.
- Make the demo visually shareable.

If time is short, the web spectator can be a polished replay page instead of a
live streaming dashboard.

## CLI Shape

Potential commands:

```bash
agent-arena demo --skin moba
agent-arena demo --skin oldschool-mmo
agent-arena replay --events battle.jsonl --skin moba
agent-arena replay --events battle.jsonl --skin oldschool-mmo
agent-arena replay --events battle.jsonl --skin ./themes/custom-skin
agent-arena export codex.log claude.log --out battle.json --skin moba
agent-arena web battle.json
```

`moba` should be the default when `--skin` is omitted. Existing `agent-arena
demo` and `pnpm arena demo` compatibility should remain. Existing `--mode`
support can remain only as a backward-compatible alias for `--skin`.

Exact names can change during implementation, but the CLI should preserve the
core paths: deterministic demo, transcript replay, exported web replay, and
skin selection.

## Legal And Product Boundary

Agent Arena ships with original genre-inspired skins. Named-game skins are not
official product assets. Third-party skins may be loaded through a generic skin
API and are independently responsible for licensing.

Do not include League of Legends, RuneScape, Riot, or Jagex branding in official
commands, filenames, packages, bundled examples, screenshots, or docs except
possibly in a short contributor note that branded skins do not ship in core.

## Benchmark And Market Notes

The adjacent space is active. Existing tools emphasize observability, session
management, dashboards, and serious side-by-side comparison more than
terminal-native game visualization.

Software-development evaluation is also a mature field. The important lesson
for Agent Arena is that credible scoring needs task-specific judges, not only
generic telemetry:

- [SWE-bench](https://www.swebench.com/) evaluates agents on real GitHub issues
  by checking whether a submitted patch passes tests. It popularized
  issue-resolution as a software-agent benchmark.
- [SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/)
  added expert human review to filter tasks for clearer issue descriptions and
  appropriate tests.
- [OpenAI SWE-Lancer](https://openai.com/index/swe-lancer/) uses real freelance
  software-engineering tasks. Independent coding tasks are graded with
  end-to-end tests, while managerial decisions are graded against the original
  engineering manager's choices.
- [Terminal-Bench](https://www.tbench.ai/) evaluates agents on terminal-based
  tasks, which is directly relevant to Agent Arena's terminal-first focus.
- OpenAI's 2026 note on why it no longer relies on SWE-bench Verified highlights
  benchmark pitfalls: contamination, underspecified tasks, and tests that check
  behavior not described in the prompt. Agent Arena should avoid overclaiming
  benchmark rigor unless the judging inputs are controlled.
- Recent benchmark work such as SWE-CI, SWE-EVO, SWE-Bench Mobile, and
  ProjDevBench points toward repository-level, long-horizon, and domain-specific
  evaluation instead of one-size-fits-all pass/fail scoring.

Closest adjacent products and references:

- [CodeAgentSwarm](https://www.codeagentswarm.com/en) manages multiple Claude
  Code, Codex, and Gemini CLI terminals, with real-time visibility, live diffs,
  notifications, history, and permissions.
- [AgentPulse](https://blog.jaystuart.dev/agentpulse-a-real-time-dashboard-for-claude-code-and-codex-sessions/)
  is an open-source dashboard for monitoring Claude Code and Codex CLI sessions,
  including live status, prompt history, timelines, tool usage, and notes.
- [Agent Observatory](https://marketplace.visualstudio.com/items?itemName=janzofx.agent-observatory)
  is a VS Code dashboard that normalizes local Claude Code, OpenCode, and Codex
  session state, with file activity and delegation feeds.
- [Agent Sessions](https://github.com/jazzyalex/agent-sessions) is a native
  macOS session browser and live HUD for Codex, Claude Code, OpenCode, Gemini,
  and related tools.
- [Agent of Empires](https://www.agent-of-empires.com/guides/claude-code-session-manager/)
  manages multiple CLI agent instances through tmux and a TUI dashboard.
- [AgentRoom](https://www.reddit.com/r/ClaudeAI/comments/1rnvagy/i_built_a_pixelart_office_that_visualizes_your/)
  and [Agent-Quest](https://www.reddit.com/r/LocalLLaMA/comments/1stda86/opensource_dashboard_to_visualize_ai_coding/)
  show that people are experimenting with visual pixel-art or fantasy-style
  representations of coding agents.
- An existing ["AI Arena" style workflow](https://www.reddit.com/r/ClaudeCode/comments/1rkodye/i_made_claude_code_fight_other_ai_coding_agents/)
  reportedly runs multiple agents in separate git worktrees and compares
  side-by-side diffs.
- Formal benchmark work such as
  [Terminal-Bench and LiveSWEBench](https://agentmarketcap.ai/blog/2026/04/06/how-we-score-ai-agents-agentmarketcap-benchmark-methodology),
  [Windows Agent Arena](https://www.microsoft.com/applied-sciences/projects/windows-agent-arena),
  and [ProjDevBench](https://arxiv.org/abs/2602.01655) reinforces that
  outcome-based scoring and controlled tasks matter.

Differentiation:

- Terminal-native battle visualization is the primary surface, not a fallback.
- The same battle event stream powers both terminal and web.
- Codex vs Claude Code is framed as a fun, shareable race with explicit fairness
  labels.
- Subagents/familiars make delegation visible as part of the game loop.
- Demo mode is first-class, so the product remains presentable even when live
  agent inputs are unavailable.

## Hackathon Build Slice

The four-hour build should prioritize:

1. Define normalized event types and battle state.
2. Implement deterministic demo event stream.
3. Build terminal arena.
4. Add skin boundary with `moba` as default.
5. Make `agent-arena demo --skin moba` the primary demo.
6. Add explainable scorecard and highlight reel output.
7. Add transcript/event replay.
8. Add exportable battle JSON.
9. Prepare GitHub-ready README, MIT license, and demo script.
10. Record a 2-minute demo.
11. Add `--skin oldschool-mmo` and minimal web replay if time remains.

The terminal demo should be complete even if the web spectator is only a replay
prototype.

## Risks

- Transcript formats may differ or change. Mitigation: keep parser heuristic and
  preserve manual JSONL input.
- Web spectator can consume too much time. Mitigation: implement after terminal
  and export path are working.
- Head-to-head claims may be challenged. Mitigation: show fairness labels and
  focus on visualization unless the task is matched.
- Game mechanics may obscure signal. Mitigation: keep event log and score
  explanations visible.
- Terminal animation may not render consistently. Mitigation: provide a plain
  mode and avoid fragile glyph assumptions.

## Implementation Decisions

- Use Node and TypeScript. This keeps the CLI, parser, battle engine, and web
  spectator in one language and matches the existing Vite/React scaffold.
- Use a lightweight terminal renderer. Start with ANSI frame rendering and add a
  small TUI library only if it clearly accelerates layout.
- Include synthetic Codex and Claude Code transcript fixtures if real matched
  logs are not available at kickoff.
- Build the web spectator as static JSON playback first. A local live server is
  optional after replay works.
- For the Codex-favorable demo, use honest scripted events: Codex should recover
  from failures, use a familiar effectively, clear checks, and finish the task.
  Claude Code can perform well but lose on verified outcomes or slower recovery.

## Acceptance Criteria

- `agent-arena demo` runs a complete Codex vs Claude Code battle in terminal.
- `agent-arena demo --skin moba` runs a complete Codex vs Claude Code battle in
  terminal.
- Skin labels and event vocabulary change based on selected skin.
- Built-in skin names are legally clean and generic.
- Core app does not ship named-game skins or assets.
- A skin API boundary exists, even if minimal.
- The battle shows agents, blockers, summons, scores, and event log.
- The scoring model rewards outcome events more than activity events.
- A replay command can consume saved event JSONL or simple transcript fixtures.
- The UI labels demo/showcase/matched race clearly.
- The repository includes README, setup instructions, demo commands, and license.
- README documents that branded skins must live outside the official repo.
- A web replay path exists or is explicitly documented as the next step if time
  runs short.
