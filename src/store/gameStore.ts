import { useSyncExternalStore } from 'react'
import { randomExpeditionEvent } from '../data/expeditionEvents'
import { CLASSES, DUNGEONS, MATERIAL_NAMES, MERCENARY_BASES, RECIPES } from '../data/gameData'
import type {
  BattleState,
  CombatUnit,
  GameState,
  MaterialKey,
  Mercenary,
  MercenaryBase,
  Party,
  SkillDefinition,
  StatMap,
} from '../types/game'

import { getClassName, getMercenaryStats, getXpRequired } from '../utils/mercenary'
import { EXPEDITION_TIMINGS } from '../config/expedition'
import {
  calculateCriticalMultiplier,
  calculateDamageRange,
  calculateFinalHitRate,
  calculatePhysicalDamage,
  getCombatMainStat,
  mapJobToCombatClass,
  rollBaseDamage,
  rollChance,
} from '../game/combat'
import { generateMercenaryTraits, getTraitCombatEffects, normalizeMercenaryTraits } from '../game/traits'

const STORAGE_KEY = 'daesangin-react-v3'
const TAVERN_REFRESH_MS = 4 * 60 * 60 * 1_000
const DUNGEON_PROGRESS_REQUIREMENTS = [80, 150, 220, 300] as const

type Listener = () => void

const listeners = new Set<Listener>()


function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function createMercenary(base?: MercenaryBase): Mercenary {
  const selectedBase = base ?? randomItem(MERCENARY_BASES)
  return {
    id: createId('mercenary'),
    base: selectedBase,
    traits: generateMercenaryTraits(),
    level: 1,
    xp: 0,
    path: [],
    gear: { weapon: null, armor: null, charm: null },
    status: 'idle',
  }
}

function createParty(index: number, members: Array<string | null> = []): Party {
  const normalizedMembers: [string | null, string | null, string | null, string | null] = [
    members[0] ?? null,
    members[1] ?? null,
    members[2] ?? null,
    members[3] ?? null,
  ]

  return {
    id: createId('party'),
    name: `제${index + 1} 원정대`,
    members: normalizedMembers,
    dungeon: null,
    status: 'idle',
    nextActionAt: 0,
    campUntil: 0,
    runs: 0,
    loot: {},
    busy: false,
    areaTotal: 80,
    areasCompleted: 0,
  }
}

function createInitialState(): GameState {

  return {
    gold: 0,
    fame: 0,
    gems: 0,
    materials: {
      wood: 0,
      ore: 0,
      fiber: 0,
      hide: 0,
      herb: 0,
      essence: 0,
    },
    mercenaries: [],
    items: [],
    candidates: [createMercenary()],
    candidateRefreshAt: Date.now() + TAVERN_REFRESH_MS,
    candidatePaused: false,
    candidateTimeRemaining: TAVERN_REFRESH_MS,
    tavernSpeedMultiplier: 1,
    marketSlots: 1,
    marketSpeedMultiplier: 1,
    marketListings: [],
    facilities: {
      quarters: 1,
      party: 1,
      storage: 1,
      forge: 1,
      tavern: 1,
    },
    parties: [createParty(0)],
    expeditionSessions: {},
    unlockedDungeonIndex: 0,
    dungeonProgress: {},
    recentLog: '새 길드가 시작되었습니다.',
    lastSavedAt: Date.now(),
  }
}

function normalizeState(input: Partial<GameState>): GameState {
  const fallback = createInitialState()

  const state: GameState = {
    ...fallback,
    ...input,
    materials: {
      ...fallback.materials,
      ...(input.materials ?? {}),
    },
    facilities: {
      ...fallback.facilities,
      ...(input.facilities ?? {}),
    },
    mercenaries: Array.isArray(input.mercenaries)
      ? input.mercenaries
      : fallback.mercenaries,
    candidates: Array.isArray(input.candidates)
      ? input.candidates.slice(-Math.max(1, (input.facilities?.tavern ?? fallback.facilities.tavern)))
      : fallback.candidates,
    items: Array.isArray(input.items) ? input.items : [],
    candidatePaused: input.candidatePaused ?? false,
    candidateTimeRemaining: Math.max(0, input.candidateTimeRemaining ?? TAVERN_REFRESH_MS),
    parties: Array.isArray(input.parties) ? input.parties : fallback.parties,
    expeditionSessions: input.expeditionSessions ?? {},
  }

  state.mercenaries = state.mercenaries.map((mercenary) => ({
    ...mercenary,
    traits: normalizeMercenaryTraits(mercenary.traits),
    path: Array.isArray(mercenary.path) ? mercenary.path : [],
    gear: {
      weapon: mercenary.gear?.weapon ?? null,
      armor: mercenary.gear?.armor ?? null,
      charm: mercenary.gear?.charm ?? null,
    },
    status: mercenary.status ?? 'idle',
  }))

  state.candidates = state.candidates.map((mercenary) => ({
    ...mercenary,
    traits: normalizeMercenaryTraits(mercenary.traits),
    path: Array.isArray(mercenary.path) ? mercenary.path : [],
    gear: {
      weapon: mercenary.gear?.weapon ?? null,
      armor: mercenary.gear?.armor ?? null,
      charm: mercenary.gear?.charm ?? null,
    },
    status: mercenary.status ?? 'idle',
  }))
  state.parties = state.parties.map((party, index) => ({
    ...createParty(index),
    ...party,
    members: [
      party.members?.[0] ?? null,
      party.members?.[1] ?? null,
      party.members?.[2] ?? null,
      party.members?.[3] ?? null,
    ],
    loot: party.loot ?? {},
    busy: false,
    areaTotal: party.areaTotal ?? 8,
    areasCompleted: party.areasCompleted ?? 0,
  }))

  state.candidatePaused = Boolean(state.candidatePaused)
  state.candidateTimeRemaining = Math.max(0, Number(state.candidateTimeRemaining) || TAVERN_REFRESH_MS)
  if (!state.candidatePaused && state.tavernSpeedMultiplier > 1) {
    const expected = TAVERN_REFRESH_MS / state.tavernSpeedMultiplier
    if (state.candidateRefreshAt - Date.now() > expected) state.candidateRefreshAt = Date.now() + expected
  }
  removeDuplicatePartyMembers(state)
  ensurePartyCount(state)

  return state
}

function resolveOfflineRun(
  targetState: GameState,
  party: Party,
): void {
  const dungeonIndex = party.dungeon
  if (dungeonIndex === null || !DUNGEONS[dungeonIndex]) {
    party.status = 'idle'
    party.dungeon = null
    return
  }

  const dungeon = DUNGEONS[dungeonIndex]
  const power = party.members.reduce((total, mercenaryId) => {
    const mercenary = targetState.mercenaries.find(
      (target) => target.id === mercenaryId,
    )

    if (!mercenary) return total

    const stats = getTotalStats(mercenary, targetState)
    return (
      total +
      stats.atk +
      stats.def * 0.7 +
      stats.heal * 0.8 +
      stats.hp * 0.08
    )
  }, 0)

  const requiredPower =
    80 + dungeon.recommendedLevel * 65
  const won =
    power * (0.85 + Math.random() * 0.3) >
    requiredPower

  if (won) {
    rewardBattleVictory(targetState, party, false)
  } else {
    applyBattleDefeat(targetState, party)
  }
}

