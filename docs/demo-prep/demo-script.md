# 2-Minute Demo Script

## 0:00-0:15 Problem

AI coding agents are easy to start and hard to review.

Transcripts are noisy. Final diffs hide blockers, regressions, and recovery.

Agent Arena gives you the match replay.

## 0:15-0:45 Web Replay In Codex

Start in the Codex desktop app browser at:

```text
http://127.0.0.1:5173/
```

Say:

This is a Codex-built replay surface running inside the Codex desktop workflow.

Point out:

- Codex lane
- Claude Code lane
- center objective
- winner
- scorecard

## 0:45-1:10 Live Mode

Say:

Demo replay is the reliable path. Live mode is the product direction.

Agent sessions emit normalized events into a local JSONL stream. Agent Arena
renders the same state in terminal and browser without scraping Codex internals.

If showing terminal:

```bash
pnpm arena live --view feed
```

## 1:10-1:35 Terminal Proof

```bash
pnpm arena demo --view split
```

Say:

The terminal produces the same replay model: Codex lane, Claude lane, center
blocker, event feed, and outcome-weighted score.

## 1:35-1:50 Scorecard

Say:

Raw activity does not win. Verified outcomes dominate.

Codex wins because it clears checks, recovers, and receives the judge verdict.

## 1:50-2:00 Close

Agent Arena is a live Codex workflow companion.

It turns agent work into a replay and scorecard so humans can decide which result
is safer to trust.
