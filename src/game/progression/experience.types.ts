export interface LevelExperienceData {
  level: number
  requiredExp: number
  startTotalExp: number
  nextTotalExp: number
}

export interface LevelUpDetail {
  fromLevel: number
  toLevel: number
}

export interface ExperienceGainResult {
  previousLevel: number
  newLevel: number
  previousTotalExp: number
  newTotalExp: number
  gainedExp: number
  levelsGained: number
  leveledUp: boolean
  levelUps: LevelUpDetail[]
  reachedCurrentMaxLevel: boolean
}
