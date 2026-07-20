import type { TraitGenerationConfig } from './trait.types'

// 확정 확률이 생기면 이 객체만 조정한다.
export const TRAIT_GENERATION_CONFIG: TraitGenerationConfig = {
  primaryTraitChance: 0.8,
  secondaryTraitChance: 0.5,
}
export const TRAIT_VALUES = {
  trollRegenerationPerTier: 1,
  dragonReductionPerTier: 1,
  blessedDarknessReduction: 8,
  initiativePriority: 1000,
  statusImmunityRate: 0.1,
  dodgeRate: 0.08,
  threatMultiplier: 2,
  counterRate: 0.1,
  healingMultiplier: 1.2,
  curseHpLossRate: 0.04,
  curseLifestealRate: 0.15,
  nocturnalDarknessScaling: 0.005,
  manaRegenerationFlat: 2,
  mercilessCriticalMultiplier: 1.2,
  focusMissChanceMultiplier: 0.85,
} as const