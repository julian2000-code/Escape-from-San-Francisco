export const EVENTS = {
  // Client → Server
  JOIN_MATCH:             'join_match',
  PLAYER_MOVE:            'player_move',
  PLAYER_SHOOT:           'player_shoot',
  PLAYER_SWING_BAT:       'player_swing_bat',
  PLAYER_THROW_GRENADE:   'player_throw_grenade',
  OPEN_CACHE:             'open_cache',
  LOOT_BODY:              'loot_body',
  REVIVE_PLAYER:          'revive_player',
  EXTRACT:                'extract',
  RETRY_PAYOUT:           'retry_payout',

  // Server → Client
  MATCH_STATE:            'match_state',
  MATCH_DELTA:            'match_delta',
  PLAYER_JOINED:          'player_joined',
  PLAYER_DIED:            'player_died',
  PLAYER_DOWNED:          'player_downed',
  PLAYER_REVIVED:         'player_revived',
  PLAYER_EXTRACTED:       'player_extracted',
  CACHE_OPENED:           'cache_opened',
  CACHE_LOOTED:           'cache_looted',
  BODY_LOOTED:            'body_looted',
  ACHIEVEMENT_UNLOCKED:   'achievement_unlocked',
  SKIN_UNLOCKED:          'skin_unlocked',
  PAYOUT_SUCCESS:         'payout_success',
  PAYOUT_FAILED:          'payout_failed',
  MATCH_ENDED:            'match_ended',
  RAID_STARTED:           'raid_started',
  ENTRY_INVOICE:          'entry_invoice',
  ENTRY_CONFIRMED:        'entry_confirmed',
  ENTRY_FAILED:           'entry_failed',
  LEVEL_UP:               'level_up',
} as const

export type EventName = typeof EVENTS[keyof typeof EVENTS]
