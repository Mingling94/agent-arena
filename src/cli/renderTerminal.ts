import { describeEventForSkin } from '../arena/skins'
import type { ArenaSkin } from '../arena/skins'
import { buildSpectatorModel } from '../arena/spectatorModel'
import type { SpectatorModel, SpectatorRuntimeMode, SpectatorSide, SpectatorView } from '../arena/spectatorModel'
import type { AgentId, AgentState, BattleState, BattleEvent } from '../arena/types'

const FRAME_WIDTH = 80
const SOLO_SCENE_WIDTH = 66
const SOLO_DASH_WIDTH = 50
const LANE_WIDTH = 27
const CENTER_WIDTH = 20
const SCENE_COLUMN_WIDTH = 24
const BAR_WIDTH = 10

export type TerminalView = SpectatorView

export interface TerminalRenderOptions {
  view?: SpectatorView
  agent?: AgentId
  runtimeMode?: SpectatorRuntimeMode
  soloAgent?: AgentId
  maxWidth?: number
}

export function renderTerminal(
  state: BattleState,
  skin: ArenaSkin,
  options: TerminalRenderOptions = {},
): string {
  const model = buildSpectatorModel(state, {
    runtimeMode: options.runtimeMode,
    viewLabel: options.runtimeMode === 'live-session' ? 'Live arena session' : undefined,
  })
  const view = options.view ?? 'split'
  const agent = options.agent ?? 'codex'
  const eventAgent = options.soloAgent
  const blockers = formatBlockers(state, skin, eventAgent)
  const log = formatFeed(state, skin, eventAgent)
  const highlights = formatHighlights(state, skin, eventAgent)
  const winner = state.winner ? `Winner: ${state.winner === 'tie' ? 'Tie' : state.agents[state.winner].name}` : 'Winner: pending'
  const divider = '='.repeat(FRAME_WIDTH)

  const parts = { blockers, log, highlights, winner, matchLabel: state.label }

  if (view === 'scene') return renderSceneView(model, skin, parts, options.soloAgent, options.maxWidth)
  if (view === 'focus') return renderFocusView(model, skin, agent, parts)
  if (view === 'feed') return renderFeedView(model, skin, parts)

  return [
    'AGENT ARENA',
    `Skin: ${skin.name}  Match: ${state.label}  ${winner}`,
    `Runtime: ${model.runtime.label}  Source: ${model.runtime.source}`,
    `View: ${model.viewLabel}  ${model.victoryLine}`,
    divider,
    'THIRD-PERSON ARENA',
    renderThirdPersonScene(model, skin),
    divider,
    'ARENA VIEW',
    renderSplitView(model, skin),
    divider,
    `Center ${titleCase(skin.labels.blocker)}`,
    `  ${blockers}`,
    `  Status: ${model.objective.status} - ${model.objective.detail}`,
    `  ${skin.glyphs.blocker} Center ${skin.labels.blocker}: ${skin.labels.finalResult}`,
    divider,
    '-------------------------- HIGHLIGHTS --------------------------',
    highlights || '  No highlights yet',
    `------------------ Recent Caster Feed (${skin.labels.feed}) ------------------`,
    log || '  No events yet',
    divider,
  ].join('\n')
}

function renderSceneView(
  model: SpectatorModel,
  skin: ArenaSkin,
  parts: { blockers: string; log: string; highlights: string; winner: string; matchLabel: string },
  soloAgent?: AgentId,
  maxWidth?: number,
): string {
  if (soloAgent) return renderSoloSceneView(model, skin, parts, soloAgent, maxWidth)

  return [
    renderCinematicScene(model, skin, soloAgent, parts.blockers),
    '',
    renderStatusDock(model, skin, parts, soloAgent),
    '',
    'CASTER FEED',
    parts.log || '  No events yet',
    '',
    'DECISIVE MOMENTS',
    parts.highlights || '  No highlights yet',
  ].join('\n')
}

function renderSoloSceneView(
  model: SpectatorModel,
  skin: ArenaSkin,
  parts: { blockers: string; log: string; highlights: string; winner: string; matchLabel: string },
  soloAgent: AgentId,
  maxWidth?: number,
): string {
  if ((maxWidth ?? Number.POSITIVE_INFINITY) < SOLO_SCENE_WIDTH + SOLO_DASH_WIDTH + 2) {
    return renderNarrowSoloSceneView(model, skin, parts, soloAgent, Math.max(42, Math.min(maxWidth ?? SOLO_SCENE_WIDTH, SOLO_SCENE_WIDTH)))
  }

  return combineColumns(
    renderSoloAnimationPanel(model, skin, parts, soloAgent),
    renderSoloDashboardPanel(model, skin, parts, soloAgent),
  )
}

