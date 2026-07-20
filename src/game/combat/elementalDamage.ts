import { COMBAT_BALANCE } from './combat.constants'
import { clampRate } from './accuracy'

export function calculateFireDamage(options: { targetMaxHp: number; targetConstitution: number; targetMagicDefenseRate: number; additiveFireDamageBonusRates?: number[] }): number {
  const bonus = (options.additiveFireDamageBonusRates ?? []).reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0)
  const rate = COMBAT_BALANCE.baseFireDamageRate * (1 + bonus)
  const raw = Math.floor(Math.max(0, options.targetMaxHp) * Math.max(0, rate))
  const afterDefense = Math.floor(raw * (1 - clampRate(options.targetMagicDefenseRate)))
  const constitutionReduction = Math.floor(Math.max(0, options.targetConstitution) / COMBAT_BALANCE.constitutionFireReductionDivisor)
  return Math.max(0, afterDefense - constitutionReduction)
}