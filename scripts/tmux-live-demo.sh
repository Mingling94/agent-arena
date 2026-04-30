#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVENTS_PATH="${AGENT_ARENA_EVENTS_PATH:-.agent-arena/live/events.jsonl}"
LOWER_COMMAND="${AGENT_ARENA_LOWER_COMMAND:-codex}"
VIEW="${AGENT_ARENA_VIEW:-focus}"
MODE="${AGENT_ARENA_MODE:-solo}"
PROFILE="${AGENT_ARENA_PROFILE:-replay}"
SCRIPT_SECONDS="${AGENT_ARENA_SCRIPT_SECONDS:-45}"
LOWER_PANE_FILE="${AGENT_ARENA_LOWER_PANE_FILE:-.agent-arena/live/lower-pane-id}"
TIMEOUT_FILE="${AGENT_ARENA_TIMEOUT_FILE:-.agent-arena/live/replay-timeout}"
ARENA_CLI="$ROOT_DIR/node_modules/.bin/tsx src/cli/main.ts"

cd "$ROOT_DIR"

if [[ -z "${TMUX:-}" ]]; then
  echo "This demo script must be run inside tmux." >&2
  echo "Start tmux first, then run: pnpm demo:tmux-live" >&2
  exit 1
fi

# Avoid confusing stale race HUDs from previous demo attempts.
pkill -f "src/cli/main.ts live --events .*agent-arena/live/events.jsonl" 2>/dev/null || true
pkill -f "pnpm arena live --events .*agent-arena/live/events.jsonl" 2>/dev/null || true
tmux clear-history 2>/dev/null || true
printf '\033[2J\033[H'

mkdir -p "$(dirname "$EVENTS_PATH")"
rm -f "$EVENTS_PATH"
rm -f "$LOWER_PANE_FILE"
rm -f "$TIMEOUT_FILE"
export AGENT_ARENA_LOWER_PANE_FILE="$LOWER_PANE_FILE"

emit_pid=""
live_pid=""
watchdog_pid=""
kill_lower_pane="0"

cleanup_demo() {
  if [[ -n "$watchdog_pid" ]]; then
    kill "$watchdog_pid" 2>/dev/null || true
  fi
  if [[ -n "$emit_pid" ]]; then
    kill "$emit_pid" 2>/dev/null || true
  fi
  if [[ -n "$live_pid" ]]; then
    kill "$live_pid" 2>/dev/null || true
  fi
  if [[ "$kill_lower_pane" == "1" && -f "$LOWER_PANE_FILE" ]]; then
    lower_pane="$(cat "$LOWER_PANE_FILE" 2>/dev/null || true)"
    if [[ -n "$lower_pane" ]]; then
      tmux kill-pane -t "$lower_pane" 2>/dev/null || true
    fi
  fi
  rm -f "$LOWER_PANE_FILE"
  rm -f "$TIMEOUT_FILE"
}

trap cleanup_demo EXIT
trap 'kill_lower_pane="1"; exit 0' INT TERM

emit_after() {
  local delay="$1"
  local agent="$2"
  local type="$3"
  local label="$4"
  shift 4

  sleep "$delay"
  $ARENA_CLI emit --events "$EVENTS_PATH" --agent "$agent" --type "$type" --label "$label" "$@" >/dev/null
}

(
  if [[ "$PROFILE" == "live" ]]; then
    exit 0
  fi

  delay=1
  if [[ "$PROFILE" == "long" ]]; then
    steps=15
    delay=$((SCRIPT_SECONDS / steps))
    if (( delay < 1 )); then
      delay=1
    fi
  fi

  emit_after 1 codex agent_started "Codex session opened in demo repo"
  if [[ "$MODE" == "race" || "$PROFILE" == "compare" ]]; then
    emit_after "$delay" claude agent_started "Claude Code entered the same task"
  fi
  emit_after "$delay" codex tool_used "user asks for a compact bug fix"
  if [[ "$MODE" == "race" || "$PROFILE" == "compare" ]]; then
    emit_after "$delay" claude file_changed "Claude Code patched quickly"
  fi
  emit_after "$delay" codex tool_used "Codex reads package scripts and source files"
  emit_after "$delay" codex blocker_detected "failing formatter check blocks submit"
  if [[ "$MODE" == "race" || "$PROFILE" == "compare" ]]; then
    emit_after "$delay" claude test_failed "Claude Code failed verification"
  fi
  emit_after "$delay" codex file_changed "Codex patches the demo utility"
  emit_after "$delay" codex subagent_spawned "test familiar checks edge cases"
  emit_after "$delay" codex tool_used "Codex replies with the plan and command"
  emit_after "$delay" codex test_failed "first test run catches a missing branch"
  emit_after "$delay" codex fix_applied "Codex adds the missing condition"
  emit_after "$delay" codex file_changed "Codex updates the focused test"
  emit_after "$delay" codex test_passed "unit tests pass"
  emit_after "$delay" codex build_passed "typecheck and build pass"
  emit_after "$delay" codex tool_used "Codex summarizes changed files"
  emit_after "$delay" codex judge_verdict "custom judge accepts the fix" --verdict accepted
  emit_after "$delay" codex task_completed "replay experience completed"
) &
emit_pid=$!

read -r -a lower_command <<< "$LOWER_COMMAND"

set +e
if [[ "$MODE" == "solo" ]]; then
  $ARENA_CLI live --events "$EVENTS_PATH" --view "$VIEW" --solo codex -- "${lower_command[@]}" &
else
  $ARENA_CLI live --events "$EVENTS_PATH" --view "$VIEW" -- "${lower_command[@]}" &
fi
live_pid=$!

if [[ "$PROFILE" != "live" ]]; then
  (
    sleep "$SCRIPT_SECONDS"
    touch "$TIMEOUT_FILE"
    kill "$live_pid" 2>/dev/null || true
  ) &
  watchdog_pid=$!
fi

wait "$live_pid"
status=$?
set -e

if [[ -f "$TIMEOUT_FILE" ]]; then
  printf 'Agent Arena replay segment complete. Codex pane remains open.\n'
  printf 'Run pnpm demo:replay again to restart the HUD.\n'
fi

if [[ "$status" == "130" || "$status" == "143" ]]; then
  exit 0
fi

exit "$status"