function renderNarrowSoloSceneView(
  model: SpectatorModel,
  skin: ArenaSkin,
  parts: { blockers: string; log: string; highlights: string },
  soloAgent: AgentId,
  width: number,
): string {
  const solo = model.sides[soloAgent]
  const objective = firstBlockerLabel(parts.blockers)
  const feed = compactBlock(parts.log, 3)
  const highlights = compactBlock(parts.highlights, 2)

  return [
    boxTop('CODEX LIVE SESSION', width),
    boxLine(`${solo.agent.name} tracking active work`, width),
    boxLine(`score ${solo.meters.score} | hp ${Math.round(solo.meters.health)} | momentum ${solo.meters.momentum}`, width),
    boxRule(width),
    boxLine(`Current ${titleCase(skin.labels.blocker)}`, width),
    boxLine(`╭──── ${clip(objective, Math.max(12, width - 18))} ────╮`, width),
    boxLine('│      CHECKPOINT CORE      │', width),
    boxLine('╰───────────────────────────╯', width),
    boxLine('', width),
    boxLine('             O/', width),
    boxLine('            /|   >>> tests/build', width),
    boxLine('            / \\', width),
    boxLine(`HP ${bar(solo.meters.health)}  Momentum ${bar(solo.meters.momentum)}`, width),
    boxLine(`${skin.glyphs.assist} ${solo.units[0] ?? 'Solo run'}`, width),
    boxRule(width),
    boxLine('EVENT FEED', width),
    ...feed.map((line) => boxLine(line, width)),
    boxRule(width),
    boxLine('CHECKS / MILESTONES', width),
    ...highlights.map((line) => boxLine(line, width)),
    boxBottom(width),
  ].join('\n')
}

export function renderAgent(agent: AgentState, skin: ArenaSkin): string {
  const assists = agent.familiars.length > 0 ? agent.familiars.join(', ') : 'none'
  return [
    `${agent.name}`,
    `  ${skin.glyphs.score} ${skin.labels.score}: ${agent.score}  Health: ${Math.round(agent.health)}  ${skin.labels.momentum}: ${agent.momentum}`,
    `  ${skin.glyphs.assist} ${skin.labels.assist}: ${assists}`,
  ].join('\n')
}

function renderCinematicScene(
  model: SpectatorModel,
  skin: ArenaSkin,
  soloAgent?: AgentId,
  soloBlockers?: string,
): string {
  const codex = model.sides.codex
  const claude = model.sides.claude
  const solo = soloAgent ? model.sides[soloAgent] : null
  const objective = soloAgent ? firstBlockerLabel(soloBlockers) : model.objective.label
  const outcome = solo
    ? `${solo.agent.name} live session`
    : model.objective.status === 'secured'
      ? model.victoryLine
      : 'Objective contested'
  const codexPush = codex.meters.score >= claude.meters.score ? 'push >>>' : 'holding'
  const claudePush = claude.meters.score > codex.meters.score ? '<<< push' : 'holding'

  if (solo) {
    return renderSoloAnimationPanel(model, skin, { blockers: soloBlockers ?? 'No active blockers' }, solo.agent.id).join('\n')
  }

  return [
    '╭────────────────────────────── AGENT ARENA LIVE ──────────────────────────────╮',
    cinemaLine(outcome),
    cinemaLine(''),
    cinemaLine(`◆ ${titleCase(skin.labels.blocker)}: ${skin.labels.finalResult} ◆`),
    cinemaLine(`╭──────── ${clip(objective, 28)} ────────╮`),
    cinemaLine('│            CHECKPOINT CORE             │'),
    cinemaLine('╰────────────────────────────────────────╯'),
    cinemaLine(''),
    cinemaColumns(codex.agent.name, 'arena lane', claude.agent.name),
    cinemaColumns('  O/', `${codexPush} / ${claudePush}`, '\\O  '),
    cinemaColumns(' /| ', '      center pressure      ', ' |\\ '),
    cinemaColumns(' / \\', model.objective.status, '/ \\ '),
    cinemaColumns(`HP ${bar(codex.meters.health)}`, `score gap ${Math.abs(codex.meters.score - claude.meters.score)}`, `HP ${bar(claude.meters.health)}`),
    cinemaColumns(`${codex.meters.score} pts`, model.runtime.label, `${claude.meters.score} pts`),
    cinemaColumns(`${skin.glyphs.assist} ${codex.units[0] ?? 'Solo run'}`, 'helpers', `${skin.glyphs.assist} ${claude.units[0] ?? 'Solo run'}`),
    cinemaLine(''),
    '╰──────────────────────────────────────────────────────────────────────────────╯',
  ].join('\n')
}

