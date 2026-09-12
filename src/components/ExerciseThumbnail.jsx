import { useState } from 'react'
import { getExerciseImageCandidates } from '../lib/exerciseImage.js'

// Vignette carrée pour le sélecteur d'exercice. Nos illustrations (voir
// ExerciseImage.jsx) suivent toutes le même gabarit généré : bandeau de
// titre en haut, figure "position de départ" en haut à gauche, figure
// "position finale" à droite, puis 4 vignettes de détail en bas — un simple
// redimensionnement en 36x36 les rend illisibles (tout le texte est encore
// là, juste minuscule). On zoome donc en CSS sur le coin supérieur gauche
// (juste la figure de départ, sans le texte) via background-image, plutôt
// que de générer et maintenir un fichier de vignette séparé par exercice.
// Comme pour ExerciseImage, essaie chaque extension candidate dans l'ordre
// et se masque si aucune ne charge (voir lib/exerciseImage.js).
export function ExerciseThumbnail({ name, className }) {
  const candidates = getExerciseImageCandidates(name)
  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)

  if (index >= candidates.length) return null

  return (
    <span
      className={className}
      style={loaded ? { backgroundImage: `url(${candidates[index]})` } : undefined}
    >
      <img src={candidates[index]} alt="" hidden onLoad={() => setLoaded(true)} onError={() => setIndex((i) => i + 1)} />
    </span>
  )
}
