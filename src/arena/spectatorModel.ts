import type { AgentId, AgentState, BattleState } from './types'

export type SpectatorView = 'scene' | 'split' | 'focus' | 'feed'
export type SpectatorRuntimeMode = 'demo-replay' | 'live-session'

export interface SpectatorRunStats {
  orchestrator: string
  backingModel: string
  repo: string
  task: string
}

export interface SpectatorSide {
  agent: AgentState
  role: 'winner' | 'contender'
  units: string[]
  runStats: SpectatorRunStats
  meters: {
    health: number
    momentum: number
    score: number
  }
}

export interface SpectatorModel {
  runtime: {
    mode: SpectatorRuntimeMode
    label: string
    source: string
    detail: string
  }
  viewLabel: string
  title: string
  objective: {
    label: string
    status: 'secured' | 'contested'
    detail: string
  }
  sides: Record<AgentId, SpectatorSide>
  callouts: string[]
  missions: string[]
  victoryLine: string
  recommendedViews: SpectatorView[]
}

interface SpectatorModelOptions {
  runtimeMode?: SpectatorRuntimeMode
  viewLabel?: string
  runStats?: Partial<Record<AgentId, SpectatorRunStats>>
}

const agentIds = ['codex', 'claude'] as const satisfies readonly AgentId[]

const DEFAULT_RUN_STATS: Record<AgentId, SpectatorRunStats> = {
  codex: {
    orchestrator: 'Codex',
    backingModel: 'GPT-5.5',
    repo: 'mission/codex-worktree',
    task: 'Implement and verify the arena replay',
  },
  claude: {
    orchestrator: 'Claude Code',
    backingModel: 'Claude Opus 4.7',
    repo: 'mission/claude-worktree',
    task: 'Solve the same mission from a parallel start',
  },
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels)]
}

export function buildSpectatorModel(
  battle: BattleState,
  options: SpectatorModelOptions = {},
): SpectatorModel {
  const winner =
    battle.winner === 'codex' || battle.winner === 'claude'
      ? battle.agents[battle.winner]
      : null
  const hasWinner = Boolean(winner)
  const objectiveLabel = battle.blockers[0] ?? battle.highlights.at(-1) ?? 'mission objective'
  const callouts = battle.log.slice(-2)
  const scoreGap = Math.abs(battle.agents.codex.score - battle.agents.claude.score)
  const runtimeMode = options.runtimeMode ?? 'demo-replay'
  const runtime =
    runtimeMode === 'live-session'
      ? {
          mode: runtimeMode,
          label: 'Live Session',
          source: 'Normalized arena event stream',
          detail: 'Reserved for active coding-agent sessions as events arrive',
        }
      : {
          mode: runtimeMode,
          label: 'Demo Replay',
          source: 'Deterministic arena event stream',
          detail: 'Reliable hackathon path shared by terminal and web',
        }

  return {
    runtime,
    viewLabel: options.viewLabel ?? 'Default Arena replay',
    title: winner ? `${winner.name} captures the objective` : 'Objective still contested',
    objective: {
      label: objectiveLabel,
      status: hasWinner ? 'secured' : 'contested',
      detail: winner ? `${winner.name} resolved the shared objective` : 'Awaiting final result',
    },
    sides: Object.fromEntries(
      agentIds.map((id) => {
        const agent = battle.agents[id]

        return [
          id,
          {
            agent,
            role: battle.winner === id ? 'winner' : 'contender',
            units: agent.familiars.length > 0 ? uniqueLabels(agent.familiars) : ['Solo run'],
            runStats: options.runStats?.[id] ?? DEFAULT_RUN_STATS[id],
            meters: {
              health: agent.health,
              momentum: agent.momentum,
              score: agent.score,
            },
          },
        ]
      }),
    ) as Record<AgentId, SpectatorSide>,
    callouts,
    missions: battle.highlights.length > 0 ? battle.highlights : [objectiveLabel],
    victoryLine: winner ? `${winner.name} wins by ${scoreGap} points` : 'Match pending final verdict',
    recommendedViews: ['scene', 'split', 'focus', 'feed'],
  }
}
