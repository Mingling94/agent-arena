# Codex Criterion

## Read

The rubric says `creative use of the Codex app`.

Treat this as the Codex desktop app / CLI / agent workflow, not ChatGPT Apps.

ChatGPT Apps SDK is a bonus, not the safest interpretation.

## Evidence To Show

- Codex built the project in parallel sessions.
- Main implementation used an isolated worktree.
- Side session did research, skins, demo prep, and QA.
- Codex tested terminal, web, skins, build, and scorecard.
- Codex app can preview the web visual in its in-app browser.

## Demo Move

Run the web app locally.

Open it in the Codex app in-app browser.

Say:

This project was built and reviewed inside Codex. Codex managed parallel agent
threads, worktrees, terminal tests, and browser preview.

## Do Not Overbuild

Do not build a ChatGPT App unless the core demo is finished.

Do not replace the terminal demo.

Do not make Apps SDK setup a live dependency.

## Main App Change

Add a small `Codex Workflow` panel to the web display or README:

- Built with Codex CLI + Codex app workflow
- Parallel agents: implementation + research/demo prep
- Worktree-based development
- Terminal verification: test/build/demo commands
- In-app browser preview for web replay

This is enough to connect the project to the 25% rubric without adding risky
infrastructure.

## Optional Bonus

If time remains, add a `codex-app` script:

```bash
pnpm dev --host 127.0.0.1
```

Then preview `http://127.0.0.1:5173` in the Codex app browser.

## ChatGPT Apps SDK

Only build this if everything else is stable:

- MCP server exposes `show_agent_arena_demo`
- tool returns deterministic battle state
- widget renders the existing replay/scorecard

Pitch as a bonus:

The same replay can also be wrapped as a ChatGPT App.
