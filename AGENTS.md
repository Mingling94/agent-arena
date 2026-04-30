# Project Instructions

## Goal

Build Agent Arena as a small, demoable open-source project for the Bellevue
Community Codex Hackathon. Optimize for a reliable 2-minute live demo.

## Commands

- Install: `pnpm install`
- Dev server: `pnpm dev`
- Lint: `pnpm lint`
- Build: `pnpm build`
- Preview: `pnpm preview`

## Constraints

- Keep the repository public and open source.
- Do not commit secrets or private data.
- Keep the app easy to run from a fresh clone.
- Prefer a working terminal demo over broad incomplete features.

## Engineering Defaults

- Use TypeScript.
- Keep the battle engine renderer-agnostic.
- Terminal and web renderers should consume normalized battle events, not parse
  agent transcripts directly.
- Preserve deterministic demo mode throughout development.

## Demo Requirements

- The terminal demo should immediately communicate Codex vs Claude Code.
- Show agents, blockers, familiars, scores, and a recent event log.
- Label `Demo Mode`, `Showcase Replay`, or `Matched Race` clearly.
- README must include setup, run, and demo instructions.
