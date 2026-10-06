// Nombre affiché à la française : virgule décimale ("7,5"), sans zéros
// superflus (7 reste "7").
export function formatDecimal(value) {
  return String(value ?? 0).replace('.', ',')
}

// Demi-répétitions : arrondi au 0,5 le plus proche (jamais négatif).
export function roundToHalf(value) {
  return Math.max(0, Math.round(value * 2) / 2)
}
