import { DeveloppeCoucheIllustration } from './DeveloppeCouche.jsx'
import { DipsIllustration } from './Dips.jsx'
import { SquatIllustration } from './Squat.jsx'

// Cle = nom d'exercice normalise (sans accents, minuscule, tirets). Un
// exercice sans entree ici retombe sur le schema generique - voir
// getExerciseIllustration ci-dessous.
const REGISTRY = {
  'developpe-couche': DeveloppeCoucheIllustration,
  dips: DipsIllustration,
  squat: SquatIllustration,
}

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Retourne le composant dedie a cet exercice, ou null s'il n'y en a pas
// (l'appelant decide alors d'afficher le generique ou rien).
export function getExerciseIllustration(exerciseName) {
  return REGISTRY[slugify(exerciseName)] ?? null
}
