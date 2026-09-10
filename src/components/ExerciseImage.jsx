import { useState } from 'react'
import { getExerciseImagePath } from '../lib/exerciseImage.js'

// Illustration d'un exercice si le fichier existe dans public/exercices/,
// sinon rien du tout (pas de placeholder cassé) : impossible de vérifier
// l'existence du fichier à l'avance côté client, donc on tente le
// chargement et on se masque au premier échec. Le parent doit passer
// `key={name}` s'il réutilise le même composant pour plusieurs exercices
// (ex. écran de séance guidée) afin de réinitialiser cet état au changement
// d'exercice.
export function ExerciseImage({ name, className }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null

  return <img src={getExerciseImagePath(name)} alt="" className={className} onError={() => setFailed(true)} />
}
