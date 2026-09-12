import { useEffect, useState } from 'react'
import { getExerciseImageCandidates } from '../lib/exerciseImage.js'

// Illustration d'un exercice si un fichier existe dans public/exercices/
// (essaie .png puis .svg, voir lib/exerciseImage.js), sinon rien du tout
// (pas de placeholder cassé) : impossible de vérifier l'existence des
// fichiers à l'avance côté client, donc on tente chaque extension dans
// l'ordre et on se masque après le dernier échec. Le parent doit passer
// `key={name}` s'il réutilise le même composant pour plusieurs exercices
// (ex. écran de séance guidée) afin de réinitialiser cet état au changement
// d'exercice. `onAvailabilityChange` (optionnel) est notifié une fois le
// sort de l'image connu : true si une extension a fini par charger, false
// si toutes ont échoué (voir ExerciseImageViewer.jsx, qui s'en sert pour
// savoir s'il doit proposer "Voir le mouvement").
export function ExerciseImage({ name, className, onAvailabilityChange }) {
  const candidates = getExerciseImageCandidates(name)
  const [index, setIndex] = useState(0)
  const exhausted = index >= candidates.length

  useEffect(() => {
    if (exhausted) onAvailabilityChange?.(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exhausted])

  if (exhausted) return null

  return (
    <img
      src={candidates[index]}
      alt=""
      className={className}
      onLoad={() => onAvailabilityChange?.(true)}
      onError={() => setIndex((i) => i + 1)}
    />
  )
}
