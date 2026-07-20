import { COMBAT_BALANCE } from './combat.constants'
import type { CombatClass, CombatStats, DamageRange } from './combat.types'

function mainStat(combatClass: CombatClass, stats: CombatStats): number {
  if (combatClass === 'warrior') return stats.constitution
  if (combatClass === 'archer') return stats.dexterity
  if (combatClass === 'rogue') return stats.constitution + stats.dexterity
  return stats.intelligence
}

export function calculateDamageRange(combatClass: CombatClass, stats: CombatStats): DamageRange {
  const value = Math.max(0, mainStat(combatClass, stats))
  const balance = COMBAT_BALANCE.damageRange[combatClass]
  const min = Math.floor(value * balance.min + 1e-9)
  const max = Math.floor(value * balance.max + 1e-9)
  return { min, max, average: (min + max) / 2 }
}

export function rollBaseDamage(range: DamageRange, random: () => number = Math.random): number {
  const min = Math.max(0, Math.ceil(Math.min(range.min, range.max)))
  const max = Math.max(min, Math.floor(Math.max(range.min, range.max)))
  const rolled = Math.min(0.999999999999, Math.max(0, random()))
  return min + Math.floor(rolled * (max - min + 1))
}

export function calculatePhysicalDamage(options: { baseDamage: number; skillMultiplier?: number; isCritical?: boolean; criticalMultiplier?: number; flatDamageReduction?: number; isBlocked?: boolean }): number {
  if (options.isBlocked) return 0
  const skillAdjusted = Math.floor(Math.max(0, options.baseDamage) * Math.max(0, options.skillMultiplier ?? 1))
  const criticalAdjusted = options.isCritical ? Math.floor(skillAdjusted * Math.max(0, options.criticalMultiplier ?? COMBAT_BALANCE.baseCriticalMultiplier)) : skillAdjusted
  return Math.max(1, Math.floor(criticalAdjusted - Math.max(0, options.flatDamageReduction ?? 0)))
}

export function getCombatMainStat(combatClass: CombatClass, stats: Pick<CombatStats, 'constitution' | 'dexterity' | 'intelligence'>): number {
  return Math.max(0, mainStat(combatClass, { ...stats, maxHp: 0, magicDefenseRate: 0 }))
}