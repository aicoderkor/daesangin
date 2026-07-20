import { MAX_DEFINED_LEVEL, MIN_LEVEL } from './experience.constants'
import { LEVEL_EXPERIENCE_MAP, LEVEL_EXPERIENCE_TABLE } from './experience.table'
import type { LevelExperienceData } from './experience.types'

const normalizeExp = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0)

export function getLevelExperienceData(level: number): LevelExperienceData | null {
  return LEVEL_EXPERIENCE_MAP.get(level) ?? null
}

export function getLevelFromTotalExp(totalExp: number): number {
  const normalized = normalizeExp(totalExp)
  for (let index = LEVEL_EXPERIENCE_TABLE.length - 1; index >= 0; index -= 1) {
    const data = LEVEL_EXPERIENCE_TABLE[index]
    if (normalized >= data.startTotalExp) return data.level
  }
  return MIN_LEVEL
}

export function getCurrentLevelExp(level: number, totalExp: number): number {
  const data = getLevelExperienceData(level)
  if (!data) return 0
  return Math.min(data.requiredExp, Math.max(0, normalizeExp(totalExp) - data.startTotalExp))
}

export function getRequiredExpForLevel(level: number): number {
  return getLevelExperienceData(level)?.requiredExp ?? 0
}

export function getLevelProgress(level: number, totalExp: number): number {
  const data = getLevelExperienceData(level)
  if (!data || data.requiredExp <= 0) return 0
  return Math.min(1, Math.max(0, getCurrentLevelExp(level, totalExp) / data.requiredExp))
}

export function clampDefinedLevel(level: number): number {
  return Math.min(MAX_DEFINED_LEVEL, Math.max(MIN_LEVEL, Math.floor(Number.isFinite(level) ? level : MIN_LEVEL)))
}
