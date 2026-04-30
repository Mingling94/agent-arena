import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { AgentId, AgentState, BattleState } from './arena/types'
import type { SpectatorRuntimeMode } from './arena/spectatorModel'
import { buildBattleReplayState } from './arena/engine'
import { buildEvalModel } from './arena/evalModel'
import { buildSpectatorModel } from './arena/spectatorModel'
import battle from './web/demoBattle.json'
import './App.css'

const agentIds = ['codex', 'claude'] as const satisfies readonly AgentId[]
const demoBattleState = battle as BattleState
const demoEvents = [...demoBattleState.events].sort((a, b) => a.at - b.at)
const replaySpeeds = [0.5, 1, 2, 4] as const

interface LiveSnapshot {
  state: BattleState
  eventsPath: string
  warning?: string
}

interface WebSkin {
  id: string
  name: string
  warning?: string
  description?: string
  labels: {
    battleTitle?: string
    blocker: string
    assist: string
    score: string
    health?: string
    momentum: string
    feed: string
    scorecard?: string
    finalResult: string
  }
  presentation?: {
    licenseNote?: string
    palette?: Partial<Record<'background' | 'panel' | 'accent' | 'accentAlt' | 'codex' | 'claude' | 'positive' | 'negative' | 'muted', string>>
  }
}

const DEFAULT_WEB_SKIN: WebSkin = {
  id: 'default',
  name: 'Default Arena',
  description: 'Official generic Agent Arena presentation.',
  labels: {
    blocker: 'blocker',
    assist: 'helper',
    score: 'score',
    health: 'Health',
    momentum: 'momentum',
    feed: 'event feed',
    scorecard: 'scorecard',
    finalResult: 'victory',
  },
}

const CUSTOM_LOCAL_SKIN_PATH = '../external-skins/lol-fan'
const mobaAbilities = [
  { key: 'Q', label: 'Test' },
  { key: 'W', label: 'Lint' },
  { key: 'E', label: 'Build' },
  { key: 'R', label: 'Agent' },
]

function getAgentMark(agent: AgentState) {
  return agent.id === 'claude' ? 'CC' : 'C'
}

function formatSigned(points: number) {
  return points > 0 ? `+${points}` : String(points)
}

