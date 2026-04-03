import pkg from 'pg';
const { Pool } = pkg;
import Redis from 'ioredis';
import env from './env.js';

let pgPool = null;
let redis = null;

// Initialize PostgreSQL Pool
if (env.postgresUrl) {
  pgPool = new Pool({
    connectionString: env.postgresUrl,
    ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
  });

  pgPool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
  });
} else {
  console.warn('POSTGRES_URL not provided. PostgreSQL features will be unavailable.');
}

// Initialize Redis Client
if (env.redisUrl) {
  redis = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  redis.on('error', () => {
    // Silently ignore all Redis errors in development
    // In production, errors are handled by logging infrastructure
  });
} else {
  // No Redis URL - create dummy client that does nothing
  redis = null;
  console.warn('REDIS_URL not provided. Redis features will be unavailable.');
}

// Table Initialization (Ultra Production)
export const initDB = async () => {
  if (!pgPool) return;

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    // Wallets Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        user_id TEXT PRIMARY KEY,
        balance NUMERIC DEFAULT 0,
        pending NUMERIC DEFAULT 0,
        withdrawable NUMERIC DEFAULT 0,
        total_earned NUMERIC DEFAULT 0,
        currency TEXT DEFAULT 'INR',
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Transactions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        order_id TEXT,
        type TEXT NOT NULL, -- earning, refund, withdrawal, deposit
        category TEXT, -- order, bonus, referral
        amount NUMERIC NOT NULL,
        status TEXT DEFAULT 'pending', -- pending, completed, failed, cancelled
        meta JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Pending Releases Table (Firestore Migration)
    await client.query(`
      CREATE TABLE IF NOT EXISTS pending_releases (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        order_id TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        status TEXT DEFAULT 'pending',
        available_at TIMESTAMP NOT NULL,
        released_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Indices
    await client.query('CREATE INDEX IF NOT EXISTS idx_tx_user_id ON transactions(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_tx_order_id ON transactions(order_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_release_user_id ON pending_releases(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_release_available_at ON pending_releases(available_at);');

    await client.query('COMMIT');
    console.log('PostgreSQL financial tables initialized.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to initialize PostgreSQL tables:', err);
  } finally {
    client.release();
  }
};

export { pgPool, redis };