function renderSoloAnimationPanel(
  model: SpectatorModel,
  skin: ArenaSkin,
  parts: { blockers: string },
  soloAgent: AgentId,
): string[] {
  const solo = model.sides[soloAgent]
  const objective = firstBlockerLabel(parts.blockers)

  return [
    boxTop('CODEX LIVE SESSION', SOLO_SCENE_WIDTH),
    boxLine(`${solo.agent.name} tracking active work`, SOLO_SCENE_WIDTH),
    boxLine('', SOLO_SCENE_WIDTH),
    boxLine(`Current ${titleCase(skin.labels.blocker)}`, SOLO_SCENE_WIDTH),
    boxLine(`╭──── ${clip(objective, 32)} ────╮`, SOLO_SCENE_WIDTH),
    boxLine('│        CHECKPOINT CORE        │', SOLO_SCENE_WIDTH),
    boxLine('╰───────────────────────────────╯', SOLO_SCENE_WIDTH),
    boxLine('', SOLO_SCENE_WIDTH),
    boxLine('             O/', SOLO_SCENE_WIDTH),
    boxLine('            /|        >>> tests/build', SOLO_SCENE_WIDTH),
    boxLine('            / \\', SOLO_SCENE_WIDTH),
    boxLine('', SOLO_SCENE_WIDTH),
    boxLine(`HP ${bar(solo.meters.health)}   Momentum ${bar(solo.meters.momentum)}`, SOLO_SCENE_WIDTH),
    boxLine(`${skin.glyphs.assist} ${solo.units[0] ?? 'Solo run'}`, SOLO_SCENE_WIDTH),
    boxLine(model.objective.status === 'secured' ? 'Objective secured' : 'Objective contested', SOLO_SCENE_WIDTH),
    boxBottom(SOLO_SCENE_WIDTH),
  ]
}

function renderSoloDashboardPanel(
  model: SpectatorModel,
  skin: ArenaSkin,
  parts: { blockers: string; log: string; highlights: string },
  soloAgent: AgentId,
): string[] {
  const solo = model.sides[soloAgent]
  const feed = compactBlock(parts.log, 3)
  const highlights = compactBlock(parts.highlights, 2)

  return [
    boxTop('SESSION HUD', SOLO_DASH_WIDTH),
    boxLine(`${solo.agent.name} | ${model.runtime.label}`, SOLO_DASH_WIDTH),
    boxRule(SOLO_DASH_WIDTH),
    boxLine('METRICS', SOLO_DASH_WIDTH),
    boxLine(`score ${solo.meters.score} pts | health ${Math.round(solo.meters.health)}`, SOLO_DASH_WIDTH),
    boxLine(`momentum ${solo.meters.momentum} | objective ${model.objective.status}`, SOLO_DASH_WIDTH),
    boxLine(`${titleCase(skin.labels.blocker)}: ${firstBlockerLabel(parts.blockers)}`, SOLO_DASH_WIDTH),
    boxRule(SOLO_DASH_WIDTH),
    boxLine('EVENT FEED', SOLO_DASH_WIDTH),
    ...feed.map((line) => boxLine(line, SOLO_DASH_WIDTH)),
    boxRule(SOLO_DASH_WIDTH),
    boxLine('CHECKS / MILESTONES', SOLO_DASH_WIDTH),
    ...highlights.map((line) => boxLine(line, SOLO_DASH_WIDTH)),
    boxBottom(SOLO_DASH_WIDTH),
  ]
}

