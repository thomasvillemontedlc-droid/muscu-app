import { useState } from 'react'
import { getExerciseImageCandidates } from '../lib/exerciseImage.js'

// Illustration d'un exercice si un fichier existe dans public/exercices/
// (essaie .png puis .svg, voir lib/exerciseImage.js), sinon rien du tout
// (pas de placeholder cassé) : impossible de vérifier l'existence des
// fichiers à l'avance côté client, donc on tente chaque extension dans
// l'ordre et on se masque après le dernier échec. Le parent doit passer
// `key={name}` s'il réutilise le même composant pour plusieurs exercices
// (ex. écran de séance guidée) afin de réinitialiser cet état au changement
// d'exercice.
export function ExerciseImage({ name, className }) {
  const candidates = getExerciseImageCandidates(name)
  const [index, setIndex] = useState(0)

  if (index >= candidates.length) return null

  return (
    <img
      src={candidates[index]}
      alt=""
      className={className}
      onError={() => setIndex((i) => i + 1)}
    />
  )
}
