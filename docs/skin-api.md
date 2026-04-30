# Agent Arena Skin API

Agent Arena ships one official built-in skin: `default`.

Local external skins are presentation overlays. They can rename labels, provide a palette, and point to user-owned assets, but they must not change scoring, event semantics, or the reducer.

## Supported Local Skin Shape

```json
{
  "id": "local-fan-skin",
  "name": "Custom Local Skin",
  "description": "Presentation-only local skin.",
  "labels": {
    "battleTitle": "Agent Arena",
    "blocker": "blocker",
    "assist": "helper",
    "score": "score",
    "health": "Health",
    "momentum": "momentum",
    "feed": "event feed",
    "scorecard": "scorecard",
    "finalResult": "victory"
  },
  "presentation": {
    "licenseNote": "Custom local skin. User is responsible for third-party assets.",
    "palette": {
      "background": "#080c12",
      "panel": "#101820",
      "accent": "#eeb755",
      "accentAlt": "#7cc7bd",
      "codex": "#7cc7bd",
      "claude": "#f07d65",
      "positive": "#52b788",
      "negative": "#f07d65",
      "muted": "#c7c0ad"
    }
  }
}
```

## Demo Commands

```bash
pnpm arena demo --skin default
pnpm arena demo --skin ../external-skins/<local-skin>
pnpm dev --host 127.0.0.1
```

For the web preview, use:

```text
http://127.0.0.1:5173/?skin=..%2Fexternal-skins%2F<local-skin>
```

## Product Boundary

- Official app language should say `Default Arena`.
- Compatibility aliases such as `moba` and `oldschool-mmo` should remain aliases, not first-class official modes.
- Local fan skins are optional and user-supplied.
- Skins affect presentation only.
- Scoring, judging, events, and replay/live behavior stay shared.
