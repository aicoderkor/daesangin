export type ScreenId =
  | 'home'
  | 'tavern'
  | 'mercs'
  | 'dungeons'
  | 'warehouse'
  | 'forge'
  | 'facilities'

export type MercenaryBase = '창잡이' | '활잡이' | '검객' | '의술사'
export type MercenaryStatus = 'idle' | 'party'
export type PartyStatus = 'idle' | 'explore' | 'camp'
export type GearSlot = 'weapon' | 'armor' | 'charm'
export type MaterialKey = 'wood' | 'ore' | 'fiber' | 'hide' | 'herb' | 'essence'

export type StatKey =
  | 'con'
  | 'dex'
  | 'int'
  | 'hp'
  | 'mp'
  | 'atk'
  | 'def'
  | 'mdef'
  | 'threat'
  | 'heal'
  | 'crit'
  | 'evade'
  | 'hit'
  | 'mana'
  | 'regen'
  | 'lifesteal'

export type StatMap = Partial<Record<StatKey, number>>

export interface SkillDefinition {
  name: string
  cost: number
  powerMultiplier?: number
  status?: 'stun' | 'silence' | 'taunt'
  statusChance?: number
  statusTurns?: number
  counterRate?: number
  type:
    | 'none'
    | 'guard'
    | 'multi'
    | 'pierce'
    | 'aoe'
    | 'cleave'
    | 'heal'
    | 'magic'
}

export interface ClassBranch {
  name: string
  description: string
  modifiers: StatMap
  skill?: SkillDefinition
  branches?: ClassBranch[]
}

export interface ClassDefinition {
  icon: string
  role: string
  con: number
  dex: number
  int: number
  hp: number
  mp: number
  atk: number
  def: number
  mdef: number
  threat: number
  heal?: number
  branches: ClassBranch[]
}

export interface MercenaryGear {
  weapon: string | null
  armor: string | null
  charm: string | null
}

export interface Mercenary {
  id: string
  base: MercenaryBase
  traits: import('../game/traits/trait.types').MercenaryTraits
  level: number
  totalExp: number
  path: number[]
  gear: MercenaryGear
  status: MercenaryStatus
  assignedDungeonId?: string | null
}

export interface DungeonEnemyDefinition {
  name: string
  hp: number
  attack: number
  defense: number
  magicDefense: number
  dexterity: number
  encounterIntros?: string[]
  deathMessages?: string[]
  victoryMessages?: string[]
}

export interface DungeonDefinition {
  name: string
  recommendedLevel: number
  actionTime: number
  materials: Partial<Record<MaterialKey, [number, number]>>
  enemies: DungeonEnemyDefinition[]
}

export interface RecipeDefinition {
  name: string
  slot: GearSlot
  requiredMaterials: Partial<Record<MaterialKey, number>>
  stats: StatMap
}

export interface GearItem {
  id: string
  name: string
  slot: GearSlot
  stats: StatMap
}

export interface FacilityLevels {
  quarters: number
  party: number
  storage: number
  forge: number
  tavern: number
}

export interface Party {
  id: string
  name: string
  members: [string | null, string | null, string | null, string | null]
  dungeon: number | null
  status: PartyStatus
  nextActionAt: number
  campUntil: number
  runs: number
  loot: Partial<Record<MaterialKey, number>>
  busy: boolean
  expeditionPhase?: import('./expedition').ExpeditionPhase
  areaTotal: number
  areasCompleted: number
}

export interface DungeonProgress {
  runProgress: number
  totalProgress: number
  cleared: boolean
  assignedMercenaryIds?: string[]
  status?: 'idle' | 'exploring' | 'combat' | 'completed'
}

export interface MarketListing {
  id: string
  kind: 'material' | 'gear'
  itemId: string
  name: string
  quantity: number
  unitPrice: number
  durationMs: number
  startedAt: number
  completedAt: number
  claimed: boolean
}

export interface GameState {
  gold: number
  fame: number
  gems: number
  materials: Record<MaterialKey, number>
  mercenaries: Mercenary[]
  items: GearItem[]
  candidates: Mercenary[]
  candidateRefreshAt: number
  candidatePaused: boolean
  candidateTimeRemaining: number
  tavernSpeedMultiplier: number
  facilities: FacilityLevels
  marketSlots: number
  marketSpeedMultiplier: number
  marketListings: MarketListing[]
  parties: Party[]
  expeditionSessions: Record<string, import('./expedition').ExpeditionSession>
  unlockedDungeonIndex: number
  dungeonProgress: Record<string, DungeonProgress>
  recentLog: string
  lastSavedAt: number
}

export interface CombatUnit {
  kind: 'ally' | 'enemy'
  combatClass: import('../game/combat/combat.types').CombatClass
  constitution: number
  intelligence: number
  id: string
  name: string
  className?: string
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  atk: number
  def: number
  mdef: number
  dex: number
  threat: number
  heal: number
  crit: number
  evade: number
  hit: number
  mana: number
  regen: number
  lifesteal: number
  flatDamageReduction: number
  initiativePriority: number
  turnRegenerationFlat: number
  turnHpLossRate: number
  criticalMultiplier: number
  missChanceMultiplier: number
  healingMultiplier: number
  skill: SkillDefinition
  stunTurns?: number
  silenceTurns?: number
  tauntTurns?: number
  counterRate?: number
}

export interface BattleState {
  allies: CombatUnit[]
  enemies: CombatUnit[]
  logs: string[]
  structuredLogs?: import('./expedition').ExpeditionLog[]
  round: number
  queue: CombatUnit[]
  activeUnitId: string | null
  hitUnitId: string | null
  result: 'victory' | 'defeat' | null
  finishAt: number
  introQueue?: string[]
}


