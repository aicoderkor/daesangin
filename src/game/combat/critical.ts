import { COMBAT_BALANCE } from './combat.constants'
import type { CriticalOptions } from './combat.types'

export function calculateCriticalMultiplier(options: CriticalOptions = {}): number {
  const additive = Number.isFinite(options.additiveCriticalDamageRate) ? options.additiveCriticalDamageRate ?? 0 : 0
  const multiplied = (options.multiplicativeCriticalModifiers ?? []).reduce((value, modifier) => value * (Number.isFinite(modifier) ? modifier : 1), COMBAT_BALANCE.baseCriticalMultiplier + additive)
  return Math.max(0, multiplied)
}

export function calculateCriticalDamage(baseDamage: number, criticalMultiplier: number, skillMultiplier = 1): number {
  return Math.max(0, Math.floor(Math.max(0, baseDamage) * Math.max(0, criticalMultiplier) * Math.max(0, skillMultiplier)))
}