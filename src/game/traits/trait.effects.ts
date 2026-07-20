import { TRAIT_CATALOG } from './trait.catalog'
import type { MercenaryTraits, TraitAdjustedStats, TraitCombatEffects } from './trait.types'
export function applyPrimaryTraitStats(stats: TraitAdjustedStats, traits: MercenaryTraits): TraitAdjustedStats {
  const result = { ...stats }
  if (!traits.primary) return result
  for (const effect of TRAIT_CATALOG[traits.primary].effects) {
    if (effect.type !== 'stat_percent') continue
    result[effect.stat] *= 1 + effect.value
  }
  return result
}
export function getTraitCombatEffects(traits: MercenaryTraits, unitTier: number): TraitCombatEffects {
  const result: TraitCombatEffects = { turnRegenerationFlat: 0, flatDamageReduction: 0, darknessReduction: 0, initiativePriority: 0, statusImmunityRate: 0, dodgeRate: 0, threatMultiplier: 1, counterRate: 0, healingMultiplier: 1, turnHpLossRate: 0, lifestealRate: 0, darknessDamageScaling: 0, manaRegenerationFlat: 0, criticalMultiplier: 1, missChanceMultiplier: 1 }
  if (!traits.secondary) return result
  for (const effect of TRAIT_CATALOG[traits.secondary].effects) {
    if (effect.type === 'turn_regeneration_per_tier') result.turnRegenerationFlat += effect.value * unitTier
    if (effect.type === 'damage_reduction_per_tier') result.flatDamageReduction += effect.value * unitTier
    if (effect.type === 'darkness_flat_reduction') result.darknessReduction += effect.value
    if (effect.type === 'initiative_priority') result.initiativePriority += effect.value
    if (effect.type === 'status_immunity') result.statusImmunityRate += effect.value
    if (effect.type === 'dodge_additive') result.dodgeRate += effect.value
    if (effect.type === 'threat_multiplier') result.threatMultiplier *= effect.value
    if (effect.type === 'counter_additive') result.counterRate += effect.value
    if (effect.type === 'healing_multiplier') result.healingMultiplier *= effect.value
    if (effect.type === 'turn_hp_loss_rate') result.turnHpLossRate += effect.value
    if (effect.type === 'lifesteal_additive') result.lifestealRate += effect.value
    if (effect.type === 'darkness_damage_scaling') result.darknessDamageScaling += effect.value
    if (effect.type === 'mana_regeneration_flat') result.manaRegenerationFlat += effect.value
    if (effect.type === 'critical_multiplier') result.criticalMultiplier *= effect.value
    if (effect.type === 'miss_chance_multiplier') result.missChanceMultiplier *= effect.value
  }
  return result
}