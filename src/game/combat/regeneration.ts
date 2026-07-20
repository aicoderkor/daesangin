import { COMBAT_BALANCE } from './combat.constants'
import type { RegenerationEffect } from './combat.types'

export function createRegenerationEffect(options: { sourceId: string; bonusRate?: number; appliedTurn: number; remainingTurns?: number }): RegenerationEffect {
  return { sourceId: options.sourceId, healingRate: Math.max(0, COMBAT_BALANCE.baseRegenerationRate + (options.bonusRate ?? 0)), appliedTurn: options.appliedTurn, remainingTurns: options.remainingTurns }
}
export function applyRegenerationEffect(_currentEffect: RegenerationEffect | null, nextEffect: RegenerationEffect): RegenerationEffect { return nextEffect }
export function calculateRegenerationAmount(maxHp: number, regenerationRate: number): number { return Math.max(0, Math.floor(Math.max(0, maxHp) * Math.max(0, regenerationRate))) }