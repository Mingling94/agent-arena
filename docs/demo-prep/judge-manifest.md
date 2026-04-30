# Judge Manifest

The demo scorecard is explainable because Agent Arena separates activity, verified outcomes, penalties, and judge verdicts.

Use this manifest when explaining what the custom judge is allowed to decide.

## Judge Inputs

- Normalized arena events.
- Test, lint, and build outcomes.
- Explicit `judge_verdict` events.
- Final `task_completed` event.

## Judge Does Not Control

- Raw UI animation.
- Skin presentation.
- Terminal layout.
- Third-party fan skin wording.

## Verdicts

- `accepted`: the result is demo-ready and receives a judge bonus.
- `partial`: the attempt is useful but incomplete.
- `regressed`: the attempt created a regression.
- `failed`: the attempt failed the mission.

## Example

```json
{
  "mission": "Implement and verify the arena replay",
  "requiredSignals": ["test_passed", "build_passed", "task_completed"],
  "preferredSignals": ["judge_verdict", "subagent_spawned"],
  "penaltySignals": ["test_failed", "blocker_detected"],
  "acceptedWhen": [
    "Tests pass",
    "Production build passes",
    "Replay can be inspected in Codex desktop",
    "Scorecard explains why the winner won"
  ]
}
```
