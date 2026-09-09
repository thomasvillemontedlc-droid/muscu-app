import { DeveloppeCoucheIllustration } from './DeveloppeCouche.jsx'
import { DipsIllustration } from './Dips.jsx'
import { SquatIllustration } from './Squat.jsx'
import { slugify } from '../lib/slugify.js'

// Cle = nom d'exercice normalise (sans accents, minuscule, tirets). Un
// exercice sans entree ici retombe sur le schema generique - voir
// getExerciseIllustration ci-dessous.
const REGISTRY = {
  'developpe-couche': DeveloppeCoucheIllustration,
  dips: DipsIllustration,
  squat: SquatIllustration,
}

// Retourne le composant dedie a cet exercice, ou null s'il n'y en a pas
// (l'appelant decide alors d'afficher le generique ou rien).
export function getExerciseIllustration(exerciseName) {
  return REGISTRY[slugify(exerciseName)] ?? null
}
