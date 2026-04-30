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
pnpm arena export fixtures/codex-sample.log fixtures/claude-sample.log --out src/web/demoBattle.json --skin moba
pnpm dev
```

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
