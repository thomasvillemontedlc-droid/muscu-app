// Nom d'exercice -> clé stable (sans accents, minuscule, tirets), utilisée
// pour retrouver l'illustration et les muscles associés à un exercice sans
// dépendre de la casse ou des accents saisis par l'utilisateur.
export function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // retire les accents
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
