export type ExpeditionPhase =
  | 'entering'
  | 'exploring'
  | 'event'
  | 'enemyEncounter'
  | 'combat'
  | 'combatVictory'
  | 'reward'
  | 'continuing'
  | 'completed'
  | 'defeated'
  | 'retreating'

export type ExpeditionLogType =
  | 'system'
  | 'exploration'
  | 'environment'
  | 'warning'
  | 'enemy'
  | 'ally'
  | 'damage'
  | 'heal'
  | 'critical'
  | 'evade'
  | 'victory'
  | 'defeat'
  | 'reward'
  | 'item'
  | 'story'

export interface ExpeditionLog {
  id: string
  type: ExpeditionLogType
  message: string
  createdAt: number
}

export interface ExpeditionSession {
  id: string
  partyId: string
  dungeonIndex: number
  phase: ExpeditionPhase
  totalAreas: number
  completedAreas: number
  defeatedEnemies: number
  startedAt: number
  nextProcessAt: number
  rewardGranted: boolean
  logs: ExpeditionLog[]
}
