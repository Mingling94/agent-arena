# Demo Quick Card

## Core Line

Agent Arena is a live Codex workflow companion.

It turns coding-agent sessions into a replay and scorecard showing which result
is safer to trust.

## Start Here

Use the Codex desktop app browser:

```text
http://127.0.0.1:5173/
```

## Say

Codex built and verified this workflow.

Agent sessions emit normalized events.

Agent Arena renders the same state in web and terminal.

The scorecard explains trust.

## Show

- web split replay first
- scorecard and event feed
- Codex Workflow panel
- terminal proof if time allows

## Terminal Proof

```bash
pnpm arena demo --view split
pnpm arena live --view feed
pnpm arena watch-log --agent codex --input .agent-arena/live/codex.log --once
```

## Close

This is not a native Codex extension.

It is an explicit, opt-in live event stream rendered inside the Codex desktop
workflow.
