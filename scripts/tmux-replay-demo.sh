#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEMO_REPO="${AGENT_ARENA_DEMO_REPO:-$ROOT_DIR/.agent-arena/demo-repo}"

mkdir -p "$DEMO_REPO/src"
cat > "$DEMO_REPO/package.json" <<'JSON'
{"scripts":{"test":"node src/check.js","build":"node src/check.js"}}
JSON

cat > "$DEMO_REPO/src/check.js" <<'JS'
const status = 'ready'
if (status !== 'ready') process.exit(1)
console.log('demo repo checks passed')
JS

export AGENT_ARENA_PROFILE="${AGENT_ARENA_PROFILE:-replay}"
export AGENT_ARENA_MODE="${AGENT_ARENA_MODE:-solo}"
export AGENT_ARENA_VIEW="${AGENT_ARENA_VIEW:-scene}"
export AGENT_ARENA_END_MODE="${AGENT_ARENA_END_MODE:-hold}"
export AGENT_ARENA_SCRIPT_SECONDS="${AGENT_ARENA_SCRIPT_SECONDS:-45}"
export AGENT_ARENA_LOWER_COMMAND="${AGENT_ARENA_LOWER_COMMAND:-bash $ROOT_DIR/scripts/replay-demo-pane.sh}"
export AGENT_ARENA_LOWER_PANE_PERCENT="${AGENT_ARENA_LOWER_PANE_PERCENT:-42}"

exec bash "$ROOT_DIR/scripts/tmux-live-demo.sh"
