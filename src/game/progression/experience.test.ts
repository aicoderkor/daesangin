import { describe, expect, it } from 'vitest'
import {
  addExperience,
  getCurrentLevelExp,
  getLevelExperienceData,
  getLevelFromTotalExp,
  getLevelProgress,
  getRequiredExpForLevel,
  LEVEL_EXPERIENCE_TABLE,
  MAX_DEFINED_LEVEL,
  MAX_DEFINED_TOTAL_EXP,
} from '.'

describe('experience progression table', () => {
  it.each([
    [0, 1], [39, 1], [40, 2], [179, 2], [180, 3], [530, 4],
    [4_922_119, 44], [4_922_120, 45], [5_353_120, 45], [10_000_000, 45],
  ])('derives level %i as %i', (totalExp, expectedLevel) => {
    expect(getLevelFromTotalExp(totalExp)).toBe(expectedLevel)
  })

  it('calculates current level experience and progress', () => {
    expect(getCurrentLevelExp(2, 110)).toBe(70)
    expect(getRequiredExpForLevel(2)).toBe(140)
    expect(getLevelProgress(2, 110)).toBe(0.5)
  })

  it('handles multi-level gains with explicit transitions', () => {
    const result = addExperience({ currentLevel: 1, currentTotalExp: 0, gainedExp: 200 })
    expect(result.newLevel).toBe(3)
    expect(result.newTotalExp).toBe(200)
    expect(result.levelsGained).toBe(2)
    expect(result.levelUps).toEqual([{ fromLevel: 1, toLevel: 2 }, { fromLevel: 2, toLevel: 3 }])
  })

  it('ignores zero and negative gains', () => {
    expect(addExperience({ currentLevel: 3, currentTotalExp: 200, gainedExp: 0 }).newTotalExp).toBe(200)
    expect(addExperience({ currentLevel: 3, currentTotalExp: 200, gainedExp: -20 }).newTotalExp).toBe(200)
  })

  it('keeps level 45 as the current maximum', () => {
    expect(MAX_DEFINED_LEVEL).toBe(45)
    expect(getLevelFromTotalExp(MAX_DEFINED_TOTAL_EXP + 1_000_000)).toBe(45)
    expect(getLevelProgress(45, MAX_DEFINED_TOTAL_EXP)).toBe(1)
  })

  it('keeps every table boundary internally consistent', () => {
    expect(LEVEL_EXPERIENCE_TABLE).toHaveLength(45)
    for (let index = 0; index < LEVEL_EXPERIENCE_TABLE.length; index += 1) {
      const current = LEVEL_EXPERIENCE_TABLE[index]
      expect(current.level).toBe(index + 1)
      expect(current.startTotalExp + current.requiredExp).toBe(current.nextTotalExp)
      if (index > 0) expect(current.startTotalExp).toBe(LEVEL_EXPERIENCE_TABLE[index - 1].nextTotalExp)
    }
  })

  it('returns null and zero values outside defined level data', () => {
    expect(getLevelExperienceData(46)).toBeNull()
    expect(getRequiredExpForLevel(46)).toBe(0)
  })
})