function formatStat(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function formatCombatDelta(points: number, reason: string) {
  const shortReason = reason
    .replace('tests passed', 'Test')
    .replace('tests failed', 'Tests')
    .replace('build passed', 'Build')
    .replace('file changed', 'File')
    .replace('tool used', 'Tool')
    .replace('subagent spawned', 'Agent')

  return `${formatSigned(points)} ${shortReason}`
}

function buildReplayBattle(eventCount: number): BattleState {
  return buildBattleReplayState(demoEvents, demoBattleState.label, eventCount)
}

function EvalSummary({ state }: { state: BattleState }) {
  const evalModel = buildEvalModel(state)
  const statusClass = (value: boolean, inverted = false) => {
    if (inverted) return value ? 'is-bad' : 'is-good'
    return value ? 'is-good' : ''
  }

  return (
    <article className="panel panel--wide eval-panel">
      <div className="panel__header">
        <p className="eyebrow">Explainable Eval</p>
        <h2>{evalModel.trustVerdict}</h2>
      </div>

      <div className="eval-layout">
        <div className="eval-breakdown" aria-label="Score source breakdown">
          <div className="eval-category eval-category--header" aria-hidden="true">
            <span>Source</span>
            <strong>Codex</strong>
            <strong>Claude</strong>
          </div>
          {evalModel.categories.map((category) => (
            <div className={`eval-category eval-category--${category}`} key={category}>
              <span>{category}</span>
              <strong>{formatSigned(evalModel.totals[category].codex)}</strong>
              <strong>{formatSigned(evalModel.totals[category].claude)}</strong>
            </div>
          ))}
        </div>

        <div className="rubric-grid" aria-label="Evaluation rubric">
          {evalModel.checks.map((check) => (
            <div className="rubric-row" key={check.label}>
              <span>{check.label}</span>
              <strong className={statusClass(check.codex, check.inverted)}>
                {check.codex ? (check.inverted ? 'Hit' : 'Pass') : check.inverted ? 'Clear' : 'Wait'}
              </strong>
              <strong className={statusClass(check.claude, check.inverted)}>
                {check.claude ? (check.inverted ? 'Hit' : 'Pass') : check.inverted ? 'Clear' : 'Wait'}
              </strong>
            </div>
          ))}
        </div>
      </div>

      <p className="eval-note">
        Scores come from normalized events. Verified outcomes and custom judge events are separated from generic activity.
      </p>
    </article>
  )
}

function StatMeter({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'health' | 'momentum'
}) {
  const boundedValue = Math.max(0, Math.min(100, value))

  return (
    <div className="stat-meter">
      <div className="stat-meter__label">
        <span>{label}</span>
        <strong>{formatStat(value)}</strong>
      </div>
      <div className="stat-meter__track" aria-hidden="true">
        <span
          className={`stat-meter__fill stat-meter__fill--${tone}`}
          style={{ width: `${boundedValue}%` }}
        />
      </div>
    </div>
  )
}

function ArenaSide({
  agent,
  isWinner,
  side,
  units,
  runStats,
  skin = DEFAULT_WEB_SKIN,
}: {
  agent: AgentState
  isWinner: boolean
  side: 'left' | 'right'
  units: string[]
  runStats: ReturnType<typeof buildSpectatorModel>['sides'][AgentId]['runStats']
  skin: WebSkin
}) {
  return (
    <article
      className={`arena-side arena-side--${side} ${isWinner ? 'arena-side--winner' : ''}`}
      aria-label={`${agent.name} battle lane`}
    >
      <div className="arena-side__header">
        <div>
          <p className="eyebrow">{isWinner ? 'Winner' : 'Contender'}</p>
          <h2>{agent.name}</h2>
        </div>
        <div className="score-badge">
          <span>{skin.labels.score}</span>
          <strong>{agent.score}</strong>
        </div>
      </div>

      <div className="arena-side__meters">
        <StatMeter label={skin.labels.health ?? 'Health'} value={agent.health} tone="health" />
        <StatMeter label={skin.labels.momentum} value={agent.momentum} tone="momentum" />
      </div>

      <dl className="run-stats" aria-label={`${agent.name} comparison stats`}>
        <div>
          <dt>Orchestrator</dt>
          <dd>{runStats.orchestrator}</dd>
        </div>
        <div>
          <dt>Model</dt>
          <dd>{runStats.backingModel}</dd>
        </div>
        <div>
          <dt>Repo</dt>
          <dd>{runStats.repo}</dd>
        </div>
        <div>
          <dt>Task</dt>
          <dd>{runStats.task}</dd>
        </div>
      </dl>

      <div className="unit-lane" aria-label={`${agent.name} units`}>
        <div className={`hero-unit hero-unit--${agent.id}`} aria-hidden="true">
          <span>{getAgentMark(agent)}</span>
        </div>
        {units.map((unit, index) => (
          <div className="support-unit" key={`${unit}-${index}`}>
            <span aria-hidden="true" />
            {unit}
          </div>
        ))}
      </div>
    </article>
  )
}

function ScorecardPanel({
  agent,
  isWinner,
  skin = DEFAULT_WEB_SKIN,
}: {
  agent: AgentState
  isWinner: boolean
  skin: WebSkin
}) {
  return (
    <article className={`scorecard ${isWinner ? 'scorecard--winner' : ''}`}>
      <p className="eyebrow">{isWinner ? `Victory ${skin.labels.scorecard ?? 'scorecard'}` : `Contender ${skin.labels.scorecard ?? 'scorecard'}`}</p>
      <h3>{agent.name}</h3>
      <div className="scorecard__stats">
        <span>{skin.labels.score}</span>
        <strong>{agent.score}</strong>
        <span>{skin.labels.health ?? 'Health'}</span>
        <strong>{formatStat(agent.health)}</strong>
        <span>{skin.labels.momentum}</span>
        <strong>{formatStat(agent.momentum)}</strong>
      </div>
    </article>
  )
}

function getInitialSkinPath() {
  return new URLSearchParams(window.location.search).get('skin') ?? 'default'
}

function getSkinCssVars(skin: WebSkin): CSSProperties {
  const palette = skin.presentation?.palette
  if (!palette) return {}

  return {
    '--bg': palette.background,
    '--surface': palette.panel,
    '--surface-raised': palette.panel,
    '--text-muted': palette.muted,
    '--accent-warm': palette.accent,
    '--accent-cool': palette.accentAlt,
    '--accent-green': palette.positive,
    '--accent-red': palette.negative,
  } as CSSProperties
}

function App() {
  const [runtimeMode, setRuntimeMode] = useState<SpectatorRuntimeMode>('demo-replay')
  const [viewMode, setViewMode] = useState<'split' | AgentId>('split')
  const [liveSnapshot, setLiveSnapshot] = useState<LiveSnapshot | null>(null)
  const [skinPath, setSkinPath] = useState(getInitialSkinPath)
  const [webSkin, setWebSkin] = useState<WebSkin>(DEFAULT_WEB_SKIN)
  const [replayEventCount, setReplayEventCount] = useState(0)
  const [isReplayPlaying, setIsReplayPlaying] = useState(true)
  const [replaySpeed, setReplaySpeed] = useState<(typeof replaySpeeds)[number]>(1)
  const replayBattleState = useMemo(() => buildReplayBattle(replayEventCount), [replayEventCount])
  const isReplayComplete = replayEventCount >= demoEvents.length
  const isReplayActivelyPlaying = isReplayPlaying && !isReplayComplete
  const battleState = runtimeMode === 'live-session' ? (liveSnapshot?.state ?? demoBattleState) : replayBattleState
  const spectator = useMemo(
    () => buildSpectatorModel(battleState, { runtimeMode }),
    [battleState, runtimeMode],
  )
  const agents: AgentState[] = agentIds.map((id) => battleState.agents[id])
  const winnerAgent =
    battleState.winner === 'codex' || battleState.winner === 'claude'
      ? battleState.agents[battleState.winner]
      : null
  const winnerName =
    winnerAgent?.name ?? (battleState.winner === 'tie' ? 'Tie' : 'Pending')
  const isLiveSession = runtimeMode === 'live-session'
  const effectiveViewMode: 'split' | AgentId = isLiveSession ? 'codex' : viewMode
  const focusedAgent: AgentId = effectiveViewMode === 'claude' ? 'claude' : 'codex'
  const focusedSide = spectator.sides[focusedAgent]
  const skinCssVars = useMemo(() => getSkinCssVars(webSkin), [webSkin])
  const evalModel = useMemo(() => buildEvalModel(battleState), [battleState])
  const visibleAgents = isLiveSession ? [battleState.agents.codex] : agents
  const scorecardPhase = runtimeMode === 'demo-replay' && !isReplayComplete ? 'Live' : 'Final'
  const modeLine = isLiveSession
    ? `Live Session · 1P Codex · ${battleState.events.length} events`
    : `Demo Replay · ${replayEventCount}/${demoEvents.length} events`
  const objectiveHeading = webSkin.id !== 'default' ? 'Epic Objective' : 'Center Objective'
  const latestDeltas = [...battleState.deltas].reverse().slice(0, 4)
  const latestCodexDelta = latestDeltas.find((delta) => delta.agent === 'codex')
  const latestClaudeDelta = latestDeltas.find((delta) => delta.agent === 'claude')
  const latestCallout = spectator.callouts.at(-1) ?? spectator.objective.detail
  const currentReplayEvent = demoEvents[Math.max(0, replayEventCount - 1)]
  const replayProgress = demoEvents.length === 0 ? 100 : (replayEventCount / demoEvents.length) * 100
  const recentEventLines = battleState.log.slice(-3).reverse()

  const restartReplay = () => {
    setReplayEventCount(0)
    setIsReplayPlaying(true)
  }

  const toggleReplay = () => {
    if (isReplayComplete) {
      restartReplay()
      return
    }

    setIsReplayPlaying((playing) => !playing)
  }

  useEffect(() => {
    let isActive = true
    const loadSkin = async () => {
      try {
        const response = await fetch(`/api/skin?skin=${encodeURIComponent(skinPath)}`, { cache: 'no-store' })
        if (!response.ok) throw new Error(`Skin ${response.status}`)
        const skin = (await response.json()) as WebSkin
        if (isActive) setWebSkin(skin)
      } catch {
        if (isActive) {
          setWebSkin({
            ...DEFAULT_WEB_SKIN,
            warning: `Could not load ${skinPath}. Falling back to default.`,
          })
        }
      }
    }

    void loadSkin()
    const params = new URLSearchParams(window.location.search)
    if (skinPath === 'default') {
      params.delete('skin')
    } else {
      params.set('skin', skinPath)
    }
    const nextSearch = params.toString()
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`
    window.history.replaceState(null, '', nextUrl)

    return () => {
      isActive = false
    }
  }, [skinPath])

  useEffect(() => {
    if (runtimeMode !== 'live-session') return undefined

    let isActive = true
    const loadLiveState = async () => {
      try {
        const response = await fetch('/api/live/state', { cache: 'no-store' })
        if (!response.ok) throw new Error(`Live state ${response.status}`)
        const snapshot = (await response.json()) as LiveSnapshot
        if (isActive) setLiveSnapshot(snapshot)
      } catch {
        if (isActive) {
          setLiveSnapshot({
            state: demoBattleState,
            eventsPath: '.agent-arena/live/events.jsonl',
            warning: 'Live state endpoint unavailable',
          })
        }
      }
    }

    void loadLiveState()
    const intervalId = window.setInterval(loadLiveState, 1000)

    return () => {
      isActive = false
      window.clearInterval(intervalId)
    }
  }, [runtimeMode])

  useEffect(() => {
    if (runtimeMode !== 'demo-replay' || !isReplayActivelyPlaying) return undefined

    const intervalId = window.setInterval(() => {
      setReplayEventCount((count) => Math.min(demoEvents.length, count + 1))
    }, 3000 / replaySpeed)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isReplayActivelyPlaying, replaySpeed, runtimeMode])

  return (
    <main
      className={`arena-shell ${webSkin.id === 'default' ? '' : 'arena-shell--custom-skin'}`}
      style={skinCssVars}
    >
      <section className="spectator" aria-labelledby="arena-title">
        <header className="observer-bar">
          <div>
            <p className="eyebrow">{spectator.runtime.label}</p>
            <h1 id="arena-title">Agent Arena</h1>
            <p className="observer-bar__summary">
              {isLiveSession
                ? 'Live Session · 1P Codex'
                : 'Live and replayable battle views for coding-agent sessions.'}
            </p>
          </div>
          <div className="observer-actions">
            <div className="skin-switcher" aria-label="Presentation skin">
              <button
                className={skinPath === 'default' ? 'is-active' : ''}
                type="button"
                onClick={() => setSkinPath('default')}
              >
                Default
              </button>
              <button
                className={skinPath === CUSTOM_LOCAL_SKIN_PATH ? 'is-active' : ''}
                type="button"
                onClick={() => setSkinPath(CUSTOM_LOCAL_SKIN_PATH)}
              >
                LoL Mode
              </button>
            </div>
            <div className="runtime-switcher" aria-label="Runtime mode">
              <button
                className={runtimeMode === 'demo-replay' ? 'is-active' : ''}
                type="button"
                onClick={() => setRuntimeMode('demo-replay')}
              >
                Demo Replay
              </button>
              <button
                className={runtimeMode === 'live-session' ? 'is-active' : ''}
                type="button"
                onClick={() => setRuntimeMode('live-session')}
              >
                Live Session
              </button>
            </div>
            <div className="match-result" aria-label="Battle winner">
              <span>{runtimeMode === 'live-session' ? 'Status' : 'Winner'}</span>
              <strong>{runtimeMode === 'live-session' && !battleState.winner ? 'Live' : winnerName}</strong>
            </div>
          </div>
        </header>

        <div
          className={`world-frame world-frame--${effectiveViewMode}`}
          aria-label="Agent Arena third-person simulator"
        >
          <div className="world-controls">
            <div className="world-controls__left">
              <div className="world-hud world-hud--top">
                <span>{modeLine}</span>
                {runtimeMode === 'live-session' ? (
                  <em>{liveSnapshot?.warning ?? 'polling live stream'}</em>
                ) : null}
              </div>

              {isLiveSession ? (
                <div className="solo-badge" aria-label="Live session view">
                  1P Codex
                </div>
              ) : (
                <div className="view-switcher" aria-label="Comparison view mode">
                  <button
                    className={viewMode === 'split' ? 'is-active' : ''}
                    type="button"
                    onClick={() => setViewMode('split')}
                  >
                    Split
                  </button>
                  <button
                    className={viewMode === 'codex' ? 'is-active' : ''}
                    type="button"
                    onClick={() => setViewMode('codex')}
                  >
                    Codex
                  </button>
                  <button
                    className={viewMode === 'claude' ? 'is-active' : ''}
                    type="button"
                    onClick={() => setViewMode('claude')}
                  >
                    Claude Code
                  </button>
                </div>
              )}
            </div>

            <aside className="tactical-panel" aria-label="Mission control">
              <section className="tactical-objective" aria-label="Animated center objective">
                <p className="eyebrow">{objectiveHeading}</p>
                <h2>{spectator.title}</h2>
                <p>{spectator.objective.label}</p>
                <strong>{spectator.victoryLine}</strong>
              </section>
              <div className="mission-stack" aria-label="Mission objectives">
                <p className="eyebrow">Active Missions</p>
                {spectator.missions.slice(0, 2).map((mission) => (
                  <strong key={mission}>{mission}</strong>
                ))}
              </div>
            </aside>
          </div>

          {runtimeMode === 'demo-replay' ? (
            <div className="replay-control-bar" aria-label="Demo replay controls">
              <div className="replay-actions">
                <button type="button" onClick={toggleReplay}>
                  {isReplayActivelyPlaying ? 'Pause' : 'Play'}
                </button>
                <button type="button" onClick={restartReplay}>
                  Restart
                </button>
                <div className="speed-control" aria-label="Replay speed">
                  {replaySpeeds.map((speed) => (
                    <button
                      className={replaySpeed === speed ? 'is-active' : ''}
                      key={speed}
                      type="button"
                      onClick={() => setReplaySpeed(speed)}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
              <div className="replay-progress" aria-label="Replay progress">
                <div className="replay-progress__label">
                  <span>{isReplayComplete ? 'Final verdict' : 'Normalized event stream'}</span>
                  <strong>{currentReplayEvent?.label ?? 'Waiting for first event'}</strong>
                </div>
                <div className="replay-progress__track" aria-hidden="true">
                  <span style={{ width: `${replayProgress}%` }} />
                </div>
                <div
                  className="replay-milestones"
                  style={{ '--event-count': demoEvents.length } as CSSProperties}
                  aria-hidden="true"
                >
                  {demoEvents.map((event, index) => (
                    <span
                      className={[
                        index < replayEventCount ? 'is-complete' : '',
                        index + 1 === replayEventCount ? 'is-current' : '',
                        event.type.includes('passed') || event.type === 'build_passed' ? 'is-check' : '',
                      ].filter(Boolean).join(' ')}
                      key={event.id}
                    />
                  ))}
                </div>
              </div>
              <div className={`trust-badge trust-badge--${evalModel.trustLabel.toLowerCase().replace(' ', '-')}`}>
                <span>Trust</span>
                <strong>{evalModel.trustLabel}</strong>
              </div>
              <div className="replay-feed" aria-label="Recent replay events">
                {recentEventLines.length > 0 ? (
                  recentEventLines.map((entry) => <span key={entry}>{entry}</span>)
                ) : (
                  <span>Codex is ready to receive the demo prompt.</span>
                )}
              </div>
            </div>
          ) : null}

          <div className="world-scene" aria-hidden="true">
            <div className="skyline" />
            <div className="terrain terrain--far" />
            <div className="terrain terrain--near" />
            <div className="path-lane path-lane--left" />
            <div className="path-lane path-lane--right" />
            <div className="scene-divider" />
            <div className="river-cut" />
            <div className="moba-tower moba-tower--codex" />
            <div className="moba-tower moba-tower--claude" />

            <div className="boss-objective boss-objective--codex">
              <div className="boss-pit" />
              <div className="boss-health" style={{ '--boss-health': `${Math.max(12, 100 - spectator.sides.codex.agent.score / 7)}%` } as CSSProperties}>
                <span />
              </div>
              <div className="boss-ring" />
              <div className="boss-core">
                <i className="monster-horn monster-horn--left" />
                <i className="monster-horn monster-horn--right" />
                <i className="monster-maw" />
                <span />
                <span />
                <strong />
              </div>
            </div>

            <div className="boss-objective boss-objective--claude">
              <div className="boss-pit" />
              <div className="boss-health" style={{ '--boss-health': `${Math.max(12, 100 - spectator.sides.claude.agent.score / 7)}%` } as CSSProperties}>
                <span />
              </div>
              <div className="boss-ring" />
              <div className="boss-core">
                <span />
                <span />
                <strong />
              </div>
            </div>

            <div className="player-avatar player-avatar--claude">
              <div className="player-shadow" />
              <div className="player-body player-body--claude">
                <span className="vanguard-crest" />
                <span className="vanguard-pauldron vanguard-pauldron--left" />
                <span className="vanguard-pauldron vanguard-pauldron--right" />
                <span className="vanguard-sword" />
                <span className="robot-antenna" />
                <span className="robot-ear robot-ear--left" />
                <span className="robot-ear robot-ear--right" />
                <span className="robot-eye robot-eye--left" />
                <span className="robot-eye robot-eye--right" />
                <strong>CC</strong>
              </div>
            </div>

            <div className="summon-party summon-party--codex">
              {spectator.sides.codex.units.map((unit, index) => (
                <span key={`${unit}-${index}`}>{webSkin.id === 'default' ? unit : ''}</span>
              ))}
            </div>

            <div className="summon-party summon-party--claude">
              {spectator.sides.claude.units.map((unit, index) => (
                <span key={`${unit}-${index}`}>{webSkin.id === 'default' ? unit : ''}</span>
              ))}
            </div>

            <div className="player-avatar player-avatar--codex">
              <div className="player-shadow" />
              <div className="player-body">
                <span className="vanguard-crest" />
                <span className="vanguard-pauldron vanguard-pauldron--left" />
                <span className="vanguard-pauldron vanguard-pauldron--right" />
                <span className="vanguard-sword" />
                <span className="robot-antenna" />
                <span className="robot-ear robot-ear--left" />
                <span className="robot-ear robot-ear--right" />
                <span className="robot-eye robot-eye--left" />
                <span className="robot-eye robot-eye--right" />
                <strong>C</strong>
              </div>
            </div>

            <div className="combat-float-stack combat-float-stack--codex">
              {latestCodexDelta ? (
                <span key={`${latestCodexDelta.eventId}-codex-float`}>
                  {formatCombatDelta(latestCodexDelta.points, latestCodexDelta.reason)}
                </span>
              ) : null}
            </div>

            <div className="combat-float-stack combat-float-stack--claude">
              {latestClaudeDelta ? (
                <span key={`${latestClaudeDelta.eventId}-claude-float`}>
                  {formatCombatDelta(latestClaudeDelta.points, latestClaudeDelta.reason)}
                </span>
              ) : null}
            </div>

            <div className="moba-minimap" aria-hidden="true">
              <span className="minimap-base minimap-base--codex" />
              <span className="minimap-base minimap-base--claude" />
              <span className="minimap-lane minimap-lane--main" />
              <span className="minimap-lane minimap-lane--river" />
              <span className="minimap-objective" />
              <span className="minimap-agent minimap-agent--codex" />
              {effectiveViewMode === 'split' ? <span className="minimap-agent minimap-agent--claude" /> : null}
            </div>
            <div className="moba-victory-banner">
              <span>{latestCallout}</span>
              <strong>{spectator.victoryLine}</strong>
            </div>
          </div>

          <div className="moba-command-hud" aria-label="MOBA command HUD">
            {mobaAbilities.map((ability, index) => {
              const isPrimed = index === Math.min(mobaAbilities.length - 1, latestDeltas.length)

              return (
                <div className={`ability-slot ${isPrimed ? 'ability-slot--primed' : ''}`} key={ability.key}>
                  <strong>{ability.key}</strong>
                  <span>{ability.label}</span>
                </div>
              )
            })}
            <div className="resource-strip">
              <span style={{ width: `${spectator.sides.codex.meters.health}%` }} />
              <strong>HP {formatStat(spectator.sides.codex.meters.health)}</strong>
            </div>
            <div className="resource-strip resource-strip--momentum">
              <span style={{ width: `${spectator.sides.codex.meters.momentum}%` }} />
              <strong>Momentum {formatStat(spectator.sides.codex.meters.momentum)}</strong>
            </div>
          </div>

          <div className="codex-desktop-pane" aria-label="Codex desktop workflow">
            <span>Codex desktop workflow</span>
            <strong>
              {runtimeMode === 'demo-replay'
                ? `Prompt pane: replaying ${currentReplayEvent?.label ?? 'mission setup'} through the shared reducer`
                : 'Live pane: watching normalized Codex session events'}
            </strong>
          </div>

          <div
            className={`arena-stage ${effectiveViewMode === 'split' ? 'arena-stage--split' : 'arena-stage--tabs'}`}
            aria-label="Agent Arena spectator replay"
          >
            {effectiveViewMode !== 'split' ? (
              <ArenaSide
                agent={focusedSide.agent}
                isWinner={focusedSide.role === 'winner'}
                side={focusedAgent === 'codex' ? 'left' : 'right'}
                units={focusedSide.units}
                runStats={focusedSide.runStats}
                skin={webSkin}
              />
            ) : (
              <>
                <ArenaSide
                  agent={spectator.sides.codex.agent}
                  isWinner={spectator.sides.codex.role === 'winner'}
                  side="left"
                  units={spectator.sides.codex.units}
                  runStats={spectator.sides.codex.runStats}
                  skin={webSkin}
                />

                <ArenaSide
                  agent={spectator.sides.claude.agent}
                  isWinner={spectator.sides.claude.role === 'winner'}
                  side="right"
                  units={spectator.sides.claude.units}
                  runStats={spectator.sides.claude.runStats}
                  skin={webSkin}
                />
              </>
            )}
          </div>
        </div>

        <aside className="caster-feed" aria-label="Caster callouts">
          <span>{webSkin.labels.feed}</span>
          {[...spectator.callouts].reverse().map((callout, index) => (
            <strong key={`${callout}-${index}`}>{callout}</strong>
          ))}
        </aside>
      </section>

      <details className="details-drawer">
        <summary>Scorecards, feed, and workflow</summary>

        <section className="battle-grid" aria-label="Replay details">
          <EvalSummary state={battleState} />

          <article className="panel final-scorecard">
            <div className="panel__header">
              <p className="eyebrow">{scorecardPhase} {webSkin.labels.scorecard ?? 'Scorecard'}</p>
              <h2>{spectator.victoryLine}</h2>
            </div>
            <div className="scorecard-grid">
              {visibleAgents.map((agent) => (
                <ScorecardPanel
                  key={agent.id}
                  agent={agent}
                  isWinner={agent.id === battleState.winner}
                  skin={webSkin}
                />
              ))}
            </div>
          </article>

          <article className="panel mission-panel">
            <div className="panel__header">
              <p className="eyebrow">Highlights</p>
              <h2>Turning Points</h2>
            </div>
            <ul className="highlight-list">
              {battleState.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </article>

          <article className="panel panel--scroll">
            <div className="panel__header">
              <p className="eyebrow">Ledger</p>
              <h2>Score Changes</h2>
            </div>
            <ol className="delta-list">
              {[...battleState.deltas].reverse().map((delta, index) => {
                const agent = battleState.agents[delta.agent]

                return (
                  <li key={`${delta.eventId}-${index}`}>
                    <span className="delta-list__agent">{agent.name}</span>
                    <span className="delta-list__reason">{delta.reason}</span>
                    <strong
                      className={
                        delta.points >= 0
                          ? 'delta-list__points delta-list__points--gain'
                          : 'delta-list__points delta-list__points--loss'
                      }
                    >
                      {formatSigned(delta.points)}
                    </strong>
                  </li>
                )
              })}
            </ol>
          </article>

          <article className="panel panel--scroll">
            <div className="panel__header">
              <p className="eyebrow">Timeline</p>
              <h2>Event Feed</h2>
            </div>
            <ol className="event-log">
              {[...battleState.log].reverse().map((entry, index) => (
                <li key={`${entry}-${index}`}>{entry}</li>
              ))}
            </ol>
          </article>

          <article className="panel panel--wide codex-workflow">
            <div className="panel__header">
              <p className="eyebrow">Built in Codex</p>
              <h2>Codex Workflow</h2>
            </div>
            <ul className="workflow-list">
              <li>Parallel sessions</li>
              <li>Worktree implementation</li>
              <li>Tests, lint, build</li>
              <li>Codex desktop preview</li>
              <li>Shared replay/live stream</li>
              <li>Presentation-only skins</li>
            </ul>
          </article>
        </section>
      </details>

      {webSkin.id !== 'default' || webSkin.warning ? (
        <aside className="skin-disclaimer" aria-label="Skin disclaimer">
          <strong>{webSkin.warning ?? webSkin.name}</strong>
          <span>
            {webSkin.presentation?.licenseNote ??
              'Custom local skins are optional presentation overlays. They are not official product assets and do not change scoring.'}
          </span>
        </aside>
      ) : null}

    </main>
  )
}

export default App
