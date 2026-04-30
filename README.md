# Agent Arena

Agent Arena turns AI coding sessions into a lightweight battle visualization.
Codex and Claude Code fight project blockers, summon subagents as familiars,
and score major hits when checks pass or tasks complete.

This repository is being built for the Bellevue Community Codex Hackathon on
April 30, 2026.

## Demo Goal

The first demo should run fully in the terminal:

```bash
pnpm install
pnpm dev
```

Planned CLI shape:

```bash
agent-arena demo
agent-arena replay codex.log claude.log
agent-arena replay --events battle.jsonl
agent-arena export codex.log claude.log --out battle.json
agent-arena web battle.json
```

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
