# Judge Q&A

## Is this a benchmark?

Not by default.

It is a replay and review layer.

It can show a `Matched Race` when task, repo, and start conditions are
controlled. Otherwise it labels the run as `Demo Mode` or `Showcase Replay`.

## Why game skins?

Skins make agent work readable fast.

The scorecard keeps the output serious.

The skin changes presentation, not scoring.

## Why not just show logs?

Logs show everything and explain little.

Agent Arena highlights blockers, recovery, verified outcomes, and final risk.

## What makes scoring credible?

Outcome events dominate:

- tests pass
- build clears
- task completes
- judge accepts

Activity points are small. Regressions and repeated failures are penalties.

## Can users customize scoring?

Later, yes.

The planned path is project-specific judge events:

- required commands
- acceptance criteria
- manual verdicts
- hidden checks

Judge verdicts should override generic activity scoring.

## What did Codex contribute?

Codex helped plan, implement, test, and prep the demo.

The demo also uses Codex as one side of the replay.

## Why terminal-first?

Coding agents live in terminal workflows.

A terminal demo is fast, reliable, and easy to run from a fresh clone.

## What is the business use?

Teams need to compare agent outputs before merging code.

Agent Arena shows which run produced verified, reviewable, lower-risk work.

## What about real transcripts?

The MVP uses deterministic events for reliability.

Real transcript adapters can normalize Codex, Claude Code, and other agent logs
into the same event stream.

## Are branded skins official?

No.

Official skins are generic. Branded/fan skins are local external skins and are
not shipped with the app.

## Do skins affect the winner?

No.

The same event stream produces the same score.

Skins only change presentation.

## Why same replay with two skins?

It proves skins are presentation only.

Trust comes from the event stream and scorecard, not the visual style.
