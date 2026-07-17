import { useSyncExternalStore } from 'react'
import { CLASSES, DUNGEONS, MERCENARY_BASES, RECIPES, TRAITS } from '../data/gameData'
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

const STORAGE_KEY = 'daesangin-react-v1'

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
  const traitCount = Math.random() < 0.58 ? 1 : Math.random() < 0.85 ? 2 : 3
  const selectedTraits = [...TRAITS]
    .sort(() => Math.random() - 0.5)
    .slice(0, traitCount)
    .map((trait) => trait.name)

  return {
    id: createId('mercenary'),
    base: selectedBase,
    traits: selectedTraits,
    level: 1,
    xp: 0,
    path: [],
    gear: {
      weapon: null,
      armor: null,
      charm: null,
    },
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
  }
}

function createInitialState(): GameState {
  const mercenaries = [
    createMercenary('창잡이'),
    createMercenary('의술사'),
    createMercenary('활잡이'),
  ]

  return {
    gold: 500,
    fame: 0,
    gems: 0,
    materials: {
      wood: 8,
      ore: 5,
      fiber: 5,
      hide: 0,
      herb: 0,
      essence: 0,
    },
    mercenaries,
    items: [],
    candidates: [
      createMercenary(),
      createMercenary(),
      createMercenary(),
    ],
    candidateRefreshAt: Date.now() + 60_000,
    facilities: {
      quarters: 1,
      party: 1,
      storage: 1,
      forge: 1,
    },
    parties: [
      createParty(0, [
        mercenaries[0].id,
        mercenaries[1].id,
        mercenaries[2].id,
      ]),
    ],
    unlockedDungeonIndex: 0,
    recentLog: '제1 원정대가 편성되었습니다.',
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
      ? input.candidates
      : fallback.candidates,
    items: Array.isArray(input.items) ? input.items : [],
    parties: Array.isArray(input.parties) ? input.parties : fallback.parties,
  }

  state.mercenaries = state.mercenaries.map((mercenary) => ({
    ...mercenary,
    traits: Array.isArray(mercenary.traits) ? mercenary.traits : [],
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
  }))

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
  const requiredCount = Math.max(1, targetState.facilities.party)

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
  return 6 + targetState.facilities.quarters * 2
}

function getStorageCapacity(targetState = state): number {
  return 40 + targetState.facilities.storage * 35
}

function getMaterialTotal(targetState = state): number {
  return Object.values(targetState.materials).reduce(
    (total, quantity) => total + quantity,
    0,
  )
}

function getHireCost(mercenary: Mercenary): number {
  return 100 + mercenary.traits.length * 60
}

const battleStates: Record<string, BattleState> = {}

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
    units.push({
      kind: 'ally',
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
      threat: stats.threat,
      heal: stats.heal,
      crit: stats.crit,
      evade: stats.evade,
      hit: stats.hit,
      mana: stats.mana,
      regen: stats.regen,
      lifesteal: stats.lifesteal,
      skill: getCombatSkill(mercenary),
    })
  }

  return units
}

function createEnemyUnits(dungeonIndex: number): CombatUnit[] {
  return DUNGEONS[dungeonIndex].enemies.map((enemy, index) => ({
    kind: 'enemy',
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
    skill: { name: '공격', cost: 999, type: 'none' },
  }))
}

function pushBattleLog(
  battle: BattleState,
  tone: 'normal' | 'good' | 'bad' | 'skill',
  message: string,
): void {
  battle.logs.push(tone + '|' + message)
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
      actor.heal * (1 + Math.random() * 0.25),
    )
    healTarget.hp = Math.min(
      healTarget.maxHp,
      healTarget.hp + quantity,
    )
    actor.mp -= actor.skill.cost
    pushBattleLog(
      battle,
      'good',
      actor.name +
        '의 ' +
        actor.skill.name +
        ': ' +
        healTarget.name +
        ' +' +
        quantity,
    )
    return
  }

  const targets = foes.filter((unit) => unit.hp > 0)
  const target = selectWeightedTarget(targets)
  if (!target) return

  if (Math.random() > actor.hit - target.evade) {
    pushBattleLog(battle, 'normal', target.name + ' 회피')
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

      const critical = Math.random() < actor.crit
      const defense = magic ? hitTarget.mdef : hitTarget.def
      let damage = Math.max(
        1,
        Math.round(
          actor.atk *
            multiplier *
            (0.85 + Math.random() * 0.3) -
            defense * 0.5,
        ),
      )

      if (critical) damage = Math.round(damage * 1.7)
      hitTarget.hp = Math.max(0, hitTarget.hp - damage)
      battle.hitUnitId = hitTarget.id

      pushBattleLog(
        battle,
        actor.kind === 'ally' ? 'good' : 'bad',
        actor.name +
          ' → ' +
          hitTarget.name +
          ' ' +
          damage +
          (critical ? ' 치명타' : ''),
      )

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
): void {
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
}

