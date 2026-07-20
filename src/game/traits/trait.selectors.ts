import { TRAIT_CATALOG } from './trait.catalog'
import type { MercenaryTraits, TraitDefinition, TraitId } from './trait.types'
export const EMPTY_MERCENARY_TRAITS: MercenaryTraits = { primary: null, secondary: null }
export function normalizeMercenaryTraits(value: unknown): MercenaryTraits {
  if (!value || Array.isArray(value) || typeof value !== 'object') return { ...EMPTY_MERCENARY_TRAITS }
  const candidate = value as Partial<MercenaryTraits>
  const primary = candidate.primary && TRAIT_CATALOG[candidate.primary]?.group === 'primary' ? candidate.primary : null
  const secondary = candidate.secondary && TRAIT_CATALOG[candidate.secondary]?.group === 'secondary' ? candidate.secondary : null
  return { primary, secondary }
}
export function hasTrait(traits: MercenaryTraits, id: TraitId): boolean { return traits.primary === id || traits.secondary === id }
export function getTraitDefinition(id: TraitId | null): TraitDefinition | null { return id ? TRAIT_CATALOG[id] : null }
export function getMercenaryTraitDefinitions(traits: MercenaryTraits): { primary: TraitDefinition | null; secondary: TraitDefinition | null } { return { primary: getTraitDefinition(traits.primary), secondary: getTraitDefinition(traits.secondary) } }
export function getTraitCount(traits: MercenaryTraits): number { return Number(Boolean(traits.primary)) + Number(Boolean(traits.secondary)) }