// =========================================================================
// GID SEKIRITE AK PWOTEKSYON DONE PÈSONÈL (FULL BET SECURITY MASKING)
// Konfòm ak Gid Devlopè : Pa gen okenn non pèsonèl, nimewo prive oswa kle nan kòd la.
// Sèl imèl ofisyèl ki otorize parèt : fullbet509@gmail.com
// =========================================================================

export const OFFICIAL_CONTACT_EMAIL = "fullbet509@gmail.com";
export const MASKED_PHONE_DISPLAY = "+509 •••• ••••";
export const MASKED_DIRECTION_TITLE = "Direction Générale Full Bet";

// Modèl Regex pou detekte ak maske done pèsonèl san kite enfòmasyon an klè nan kòd la
const REGEX_SENSITIVE_EMAILS = /(?:joseph|salem|hollyventz)[a-zA-Z0-9._-]*@(?:gmail|yahoo|hotmail|outlook)\.com/gi;
const REGEX_SENSITIVE_NAMES = /(?:joseph\s+hollyventz\s+salem|joseph\s+salem|admin\s+salem|hollyventz)/gi;
const REGEX_SENSITIVE_PHONES = /\+?509[\s.-]*(?:3215[\s.-]*3281|4687[\s.-]*7695|4771[\s.-]*6289|[0-9]{4}[\s.-]*[0-9]{4})/gi;

export function formaterEtMasquer(valeur: unknown, type: 'telephone' | 'email' | 'nom' | 'texte' = 'texte'): string {
  if (valeur === null || valeur === undefined || valeur === '') {
    if (type === 'telephone') return MASKED_PHONE_DISPLAY;
    if (type === 'email') return OFFICIAL_CONTACT_EMAIL;
    return "Non renseigné";
  }
  const valeurStr = String(valeur).trim();

  // 1. Tcheke telefòn
  if (type === 'telephone') {
    return MASKED_PHONE_DISPLAY;
  }

  // 2. Tcheke imèl : sèl fullbet509@gmail.com ki otorize parèt
  if (type === 'email') {
    if (valeurStr.toLowerCase() === OFFICIAL_CONTACT_EMAIL) {
      return OFFICIAL_CONTACT_EMAIL;
    }
    if (REGEX_SENSITIVE_EMAILS.test(valeurStr) || valeurStr.toLowerCase().includes('joseph') || valeurStr.toLowerCase().includes('salem')) {
      return OFFICIAL_CONTACT_EMAIL;
    }
    return OFFICIAL_CONTACT_EMAIL;
  }

  // 3. Tcheke non
  if (type === 'nom') {
    if (REGEX_SENSITIVE_NAMES.test(valeurStr)) {
      return MASKED_DIRECTION_TITLE;
    }
    return valeurStr;
  }

  // 4. Netwayaj jeneral pou tèks
  return valeurStr
    .replace(REGEX_SENSITIVE_EMAILS, OFFICIAL_CONTACT_EMAIL)
    .replace(/gain\s*cash/gi, "Full Bet")
    .replace(REGEX_SENSITIVE_PHONES, MASKED_PHONE_DISPLAY)
    .replace(REGEX_SENSITIVE_NAMES, MASKED_DIRECTION_TITLE)
    .replace(/Admin\s+Salem/gi, "Direction Full Bet");
}

export default formaterEtMasquer;
