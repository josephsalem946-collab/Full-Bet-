/**
 * FULL BET - Multi-Database Connectors Blueprint
 * Configuration pour PostgreSQL, MySQL, MongoDB et SQLite
 * Environnement: DB_TYPE=postgres | mysql | mongodb | sqlite
 */

export interface DbConfig {
  dbType: 'postgres' | 'mysql' | 'mongodb' | 'sqlite';
  connectionUrl?: string;
  host?: string;
  user?: string;
  password?: string;
  database?: string;
}

export const CURRENT_DB_CONFIG: DbConfig = {
  dbType: (process.env.DB_TYPE as any) || 'postgres',
  connectionUrl: process.env.DATABASE_URL || 'postgresql://fullbet_user:SecretPassword123@localhost:5432/fullbet_db',
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'fullbet_user',
  password: process.env.DB_PASSWORD || 'SecretPassword123',
  database: process.env.DB_NAME || 'fullbet_db'
};

/**
 * SQL queries for transaction limit enforcement and ticket management
 */
export const SQL_QUERIES = {
  // Check sliding 24-hour transaction count
  countTransactions24h: `
    SELECT COUNT(*) AS tx_count
    FROM transactions
    WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '24 HOURS';
  `,

  // Get earliest transaction within the 24-hour window
  getEarliestTxIn24h: `
    SELECT created_at
    FROM transactions
    WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '24 HOURS'
    ORDER BY created_at ASC
    LIMIT 1;
  `,

  // Insert ticket
  insertTicket: `
    INSERT INTO tickets (id, ticket_code, user_id, game_type, bet_amount, odds, potential_payout, status, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING *;
  `,

  // Verify ticket
  verifyTicketByCode: `
    SELECT id, ticket_code, user_id, game_type, bet_amount, odds, potential_payout, status, created_at
    FROM tickets
    WHERE ticket_code = $1;
  `
};

/**
 * Helper to calculate potential payout capped at 1,000,000 HTG
 * and odds capped at 50,000.00
 */
export function calculatePayout(stake: number, requestedOdds: number): { appliedOdds: number; potentialPayout: number } {
  const appliedOdds = Math.min(requestedOdds, 50000);
  const potentialPayout = Math.min(stake * appliedOdds, 1000000);
  return { appliedOdds, potentialPayout };
}
