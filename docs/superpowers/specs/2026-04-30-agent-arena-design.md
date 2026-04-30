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
- Support Codex vs Claude Code comparison as the headline demo.
- Represent subagents as familiars or summons under their parent agent.
- Use an outcome-weighted scoring model that rewards correctness over raw
  activity.
- Include deterministic demo mode so the hackathon pitch is reliable.
- Be ready for public GitHub release under an open-source license.

## Non-Goals

- A full scientific benchmark suite.
- Live terminal capture as a day-one requirement.
- Heavy game engine, GPU dependency, or resource-intensive animation.
- Deep integration with every coding agent.
- A permanent hosted service.
- Configurable skins as an MVP requirement. Skins can come later.

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
3. The battle engine applies scoring, damage, status effects, summons, labels,
   and replay timing.
4. The terminal renderer consumes battle state and renders a compact arena.
5. The web spectator consumes the same exported battle state or event stream.
6. The demo driver emits scripted normalized events.

Terminal and web renderers must not parse agent transcripts directly. They only
consume normalized events or battle state.

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
Claude Code stand on opposite sides of an arena.

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
- Low-resource animation that works inside iTerm and tmux.

The terminal renderer should use simple ANSI/Unicode graphics and avoid heavy
dependencies. It should still be readable in plain terminal environments.

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
agent-arena demo
agent-arena replay codex.log claude.log
agent-arena replay --events battle.jsonl
agent-arena export codex.log claude.log --out battle.json
agent-arena web battle.json
```

Exact names can change during implementation, but the CLI should preserve the
three core paths: deterministic demo, transcript replay, and exported web replay.

## Benchmark And Market Notes

The adjacent space is active. Existing tools emphasize observability, session
management, dashboards, and serious side-by-side comparison more than
terminal-native game visualization.

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
4. Add transcript/event replay.
5. Add exportable battle JSON.
6. Add minimal web replay if time remains.
7. Prepare GitHub-ready README, MIT license, and demo script.

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
- The battle shows agents, blockers, summons, scores, and event log.
- The scoring model rewards outcome events more than activity events.
- A replay command can consume saved event JSONL or simple transcript fixtures.
- The UI labels demo/showcase/matched race clearly.
- The repository includes README, setup instructions, demo commands, and license.
- A web replay path exists or is explicitly documented as the next step if time
  runs short.
