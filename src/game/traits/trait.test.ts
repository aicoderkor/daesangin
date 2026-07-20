import { describe, expect, it } from 'vitest'
import { calculateFinalHitRate } from '../combat/accuracy'
import {
  applyPrimaryTraitStats,
  generateMercenaryTraits,
  getTraitCombatEffects,
  normalizeMercenaryTraits,
} from '.'
import type { MercenaryTraits } from './trait.types'

const traits = (primary: MercenaryTraits['primary'] = null, secondary: MercenaryTraits['secondary'] = null): MercenaryTraits => ({ primary, secondary })

describe('mercenary traits', () => {
  it('generates both slots independently with injected random values', () => {
    const values = [0.1, 0, 0.1, 0]
    const result = generateMercenaryTraits({ primaryTraitChance: 0.5, secondaryTraitChance: 0.5 }, () => values.shift() ?? 0)
    expect(result).toEqual({ primary: 'large', secondary: 'troll_blood' })
  })

  it('allows both slots to remain empty without a fake none trait', () => {
    const result = generateMercenaryTraits({ primaryTraitChance: 0, secondaryTraitChance: 0 }, () => 0.9)
    expect(result).toEqual({ primary: null, secondary: null })
  })

  it('migrates legacy arrays to two null slots without rerolling', () => {
    expect(normalizeMercenaryTraits(['거구', '민첩한'])).toEqual({ primary: null, secondary: null })
  })

  it('rejects an invalid trait in the wrong slot', () => {
    expect(normalizeMercenaryTraits({ primary: 'focus', secondary: 'large' })).toEqual({ primary: null, secondary: null })
  })

  it('applies large stat changes', () => {
    expect(applyPrimaryTraitStats({ constitution: 100, dexterity: 100, intelligence: 100 }, traits('large'))).toEqual({ constitution: 110.00000000000001, dexterity: 95, intelligence: 95 })
  })

  it('applies wild stat changes', () => {
    expect(applyPrimaryTraitStats({ constitution: 100, dexterity: 100, intelligence: 100 }, traits('wild'))).toEqual({ constitution: 95, dexterity: 110.00000000000001, intelligence: 95 })
  })

  it('applies bookworm stat changes', () => {
    expect(applyPrimaryTraitStats({ constitution: 100, dexterity: 100, intelligence: 100 }, traits('bookworm'))).toEqual({ constitution: 95, dexterity: 95, intelligence: 110.00000000000001 })
  })

  it('applies plus primary traits without penalties', () => {
    expect(applyPrimaryTraitStats({ constitution: 100, dexterity: 100, intelligence: 100 }, traits('large_plus'))).toEqual({ constitution: 114.99999999999999, dexterity: 100, intelligence: 100 })
  })

  it('scales troll regeneration by tier', () => {
    expect(getTraitCombatEffects(traits(null, 'troll_blood'), 3).turnRegenerationFlat).toBe(3)
  })

  it('scales dragon damage reduction by tier', () => {
    expect(getTraitCombatEffects(traits(null, 'dragon_blood'), 4).flatDamageReduction).toBe(4)
  })

  it('applies agile as additive dodge chance', () => {
    expect(getTraitCombatEffects(traits(null, 'agile'), 1).dodgeRate).toBe(0.08)
  })

  it('applies curse hp loss and lifesteal together', () => {
    const effect = getTraitCombatEffects(traits(null, 'curse'), 1)
    expect(effect.turnHpLossRate).toBe(0.04)
    expect(effect.lifestealRate).toBe(0.15)
  })

  it('applies empathy healing multiplier', () => {
    expect(getTraitCombatEffects(traits(null, 'empathy'), 1).healingMultiplier).toBe(1.2)
  })

  it('applies merciless to final critical multiplier', () => {
    expect(1.5 * getTraitCombatEffects(traits(null, 'merciless'), 1).criticalMultiplier).toBeCloseTo(1.8)
  })

  it('reduces a 40% miss chance by 15% for focus, producing 66% hit chance', () => {
    const multiplier = getTraitCombatEffects(traits(null, 'focus'), 1).missChanceMultiplier
    expect(calculateFinalHitRate({ attackerMainStat: 3, defenderRelevantStat: 10, missChanceMultiplier: multiplier })).toBeCloseTo(0.66)
  })

  it('applies alert initiative priority, talent mana and dangerous threat', () => {
    expect(getTraitCombatEffects(traits(null, 'alert'), 1).initiativePriority).toBeGreaterThan(0)
    expect(getTraitCombatEffects(traits(null, 'talent'), 1).manaRegenerationFlat).toBe(2)
    expect(getTraitCombatEffects(traits(null, 'dangerous'), 1).threatMultiplier).toBe(2)
  })
})

