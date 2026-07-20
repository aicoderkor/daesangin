import { TRAIT_GENERATION_CONFIG } from './trait.constants'
import { PRIMARY_TRAIT_IDS, SECONDARY_TRAIT_IDS } from './trait.catalog'
import type { MercenaryTraits, TraitGenerationConfig } from './trait.types'
const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))
const select = <T>(items: readonly T[], random: () => number): T => items[Math.min(items.length - 1, Math.floor(Math.max(0, random()) * items.length))]
export function generateMercenaryTraits(config: TraitGenerationConfig = TRAIT_GENERATION_CONFIG, random: () => number = Math.random): MercenaryTraits {
  const primary = random() < clamp(config.primaryTraitChance) ? select(PRIMARY_TRAIT_IDS, random) : null
  const secondary = random() < clamp(config.secondaryTraitChance) ? select(SECONDARY_TRAIT_IDS, random) : null
  return { primary, secondary }
}