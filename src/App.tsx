import battle from './web/demoBattle.json'
import './App.css'

type AgentId = 'codex' | 'claude'

type Agent = {
  id: AgentId
  name: string
  score: number
  health: number
  momentum: number
  familiars: string[]
}

type Delta = {
  eventId: string
  agent: AgentId
  points: number
  reason: string
  category: string
}

type BattleState = {
  label: string
  agents: Record<AgentId, Agent>
  blockers: string[]
  log: string[]
  deltas: Delta[]
  highlights: string[]
  winner: AgentId
}

const battleState = battle as BattleState
const agents: Agent[] = [battleState.agents.codex, battleState.agents.claude]
const winner = battleState.agents[battleState.winner]

function formatSigned(points: number) {
  return points > 0 ? `+${points}` : String(points)
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
        <strong>{value}</strong>
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

function AgentPanel({ agent, isWinner }: { agent: Agent; isWinner: boolean }) {
  return (
    <article className={`agent-card ${isWinner ? 'agent-card--winner' : ''}`}>
      <div className="agent-card__header">
        <div>
          <p className="eyebrow">{isWinner ? 'Winner' : 'Contender'}</p>
          <h2>{agent.name}</h2>
        </div>
        <div className="score-badge">
          <span>Score</span>
          <strong>{agent.score}</strong>
        </div>
      </div>

      <div className="agent-card__meters">
        <StatMeter label="Health" value={agent.health} tone="health" />
        <StatMeter label="Momentum" value={agent.momentum} tone="momentum" />
      </div>

      <div className="familiars">
        <h3>Familiars</h3>
        {agent.familiars.length > 0 ? (
          <ul>
            {agent.familiars.map((familiar) => (
              <li key={familiar}>{familiar}</li>
            ))}
          </ul>
        ) : (
          <p>No familiars active</p>
        )}
      </div>
    </article>
  )
}

function App() {
  return (
    <main className="arena-shell">
      <section className="hero-panel" aria-labelledby="arena-title">
        <div>
          <p className="eyebrow">{battleState.label}</p>
          <h1 id="arena-title">Agent Arena</h1>
          <p className="hero-panel__summary">
            Skin-neutral replay viewer for a recorded Codex vs Claude Code
            battle.
          </p>
        </div>
        <aside className="winner-panel" aria-label="Battle winner">
          <span>Winner</span>
          <strong>{winner.name}</strong>
        </aside>
      </section>

      <section className="scoreboard" aria-label="Agent scoreboards">
        {agents.map((agent) => (
          <AgentPanel
            key={agent.id}
            agent={agent}
            isWinner={agent.id === battleState.winner}
          />
        ))}
      </section>

      <section className="battle-grid" aria-label="Replay details">
        <article className="panel panel--center">
          <div className="panel__header">
            <p className="eyebrow">Center Lane</p>
            <h2>Blockers and Objectives</h2>
          </div>
          <ul className="objective-list">
            {battleState.blockers.map((blocker) => (
              <li key={blocker}>
                <span className="objective-marker" aria-hidden="true" />
                {blocker}
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <div className="panel__header">
            <p className="eyebrow">Replay Notes</p>
            <h2>Highlights</h2>
          </div>
          <ul className="highlight-list">
            {battleState.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </article>

        <article className="panel panel--wide">
          <div className="panel__header">
            <p className="eyebrow">Scoring Feed</p>
            <h2>Score Changes</h2>
          </div>
          <ol className="delta-list">
            {battleState.deltas.map((delta) => {
              const agent = battleState.agents[delta.agent]

              return (
                <li key={delta.eventId}>
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

        <article className="panel panel--wide">
          <div className="panel__header">
            <p className="eyebrow">Timeline</p>
            <h2>Event Log</h2>
          </div>
          <ol className="event-log">
            {battleState.log.map((entry, index) => (
              <li key={`${entry}-${index}`}>{entry}</li>
            ))}
          </ol>
        </article>
      </section>
    </main>
  )
}

export default App