function renderStatusDock(
  model: SpectatorModel,
  skin: ArenaSkin,
  parts: { blockers: string; winner: string; matchLabel: string },
  soloAgent?: AgentId,
): string {
  if (soloAgent) {
    const side = model.sides[soloAgent]

    return [
      '╭────────────────────────────── SESSION CONTROL ──────────────────────────────╮',
      dockLine(`${side.agent.name} | ${model.viewLabel} | ${model.runtime.label}`),
      dockLine(`score ${side.meters.score} pts  | health ${Math.round(side.meters.health)}  | momentum ${side.meters.momentum}`),
      dockLine(`${skin.labels.blocker}: ${parts.blockers}`),
      '╰──────────────────────────────────────────────────────────────────────────────╯',
    ].join('\n')
  }

  return [
    '╭────────────────────────────── MATCH CONTROL ────────────────────────────────╮',
    dockLine(`${parts.matchLabel} | ${parts.winner} | ${model.viewLabel}`),
    dockLine(`Codex ${model.sides.codex.meters.score} pts  vs  Claude Code ${model.sides.claude.meters.score} pts  | objective ${model.objective.status}`),
    dockLine(`${skin.labels.blocker}: ${parts.blockers}`),
    '╰──────────────────────────────────────────────────────────────────────────────╯',
  ].join('\n')
}

function firstBlockerLabel(blockers?: string): string {
  if (!blockers || blockers === 'No active blockers') return 'active session'
  const first = blockers.split(' | ')[0] ?? blockers
  return first.includes(': ') ? first.split(': ').slice(1).join(': ') : first
}

function cinemaLine(value: string): string {
  return `│${centerFit(value, FRAME_WIDTH - 2)}│`
}

function cinemaColumns(left: string, center: string, right: string): string {
  return `│ ${fit(left, 22)} ${centerFit(center, 30)} ${fit(right, 22)} │`
}

function dockLine(value: string): string {
  return `│ ${fit(value, FRAME_WIDTH - 4)} │`
}

function combineColumns(left: string[], right: string[]): string {
  const height = Math.max(left.length, right.length)
  const leftBlank = ' '.repeat(SOLO_SCENE_WIDTH)
  const rightBlank = ' '.repeat(SOLO_DASH_WIDTH)
  const lines: string[] = []

  for (let index = 0; index < height; index += 1) {
    lines.push(`${left[index] ?? leftBlank}  ${right[index] ?? rightBlank}`)
  }

  return lines.join('\n')
}

function boxTop(title: string, width: number): string {
  const label = ` ${title} `
  const left = Math.max(0, Math.floor((width - 2 - label.length) / 2))
  const right = Math.max(0, width - 2 - label.length - left)
  return `╭${'─'.repeat(left)}${label}${'─'.repeat(right)}╮`
}

function boxLine(value: string, width: number): string {
  return `│ ${fit(value, width - 4)} │`
}

function boxRule(width: number): string {
  return `├${'─'.repeat(width - 2)}┤`
}

function boxBottom(width: number): string {
  return `╰${'─'.repeat(width - 2)}╯`
}

function compactBlock(value: string, maxLines: number): string[] {
  const lines = value
    .split('\n')
    .map((line) => line.trim().replace(/^[-*]\s*/, ''))
    .filter(Boolean)
    .slice(-maxLines)

  return lines.length > 0 ? lines : ['No events yet']
}

function renderSplitView(model: SpectatorModel, skin: ArenaSkin): string {
  const codex = renderLane(model.sides.codex, 'Codex Lane', skin)
  const claude = renderLane(model.sides.claude, 'Claude Lane', skin)
  const center = renderCenter(model, skin)

  return codex.map((line, index) => `${line} | ${center[index]} | ${claude[index]}`).join('\n')
}

