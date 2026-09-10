import { slugify } from './slugify.js'

// Chemin de l'illustration d'un exercice, dérivé automatiquement de son nom
// (public/exercices/<nom-slugifié>.svg) : aucune correspondance à tenir à
// jour dans le code, déposer un fichier dans ce dossier suffit. On ne peut
// pas vérifier l'existence du fichier à l'avance côté client — le composant
// qui affiche l'image (voir components/ExerciseImage.jsx) doit se masquer
// lui-même si le chargement échoue.
export function getExerciseImagePath(exerciseName) {
  return `${import.meta.env.BASE_URL}exercices/${slugify(exerciseName)}.svg`
}
