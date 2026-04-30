# Agent Arena

Agent Arena turns coding-agent sessions into live or replayable battle views.
Codex and Claude Code fight project blockers, summon helpers, and score major
hits when checks pass or tasks complete.

This repository is being built for the Bellevue Community Codex Hackathon on
April 30, 2026.

## Runtime Model

Agent Arena has one normalized arena event stream, one shared spectator model,
and two renderer surfaces: terminal and web/Codex browser.

- Demo/replay mode uses deterministic events for the reliable 2-minute
  hackathon demo.
- Live session mode is the product direction: a long-running view of active
  coding-agent sessions as normalized events arrive.
- Skins affect presentation only. Scoring and event semantics stay shared.

The hackathon path leads with demo/replay mode, then previews the same replay
inside the Codex desktop workflow.

## Demo

Install dependencies once:

```bash
pnpm install
```

Run the terminal demo with the built-in default arena skin:

```bash
pnpm arena demo
pnpm arena demo --skin default
pnpm arena demo --view focus --agent codex
pnpm arena demo --view feed
pnpm arena scorecard
pnpm arena replay --events fixtures/demo-events.jsonl
pnpm arena replay fixtures/codex-sample.log fixtures/claude-sample.log
```

Run the live terminal HUD. Bare `pnpm arena live` plays the deterministic event
stream as live telemetry. Passing `--events` tails a JSONL event file. For an
interactive Codex CLI session, use tmux or two terminal tabs; do not embed the
HUD and Codex in one raw terminal stream.

```bash
pnpm arena live
pnpm arena live --view feed
pnpm arena live --events .agent-arena/live/events.jsonl --view split
pnpm arena live --events .agent-arena/live/events.jsonl --view focus --agent codex
pnpm arena live --events .agent-arena/live/events.jsonl --view feed
pnpm arena emit --agent codex --type test_passed --label "tests passed"
pnpm arena watch-log --agent codex --input .agent-arena/live/codex.log
```

Inside tmux, this command keeps the HUD in the current pane and opens Codex in a
new lower pane:

```bash
pnpm arena live --events .agent-arena/live/events.jsonl --view split -- codex
```

Or run the organized tmux demos:

```bash
pnpm demo:replay
pnpm demo:replay:exit
pnpm demo:replay:loop
pnpm demo:live
pnpm demo:compare
```

`demo:replay` is the recommended terminal recording shot. It uses a throwaway
demo repo, opens the real Codex CLI in the lower pane, and emits HUD events
every second. After Codex opens, it auto-submits a short demo prompt so the
lower pane visibly starts a response while the HUD tracks progress.

Replay end modes:

- `pnpm demo:replay`: hold the final HUD until Ctrl-C.
- `pnpm demo:replay:exit`: run a timed 45-second clip, then leave Codex open.
- `pnpm demo:replay:loop`: loop the HUD event stream continuously.

`demo:live` is the real product-direction mode: it opens the HUD plus Codex pane
and waits for explicit events in `.agent-arena/live/events.jsonl`.

`demo:compare` shows the Codex vs Claude Code comparison/race framing.

```bash
pnpm demo:tmux-live
pnpm demo:tmux-live:quick
```

`demo:reply` and `demo:tmux-live` are kept as compatibility aliases for `demo:replay`.

Export a skin-neutral battle state and open the Codex-built web replay tool:

```bash
pnpm export-demo
pnpm dev --host 127.0.0.1
```

Open `http://127.0.0.1:5173` for the official default arena, or append a local
skin query string such as
`?skin=..%2Fexternal-skins%2F<local-skin>` for a presentation-only external skin.

The headline recording path is:

1. `pnpm export-demo`
2. `pnpm dev --host 127.0.0.1`
3. Open `http://127.0.0.1:5173` in the Codex desktop app browser.
4. Run the browser `Demo Replay`, then open the final scorecard and eval drawer.

## Codex Desktop Demo

1. Open this repo in the Codex desktop app.
2. Run `pnpm arena live --view feed` for the terminal live HUD shot.
3. Run `pnpm arena demo` for the static terminal fallback.
4. Optionally run a local external skin, such as `pnpm arena demo --skin ../external-skins/<local-skin>`.
5. Run `pnpm export-demo`.
6. Run `pnpm dev --host 127.0.0.1`.
7. Open `http://127.0.0.1:5173` in the Codex app in-app browser.
8. Show the replay, scorecard, and Codex Workflow panel.

Codex built this with parallel agent threads and worktrees. Agent Arena then
turns coding-agent sessions into a replay and scorecard. This is a
Codex-built replay tool, previewed inside the Codex desktop workflow.

Agent Arena ships with one original default arena skin. Named-game skins are
not official product assets. Third-party skins may be loaded through a generic
skin API and are independently responsible for licensing.

## Demo Prep

See [docs/demo-prep/](docs/demo-prep/) for the 2-minute script, runbook,
recording checklist, judge Q&A, and pitch snippets.

For the fastest final recording, use
[docs/demo-prep/recording-script-90s.md](docs/demo-prep/recording-script-90s.md).
For presentation-only local skins, see [docs/skin-api.md](docs/skin-api.md).
For explaining the scoring and custom judge boundary, see
[docs/demo-prep/judge-manifest.md](docs/demo-prep/judge-manifest.md).

## Design Spec

See [docs/superpowers/specs/2026-04-30-agent-arena-design.md](docs/superpowers/specs/2026-04-30-agent-arena-design.md).

## Current Stack

- React
- TypeScript
- Vite
- pnpm

## Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm preview
```

## License

MIT
