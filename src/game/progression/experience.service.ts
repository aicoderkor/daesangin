import type { Mercenary } from '../../types/game'
import { MAX_DEFINED_LEVEL } from './experience.constants'
import type { ExperienceGainResult, LevelUpDetail } from './experience.types'
import { clampDefinedLevel, getLevelExperienceData, getLevelFromTotalExp } from './experience.utils'

export function addExperience({ currentLevel, currentTotalExp, gainedExp }: { currentLevel: number; currentTotalExp: number; gainedExp: number }): ExperienceGainResult {
  void currentLevel
  const previousTotalExp = Math.max(0, Number.isFinite(currentTotalExp) ? currentTotalExp : 0)
  const previousLevel = getLevelFromTotalExp(previousTotalExp)
  const acceptedGain = Math.max(0, Number.isFinite(gainedExp) ? gainedExp : 0)
  const newTotalExp = previousTotalExp + acceptedGain
  const newLevel = getLevelFromTotalExp(newTotalExp)
  const levelUps: LevelUpDetail[] = []
  for (let level = previousLevel; level < newLevel; level += 1) levelUps.push({ fromLevel: level, toLevel: level + 1 })
  return {
    previousLevel,
    newLevel,
    previousTotalExp,
    newTotalExp,
    gainedExp: acceptedGain,
    levelsGained: levelUps.length,
    leveledUp: levelUps.length > 0,
    levelUps,
    reachedCurrentMaxLevel: newLevel === MAX_DEFINED_LEVEL,
  }
}

export function grantBattleExperience(mercenary: Mercenary, gainedExp: number): { mercenary: Mercenary; result: ExperienceGainResult } {
  const result = addExperience({ currentLevel: mercenary.level, currentTotalExp: mercenary.totalExp, gainedExp })
  return { mercenary: { ...mercenary, level: result.newLevel, totalExp: result.newTotalExp }, result }
}

export function normalizeMercenaryProgression(value: { level?: number; totalExp?: number; xp?: number }): { level: number; totalExp: number } {
  const savedTotalExp = value.totalExp
  const totalExp = Number.isFinite(savedTotalExp)
    ? Math.max(0, savedTotalExp ?? 0)
    : (getLevelExperienceData(clampDefinedLevel(value.level ?? 1))?.startTotalExp ?? 0) + Math.max(0, Number.isFinite(value.xp) ? value.xp ?? 0 : 0)
  return { totalExp, level: getLevelFromTotalExp(totalExp) }
}

