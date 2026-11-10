-- =========================================================================
-- 1. CÔTÉ BASE DE DONNÉES (SQL) : Création d'une Vue de Sécurité
-- =========================================================================
CREATE VIEW vue_securisee_utilisateurs AS
SELECT 
    id,
    -- Masquage de l'identité Direction / Super Admin
    CASE 
        WHEN role IN ('ADMIN', 'OWNER') OR email LIKE '%salem%' OR nom LIKE '%Salem%' THEN 'Direction Générale Full Bet'
        ELSE nom 
    END AS nom,
    
    -- Masquage de l'e-mail personnel (Seul fullbet509@gmail.com est autorisé)
    CASE 
        WHEN email = 'fullbet509@gmail.com' THEN 'fullbet509@gmail.com'
        WHEN email LIKE '%salem%' OR email LIKE '%joseph%' THEN 'fullbet509@gmail.com'
        ELSE email 
    END AS email,
    
    -- Masquage systématique des numéros officiels d'administration
    CASE 
        WHEN role IN ('ADMIN', 'OWNER') OR telephone LIKE '%3215%' OR telephone LIKE '%4687%' OR telephone LIKE '%4771%' THEN '+509 •••• ••••'
        ELSE telephone 
    END AS telephone,
    
    -- Nettoyage des textes / mentions sensibles (comme les panneaux admin)
    REPLACE(REPLACE(commentaire, 'panneau admin', '[Panneau masqué]'), 'Panneau Admin', '[Panneau masqué]') AS commentaire

FROM table_utilisateurs;
