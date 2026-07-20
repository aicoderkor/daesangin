import { CLASSES } from '../data/gameData'
import { applyPrimaryTraitStats } from '../game/traits'
import type {
  ClassBranch,
  Mercenary,
  MercenaryBase,
  StatMap,
} from '../types/game'

const additiveStats = new Set([
  'crit',
  'evade',
  'hit',
  'regen',
  'lifesteal',
])

export function getClassNode(mercenary: Mercenary): ClassBranch | null {
  let branches = CLASSES[mercenary.base].branches
  let selected: ClassBranch | null = null

  for (const pathIndex of mercenary.path) {
    selected = branches[pathIndex] ?? null

    if (!selected) {
      return null
    }

    branches = selected.branches ?? []
  }

  return selected
}

export function getClassName(mercenary: Mercenary): string {
  return getClassNode(mercenary)?.name ?? mercenary.base
}

export function getNextPromotionBranches(
  mercenary: Mercenary,
): ClassBranch[] {
  if (mercenary.path.length === 0) {
    return CLASSES[mercenary.base].branches
  }

  return getClassNode(mercenary)?.branches ?? []
}

export function isPromotionReady(mercenary: Mercenary): boolean {
  if (mercenary.path.length === 0) {
    return mercenary.level >= 5
  }

  if (mercenary.path.length === 1) {
    return mercenary.level >= 10
  }

  return false
}

export function getNextPromotionLevel(
  mercenary: Mercenary,
): number | null {
  if (mercenary.path.length === 0) {
    return 5
  }

  if (mercenary.path.length === 1) {
    return 10
  }

  return null
}

export function getMercenaryStats(
  mercenary: Mercenary,
): Required<StatMap> {
  const base = CLASSES[mercenary.base]

  const stats: Required<StatMap> = {
    con: base.con,
    dex: base.dex,
    int: base.int,
    hp: base.hp,
    mp: base.mp,
    atk: base.atk,
    def: base.def,
    mdef: base.mdef,
    threat: base.threat,
    heal: base.heal ?? 0,
    crit: 0.05,
    evade: 0.03,
    hit: 0.9,
    mana: 8,
    regen: 0,
    lifesteal: 0,
  }

  let branches = base.branches

  for (const pathIndex of mercenary.path) {
    const branch = branches[pathIndex]

    if (!branch) {
      break
    }

    applyModifiers(stats, branch.modifiers)
    branches = branch.branches ?? []
  }


  const levelOffset = Math.max(0, mercenary.level - 1)

  stats.hp *= 1 + levelOffset * 0.085
  stats.atk *= 1 + levelOffset * 0.07
  stats.def *= 1 + levelOffset * 0.055
  stats.mdef *= 1 + levelOffset * 0.055
  stats.heal *= 1 + levelOffset * 0.07

  const adjusted = applyPrimaryTraitStats({
    constitution: stats.con,
    dexterity: stats.dex,
    intelligence: stats.int,
  }, mercenary.traits)
  stats.con = adjusted.constitution
  stats.dex = adjusted.dexterity
  stats.int = adjusted.intelligence
  return stats
}

export function getBaseIcon(base: MercenaryBase): string {
  return CLASSES[base].icon
}

export function getBaseRole(base: MercenaryBase): string {
  return CLASSES[base].role
}

export function applyModifiers(
  target: Required<StatMap>,
  modifiers: StatMap,
): void {
  for (const [key, value] of Object.entries(modifiers)) {
    if (value === undefined) {
      continue
    }

    const statKey = key as keyof Required<StatMap>

    if (additiveStats.has(statKey)) {
      target[statKey] += value
    } else {
      target[statKey] *= value
    }
  }
}
