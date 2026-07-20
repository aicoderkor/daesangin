export type PrimaryTraitId = 'large' | 'wild' | 'bookworm' | 'large_plus' | 'wild_plus' | 'bookworm_plus'
export type SecondaryTraitId = 'troll_blood' | 'dragon_blood' | 'blessed' | 'alert' | 'careful' | 'agile' | 'dangerous' | 'reactive' | 'empathy' | 'curse' | 'nocturnal' | 'talent' | 'merciless' | 'focus'
export type TraitId = PrimaryTraitId | SecondaryTraitId
export type TraitGroup = 'primary' | 'secondary'
export type TraitStat = 'constitution' | 'dexterity' | 'intelligence'
export type TraitEffect =
  | { type: 'stat_percent'; stat: TraitStat; value: number }
  | { type: 'turn_regeneration_per_tier' | 'damage_reduction_per_tier' | 'darkness_flat_reduction' | 'initiative_priority' | 'status_immunity' | 'dodge_additive' | 'threat_multiplier' | 'counter_additive' | 'healing_multiplier' | 'turn_hp_loss_rate' | 'lifesteal_additive' | 'darkness_damage_scaling' | 'mana_regeneration_flat' | 'critical_multiplier' | 'miss_chance_multiplier'; value: number }
export interface TraitDefinition { id: TraitId; name: string; group: TraitGroup; description: string; effects: TraitEffect[] }
export interface MercenaryTraits { primary: PrimaryTraitId | null; secondary: SecondaryTraitId | null }
export interface TraitGenerationConfig { primaryTraitChance: number; secondaryTraitChance: number }
export interface TraitAdjustedStats { constitution: number; dexterity: number; intelligence: number }
export interface TraitCombatEffects {
  turnRegenerationFlat: number
  flatDamageReduction: number
  darknessReduction: number
  initiativePriority: number
  statusImmunityRate: number
  dodgeRate: number
  threatMultiplier: number
  counterRate: number
  healingMultiplier: number
  turnHpLossRate: number
  lifestealRate: number
  darknessDamageScaling: number
  manaRegenerationFlat: number
  criticalMultiplier: number
  missChanceMultiplier: number
}