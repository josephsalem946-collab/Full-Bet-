-- =========================================================================
-- FULL BET - STRUCTURE OFFICIELLE BASE DE DONNÉES (POSTGRESQL & MYSQL)
-- Devise: HTG (Gourdes Haïtiennes) | Version: 2.0.0
-- =========================================================================

-- 1. Table Utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100),
    balance NUMERIC(12,2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table Transactions (Dépôts, Retraits, Mises)
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id),
    type VARCHAR(32) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    reference_id VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index optimisé pour calcul de la fenêtre glissante des 24 heures
CREATE INDEX IF NOT EXISTS idx_tx_user_created ON transactions(user_id, created_at DESC);

-- 3. Table Tickets & Fiches (Format FB-XXXX-YYYY)
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(64) PRIMARY KEY,
    ticket_code VARCHAR(32) UNIQUE NOT NULL,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id),
    game_type VARCHAR(50) NOT NULL,
    bet_amount NUMERIC(12,2) NOT NULL,
    odds NUMERIC(10,2) NOT NULL,
    potential_payout NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_code ON tickets(ticket_code);

-- 4. Requête SQL pour vérifier la limite des 15 transactions par 24h
-- SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '24 HOURS';

-- =========================================================================
-- 5. CÔTÉ BASE DE DONNÉES (SQL) : Vue de Sécurité & Masquage
-- =========================================================================
CREATE VIEW IF NOT EXISTS vue_securisee_utilisateurs AS
SELECT 
    id,
    CASE 
        WHEN username = 'Joseph Hollyventz Salem' THEN 'Non renseigné'
        ELSE username 
    END AS username,
    balance,
    created_at
FROM users;

