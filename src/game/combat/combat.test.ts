import { describe, expect, it } from 'vitest'
import { applyDarknessToHitRate, calculateBaseHitRate, calculateDodgeRate, calculateFinalHitRate } from './accuracy'
import { calculateCriticalMultiplier } from './critical'
import { calculateDamageRange } from './damage'
import { calculateFireDamage } from './elementalDamage'
import { applyRegenerationEffect, calculateRegenerationAmount, createRegenerationEffect } from './regeneration'

const stats = (constitution: number, dexterity: number, intelligence: number) => ({ constitution, dexterity, intelligence, maxHp: 100, magicDefenseRate: 0 })

describe('combat engine', () => {
  it.each([
    ['warrior', stats(100, 0, 0), 85, 115, 100],
    ['archer', stats(0, 100, 0), 90, 110, 100],
    ['rogue', stats(50, 50, 0), 75, 125, 100],
    ['mage', stats(0, 0, 100), 95, 105, 100],
  ] as const)('%s damage range', (combatClass, combatStats, min, max, average) => {
    expect(calculateDamageRange(combatClass, combatStats)).toEqual({ min, max, average })
  })

  it('calculates hit and dodge rates', () => {
    expect(calculateBaseHitRate(80, 65)).toBeCloseTo(0.860215, 6)
    expect(calculateDodgeRate(70, 150)).toBeCloseTo(0.3, 6)
  })

  it('applies darkness, night vision, and focus in order', () => {
    expect(applyDarknessToHitRate(0.86, 0.4, false)).toBeCloseTo(0.516, 6)
    expect(applyDarknessToHitRate(0.86, 0.4, true)).toBeCloseTo(0.916, 6)
    expect(calculateFinalHitRate({ attackerMainStat: 100, defenderRelevantStat: 0, focusBonusRate: 0.15 })).toBe(1)
  })

  it('combines critical modifiers', () => {
    expect(calculateCriticalMultiplier({ additiveCriticalDamageRate: 0.3, multiplicativeCriticalModifiers: [1.2] })).toBeCloseTo(2.16, 8)
  })

  it('calculates fire damage at documented floor points', () => {
    expect(calculateFireDamage({ targetMaxHp: 615, targetConstitution: 48, targetMagicDefenseRate: 0.51 })).toBe(10)
  })

  it('calculates normal and enhanced regeneration', () => {
    expect(calculateRegenerationAmount(1000, 0.06)).toBe(60)
    expect(calculateRegenerationAmount(1000, 0.11)).toBe(110)
  })

  it('replaces an existing regeneration effect', () => {
    const enhanced = createRegenerationEffect({ sourceId: 'a', bonusRate: 0.05, appliedTurn: 1 })
    const normal = createRegenerationEffect({ sourceId: 'b', appliedTurn: 2 })
    expect(applyRegenerationEffect(enhanced, normal)).toEqual(normal)
    expect(normal.healingRate).toBe(0.06)
  })
})