function renderFocusView(
  model: SpectatorModel,
  skin: ArenaSkin,
  agentId: AgentId,
  parts: { blockers: string; log: string; highlights: string; winner: string; matchLabel: string },
): string {
  const side = model.sides[agentId]
  const agent = side.agent
  const opponent = model.sides[agentId === 'codex' ? 'claude' : 'codex'].agent
  const units = side.units.join(', ')
  const focusDivider = '-'.repeat(60)

  return [
    'AGENT ARENA',
    `Skin: ${skin.name}  Match: ${parts.matchLabel}  ${parts.winner}`,
    `Runtime: ${model.runtime.label}  Source: ${model.runtime.source}`,
    `View: ${model.viewLabel}  ${model.victoryLine}`,
    focusDivider,
    'THIRD-PERSON ARENA',
    renderThirdPersonScene(model, skin, agentId),
    focusDivider,
    'FOCUS VIEW',
    `Focused Agent: ${agent.name}`,
    `Opponent: ${opponent.name}`,
    `Model: ${side.runStats.backingModel}`,
    `Repo: ${side.runStats.repo}`,
    `Task: ${side.runStats.task}`,
    `${skin.glyphs.score} ${skin.labels.score}: ${side.meters.score}  ${skin.labels.momentum}: ${side.meters.momentum}`,
    `HP ${bar(side.meters.health)} ${Math.round(side.meters.health)}`,
    `Momentum ${bar(side.meters.momentum)} ${side.meters.momentum}`,
    `Units: ${skin.glyphs.assist} ${skin.labels.assist}`,
    `  ${units}`,
    focusDivider,
    `Center ${titleCase(skin.labels.blocker)}`,
    `  ${parts.blockers}`,
    `  Status: ${model.objective.status} - ${model.objective.detail}`,
    `  ${skin.glyphs.blocker} Center ${skin.labels.blocker}: ${skin.labels.finalResult}`,
    focusDivider,
    'Recent Caster Feed',
    parts.log || '  No events yet',
    focusDivider,
    'Decisive Moments',
    parts.highlights || '  No highlights yet',
    focusDivider,
  ].join('\n')
}

function renderFeedView(
  model: SpectatorModel,
  skin: ArenaSkin,
  parts: { blockers: string; log: string; highlights: string; winner: string; matchLabel: string },
): string {
  return [
    'AGENT ARENA',
    `Skin: ${skin.name}  Match: ${parts.matchLabel}  ${parts.winner}`,
    `Runtime: ${model.runtime.label}  Source: ${model.runtime.source}`,
    `View: ${model.viewLabel}  ${model.victoryLine}`,
    '-'.repeat(60),
    'FEED VIEW',
    `Score: Codex ${model.sides.codex.meters.score} | Claude Code ${model.sides.claude.meters.score}`,
    `Center ${skin.labels.blocker}: ${skin.labels.finalResult}`,
    `Status: ${model.objective.status} - ${model.objective.detail}`,
    `Active ${skin.labels.blocker}: ${parts.blockers}`,
    '-'.repeat(60),
    'Recent Caster Feed',
    parts.log || '  No events yet',
    '-'.repeat(60),
    'Decisive Moments',
    parts.highlights || '  No highlights yet',
    '-'.repeat(60),
  ].join('\n')
}

function renderThirdPersonScene(model: SpectatorModel, skin: ArenaSkin, focusAgent?: AgentId): string {
  const codex = model.sides.codex
  const claude = model.sides.claude
  const activeBlocker = model.objective.label
  const codexUnit = renderUnit(codex, skin, focusAgent === 'codex')
  const claudeUnit = renderUnit(claude, skin, focusAgent === 'claude')
  const codexHelper = renderHelper(codex, skin)
  const claudeHelper = renderHelper(claude, skin)

  return [
    sceneLine(''),
    sceneLine(centerFit(`${skin.glyphs.blocker} ${titleCase(skin.labels.blocker)}: ${skin.labels.finalResult}`, 74)),
    sceneLine(centerFit(model.objective.status === 'secured' ? model.victoryLine : 'Objective contested', 74)),
    sceneLine(''),
    sceneColumns(codexHelper, 'helpers', claudeHelper),
    sceneColumns(codexUnit, `${skin.glyphs.blocker} ${activeBlocker}`, claudeUnit),
    sceneColumns(`HP ${bar(codex.meters.health)}`, 'battle line', `HP ${bar(claude.meters.health)}`),
    sceneColumns(`${codex.meters.score} pts`, model.objective.status, `${claude.meters.score} pts`),
    sceneLine(''),
  ].join('\n')
}

function renderUnit(side: SpectatorSide, skin: ArenaSkin, focused: boolean): string {
  const marker = focused ? '>' : ' '
  return `${marker}${glyphForAgent(side.agent, skin)} ${side.agent.name}${marker}`
}

function renderHelper(side: SpectatorSide, skin: ArenaSkin): string {
  const helper = side.units[0] ?? 'Solo run'
  return `${skin.glyphs.assist} ${helper}`
}

function sceneLine(value: string): string {
  return `| ${fit(value, FRAME_WIDTH - 4)} |`
}

function sceneColumns(left: string, center: string, right: string): string {
  return sceneLine(
    `${fit(left, SCENE_COLUMN_WIDTH)} ${centerFit(center, SCENE_COLUMN_WIDTH)} ${fit(right, SCENE_COLUMN_WIDTH)}`,
  )
}

