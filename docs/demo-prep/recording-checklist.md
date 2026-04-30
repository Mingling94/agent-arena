# Recording Checklist

## Setup

- Close unrelated windows.
- Use one terminal window.
- Increase font size.
- Set terminal width wide enough for panels.
- Use clean shell prompt.
- Keep backup commands in clipboard.

## Commands

```bash
cd /Users/ming/hackathon/bellevue-codex-2026/project/.worktrees/agent-arena-mvp
pnpm arena demo --skin moba
pnpm arena demo --skin oldschool-mmo
```

If local external skins work:

```bash
pnpm arena demo --skin ../external-skins/lol-fan
pnpm arena demo --skin ../external-skins/runescape-fan
```

Scorecard shot:

```bash
pnpm arena scorecard --skin ../external-skins/lol-fan
```

## Shot Order

1. Title / repo visible.
2. Run `--skin moba`.
3. Pause on turning point: blocker, helper, test pass.
4. Pause on final scorecard.
5. Run `--skin oldschool-mmo`.
6. Optional branded local skin finisher.
7. End on final verdict.

## Fallback

If live animation glitches, show:

- exported replay output
- final scorecard
- README commands

Message:

The core is the event stream and scorecard. Animation is presentation.

## Cut If Short

Cut transcript parsing.

Cut web spectator.

Cut external branded skins.

Keep terminal replay and scorecard.

## Verify Before Recording

```bash
pnpm build
```
