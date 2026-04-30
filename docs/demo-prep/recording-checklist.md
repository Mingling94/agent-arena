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
cd /Users/ming/hackathon/bellevue-codex-2026/project
pnpm arena demo
pnpm arena demo --view focus --agent codex
pnpm arena demo --view feed
```

If a local external skin is available:

```bash
pnpm arena demo --skin ../external-skins/<local-skin>
```

Scorecard shot:

```bash
pnpm arena scorecard --skin ../external-skins/<local-skin>
```

## Shot Order

1. Title / repo visible.
2. Run `pnpm arena demo`.
3. Pause on the `ARENA VIEW`: lanes, center blocker, bars, helper row.
4. Run `--view focus --agent codex` if the pane is narrow.
5. Run `--view feed` as the compact fallback shot.
6. Pause on final scorecard.
7. Optional local external skin finisher.
8. End on final verdict.

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

Cut external custom skins.

Keep terminal replay and scorecard.

## Verify Before Recording

```bash
pnpm build
```
