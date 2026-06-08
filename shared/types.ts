// ============================================
// PLAYER
// ============================================

export type SkinType =
  | 'default'
  | 'with_all_due_respect'
  | 'i_am_the_red_flag'
  | 'new_money'
  | 'paparazzi'
  | 'fog_of_war'

export type GrenadeType = 'flashbang' | 'smoke'

export type PlayerState =
  | 'alive'
  | 'downed'
  | 'dead'
  | 'extracted'

export interface Position {
  x: number
  y: number
}

export interface Player {
  id: string
  nostrPubKey: string
  displayName: string
  position: Position
  facing: number
  health: number
  stamina: number
  state: PlayerState
  sats: number
  ammo: {
    current: number
    clips: number
  }
  grenade: GrenadeType | null
  hasKeycard: boolean
  skin: SkinType
  isReviving: boolean
  bleedoutTimer: number | null
  level: number
  nwcConnectionString: string
}

// ============================================
// MATCH
// ============================================

export type MatchPhase =
  | 'waiting'
  | 'starting'
  | 'active'
  | 'raid'
  | 'ended'

export type ExitId = 'center' | 'edge_north' | 'edge_south'

export interface Exit {
  id: ExitId
  position: Position
  isOpen: boolean
}

export interface MatchState {
  matchId: string
  phase: MatchPhase
  players: Record<string, Player>
  npcs: Record<string, NPC>
  caches: Record<string, Cache>
  ammoPickups: Record<string, AmmoPickup>
  keycard: Keycard | null
  exits: Exit[]
  timeRemaining: number
  raidStarted: boolean
  helicopter: Helicopter | null
  totalSatsInPlay: number
}

// ============================================
// LOOT
// ============================================

export type CacheSize = 'small' | 'medium' | 'large' | 'jackpot'
export type CacheState = 'locked' | 'opening' | 'open' | 'looted'

export interface Cache {
  id: string
  position: Position
  size: CacheSize
  satValue: number
  state: CacheState
  openingProgress: number
  openedBy: string | null
  lootedBy: string | null
  requiresKeycard: boolean
}

export interface AmmoPickup {
  id: string
  position: Position
  clips: number
  looted: boolean
}

export interface Keycard {
  id: string
  position: Position
  looted: boolean
  lootedBy: string | null
}

// ============================================
// NPCS
// ============================================

export type NPCType =
  | 'dog_friendly'
  | 'dog_aggressive'
  | 'addict'
  | 'gang_member'
  | 'military_foot'

export type NPCState =
  | 'patrolling'
  | 'idle'
  | 'alert'
  | 'chasing'
  | 'attacking'
  | 'fleeing'
  | 'dead'

export interface NPC {
  id: string
  type: NPCType
  position: Position
  facing: number
  health: number
  state: NPCState
  targetPlayerId: string | null
  patrolPath: Position[]
}

export interface Helicopter {
  position: Position
  angle: number
  spotlightAngle: number
  spotlightActive: boolean
}

// ============================================
// LIGHTNING & ECONOMY
// ============================================

export type PaymentStatus = 'pending' | 'confirmed' | 'failed'
export type PaymentType = 'entry_fee' | 'payout' | 'retry_payout'

export interface Payment {
  id: string
  playerNostrPubKey: string
  amountSats: number
  type: PaymentType
  status: PaymentStatus
  timestamp: Date
  matchId: string
}

export interface FailedPayout {
  id: string
  matchId: string
  playerNostrPubKey: string
  nwcConnectionString: string
  amountSats: number
  reason: string
  attempts: number
  timestamp: Date
  resolved: boolean
  resolvedAt: Date | null
}

// ============================================
// ACHIEVEMENTS & PROGRESSION
// ============================================

export interface Achievement {
  id: string
  achievementKey: string
  name: string
  unlockedAt: Date
  playerNostrPubKey: string
  matchId: string | null
  nostrEventId: string | null
}

export interface PlayerProfile {
  nostrPubKey: string
  displayName: string
  level: number
  levelTitle: string
  xp: number
  totalMatches: number
  totalExtractions: number
  totalKills: number
  totalSatsExtracted: number
  totalRevives: number
  totalBatKills: number
  achievements: Achievement[]
  skins: SkinType[]
  activeSkin: SkinType
  nwcConnectionString: string | null
}

// ============================================
// SOCKET PAYLOADS
// ============================================

export interface JoinMatchPayload {
  matchId: string
  player: {
    nostrPubKey: string
    displayName: string
    nwcConnectionString: string
    skin: SkinType
  }
}

export interface PlayerMovePayload {
  matchId: string
  position: Position
  facing: number
}

export interface PlayerShootPayload {
  matchId: string
  targetId: string
}

export interface GrenadeThrowPayload {
  matchId: string
  position: Position
  grenadeType: GrenadeType
}

export interface OpenCachePayload {
  matchId: string
  cacheId: string
}

export interface LootBodyPayload {
  matchId: string
  targetId: string
}

export interface RevivePayload {
  matchId: string
  targetId: string
}

export interface ExtractPayload {
  matchId: string
  exitId: ExitId
}
