import { db } from './connection'
import { v4 as uuidv4 } from 'uuid'

// ============================================
// PLAYERS
// ============================================

export const PlayerQueries = {

  findById(id: string) {
    return db.prepare('SELECT * FROM players WHERE id = ?').get(id) as any
  },

  findOrCreate(id: string, displayName: string, nwcConnectionString: string) {
    const existing = this.findById(id)
    if (existing) {
      // Update last seen and NWC string
      db.prepare(`
        UPDATE players
        SET last_seen_at = CURRENT_TIMESTAMP,
            nwc_connection_string = ?,
            display_name = ?
        WHERE id = ?
      `).run(nwcConnectionString, displayName, id)
      return this.findById(id)
    }

    db.prepare(`
      INSERT INTO players (id, display_name, nwc_connection_string)
      VALUES (?, ?, ?)
    `).run(id, displayName, nwcConnectionString)

    return this.findById(id)
  },

  updateStats(id: string, stats: {
    kills?: number
    batKills?: number
    deaths?: number
    revives?: number
    satsExtracted?: number
    satsLost?: number
    extractions?: number
  }) {
    const updates: string[] = []
    const values: any[] = []

    if (stats.kills)         { updates.push('total_kills = total_kills + ?');                values.push(stats.kills) }
    if (stats.batKills)      { updates.push('total_bat_kills = total_bat_kills + ?');         values.push(stats.batKills) }
    if (stats.deaths)        { updates.push('total_matches = total_matches + ?');             values.push(stats.deaths) }
    if (stats.revives)       { updates.push('total_revives = total_revives + ?');             values.push(stats.revives) }
    if (stats.satsExtracted) { updates.push('total_sats_extracted = total_sats_extracted + ?'); values.push(stats.satsExtracted) }
    if (stats.satsLost)      { updates.push('total_sats_lost = total_sats_lost + ?');         values.push(stats.satsLost) }
    if (stats.extractions)   { updates.push('total_extractions = total_extractions + ?');     values.push(stats.extractions) }

    if (updates.length === 0) return
    values.push(id)

    db.prepare(`UPDATE players SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  },

  addXP(id: string, xp: number): number {
    db.prepare('UPDATE players SET xp = xp + ? WHERE id = ?').run(xp, id)
    const player = this.findById(id)
    return player.xp
  },

  updateLevel(id: string, level: number) {
    db.prepare('UPDATE players SET level = ? WHERE id = ?').run(level, id)
  },

  updateSkin(id: string, skin: string) {
    db.prepare('UPDATE players SET active_skin = ? WHERE id = ?').run(skin, id)
  },

  getAchievements(playerId: string) {
    return db.prepare('SELECT * FROM achievements WHERE player_id = ?').all(playerId) as any[]
  },

  getSkins(playerId: string) {
    return db.prepare('SELECT * FROM player_skins WHERE player_id = ?').all(playerId) as any[]
  },
}

// ============================================
// MATCHES
// ============================================

export const MatchQueries = {

  create(id: string) {
    db.prepare(`
      INSERT INTO matches (id, phase, total_sats, player_count)
      VALUES (?, 'waiting', 0, 0)
    `).run(id)
    return this.findById(id)
  },

  findById(id: string) {
    return db.prepare('SELECT * FROM matches WHERE id = ?').get(id) as any
  },

  updatePhase(id: string, phase: string) {
    db.prepare('UPDATE matches SET phase = ? WHERE id = ?').run(phase, id)
  },

  updateOnStart(id: string, playerCount: number, totalSats: number) {
    db.prepare(`
      UPDATE matches
      SET phase = 'active',
          player_count = ?,
          total_sats = ?,
          started_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(playerCount, totalSats, id)
  },

  updateOnEnd(id: string, winnerIds: string[], unclaimedSats: number) {
    db.prepare(`
      UPDATE matches
      SET phase = 'ended',
          ended_at = CURRENT_TIMESTAMP,
          winner_ids = ?,
          unclaimed_sats = ?
      WHERE id = ?
    `).run(JSON.stringify(winnerIds), unclaimedSats, id)
  },

  addPlayer(matchId: string, playerId: string) {
    db.prepare(`
      INSERT INTO match_players (id, match_id, player_id)
      VALUES (?, ?, ?)
    `).run(uuidv4(), matchId, playerId)
  },

  updatePlayerOutcome(matchId: string, playerId: string, outcome: {
    outcome: string
    satsExtracted?: number
    satsLost?: number
    kills?: number
    deaths?: number
    revivesGiven?: number
    revivesReceived?: number
  }) {
    db.prepare(`
      UPDATE match_players
      SET outcome = ?,
          sats_extracted = ?,
          sats_lost = ?,
          kills = ?,
          deaths = ?,
          revives_given = ?,
          revives_received = ?
      WHERE match_id = ? AND player_id = ?
    `).run(
      outcome.outcome,
      outcome.satsExtracted || 0,
      outcome.satsLost || 0,
      outcome.kills || 0,
      outcome.deaths || 0,
      outcome.revivesGiven || 0,
      outcome.revivesReceived || 0,
      matchId,
      playerId
    )
  },

  markEntryPaid(matchId: string, playerId: string, txId: string) {
    db.prepare(`
      UPDATE match_players
      SET entry_paid = 1, entry_tx_id = ?
      WHERE match_id = ? AND player_id = ?
    `).run(txId, matchId, playerId)
  },

  markPayoutSent(matchId: string, playerId: string, txId: string, amount: number) {
    db.prepare(`
      UPDATE match_players
      SET payout_sent = 1, payout_tx_id = ?, payout_amount = ?
      WHERE match_id = ? AND player_id = ?
    `).run(txId, amount, matchId, playerId)
  },
}

// ============================================
// ACHIEVEMENTS
// ============================================

export const AchievementQueries = {

  hasAchievement(playerId: string, achievementKey: string): boolean {
    const result = db.prepare(`
      SELECT id FROM achievements
      WHERE player_id = ? AND achievement_key = ?
    `).get(playerId, achievementKey)
    return !!result
  },

  award(playerId: string, achievementKey: string, matchId: string | null) {
    const id = uuidv4()
    db.prepare(`
      INSERT OR IGNORE INTO achievements (id, player_id, achievement_key, match_id)
      VALUES (?, ?, ?, ?)
    `).run(id, playerId, achievementKey, matchId)
    return id
  },

  updateNostrEvent(achievementId: string, nostrEventId: string) {
    db.prepare(`
      UPDATE achievements
      SET nostr_event_id = ?, nostr_published = 1
      WHERE id = ?
    `).run(nostrEventId, achievementId)
  },

  getAll(playerId: string) {
    return db.prepare(`
      SELECT * FROM achievements WHERE player_id = ? ORDER BY unlocked_at DESC
    `).all(playerId) as any[]
  },
}

// ============================================
// SKINS
// ============================================

export const SkinQueries = {

  hasSkin(playerId: string, skinKey: string): boolean {
    const result = db.prepare(`
      SELECT id FROM player_skins WHERE player_id = ? AND skin_key = ?
    `).get(playerId, skinKey)
    return !!result
  },

  award(playerId: string, skinKey: string) {
    db.prepare(`
      INSERT OR IGNORE INTO player_skins (id, player_id, skin_key, owner_nostr_id)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), playerId, skinKey, playerId)
  },

  getAll(playerId: string) {
    return db.prepare(`
      SELECT * FROM player_skins WHERE player_id = ?
    `).all(playerId) as any[]
  },
}

// ============================================
// PAYMENTS
// ============================================

export const PaymentQueries = {

  create(data: {
    id: string
    playerId: string
    matchId: string | null
    type: string
    amountSats: number
    status: string
    invoice?: string
    paymentHash?: string
  }) {
    db.prepare(`
      INSERT INTO payments (id, player_id, match_id, type, amount_sats, status, invoice, payment_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.id,
      data.playerId,
      data.matchId,
      data.type,
      data.amountSats,
      data.status,
      data.invoice || null,
      data.paymentHash || null
    )
  },

  confirm(id: string, paymentHash?: string) {
    db.prepare(`
      UPDATE payments
      SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP, payment_hash = ?
      WHERE id = ?
    `).run(paymentHash || null, id)
  },

  fail(id: string) {
    db.prepare(`UPDATE payments SET status = 'failed' WHERE id = ?`).run(id)
  },
}

// ============================================
// FAILED PAYOUTS
// ============================================

export const FailedPayoutQueries = {

  create(data: {
    matchId: string
    playerId: string
    nwcConnectionString: string
    amountSats: number
    reason: string
  }) {
    const id = uuidv4()
    db.prepare(`
      INSERT INTO failed_payouts (id, match_id, player_id, nwc_connection_string, amount_sats, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.matchId, data.playerId, data.nwcConnectionString, data.amountSats, data.reason)
    return id
  },

  findById(id: string) {
    return db.prepare('SELECT * FROM failed_payouts WHERE id = ?').get(id) as any
  },

  getAllUnresolved() {
    return db.prepare(`
      SELECT fp.*, p.display_name
      FROM failed_payouts fp
      JOIN players p ON p.id = fp.player_id
      WHERE fp.resolved = 0
      ORDER BY fp.created_at ASC
    `).all() as any[]
  },

  incrementAttempts(id: string) {
    db.prepare(`
      UPDATE failed_payouts SET attempts = attempts + 1 WHERE id = ?
    `).run(id)
  },

  resolve(id: string, txId: string) {
    db.prepare(`
      UPDATE failed_payouts
      SET resolved = 1, resolved_at = CURRENT_TIMESTAMP, resolved_tx_id = ?
      WHERE id = ?
    `).run(txId, id)
  },
}

// ============================================
// NPC EVENTS
// ============================================

export const NPCEventQueries = {

  log(matchId: string, playerId: string, eventType: string, npcType: string) {
    db.prepare(`
      INSERT INTO npc_events (id, match_id, player_id, event_type, npc_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), matchId, playerId, eventType, npcType)
  },

  getForMatch(matchId: string) {
    return db.prepare(`
      SELECT * FROM npc_events WHERE match_id = ?
    `).all(matchId) as any[]
  },
}
