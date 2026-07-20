import type { MercenaryBase } from '../../types/game'

export type CombatClass = 'warrior' | 'archer' | 'rogue' | 'mage'

export interface CombatStats {
  constitution: number
  dexterity: number
  intelligence: number
  maxHp: number
  magicDefenseRate: number
}

export interface DamageRange { min: number; max: number; average: number }
export interface AccuracyOptions {
  attackerMainStat: number
  defenderRelevantStat: number
  darknessRate?: number
  hasNightVision?: boolean
  focusBonusRate?: number
  missChanceMultiplier?: number
}
export interface CriticalOptions {
  additiveCriticalDamageRate?: number
  multiplicativeCriticalModifiers?: number[]
}
export interface DamageCalculationResult {
  hit: boolean
  dodged: boolean
  critical: boolean
  baseDamage: number
  skillAdjustedDamage: number
  criticalAdjustedDamage: number
  reducedDamage: number
  finalDamage: number
}
export interface RegenerationEffect {
  sourceId: string
  healingRate: number
  appliedTurn: number
  remainingTurns?: number
}

const CLASS_BY_JOB: Record<MercenaryBase, CombatClass> = {
  창잡이: 'warrior',
  활잡이: 'archer',
  검객: 'rogue',
  의술사: 'mage',
}

export function mapJobToCombatClass(job: MercenaryBase): CombatClass {
  return CLASS_BY_JOB[job]
}