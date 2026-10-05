-- =========================================================================
-- 1. CÔTÉ BASE DE DONNÉES (SQL) : Création d'une Vue de Sécurité
-- =========================================================================
CREATE VIEW vue_securisee_utilisateurs AS
SELECT 
    id,
    -- Masquage du nom
    CASE 
        WHEN nom = 'Joseph Hollyventz Salem' THEN 'Non renseigné'
        ELSE nom 
    END AS nom,
    
    -- Masquage de l'e-mail
    CASE 
        WHEN email = 'josephsalem946@gmail.com' THEN 'Non renseigné'
        ELSE email 
    END AS email,
    
    -- Masquage des numéros de téléphone
    CASE 
        WHEN telephone IN ('509 46877695', '50946877695', '+50946877695', '+509 4687 7695', '46877695', '4687 7695', '509 32153281', '50932153281', '+50932153281', '+509 3215 3281', '+509 32153281', '32153281', '3215 3281', '509 4771 6289', '+509 4771 6289', '50947716289', '47716289') THEN 'Numéro masqué'
        ELSE telephone 
    END AS telephone,
    
    -- Nettoyage des textes / mentions sensibles (comme les panneaux admin)
    REPLACE(REPLACE(commentaire, 'panneau admin', '[Panneau masqué]'), 'Panneau Admin', '[Panneau masqué]') AS commentaire

FROM table_utilisateurs;
