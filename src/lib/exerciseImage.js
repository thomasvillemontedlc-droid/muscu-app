import { slugify } from './slugify.js'

// WebP en priorité (format final après compression automatique, voir
// scripts/compress-exercise-images.mjs) ; .png en repli pour une image tout
// juste déposée avant qu'un build/dev n'ait eu l'occasion de la compresser ;
// .svg en dernier repli pour un schéma vectoriel fait à la main. Le support
// WebP est universel sur les navigateurs actuels (Safari inclus depuis
// 2020) : pas besoin d'un vrai PNG de secours en production.
const EXTENSIONS = ['webp', 'png', 'svg']

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
