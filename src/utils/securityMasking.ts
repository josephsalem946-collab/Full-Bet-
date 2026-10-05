// =========================================================================
// 2. CÔTÉ INTERFACE UTILISATEUR / BACKEND (JavaScript / TypeScript)
// =========================================================================

export const DONNEES_A_MASQUER = {
  noms: ["Joseph Hollyventz Salem"],
  emails: ["josephsalem946@gmail.com"],
  telephones: [
    "509 46877695",
    "50946877695",
    "+50946877695",
    "+509 4687 7695",
    "46877695",
    "4687 7695",
    "509 32153281",
    "50932153281",
    "+50932153281",
    "+509 3215 3281",
    "+509 32153281",
    "32153281",
    "3215 3281",
    "509 4771 6289",
    "+509 4771 6289",
    "50947716289",
    "47716289"
  ]
};

export function formaterEtMasquer(valeur: unknown, type: 'telephone' | 'email' | 'nom' | 'texte' = 'texte'): string {
  if (valeur === null || valeur === undefined || valeur === '') return "Non renseigné";
  const valeurStr = String(valeur).trim();

  // Vérification stricte par type
  if (type === 'telephone') {
    if (DONNEES_A_MASQUER.telephones.includes(valeurStr) || /^(?:\+?509)?[0-9\s.-]{8,}$/.test(valeurStr)) {
      return "+509 •••• ••••";
    }
    return "+509 •••• ••••";
  }
  if (type === 'email' && (DONNEES_A_MASQUER.emails.includes(valeurStr) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valeurStr))) return "••••••••@gmail.com";
  if (type === 'nom' && DONNEES_A_MASQUER.noms.includes(valeurStr)) return "Jean-Baptiste Pie...";

  // Nettoyage global par Regex pour tout texte ou description dynamique
  return valeurStr
    .replace(/josephsalem946@gmail\.com/gi, "••••••••@gmail.com")
    .replace(/\+?509[\s.-]*(?:3215[\s.-]*3281|4687[\s.-]*7695|4771[\s.-]*6289)/gi, "+509 •••• ••••")
    .replace(/(\+?509[\s.-]*)?[0-9]{8,}/g, "+509 •••• ••••")
    .replace(/Joseph\s+Hollyventz\s+Salem/gi, "Jean-Baptiste Pie...")
    .replace(/panneau\s+admin(?:istrateur)?/gi, "Panneau Admin (••••••••@gmail.com)")
    .replace(/Panneau\s+Admin(?:istrateur)?/gi, "Panneau Admin (••••••••@gmail.com)");
}

export default formaterEtMasquer;