function renderLane(side: SpectatorSide, lane: string, skin: ArenaSkin): string[] {
  const agent = side.agent
  const units = side.units.join(', ')
  const momentumLabel = titleCase(skin.labels.momentum)

  return [
    fit(lane, LANE_WIDTH),
    fit(`${glyphForAgent(agent, skin)} ${agent.name}`, LANE_WIDTH),
    fit(`${skin.glyphs.score} ${skin.labels.score}: ${side.meters.score}`, LANE_WIDTH),
    fit(`HP ${bar(side.meters.health)} ${Math.round(side.meters.health)}`, LANE_WIDTH),
    fit(`${momentumLabel} ${bar(side.meters.momentum)} ${side.meters.momentum}`, LANE_WIDTH),
    fit(`Units: ${skin.glyphs.assist} ${skin.labels.assist}`, LANE_WIDTH),
    fit(`  ${units}`, LANE_WIDTH),
  ]
}

function renderCenter(model: SpectatorModel, skin: ArenaSkin): string[] {
  const blockerTitle = titleCase(skin.labels.blocker)

  return [
    centerFit(`Center ${blockerTitle}`, CENTER_WIDTH),
    centerFit(`${skin.glyphs.blocker} ${skin.labels.finalResult}`, CENTER_WIDTH),
    centerFit(model.objective.status, CENTER_WIDTH),
    centerFit(model.objective.label, CENTER_WIDTH),
    centerFit('Mission Result', CENTER_WIDTH),
    centerFit(model.victoryLine, CENTER_WIDTH),
    centerFit(model.viewLabel, CENTER_WIDTH),
  ]
}

function formatBlockers(state: BattleState, skin: ArenaSkin, agent?: AgentId): string {
  const blockerEvents = state.events.filter(
    (event) => (!agent || event.agent === agent) && (event.type === 'blocker_detected' || event.type === 'test_failed'),
  )
  if (blockerEvents.length === 0) return 'No active blockers'

  return blockerEvents
    .slice(-3)
    .reverse()
    .map((event) => `${describeEventForSkin(event.type, skin)}: ${event.label}`)
    .join(' | ')
}

function formatHighlights(state: BattleState, skin: ArenaSkin, agent?: AgentId): string {
  const highlightEvents = state.events.filter(
    (event) =>
      (!agent || event.agent === agent) &&
      (event.type === 'test_passed' || event.type === 'build_passed' || event.type === 'task_completed' || event.type === 'judge_verdict'),
  )

  return highlightEvents
    .slice(-4)
    .map((event) => `  * ${state.agents[event.agent].name}: ${describeEventForSkin(event.type, skin)} - ${event.label}`)
    .join('\n')
}

function formatFeed(state: BattleState, skin: ArenaSkin, agent?: AgentId): string {
  const eventById = new Map<string, BattleEvent>(state.events.map((event) => [event.id, event]))

  return state.deltas
    .filter((delta) => !agent || delta.agent === agent)
    .slice(-8)
    .map((delta) => {
      const event = eventById.get(delta.eventId)
      const text = event ? describeEventForSkin(event.type, skin) : delta.reason
      const sign = delta.points >= 0 ? '+' : ''
      return `  ${state.agents[delta.agent].name}: ${text} - ${delta.reason} (${sign}${delta.points})`
    })
    .join('\n')
}

function glyphForAgent(agent: AgentState, skin: ArenaSkin): string {
  return agent.id === 'codex' ? skin.glyphs.codex : skin.glyphs.claude
}

function bar(value: number): string {
  const boundedValue = Math.max(0, Math.min(100, Math.round(value)))
  const filled = Math.round((boundedValue / 100) * BAR_WIDTH)
  return `[${'#'.repeat(filled)}${'-'.repeat(BAR_WIDTH - filled)}]`
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (match) => match.toUpperCase())
}

function fit(value: string, width: number): string {
  const compact = value.length > width ? `${value.slice(0, width - 1)}~` : value
  return compact.padEnd(width, ' ')
}

function clip(value: string, width: number): string {
  return value.length > width ? `${value.slice(0, width - 1)}~` : value
}

function centerFit(value: string, width: number): string {
  const compact = value.length > width ? `${value.slice(0, width - 1)}~` : value
  const left = Math.floor((width - compact.length) / 2)
  const right = width - compact.length - left
  return `${' '.repeat(left)}${compact}${' '.repeat(right)}`
}