function processOfflineProgress(
  targetState: GameState,
): void {
  const elapsedSeconds = Math.min(
    21_600,
    Math.max(
      0,
      (Date.now() -
        (targetState.lastSavedAt || Date.now())) /
        1_000,
    ),
  )

  for (const party of targetState.parties) {
    if (
      party.status !== 'explore' ||
      party.dungeon === null
    ) {
      continue
    }

    const dungeon = DUNGEONS[party.dungeon]
    if (!dungeon) continue

    const runCount = Math.min(
      100,
      Math.floor(elapsedSeconds / dungeon.actionTime),
    )

    for (
      let runIndex = 0;
      runIndex < runCount;
      runIndex += 1
    ) {
      resolveOfflineRun(targetState, party)
    }

    party.nextActionAt =
      Date.now() + dungeon.actionTime * 1_000
  }

  targetState.lastSavedAt = Date.now()
}

function loadState(): GameState {
  if (typeof window === 'undefined') {
    return createInitialState()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return createInitialState()
    }

    const loadedState = normalizeState(
      JSON.parse(raw) as Partial<GameState>,
    )
    processOfflineProgress(loadedState)
    return loadedState
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return createInitialState()
  }
}

let state = loadState()

function emit(): void {
  for (const listener of listeners) {
    listener()
  }
}

