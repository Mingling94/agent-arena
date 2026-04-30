# Final Runbook

## Use This Worktree

```bash
cd /Users/ming/hackathon/bellevue-codex-2026/project/.worktrees/agent-arena-mvp
```

## Verify

```bash
pnpm test
pnpm build
```

Known passing in side-session test:

- 13 tests
- Vite production build

## Core Demo

```bash
pnpm arena demo --skin moba
pnpm arena demo --skin oldschool-mmo
```

Say:

Same replay. Same score. Different skin.

## Local External Skin Finisher

```bash
pnpm arena demo --skin ../external-skins/<local-skin>
```

Say:

This is a local external skin loaded through the skin API. It is not an
official bundled asset.

## Scorecard

```bash
pnpm arena scorecard --skin ../external-skins/<local-skin>
```

Point out:

- verified outcomes dominate
- regressions penalize
- judge verdict carries weight
- Codex wins on evidence

## Replay From Events

```bash
pnpm arena replay --events fixtures/demo-events.jsonl --skin oldschool-mmo
```

Use only if asked how non-demo input works.

## Skin Text Status

Skins change labels, glyphs, event feed text, highlights, and scorecard event
phrasing.

If asked:

The same replay and score are reused. The skin only changes presentation text.

## If Something Fails

Show scorecard.

Say:

The core is the normalized event stream and outcome-weighted scorecard.

Animation and skins are presentation layers.
