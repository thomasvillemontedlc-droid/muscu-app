// Nettoie la saisie brute d'un champ texte numérique : ne garde que les
// chiffres, retire les zéros superflus en tête (ex: "020" -> "20").
export function sanitizeInteger(raw) {
  return raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
}

// Comme sanitizeInteger, mais autorise un seul séparateur décimal (poids en
// kg) — virgule ET point acceptés à la saisie (clavier mobile français vs
// anglais), la virgule est normalisée en point.
export function sanitizeDecimal(raw) {
  let cleaned = raw.replace(/[^\d.,]/g, '').replace(/,/g, '.')
  const firstDot = cleaned.indexOf('.')
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
  }
  return cleaned.replace(/^0+(?=\d)/, '')
}