function rewardBattleVictory(
  targetState: GameState,
  party: Party,
  allowGear = true,
): void {
  const dungeonIndex = party.dungeon
  if (dungeonIndex === null) return

  const dungeon = DUNGEONS[dungeonIndex]
  party.runs += 1
  const gold = 20 + dungeon.recommendedLevel * 12

  targetState.gold += gold
  targetState.fame += 2 + dungeon.recommendedLevel

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
    dungeonIndex === targetState.unlockedDungeonIndex &&
    party.runs >= 3 &&
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
      ' 승리 · ' +
      gold +
      ' 엽전'
  }

  if (
    allowGear &&
    Math.random() < 0.12 &&
    party.dungeon !== null
  ) {
    dropBattleGear(targetState, party.dungeon)
  }

  party.busy = false
}

function applyBattleDefeat(
  targetState: GameState,
  party: Party,
): void {
  const dungeonIndex = party.dungeon
  if (dungeonIndex === null) return

  party.status = 'camp'
  party.busy = false
  party.campUntil =
    Date.now() +
    (18 + DUNGEONS[dungeonIndex].recommendedLevel * 2) * 1_000
  targetState.recentLog = party.name + ' 전멸 · 야영 회복'
}

function finishBattle(
  targetState: GameState,
  party: Party,
  battle: BattleState,
  won: boolean,
  now: number,
): void {
  battle.result = won ? 'victory' : 'defeat'
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

  if (!allies.length || !enemies.length) {
    party.status = 'idle'
    party.dungeon = null
    party.busy = false
    targetState.recentLog =
      party.name + ' 편성을 확인해 주세요.'
    return
  }

  party.busy = true
  battleStates[party.id] = {
    allies,
    enemies,
    logs: [
      'skill|' + DUNGEONS[dungeonIndex].name + ' 전투 시작',
    ],
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
          right.dex +
          Math.random() * 5 -
          (left.dex + Math.random() * 5),
      )
    battle.round += 1
  }

  const actor = battle.queue.shift()

  if (actor && actor.hp > 0) {
    performBattleAction(battle, actor)
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
  getBattleState(partyId: string): BattleState | undefined {
    return battleStates[partyId]
  },

  getMercenaryCapacity,
  getStorageCapacity,
  getMaterialTotal,
  getHireCost,

  refreshCandidates(paid = true): boolean {
    const refreshCost = 80

    if (paid && state.gold < refreshCost) {
      return false
    }

    setState((current) => ({
      ...current,
      gold: paid ? current.gold - refreshCost : current.gold,
      candidates: [
        createMercenary(),
        createMercenary(),
        createMercenary(),
      ],
      candidateRefreshAt: Date.now() + 60_000,
    }))

    return true
  },

  hireMercenary(mercenaryId: string): boolean {
    const candidate = state.candidates.find(
      (mercenary) => mercenary.id === mercenaryId,
    )

    if (!candidate) {
      return false
    }

    const cost = getHireCost(candidate)

    if (
      state.gold < cost ||
      state.mercenaries.length >= getMercenaryCapacity()
    ) {
      return false
    }

    setState((current) => ({
      ...current,
      gold: current.gold - cost,
      mercenaries: [...current.mercenaries, candidate],
      candidates: current.candidates.filter(
        (mercenary) => mercenary.id !== mercenaryId,
      ),
      recentLog: `${candidate.base}이 상단에 합류했습니다.`,
    }))

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

  assignDungeon(partyIndex: number, dungeonIndex: number): boolean {
    const party = state.parties[partyIndex]

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
      const targetParty = next.parties[partyIndex]

      targetParty.dungeon = dungeonIndex
      targetParty.status = 'explore'
      targetParty.nextActionAt = Date.now() + 1_200
      targetParty.campUntil = 0
      targetParty.busy = false
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
    const cost = 250 * level * level

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

      if (now >= next.candidateRefreshAt) {
        next.candidates = [
          createMercenary(),
          createMercenary(),
          createMercenary(),
        ]
        next.candidateRefreshAt = now + 60_000
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
            delete battleStates[party.id]
          }
          continue
        }

        if (
          party.status === 'camp' &&
          now >= party.campUntil
        ) {
          party.status = 'explore'
          party.nextActionAt =
            now +
            DUNGEONS[dungeonIndex as number].actionTime *
              1_000
        }

        if (party.status !== 'explore') {
          if (battle) delete battleStates[party.id]
          continue
        }

        if (battle) {
          advanceBattle(next, party, battle, now)
        } else if (now >= party.nextActionAt) {
          startBattle(next, party)
        }
      }

      return next
    })
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














