import dotenv from 'dotenv'
dotenv.config()

type Environment = 'local' | 'ngrok' | 'railway'
type LightningMode = 'fake' | 'real'

const env = process.env.NODE_ENV as Environment || 'local'

const serverUrls: Record<Environment, string> = {
  local:   `http://localhost:${process.env.PORT || 3000}`,
  ngrok:   process.env.NGROK_URL || '',
  railway: process.env.RAILWAY_URL || '',
}

export const config = {
  environment: env,
  port: parseInt(process.env.PORT || '3000'),
  serverUrl: serverUrls[env],

  // One line to switch local → ngrok → railway
  clientUrl: serverUrls[env],

  // One line to switch fake → real lightning
  lightningMode: (process.env.LIGHTNING_MODE as LightningMode) || 'fake',

  database: {
    // Empty = use SQLite locally, filled = use PostgreSQL on Railway
    url: process.env.DATABASE_URL || '',
    sqlitePath: './escape-from-sf.db',
  },

  nostr: {
    relayUrl: process.env.RELAY_URL || 'wss://relay.damus.io',
    gamePrivateKey: process.env.NOSTR_GAME_PRIVATE_KEY || '',
  },

  lnbits: {
    url: process.env.LNBITS_URL || '',
    apiKey: process.env.LNBITS_API_KEY || '',
  },

  isLocal:   env === 'local',
  isNgrok:   env === 'ngrok',
  isRailway: env === 'railway',
  isFakeLightning: process.env.LIGHTNING_MODE !== 'real',
}
