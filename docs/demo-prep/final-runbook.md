# Final Runbook

## Use This Repo

```bash
cd /Users/ming/hackathon/bellevue-codex-2026/project
```

## Pre-Demo Setup

Use the shared dev server owned by the main Codex desktop session:

```text
http://127.0.0.1:5173/
```

Do not start another Vite server unless that URL is down and ownership is
coordinated.

## Verify

```bash
pnpm test
pnpm build
pnpm lint
```

## Web-First Demo

Open the Codex desktop app browser and show:

- split replay
- Codex focus
- Claude Code focus
- scorecard
- event feed
- Codex Workflow panel

Say:

The web view is the product surface. The terminal proves it is reproducible.

## Terminal Proof

```bash
pnpm arena demo --view split
pnpm arena demo --view focus --agent codex
pnpm arena live --view feed
```

## Live Mode Shape

Reliable live-HUD shot:

```bash
pnpm arena live --view feed
```

Product-direction live stream:

```bash
pnpm demo:replay
pnpm demo:live
pnpm demo:compare
pnpm demo:reply
pnpm demo:tmux-live
pnpm demo:tmux-live:quick
pnpm arena live --events .agent-arena/live/events.jsonl --view split
pnpm arena emit --agent codex --type test_passed --label "tests passed"
pnpm arena watch-log --agent codex --input .agent-arena/live/codex.log
```

Say:

Live mode uses explicit normalized JSONL events. It does not scrape private Codex
Desktop logs.

Use `pnpm demo:replay` for the recording shot: it opens the real Codex CLI in a
throwaway demo repo, auto-submits a short prompt, and emits HUD events every
second while Codex responds.
Use `pnpm demo:live` when you want the real explicit-event live mode. Use
`pnpm demo:compare` when you want the Codex vs Claude Code race.

Run the live HUD and Codex CLI in separate terminal tabs or tmux panes. Do not
force both into one raw terminal stream.

## If Something Fails

Use terminal demo:

```bash
pnpm arena demo --view split
pnpm arena scorecard
```

Say:

The core is the normalized event stream and outcome-weighted scorecard.
