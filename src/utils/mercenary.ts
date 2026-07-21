import martialArtistPortrait from '../assets/martial-artist.png'
import hunterPortrait from '../assets/hunter.png'
import shamanPortrait from '../assets/shaman.png'
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
  return getClassNode(mercenary)?.name ?? ({ 창잡이: '무도가', 활잡이: '사냥꾼', 검객: '낭인', 의술사: '무녀' }[mercenary.base] ?? mercenary.base)
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
  const requiredLevel = getNextPromotionLevel(mercenary)
  return requiredLevel !== null && mercenary.level >= requiredLevel
}

export function getNextPromotionLevel(
  mercenary: Mercenary,
): number | null {
  const nextLevel = (mercenary.path.length + 1) * 5
  return nextLevel <= 45 ? nextLevel : null
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
    mp: 100,
    atk: base.atk,
    def: base.def,
    mdef: base.mdef,
    threat: base.threat,
    heal: base.heal ?? 0,
    crit: 0.05,
    evade: 0.03,
    hit: 0.9,
    mana: 10,
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


  const promotionBonuses: Record<MercenaryBase, { con: number; dex: number; int: number }> = {
    창잡이: { con: 5, dex: 1, int: 1 },
    활잡이: { con: 1, dex: 5, int: 1 },
    의술사: { con: 1, dex: 1, int: 5 },
    검객: { con: 3, dex: 3, int: 1 },
  }
  const promotionBonus = promotionBonuses[mercenary.base]
  const promotionCount = mercenary.path.length

  stats.con += promotionBonus.con * promotionCount
  stats.dex += promotionBonus.dex * promotionCount
  stats.int += promotionBonus.int * promotionCount

  // Temporary tier level only improves durability. Promotion stat gains are handled above.
  const levelOffset = Math.max(0, mercenary.level - 1)
  stats.hp += levelOffset
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
export function getBasePortrait(base?: MercenaryBase | null): string | null {
  if (!base) return null
  return ({
    창잡이: martialArtistPortrait,
    활잡이: hunterPortrait,
    의술사: shamanPortrait,
  } as Partial<Record<MercenaryBase, string>>)[base] ?? null
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