function persist(): void {
  if (typeof window === 'undefined') {
    return
  }

  state.lastSavedAt = Date.now()
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function setState(updater: (current: GameState) => GameState): void {
  state = updater(state)
  persist()
  emit()
}

function removeDuplicatePartyMembers(targetState: GameState): void {
  const usedIds = new Set<string>()

  for (const party of targetState.parties) {
    party.members = party.members.map((mercenaryId) => {
      if (!mercenaryId || usedIds.has(mercenaryId)) {
        return null
      }

      usedIds.add(mercenaryId)
      return mercenaryId
    }) as Party['members']
  }

  targetState.mercenaries = targetState.mercenaries.map((mercenary) => ({
    ...mercenary,
    status: usedIds.has(mercenary.id) ? 'party' : 'idle',
  }))
}

function ensurePartyCount(targetState: GameState): void {
  const requiredCount = Math.max(1, targetState.facilities.party, DUNGEONS.length)

  while (targetState.parties.length < requiredCount) {
    targetState.parties.push(createParty(targetState.parties.length))
  }

  if (targetState.parties.length > requiredCount) {
    const removable = targetState.parties.slice(requiredCount)

    for (const party of removable) {
      for (const mercenaryId of party.members) {
        if (!mercenaryId) continue

        const mercenary = targetState.mercenaries.find(
          (target) => target.id === mercenaryId,
        )

        if (mercenary) {
          mercenary.status = 'idle'
        }
      }
    }

    targetState.parties = targetState.parties.slice(0, requiredCount)
  }
}

function getMercenaryCapacity(targetState = state): number {
  return targetState.facilities.quarters + 1
}

function getTavernCapacity(targetState = state): number {
  return Math.max(1, targetState.facilities.tavern)
}

function getStorageCapacity(targetState = state): number {
  return 35 + (targetState.facilities.storage - 1)
}

function getMaterialTotal(targetState = state): number {
  return Object.values(targetState.materials).reduce(
    (total, quantity) => total + quantity,
    0,
  )
}

function getHireCost(_mercenary: Mercenary): number {
  return 0
}

function getFacilityUpgradeCost(facility: keyof GameState['facilities'], level: number): number {
  return facility === 'tavern' || facility === 'quarters' || facility === 'storage' ? 1 : 250 * level * level
}

const battleStates: Record<string, BattleState> = {}
const lastBattleStates: Record<string, BattleState> = {}
const partyVitals: Record<string, Record<string, { hp: number; mp: number }>> = {}
const partyLogs: Record<string, string[]> = {}

function getTotalStats(mercenary: Mercenary, targetState: GameState) {
  const stats = getMercenaryStats(mercenary)

  for (const itemId of Object.values(mercenary.gear)) {
    if (!itemId) continue
    const item = targetState.items.find((target) => target.id === itemId)
    if (!item) continue

    for (const [key, value] of Object.entries(item.stats)) {
      if (value === undefined) continue
      const statKey = key as keyof typeof stats
      stats[statKey] += value
    }
  }

  return stats
}

function getCombatSkill(mercenary: Mercenary): SkillDefinition {
  let branches = CLASSES[mercenary.base].branches
  let skill: SkillDefinition | undefined

  for (const branchIndex of mercenary.path) {
    const branch = branches[branchIndex]
    if (!branch) break
    if (branch.skill) skill = branch.skill
    branches = branch.branches ?? []
  }

  return skill ?? { name: '기본기', cost: 999, type: 'none' }
}

function createAllyUnits(
  targetState: GameState,
  party: Party,
): CombatUnit[] {
  const units: CombatUnit[] = []

  for (const mercenaryId of party.members) {
    const mercenary = targetState.mercenaries.find(
      (target) => target.id === mercenaryId,
    )
    if (!mercenary) continue

    const stats = getTotalStats(mercenary, targetState)
    const traitEffects = getTraitCombatEffects(mercenary.traits, mercenary.path.length + 1)
    units.push({
      kind: 'ally',
      combatClass: mapJobToCombatClass(mercenary.base),
      constitution: stats.con,
      intelligence: stats.int,
      id: mercenary.id,
      name: getClassName(mercenary),
      className: getClassName(mercenary),
      hp: stats.hp,
      maxHp: stats.hp,
      mp: 0,
      maxMp: stats.mp,
      atk: stats.atk,
      def: stats.def,
      mdef: stats.mdef,
      dex: stats.dex,
      threat: stats.threat * traitEffects.threatMultiplier,
      heal: stats.heal,
      crit: stats.crit,
      evade: stats.evade + traitEffects.dodgeRate,
      hit: stats.hit,
      mana: stats.mana + traitEffects.manaRegenerationFlat,
      regen: stats.regen,
      lifesteal: stats.lifesteal + traitEffects.lifestealRate,
      flatDamageReduction: traitEffects.flatDamageReduction,
      initiativePriority: traitEffects.initiativePriority,
      turnRegenerationFlat: traitEffects.turnRegenerationFlat,
      turnHpLossRate: traitEffects.turnHpLossRate,
      criticalMultiplier: traitEffects.criticalMultiplier,
      missChanceMultiplier: traitEffects.missChanceMultiplier,
      healingMultiplier: traitEffects.healingMultiplier,
      skill: getCombatSkill(mercenary),
    })
  }

  return units
}

function createEnemyUnits(dungeonIndex: number): CombatUnit[] {
  return DUNGEONS[dungeonIndex].enemies.map((enemy, index) => ({
    kind: 'enemy',
    combatClass: 'warrior',
    constitution: enemy.attack,
    intelligence: enemy.attack,
    id: 'enemy-' + index + '-' + createId('combat'),
    name: enemy.name,
    hp: enemy.hp,
    maxHp: enemy.hp,
    mp: 0,
    maxMp: 40,
    atk: enemy.attack,
    def: enemy.defense,
    mdef: enemy.magicDefense,
    dex: enemy.dexterity,
    threat: 1,
    heal: 0,
    crit: 0.04,
    evade: 0.02,
    hit: 0.88,
    mana: 7,
    regen: 0,
    lifesteal: 0,
    flatDamageReduction: 0,
    initiativePriority: 0,
    turnRegenerationFlat: 0,
    turnHpLossRate: 0,
    criticalMultiplier: 1,
    missChanceMultiplier: 1,
    healingMultiplier: 1,
    skill: { name: '공격', cost: 999, type: 'none' },
  }))
}

function subjectParticle(name: string): string {
  const last = name.at(-1) ?? ''
  const code = last.charCodeAt(0)
  const hasJong = code >= 0xAC00 && code <= 0xD7A3 && (code - 0xAC00) % 28 !== 0
  return name + (hasJong ? '이' : '가')
}

function pushBattleLog(
  battle: BattleState,
  tone: 'normal' | 'good' | 'bad' | 'skill',
  message: string,
): void {
  battle.logs.push(tone + '|' + message)
  const type: import('../types/expedition').ExpeditionLogType = tone === 'good' ? 'victory' : tone === 'bad' ? 'defeat' : tone === 'skill' ? 'system' : 'damage'
  battle.structuredLogs = [...(battle.structuredLogs ?? []), { id: createId('log'), type, message, createdAt: Date.now() }].slice(-120)
  battle.logs = battle.logs.slice(-40)
}

function unitsAlive(units: CombatUnit[]): boolean {
  return units.some((unit) => unit.hp > 0)
}

function selectWeightedTarget(
  units: CombatUnit[],
): CombatUnit | undefined {
  let cursor =
    Math.random() *
    units.reduce((sum, unit) => sum + (unit.threat || 1), 0)

  for (const unit of units) {
    cursor -= unit.threat || 1
    if (cursor <= 0) return unit
  }

  return units[0]
}

function performBattleAction(
  battle: BattleState,
  actor: CombatUnit,
): void {
  const foes =
    actor.kind === 'ally' ? battle.enemies : battle.allies
  const friends =
    actor.kind === 'ally' ? battle.allies : battle.enemies

  battle.activeUnitId = actor.id
  battle.hitUnitId = null

  const healTarget =
    actor.kind === 'ally' && actor.heal > 0
      ? friends
          .filter(
            (unit) =>
              unit.hp > 0 && unit.hp / unit.maxHp < 0.6,
          )
          .sort(
            (left, right) =>
              left.hp / left.maxHp - right.hp / right.maxHp,
          )[0]
      : undefined

  if (
    healTarget &&
    actor.mp >= actor.skill.cost &&
    actor.skill.type === 'heal'
  ) {
    const quantity = Math.round(
      actor.heal * actor.healingMultiplier * (1 + Math.random() * 0.25),
    )
    healTarget.hp = Math.min(
      healTarget.maxHp,
      healTarget.hp + quantity,
    )
    actor.mp -= actor.skill.cost
    pushBattleLog(
      battle,
      'good',
      subjectParticle(actor.name) + ' ' + actor.skill.name + '을 사용했습니다. ' + healTarget.name + '의 HP가 ' + quantity + ' 회복되었습니다.',
    )
    return
  }

  const targets = foes.filter((unit) => unit.hp > 0)
  const target = selectWeightedTarget(targets)
  if (!target) return

  const actorMainStat = getCombatMainStat(actor.combatClass, {
    constitution: actor.constitution,
    dexterity: actor.dex,
    intelligence: actor.intelligence,
  })
  const finalHitRate = calculateFinalHitRate({
    attackerMainStat: actorMainStat,
    defenderRelevantStat: target.dex,
    focusBonusRate: Math.max(0, actor.hit - 0.9) - target.evade,
    missChanceMultiplier: actor.missChanceMultiplier,
  })
  if (!rollChance(finalHitRate)) {
    pushBattleLog(battle, 'normal', actor.name + '의 공격을 ' + subjectParticle(target.name) + (Math.random() < 0.5 ? ' 몸을 틀어 피했습니다.' : ' 재빠르게 회피했습니다.'))
    actor.mp = Math.min(actor.maxMp, actor.mp + actor.mana)
    return
  }

  let multiplier = 1
  let magic = false
  let hitCount = 1
  let area = false

  if (actor.kind === 'ally' && actor.mp >= actor.skill.cost) {
    actor.mp -= actor.skill.cost
    pushBattleLog(
      battle,
      'skill',
      actor.name + '의 ' + actor.skill.name,
    )

    if (actor.skill.type === 'multi') {
      multiplier = 0.72
      hitCount = 2
    }
    if (actor.skill.type === 'pierce') multiplier = 1.65
    if (
      actor.skill.type === 'aoe' ||
      actor.skill.type === 'cleave'
    ) {
      multiplier = 0.85
      area = true
    }
    if (actor.skill.type === 'magic') {
      multiplier = 1.45
      magic = true
    }
    if (actor.skill.type === 'guard') {
      actor.def *= 1.15
      multiplier = 0.7
    }
  } else {
    actor.mp = Math.min(actor.maxMp, actor.mp + actor.mana)
  }

  const hitTargets = area ? targets.slice(0, 3) : [target]

  for (const hitTarget of hitTargets) {
    for (let hitIndex = 0; hitIndex < hitCount; hitIndex += 1) {
      if (hitTarget.hp <= 0) continue

      const critical = rollChance(actor.crit)
      const defense = magic ? hitTarget.mdef : hitTarget.def
      const damageRange = calculateDamageRange(actor.combatClass, {
        constitution: actor.constitution,
        dexterity: actor.dex,
        intelligence: actor.intelligence,
        maxHp: actor.maxHp,
        magicDefenseRate: 0,
      })
      const damage = calculatePhysicalDamage({
        baseDamage: rollBaseDamage(damageRange),
        skillMultiplier: multiplier,
        isCritical: critical,
        criticalMultiplier: calculateCriticalMultiplier({ multiplicativeCriticalModifiers: [actor.criticalMultiplier] }),
        flatDamageReduction: defense * 0.5 + hitTarget.flatDamageReduction,
      })
      hitTarget.hp = Math.max(0, hitTarget.hp - damage)
      battle.hitUnitId = hitTarget.id

      pushBattleLog(
        battle,
        actor.kind === 'ally' ? 'good' : 'bad',
        critical
          ? subjectParticle(actor.name) + ' 빈틈을 포착해 치명타를 가했습니다. ' + hitTarget.name + '에게 ' + damage + '의 피해를 입혔습니다.'
          : subjectParticle(actor.name) + (Math.random() < 0.5 ? ' 공격을 적중시켰습니다. ' : ' 공격을 퍼부었습니다. ') + hitTarget.name + '에게 ' + damage + '의 피해를 입혔습니다.',
      )

      if (hitTarget.hp <= 0) pushBattleLog(battle, 'good', subjectParticle(hitTarget.name) + ' 힘없이 쓰러졌습니다.')

      if (actor.lifesteal > 0) {
        actor.hp = Math.min(
          actor.maxHp,
          actor.hp + damage * actor.lifesteal,
        )
      }
    }
  }
}

function gainExperience(
  targetState: GameState,
  mercenary: Mercenary,
  quantity: number,
): void {
  mercenary.xp += quantity

  while (mercenary.xp >= getXpRequired(mercenary.level)) {
    mercenary.xp -= getXpRequired(mercenary.level)
    mercenary.level += 1
    targetState.fame += 3
  }
}

function dropBattleGear(
  targetState: GameState,
  dungeonIndex: number,
): string {
  const recipe =
    RECIPES[Math.floor(Math.random() * RECIPES.length)]
  const multiplier = 0.55 + dungeonIndex * 0.08
  const stats: StatMap = {}

  for (const [key, value] of Object.entries(recipe.stats)) {
    stats[key as keyof StatMap] = (value ?? 0) * multiplier
  }

  targetState.items.push({
    id: createId('gear'),
    name: '낡은 ' + recipe.name,
    slot: recipe.slot,
    stats,
  })
  targetState.recentLog += ' · 장비 발견'
  return '낡은 ' + recipe.name
}

function rewardBattleVictory(
  targetState: GameState,
  party: Party,
  allowGear = true,
): void {
  const dungeonIndex = party.dungeon
  if (dungeonIndex === null) return

  const dungeon = DUNGEONS[dungeonIndex]
  const progressKey = String(dungeonIndex)
  const progress = targetState.dungeonProgress[progressKey] ?? { runProgress: 0, totalProgress: 0, cleared: false }
  progress.runProgress += 1
  progress.totalProgress = Math.max(progress.totalProgress, progress.runProgress)
  const requirement = DUNGEON_PROGRESS_REQUIREMENTS[dungeonIndex] ?? 999999
  if (progress.runProgress >= requirement) progress.cleared = true
  targetState.dungeonProgress[progressKey] = progress
  party.runs += 1
  party.areasCompleted = Math.min(party.areaTotal, party.areasCompleted + 1)
  targetState.fame += 2 + dungeon.recommendedLevel
  const rewardLogs = [
    'good|' + dungeon.name + '의 적이 쓰러졌습니다.',
    'good|전투에서 승리했습니다.',
    'skill|경험치를 획득했습니다.',
    'skill|\uC9C4\uD589\uB3C4 \uC5C5\uB370\uC774\uD2B8: ' + progress.runProgress + '/' + requirement + ' · \uCD5C\uACE0 \uC9C4\uD589\uB3C4: ' + progress.totalProgress,
  ]
  partyLogs[party.id] = [...(partyLogs[party.id] ?? []), ...rewardLogs].slice(-120)
  if (targetState.expeditionSessions[party.id]) { const session = targetState.expeditionSessions[party.id]; session.logs.push({ id: createId('log'), type: 'reward', message: '전투 승리 · 경험치 획득', createdAt: Date.now() }); session.logs = session.logs.slice(-120) }

  for (const [material, range] of Object.entries(
    dungeon.materials,
  )) {
    if (!range) continue

    const materialKey = material as MaterialKey
    const quantity =
      range[0] +
      Math.floor(Math.random() * (range[1] - range[0] + 1))
    const availableSpace = Math.max(
      0,
      getStorageCapacity(targetState) -
        getMaterialTotal(targetState),
    )
    const accepted = Math.min(quantity, availableSpace)

    targetState.materials[materialKey] += accepted
    party.loot[materialKey] =
      (party.loot[materialKey] ?? 0) + accepted
  }

  for (const mercenaryId of party.members) {
    const mercenary = targetState.mercenaries.find(
      (target) => target.id === mercenaryId,
    )

    if (mercenary) {
      gainExperience(
        targetState,
        mercenary,
        32 + dungeon.recommendedLevel * 12,
      )
    }
  }

  if (
    progress.cleared &&
    dungeonIndex === targetState.unlockedDungeonIndex &&
    targetState.unlockedDungeonIndex < DUNGEONS.length - 1
  ) {
    targetState.unlockedDungeonIndex += 1
    targetState.recentLog =
      DUNGEONS[targetState.unlockedDungeonIndex].name + ' 해금'
  } else {
    targetState.recentLog =
      party.name +
      ': ' +
      dungeon.name +
      ' 승리'
  }

  if (
    allowGear &&
    Math.random() < 0.12 &&
    party.dungeon !== null
  ) {
    const itemName = dropBattleGear(targetState, party.dungeon)
    partyLogs[party.id] = [...(partyLogs[party.id] ?? []), 'skill|아이템 획득 · ' + itemName].slice(-120)
  }

  party.busy = false
  party.expeditionPhase = 'continuing'
  if (targetState.expeditionSessions[party.id]) { const session = targetState.expeditionSessions[party.id]; session.phase = party.areasCompleted + 1 >= party.areaTotal ? 'completed' : 'continuing'; session.completedAreas = party.areasCompleted; session.nextProcessAt = Date.now() + EXPEDITION_TIMINGS.rewardLogMs }

}

function applyBattleDefeat(
  targetState: GameState,
  party: Party,
): void {
  const dungeonIndex = party.dungeon
  if (dungeonIndex === null) return

  party.status = 'idle'
  party.expeditionPhase = 'defeated'
  if (targetState.expeditionSessions[party.id]) { targetState.expeditionSessions[party.id].phase = 'defeated'; targetState.expeditionSessions[party.id].nextProcessAt = Date.now() }
  party.busy = false
  const assignment = targetState.dungeonProgress[String(dungeonIndex)]
  for (const mercenaryId of assignment?.assignedMercenaryIds ?? party.members.filter((id): id is string => Boolean(id))) {
    const mercenary = targetState.mercenaries.find((candidate) => candidate.id === mercenaryId)
    if (mercenary) mercenary.assignedDungeonId = null
  }
  if (assignment) assignment.assignedMercenaryIds = []
  party.dungeon = null
  party.members = [null, null, null, null]
  party.campUntil = 0
  delete partyVitals[party.id]
  targetState.recentLog = party.name + ' 전멸 · 야영 회복'
  if (targetState.expeditionSessions[party.id]) { const session = targetState.expeditionSessions[party.id]; session.logs.push({ id: createId('log'), type: 'defeat', message: '원정대 전멸 · 귀환', createdAt: Date.now() }); session.logs = session.logs.slice(-120) }
}

function finishBattle(
  targetState: GameState,
  party: Party,
  battle: BattleState,
  won: boolean,
  now: number,
): void {
  battle.result = won ? 'victory' : 'defeat'
  partyLogs[party.id] = [...(partyLogs[party.id] ?? []), ...battle.logs]
  partyVitals[party.id] = Object.fromEntries(battle.allies.map((unit) => [unit.id, { hp: unit.hp, mp: unit.mp }]))
  battle.finishAt = now + 1_200
  pushBattleLog(
    battle,
    won ? 'good' : 'bad',
    won ? '승리' : '전멸',
  )

  if (won) {
    rewardBattleVictory(targetState, party)
    if (party.dungeon !== null) {
      party.nextActionAt =
        now + DUNGEONS[party.dungeon].actionTime * 1_000
    }
  } else {
    applyBattleDefeat(targetState, party)
  }
}

function startBattle(
  targetState: GameState,
  party: Party,
): void {
  const dungeonIndex = party.dungeon
  if (dungeonIndex === null) return

  const allies = createAllyUnits(targetState, party)
  const enemies = createEnemyUnits(dungeonIndex)
  const autoEvent = Math.random() < 0.28 ? randomExpeditionEvent() : null
  const enemyDefinitions = DUNGEONS[dungeonIndex].enemies
  const intro = enemyDefinitions[0]?.encounterIntros?.[Math.floor(Math.random() * enemyDefinitions[0].encounterIntros.length)] ?? (Math.random() < 0.5 ? '주변에서 낯선 인기척이 느껴집니다.' : '수풀 너머에서 적의 모습이 드러납니다.')
  if (autoEvent?.effect === 'heal') allies.forEach((unit) => { unit.hp = Math.min(unit.maxHp, unit.hp + Math.round(unit.maxHp * 0.15)) })
  if (autoEvent?.effect === 'trap') allies.forEach((unit) => { unit.hp = Math.max(1, unit.hp - 5) })
  const savedVitals = partyVitals[party.id]
  if (savedVitals) allies.forEach((unit) => { const vital = savedVitals[unit.id]; if (vital) { unit.hp = Math.min(unit.maxHp, vital.hp); unit.mp = Math.min(unit.maxMp, vital.mp) } })

  if (!allies.length || !enemies.length) {
    party.status = 'idle'
    party.dungeon = null
    party.busy = false
    targetState.recentLog =
      party.name + ' 편성을 확인해 주세요.'
    return
  }

  party.busy = true
  party.expeditionPhase = 'combat'
  if (targetState.expeditionSessions[party.id]) { targetState.expeditionSessions[party.id].phase = 'combat'; targetState.expeditionSessions[party.id].nextProcessAt = Date.now() + 2_000 }
  delete lastBattleStates[party.id]
  battleStates[party.id] = {
    allies,
    enemies,
    logs: [],
    introQueue: [...(autoEvent ? autoEvent.messages : []), intro, (enemies[0]?.name ?? '적') + '와의 전투가 시작됩니다.'],
    round: 1,
    queue: [],
    activeUnitId: null,
    hitUnitId: null,
    result: null,
    finishAt: 0,
  }
}

function advanceBattle(
  targetState: GameState,
  party: Party,
  battle: BattleState,
  now: number,
): void {
  if (battle.introQueue?.length) {
    pushBattleLog(battle, 'normal', battle.introQueue.shift() ?? '')
    const introSession = targetState.expeditionSessions[party.id]
    if (introSession) introSession.nextProcessAt = now + EXPEDITION_TIMINGS.encounterIntroMs
    return
  }

  if (
    !unitsAlive(battle.allies) ||
    !unitsAlive(battle.enemies) ||
    battle.round > 40
  ) {
    finishBattle(
      targetState,
      party,
      battle,
      unitsAlive(battle.allies) &&
        !unitsAlive(battle.enemies),
      now,
    )
    return
  }

  if (!battle.queue.length) {
    pushBattleLog(
      battle,
      'normal',
      '— ' + battle.round + '턴 —',
    )
    battle.queue = [...battle.allies, ...battle.enemies]
      .filter((unit) => unit.hp > 0)
      .sort(
        (left, right) =>
          right.dex + right.initiativePriority +
          Math.random() * 5 -
          (left.dex + left.initiativePriority + Math.random() * 5),
      )
    battle.round += 1
  }

  const actor = battle.queue.shift()

  if (actor && actor.hp > 0) {
    if (actor.turnHpLossRate > 0) {
      const loss = Math.max(1, Math.floor(actor.maxHp * actor.turnHpLossRate))
      actor.hp = Math.max(0, actor.hp - loss)
      pushBattleLog(battle, actor.kind === 'ally' ? 'bad' : 'good', subjectParticle(actor.name) + ' 저주의 대가로 HP ' + loss + '을 잃었습니다.')
    }
    if (actor.hp > 0 && actor.turnRegenerationFlat > 0) {
      const restored = Math.min(actor.turnRegenerationFlat, actor.maxHp - actor.hp)
      actor.hp += restored
      if (restored > 0) pushBattleLog(battle, actor.kind === 'ally' ? 'good' : 'bad', subjectParticle(actor.name) + ' HP ' + restored + '을 재생했습니다.')
    }
    if (actor.hp > 0) performBattleAction(battle, actor)
  }

  if (
    !unitsAlive(battle.allies) ||
    !unitsAlive(battle.enemies)
  ) {
    finishBattle(
      targetState,
      party,
      battle,
      unitsAlive(battle.allies),
      now,
    )
  }
}

function getSnapshot(): GameState {
  return state
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useGameStore(): GameState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export const gameStore = {
  getState(): GameState {
    return state
  },

  subscribe,
  save(): void { persist() },
  getLiveBattleState(partyId: string): BattleState | undefined {
    return battleStates[partyId]
  },
  getBattleState(partyId: string): BattleState | undefined {
    return battleStates[partyId] ?? lastBattleStates[partyId]
  },
  getBattleLogs(partyId: string): string[] {
    return [...(partyLogs[partyId] ?? []), ...(battleStates[partyId]?.logs ?? [])]
  },
  getExpeditionLogs(partyId: string): string[] {
    const sessionLogs = state.expeditionSessions[partyId]?.logs.map((log) => 'exploration|' + log.message) ?? []
    return [...sessionLogs, ...(partyLogs[partyId] ?? []), ...(battleStates[partyId]?.logs ?? [])].slice(-120)
  },

  getMercenaryCapacity,
  getTavernCapacity,
  getStorageCapacity,
  getMaterialTotal,
  getHireCost,
  getFacilityUpgradeCost,

  fillTavernCandidates(): void {
    setState((current) => {
      const candidates = Array.from({ length: getTavernCapacity(current) }, () => createMercenary())
      return { ...current, candidates, candidateRefreshAt: Date.now() + TAVERN_REFRESH_MS / current.tavernSpeedMultiplier, candidateTimeRemaining: TAVERN_REFRESH_MS / current.tavernSpeedMultiplier }
    })
  },

  refreshCandidates(): boolean {
    setState((current) => {
      const candidates = [...current.candidates, createMercenary()]
      const capacity = getTavernCapacity(current)
      while (candidates.length > capacity) candidates.shift()
      return { ...current, candidates, candidateRefreshAt: Date.now() + TAVERN_REFRESH_MS, candidatePaused: false, candidateTimeRemaining: TAVERN_REFRESH_MS }
    })
    return true
  },

  toggleCandidatePause(): boolean {
    const now = Date.now()
    setState((current) => current.candidatePaused
      ? { ...current, candidatePaused: false, candidateRefreshAt: now + Math.max(1_000, current.candidateTimeRemaining || TAVERN_REFRESH_MS) }
      : { ...current, candidatePaused: true, candidateTimeRemaining: Math.max(1_000, current.candidateRefreshAt - now), candidateRefreshAt: 0 })
    return true
  },

  hireMercenary(mercenaryId: string): boolean {
    const candidate = state.candidates.find((mercenary) => mercenary.id === mercenaryId)
    if (!candidate || state.mercenaries.length >= getMercenaryCapacity()) return false
    setState((current) => ({ ...current, mercenaries: [...current.mercenaries, candidate], candidates: current.candidates.filter((mercenary) => mercenary.id !== mercenaryId), recentLog: `${candidate.base}이 상단에 합류했습니다.` }))
    return true
  },

  dismissMercenary(mercenaryId: string): boolean {
    if (!state.mercenaries.some((target) => target.id === mercenaryId)) return false
    setState((current) => ({ ...current, mercenaries: current.mercenaries.filter((target) => target.id !== mercenaryId), parties: current.parties.map((party) => ({ ...party, members: party.members.map((id) => id === mercenaryId ? null : id) as typeof party.members })) }))
    return true
  },

  promoteMercenary(
    mercenaryId: string,
    branchIndex: number,
  ): boolean {
    const mercenary = state.mercenaries.find(
      (target) => target.id === mercenaryId,
    )

    if (!mercenary) {
      return false
    }

    const promotionReady =
      (mercenary.path.length === 0 && mercenary.level >= 5) ||
      (mercenary.path.length === 1 && mercenary.level >= 10)

    let branches = CLASSES[mercenary.base].branches

    for (const pathIndex of mercenary.path) {
      const selectedBranch = branches[pathIndex]
      if (!selectedBranch) return false
      branches = selectedBranch.branches ?? []
    }

    if (!promotionReady || !branches[branchIndex]) {
      return false
    }

    setState((current) => {
      const next = structuredClone(current)
      const target = next.mercenaries.find(
        (item) => item.id === mercenaryId,
      )
      if (!target) return current

      target.path.push(branchIndex)
      next.fame += 40
      next.recentLog = target.base + ' 전직 완료'
      return next
    })

    return true
  },
  setPartyMember(
    partyIndex: number,
    slotIndex: number,
    mercenaryId: string | null,
  ): boolean {
    const party = state.parties[partyIndex]

    if (!party || slotIndex < 0 || slotIndex > 3) {
      return false
    }

    if (
      mercenaryId &&
      state.parties.some(
        (targetParty, targetIndex) =>
          targetIndex !== partyIndex &&
          targetParty.members.includes(mercenaryId),
      )
    ) {
      return false
    }

    setState((current) => {
      const next = structuredClone(current)
      const targetParty = next.parties[partyIndex]

      if (mercenaryId) {
        targetParty.members = targetParty.members.map((memberId, index) =>
          index !== slotIndex && memberId === mercenaryId ? null : memberId,
        ) as Party['members']
      }

      targetParty.members[slotIndex] = mercenaryId
      removeDuplicatePartyMembers(next)

      return next
    })

    return true
  },

  assignMercenaryToDungeon(dungeonIndex: number, mercenaryId: string): boolean {
    const target = state.mercenaries.find((mercenary) => mercenary.id === mercenaryId)
    if (!target) return false
    const existing = state.parties.find((party) => party.dungeon === dungeonIndex)
    if (existing && existing.status !== 'idle') return false
    const occupiedElsewhere = state.parties.some((party) => party.dungeon !== null && party.dungeon !== dungeonIndex && party.members.includes(mercenaryId))
    if (occupiedElsewhere) return false
    setState((current) => {
      const next = structuredClone(current)
      const progress = next.dungeonProgress[String(dungeonIndex)] ?? { runProgress: 0, totalProgress: 0, cleared: false }
      progress.assignedMercenaryIds = Array.from(new Set([...(progress.assignedMercenaryIds ?? []), mercenaryId]))
      next.dungeonProgress[String(dungeonIndex)] = progress
      const party = next.parties.find((candidate) => candidate.dungeon === dungeonIndex) ?? next.parties.find((candidate) => candidate.status === 'idle' && candidate.dungeon === null)
      if (party) {
        party.dungeon = dungeonIndex
        party.members = [...progress.assignedMercenaryIds.slice(0, 4), null, null, null, null].slice(0, 4) as Party['members']
        party.status = 'idle'
      }
      const mercenary = next.mercenaries.find((candidate) => candidate.id === mercenaryId)
      if (mercenary) mercenary.assignedDungeonId = String(dungeonIndex)
      return next
    })
    return true
  },

  removeMercenaryFromDungeon(dungeonIndex: number, mercenaryId: string): boolean {
    const party = state.parties.find((candidate) => candidate.dungeon === dungeonIndex)
    if (party && party.status !== 'idle') return false
    setState((current) => {
      const next = structuredClone(current)
      const progress = next.dungeonProgress[String(dungeonIndex)]
      if (progress) progress.assignedMercenaryIds = (progress.assignedMercenaryIds ?? []).filter((id) => id !== mercenaryId)
      const targetParty = next.parties.find((candidate) => candidate.dungeon === dungeonIndex)
      if (targetParty) targetParty.members = [...(progress?.assignedMercenaryIds ?? []).slice(0, 4), null, null, null, null].slice(0, 4) as Party['members']
      const mercenary = next.mercenaries.find((candidate) => candidate.id === mercenaryId)
      if (mercenary) mercenary.assignedDungeonId = null
      return next
    })
    return true
  },
  assignDungeon(_partyIndex: number, dungeonIndex: number): boolean {
    const party = state.parties.find((candidate) => candidate.dungeon === dungeonIndex) ?? state.parties.find((candidate) => candidate.dungeon === null && candidate.status === 'idle')

    if (
      !party ||
      dungeonIndex < 0 ||
      dungeonIndex > state.unlockedDungeonIndex ||
      !party.members.some(Boolean)
    ) {
      return false
    }

    setState((current) => {
      const next = structuredClone(current)
      const targetParty = next.parties.find((candidate) => candidate.dungeon === dungeonIndex) ?? next.parties.find((candidate) => candidate.dungeon === null && candidate.status === 'idle')
      if (!targetParty) return next

      delete partyLogs[targetParty.id]
      delete battleStates[targetParty.id]
      delete lastBattleStates[targetParty.id]

      targetParty.dungeon = dungeonIndex
      targetParty.expeditionPhase = 'entering'
      next.expeditionSessions[targetParty.id] = { id: createId('expedition'), partyId: targetParty.id, dungeonIndex, phase: 'entering', totalAreas: targetParty.areaTotal, completedAreas: 0, defeatedEnemies: 0, startedAt: Date.now(), nextProcessAt: Date.now() + EXPEDITION_TIMINGS.explorationLogMs, rewardGranted: false, logs: [] }
      targetParty.status = 'explore'
      targetParty.nextActionAt = Date.now() + 1_200
      targetParty.campUntil = 0
      targetParty.busy = false
      targetParty.areasCompleted = 0
      const progress = next.dungeonProgress[String(dungeonIndex)] ?? { runProgress: 0, totalProgress: 0, cleared: false }
      progress.runProgress = 1
      next.dungeonProgress[String(dungeonIndex)] = progress
      next.expeditionSessions[targetParty.id].logs.push({ id: createId('log'), type: 'exploration', message: DUNGEONS[dungeonIndex].name + ' \uC9C4\uD589\uB3C4 1/' + (DUNGEON_PROGRESS_REQUIREMENTS[dungeonIndex] ?? 999999) + ' · \uCD5C\uACE0 \uC9C4\uD589\uB3C4: ' + progress.totalProgress, createdAt: Date.now() })
      next.recentLog = `${targetParty.name}이 원정을 시작했습니다.`

      return next
    })

    return true
  },

  recallParty(partyIndex: number): boolean {
    const party = state.parties[partyIndex]

    if (!party) {
      return false
    }

    setState((current) => {
      const next = structuredClone(current)
      const targetParty = next.parties[partyIndex]

      if (next.expeditionSessions[targetParty.id]) delete next.expeditionSessions[targetParty.id]
      delete partyLogs[targetParty.id]
      delete battleStates[targetParty.id]
      delete lastBattleStates[targetParty.id]
      if (targetParty.dungeon !== null) {
        const assignment = next.dungeonProgress[String(targetParty.dungeon)]
        for (const mercenaryId of assignment?.assignedMercenaryIds ?? targetParty.members.filter((id): id is string => Boolean(id))) {
          const mercenary = next.mercenaries.find((candidate) => candidate.id === mercenaryId)
          if (mercenary) mercenary.assignedDungeonId = null
        }
        if (assignment) assignment.assignedMercenaryIds = []
      }
      targetParty.members = [null, null, null, null]
      targetParty.dungeon = null
      targetParty.status = 'idle'
      targetParty.nextActionAt = 0
      targetParty.campUntil = 0
      targetParty.busy = false
      next.recentLog = `${targetParty.name}이 귀환했습니다.`

      return next
    })

    return true
  },

  addMaterial(material: MaterialKey, quantity: number): number {
    const remainingCapacity = Math.max(
      0,
      getStorageCapacity() - getMaterialTotal(),
    )

    const acceptedQuantity = Math.max(
      0,
      Math.min(quantity, remainingCapacity),
    )

    if (acceptedQuantity === 0) {
      return 0
    }

    setState((current) => ({
      ...current,
      materials: {
        ...current.materials,
        [material]: current.materials[material] + acceptedQuantity,
      },
    }))

    return acceptedQuantity
  },

  addGold(quantity: number): void {
    setState((current) => ({
      ...current,
      gold: Math.max(0, current.gold + quantity),
    }))
  },

  addFame(quantity: number): void {
    setState((current) => ({
      ...current,
      fame: Math.max(0, current.fame + quantity),
    }))
  },

  equipItem(
    itemId: string,
    mercenaryId: string | null,
  ): boolean {
    const item = state.items.find(
      (target) => target.id === itemId,
    )

    if (!item) return false

    if (
      mercenaryId &&
      !state.mercenaries.some(
        (target) => target.id === mercenaryId,
      )
    ) {
      return false
    }

    setState((current) => {
      const next = structuredClone(current)

      for (const mercenary of next.mercenaries) {
        if (mercenary.gear[item.slot] === itemId) {
          mercenary.gear[item.slot] = null
        }
      }

      if (mercenaryId) {
        const mercenary = next.mercenaries.find(
          (target) => target.id === mercenaryId,
        )
        if (mercenary) {
          mercenary.gear[item.slot] = itemId
        }
      }

      return next
    })

    return true
  },

  sellMaterial(material: MaterialKey, quantity: number): boolean {
    const price: Record<MaterialKey, number> = { wood: 1, ore: 2, fiber: 1, hide: 2, herb: 2, essence: 5 }
    const seconds: Record<MaterialKey, number> = { wood: 3, ore: 4, fiber: 5, hide: 5, herb: 5, essence: 8 }
    const amount = Math.max(0, Math.floor(quantity))
    if (!amount || state.materials[material] < amount || state.marketListings.length >= state.marketSlots) return false
    setState((current) => {
      const next = structuredClone(current)
      next.materials[material] -= amount
      next.marketListings.push({ id: createId('listing'), kind: 'material', itemId: material, name: MATERIAL_NAMES[material], quantity: amount, unitPrice: price[material], durationMs: amount * seconds[material] * 1000 / Math.max(1, next.marketSpeedMultiplier), startedAt: Date.now(), completedAt: Date.now() + amount * seconds[material] * 1000 / Math.max(1, next.marketSpeedMultiplier), claimed: false })
      return next
    })
    return true
  },

  sellGear(itemId: string): boolean {
    const item = state.items.find((entry) => entry.id === itemId)
    if (!item || state.mercenaries.some((mercenary) => Object.values(mercenary.gear).includes(itemId)) || state.marketListings.length >= state.marketSlots) return false
    setState((current) => { const next = structuredClone(current); next.items = next.items.filter((entry) => entry.id !== itemId); const duration = 10_000 / Math.max(1, next.marketSpeedMultiplier); next.marketListings.push({ id: createId('listing'), kind: 'gear', itemId, name: item.name, quantity: 1, unitPrice: 10, durationMs: duration, startedAt: Date.now(), completedAt: Date.now() + duration, claimed: false }); return next })
    return true
  },

  claimMarketListing(id: string): boolean {
    let claimed = false
    setState((current) => {
      const next = structuredClone(current)
      const listing = next.marketListings.find((item) => item.id === id)
      if (!listing || listing.claimed || Date.now() < listing.completedAt) return next
      next.gold += listing.quantity * listing.unitPrice
      next.marketListings = next.marketListings.filter((item) => item.id !== id)
      claimed = true
      return next
    })
    return claimed
  },
  sellSurplusMaterials(): number {
    let earned = 0

    setState((current) => {
      const next = structuredClone(current)
      const prices: Record<MaterialKey, number> = {
        wood: 4,
        ore: 8,
        fiber: 4,
        hide: 4,
        herb: 4,
        essence: 20,
      }

      for (
        const material of Object.keys(
          next.materials,
        ) as MaterialKey[]
      ) {
        const keep =
          material === 'essence'
            ? next.materials[material]
            : Math.min(next.materials[material], 10)
        const quantity = next.materials[material] - keep

        earned += quantity * prices[material]
        next.materials[material] = keep
      }

      next.gold += earned
      next.recentLog =
        earned > 0
          ? '재료 판매 · ' + earned + ' 엽전'
          : '판매할 잉여 재료가 없습니다.'
      return next
    })

    return earned
  },

  craftItem(recipeIndex: number): boolean {
    const recipe = RECIPES[recipeIndex]
    const visibleRecipeCount = Math.min(
      RECIPES.length,
      2 + state.facilities.forge * 2,
    )

    if (!recipe || recipeIndex >= visibleRecipeCount) {
      return false
    }

    const canCraft = Object.entries(
      recipe.requiredMaterials,
    ).every(
      ([material, quantity]) =>
        state.materials[material as MaterialKey] >=
        (quantity ?? 0),
    )

    if (!canCraft) return false

    setState((current) => {
      const next = structuredClone(current)

      for (const [material, quantity] of Object.entries(
        recipe.requiredMaterials,
      )) {
        next.materials[material as MaterialKey] -=
          quantity ?? 0
      }

      next.items.push({
        id: createId('gear'),
        name: recipe.name,
        slot: recipe.slot,
        stats: { ...recipe.stats },
      })
      next.fame += 10
      next.recentLog = recipe.name + ' 제작 완료'
      return next
    })

    return true
  },

  upgradeFacility(
    facility: keyof GameState['facilities'],
  ): boolean {
    const level = state.facilities[facility]
    const cost = getFacilityUpgradeCost(facility, level)

    if (state.gold < cost) {
      return false
    }

    setState((current) => {
      const next = structuredClone(current)

      next.gold -= cost
      next.facilities[facility] += 1
      next.recentLog = '시설 확장이 완료되었습니다.'
      ensurePartyCount(next)

      return next
    })

    return true
  },

  tick(): void {
    const now = Date.now()

    setState((current) => {
      const next = structuredClone(current)

      if (!next.candidatePaused) {
        if (now >= next.candidateRefreshAt) {
          next.candidates = [...next.candidates, createMercenary()]
          while (next.candidates.length > getTavernCapacity(next)) next.candidates.shift()
          next.candidateRefreshAt = now + TAVERN_REFRESH_MS / next.tavernSpeedMultiplier
          next.candidateTimeRemaining = TAVERN_REFRESH_MS / next.tavernSpeedMultiplier
        } else {
          next.candidateTimeRemaining = Math.max(0, next.candidateRefreshAt - now)
        }
      }

      for (const party of next.parties) {
        const dungeonIndex = party.dungeon

        if (
          party.status !== 'idle' &&
          (dungeonIndex === null || !DUNGEONS[dungeonIndex])
        ) {
          party.status = 'idle'
          party.dungeon = null
          party.busy = false
          delete battleStates[party.id]
          continue
        }

        const battle = battleStates[party.id]

        if (battle?.result) {
          if (now >= battle.finishAt) {
            lastBattleStates[party.id] = battle
            delete battleStates[party.id]
          }
          continue
        }

        if (
          party.status === 'camp' &&
          now >= party.campUntil
        ) {
          party.status = 'idle'
          party.dungeon = null
          party.busy = false
          party.nextActionAt = 0
        }

        if (party.status !== 'explore') {
          if (battle) delete battleStates[party.id]
          continue
        }

        const session = next.expeditionSessions[party.id]
        if (session && !battle) {
          session.phase = 'exploring'
          session.nextProcessAt = party.nextActionAt
          session.completedAreas = party.areasCompleted
          const explorationMessage = party.areasCompleted > 0 ? '일행이 다음 구역으로 이동합니다.' : '일행이 주변을 탐색합니다.'
          if (session.logs.at(-1)?.message !== explorationMessage) {
            session.logs.push({ id: createId('log'), type: 'exploration', message: explorationMessage, createdAt: Date.now() })
            session.logs = session.logs.slice(-120)
          }
        }

        if (battle) {
          if (session && now < session.nextProcessAt) continue
          advanceBattle(next, party, battle, now)
          if (session && battleStates[party.id] && !battle.result) {
            session.nextProcessAt = now + EXPEDITION_TIMINGS.combatTurnMs
          }
        } else if (now >= party.nextActionAt) {
          startBattle(next, party)
        }
      }

      return next
    })

  },

  upgradeMarketSlots(): boolean {
    const cost = 20
    if (state.gold < cost) return false
    setState((current) => ({ ...current, gold: current.gold - cost, marketSlots: current.marketSlots + 1 }))
    return true
  },

  upgradeTavernSpeed(): boolean {
    const cost = 10
    if (state.gold < cost) return false
    const now = Date.now()
    setState((current) => {
      const nextMultiplier = current.tavernSpeedMultiplier + 0.1
      const remaining = current.candidatePaused ? current.candidateTimeRemaining : Math.max(0, current.candidateRefreshAt - now)
      const adjustedRemaining = remaining * current.tavernSpeedMultiplier / nextMultiplier
      return { ...current, gold: current.gold - cost, tavernSpeedMultiplier: nextMultiplier, candidateTimeRemaining: adjustedRemaining, candidateRefreshAt: current.candidatePaused ? current.candidateRefreshAt : now + adjustedRemaining }
    })
    return true
  },

  upgradeMarketSpeed(): boolean {
    const cost = 10
    if (state.gold < cost) return false
    const now = Date.now()
    setState((current) => {
      const nextMultiplier = current.marketSpeedMultiplier + 0.1
      const ratio = current.marketSpeedMultiplier / nextMultiplier
      const listings = current.marketListings.map((listing) => {
        if (listing.claimed || now >= listing.completedAt) return listing
        const elapsedRatio = Math.min(1, Math.max(0, (now - listing.startedAt) / listing.durationMs))
        const nextDuration = listing.durationMs * ratio
        const nextStartedAt = now - elapsedRatio * nextDuration
        return { ...listing, durationMs: nextDuration, startedAt: nextStartedAt, completedAt: now + (listing.completedAt - now) * ratio }
      })
      return { ...current, gold: current.gold - cost, marketSpeedMultiplier: nextMultiplier, marketListings: listings }
    })
    return true
  },

  reset(): void {
    state = createInitialState()
    persist()
    emit()
  },
}

export function getClassDefinition(base: MercenaryBase) {
  return CLASSES[base]
}









































































































