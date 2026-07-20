import { COMBAT_BALANCE } from './combat.constants'
import type { AccuracyOptions } from './combat.types'

export function clampRate(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
}

export function calculateBaseHitRate(attackerMainStat: number, defenderRelevantStat: number): number {
  const attacker = Math.max(0, Number.isFinite(attackerMainStat) ? attackerMainStat : 0)
  const defender = Math.max(0, Number.isFinite(defenderRelevantStat) ? defenderRelevantStat : 0)
  const denominator = attacker + defender / COMBAT_BALANCE.defenseStatHitDivisor
  return denominator <= 0 ? COMBAT_BALANCE.zeroStatHitRate : clampRate(attacker / denominator)
}

export function calculateDodgeRate(enemyMainStat: number, defenderRelevantStat: number): number {
  return clampRate(1 - calculateBaseHitRate(enemyMainStat, defenderRelevantStat))
}

export function applyDarknessToHitRate(baseHitRate: number, darknessRate: number, hasNightVision: boolean): number {
  const base = clampRate(baseHitRate)
  const darkness = clampRate(darknessRate)
  return clampRate(hasNightVision ? base - darkness * (base - 1) : base * (1 - darkness))
}

export function calculateFinalHitRate(options: AccuracyOptions): number {
  const base = calculateBaseHitRate(options.attackerMainStat, options.defenderRelevantStat)
  const darknessAdjusted = applyDarknessToHitRate(base, options.darknessRate ?? 0, options.hasNightVision ?? false)
  return clampRate(darknessAdjusted + (options.focusBonusRate ?? 0))
}

export function rollChance(rate: number, random: () => number = Math.random): boolean {
  return random() < clampRate(rate)
}

export function rollHit(rate: number, random: () => number = Math.random): boolean {
  return rollChance(rate, random)
}