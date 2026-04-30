# 2-Minute Demo Script

## 0:00-0:15 Problem

AI coding agents do a lot of work, but transcripts are hard to review.

When two agents attempt the same task, you need a match replay, not a wall of
logs.

## 0:15-0:30 Start Replay

```bash
pnpm arena demo --skin moba
```

This is a deterministic Codex vs Claude Code replay.

Same task. Same event stream. Outcome-weighted scoring.

## 0:30-1:05 Match Story

Claude Code starts fast with early file reads and edits.

Codex hits a blocker, spawns a helper, and recovers.

The key events are verified outcomes:

- tests pass
- build clears
- blocker resolves
- task completes

Raw activity helps, but it cannot win alone.

## 1:05-1:25 Scorecard

The final scorecard explains the result:

- verified progress
- regressions
- recovery time
- delegation value
- reviewability

Codex wins because it clears checks and finishes with stronger evidence.

## 1:25-1:45 Skin Switch

Same replay, different presentation:

```bash
pnpm arena demo --skin oldschool-mmo
```

The engine and score do not change. Only the skin changes.

## 1:45-2:00 Close

Agent Arena turns coding-agent sessions into a replay humans can inspect.

It is fun enough to watch, but the point is serious: which agent result is
safer to trust?
