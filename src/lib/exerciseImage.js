import { slugify } from './slugify.js'

// PNG en priorité (illustrations générées, format courant désormais), SVG en
// repli pour les exercices pas encore ré-illustrés en PNG.
const EXTENSIONS = ['png', 'svg']

// Chemins candidats de l'illustration d'un exercice, dérivés automatiquement
// de son nom (public/exercices/<nom-slugifié>.<ext>) : aucune correspondance
// à tenir à jour dans le code, déposer un fichier dans ce dossier suffit. On
// ne peut pas vérifier l'existence des fichiers à l'avance côté client — le
// composant qui affiche l'image (voir components/ExerciseImage.jsx) essaie
// chaque extension dans l'ordre et se masque si aucune ne charge.
export function getExerciseImageCandidates(exerciseName) {
  const slug = slugify(exerciseName)
  return EXTENSIONS.map((ext) => `${import.meta.env.BASE_URL}exercices/${slug}.${ext}`)
}
