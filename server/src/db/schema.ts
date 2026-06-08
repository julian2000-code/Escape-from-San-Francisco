import Database from 'better-sqlite3'
import { config } from '../../../config/environment'

export function initializeDatabase(db: Database.Database): void {

  db.exec(`
    -- ============================================
    -- PLAYERS
    -- ============================================
    CREATE TABLE IF NOT EXISTS players (
      id                    TEXT PRIMARY KEY,
      display_name          TEXT NOT NULL,
      nwc_connection_string TEXT,
      level                 INTEGER DEFAULT 1,
      xp                    INTEGER DEFAULT 0,

      total_matches         INTEGER DEFAULT 0,
      total_extractions     INTEGER DEFAULT 0,
      total_kills           INTEGER DEFAULT 0,
      total_bat_kills       INTEGER DEFAULT 0,
      total_revives         INTEGER DEFAULT 0,
      total_sats_extracted  INTEGER DEFAULT 0,
      total_sats_lost       INTEGER DEFAULT 0,

      pending_sats          INTEGER DEFAULT 0,
      active_skin           TEXT DEFAULT 'default',

      created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen_at          DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ============================================
    -- MATCHES
    -- ============================================
    CREATE TABLE IF NOT EXISTS matches (
      id              TEXT PRIMARY KEY,
      phase           TEXT NOT NULL DEFAULT 'waiting',
      total_sats      INTEGER NOT NULL DEFAULT 0,
      player_count    INTEGER NOT NULL DEFAULT 0,
      started_at      DATETIME,
      ended_at        DATETIME,
      winner_ids      TEXT,
      unclaimed_sats  INTEGER DEFAULT 0,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ============================================
    -- MATCH PLAYERS
    -- ============================================
    CREATE TABLE IF NOT EXISTS match_players (
      id                TEXT PRIMARY KEY,
      match_id          TEXT NOT NULL REFERENCES matches(id),
      player_id         TEXT NOT NULL REFERENCES players(id),

      entry_paid        INTEGER DEFAULT 0,
      entry_tx_id       TEXT,

      outcome           TEXT,
      sats_extracted    INTEGER DEFAULT 0,
      sats_lost         INTEGER DEFAULT 0,
      kills             INTEGER DEFAULT 0,
      deaths            INTEGER DEFAULT 0,
      revives_given     INTEGER DEFAULT 0,
      revives_received  INTEGER DEFAULT 0,

      payout_sent       INTEGER DEFAULT 0,
      payout_tx_id      TEXT,
      payout_amount     INTEGER DEFAULT 0,

      created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ============================================
    -- ACHIEVEMENTS
    -- ============================================
    CREATE TABLE IF NOT EXISTS achievements (
      id                TEXT PRIMARY KEY,
      player_id         TEXT NOT NULL REFERENCES players(id),
      achievement_key   TEXT NOT NULL,
      match_id          TEXT REFERENCES matches(id),
      nostr_event_id    TEXT,
      nostr_published   INTEGER DEFAULT 0,
      unlocked_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(player_id, achievement_key)
    );

    -- ============================================
    -- SKINS
    -- ============================================
    CREATE TABLE IF NOT EXISTS player_skins (
      id              TEXT PRIMARY KEY,
      player_id       TEXT NOT NULL REFERENCES players(id),
      skin_key        TEXT NOT NULL,
      owner_nostr_id  TEXT NOT NULL REFERENCES players(id),
      is_for_sale     INTEGER DEFAULT 0,
      sale_price_sats INTEGER,
      earned_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(player_id, skin_key)
    );

    -- ============================================
    -- PAYMENTS
    -- ============================================
    CREATE TABLE IF NOT EXISTS payments (
      id              TEXT PRIMARY KEY,
      player_id       TEXT NOT NULL REFERENCES players(id),
      match_id        TEXT REFERENCES matches(id),
      type            TEXT NOT NULL,
      amount_sats     INTEGER NOT NULL,
      status          TEXT NOT NULL DEFAULT 'pending',
      invoice         TEXT,
      payment_hash    TEXT,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      confirmed_at    DATETIME
    );

    -- ============================================
    -- FAILED PAYOUTS — never deleted
    -- ============================================
    CREATE TABLE IF NOT EXISTS failed_payouts (
      id                      TEXT PRIMARY KEY,
      match_id                TEXT NOT NULL REFERENCES matches(id),
      player_id               TEXT NOT NULL REFERENCES players(id),
      nwc_connection_string   TEXT NOT NULL,
      amount_sats             INTEGER NOT NULL,
      reason                  TEXT NOT NULL,
      attempts                INTEGER DEFAULT 1,
      resolved                INTEGER DEFAULT 0,
      resolved_at             DATETIME,
      resolved_tx_id          TEXT,
      created_at              DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ============================================
    -- NPC EVENTS
    -- ============================================
    CREATE TABLE IF NOT EXISTS npc_events (
      id          TEXT PRIMARY KEY,
      match_id    TEXT NOT NULL REFERENCES matches(id),
      player_id   TEXT NOT NULL REFERENCES players(id),
      event_type  TEXT NOT NULL,
      npc_type    TEXT NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ============================================
    -- INDEXES
    -- ============================================
    CREATE INDEX IF NOT EXISTS idx_match_players_match    ON match_players(match_id);
    CREATE INDEX IF NOT EXISTS idx_match_players_player   ON match_players(player_id);
    CREATE INDEX IF NOT EXISTS idx_achievements_player    ON achievements(player_id);
    CREATE INDEX IF NOT EXISTS idx_payments_player        ON payments(player_id);
    CREATE INDEX IF NOT EXISTS idx_payments_match         ON payments(match_id);
    CREATE INDEX IF NOT EXISTS idx_failed_payouts_player  ON failed_payouts(player_id);
    CREATE INDEX IF NOT EXISTS idx_failed_payouts_resolved ON failed_payouts(resolved);
    CREATE INDEX IF NOT EXISTS idx_player_skins_player    ON player_skins(player_id);
    CREATE INDEX IF NOT EXISTS idx_npc_events_match       ON npc_events(match_id);
  `)

  console.log('Database schema initialized')
}
