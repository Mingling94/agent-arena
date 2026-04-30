# Agent Arena

Agent Arena turns AI coding sessions into a lightweight battle visualization.
Codex and Claude Code fight project blockers, summon subagents as familiars,
and score major hits when checks pass or tasks complete.

This repository is being built for the Bellevue Community Codex Hackathon on
April 30, 2026.

## Demo

Install dependencies once:

```bash
pnpm install
```

Run the terminal demos with the built-in original skins:

```bash
pnpm arena demo --skin moba
pnpm arena demo --skin oldschool-mmo
pnpm arena scorecard --skin moba
pnpm arena replay --events fixtures/demo-events.jsonl --skin moba
pnpm arena replay fixtures/codex-sample.log fixtures/claude-sample.log --skin moba
```

Export a skin-neutral battle state and open the lightweight web replay viewer:

```bash
pnpm export-demo
pnpm dev
```

## Codex Desktop Demo

1. Open this repo in the Codex desktop app.
2. Run `pnpm arena demo --skin moba`.
3. Run `pnpm arena demo --skin oldschool-mmo`.
4. Run `pnpm export-demo`.
5. Run `pnpm dev --host 127.0.0.1`.
6. Open `http://127.0.0.1:5173` in the Codex app in-app browser.
7. Show the replay, scorecard, and Codex Workflow panel.

Codex built this with parallel agent threads and worktrees. Agent Arena then
turns coding-agent sessions into a replay and scorecard, previewed directly
inside the Codex app browser.

Agent Arena ships with original genre-inspired skins. Named-game skins are not
official product assets. Third-party skins may be loaded through a generic skin
API and are independently responsible for licensing.

## Demo Prep

See [docs/demo-prep/](docs/demo-prep/) for the 2-minute script, runbook,
recording checklist, judge Q&A, and pitch snippets.

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
