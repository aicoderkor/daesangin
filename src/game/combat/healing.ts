import { COMBAT_BALANCE } from './combat.constants'

export function calculateHealing(options: { baseDamage: number; additiveHealingRates?: number[]; multiplicativeHealingModifiers?: number[] }): number {
  const additive = (options.additiveHealingRates ?? []).reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0)
  const multiplied = (options.multiplicativeHealingModifiers ?? []).reduce((value, modifier) => value * (Number.isFinite(modifier) ? modifier : 1), Math.max(0, options.baseDamage) * COMBAT_BALANCE.baseHealingDamageRatio * (1 + additive))
  return Math.max(0, Math.floor(multiplied))
}

export function applyHealing(options: { currentHp: number; maxHp: number; healingAmount: number }): { restoredHp: number; newHp: number; overheal: number } {
  const current = Math.min(Math.max(0, options.currentHp), Math.max(0, options.maxHp))
  const amount = Math.max(0, Math.floor(options.healingAmount))
  const restoredHp = Math.min(amount, Math.max(0, options.maxHp - current))
  return { restoredHp, newHp: current + restoredHp, overheal: amount - restoredHp }
}