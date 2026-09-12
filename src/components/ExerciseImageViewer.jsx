import { useState } from 'react'
import { ExerciseImage } from './ExerciseImage.jsx'

// Pendant une série active, l'illustration reste masquée par défaut (pour
// laisser la place au tableau comparatif et à la saisie) : un bouton "Voir
// le mouvement" l'ouvre en plein écran pour bien voir les détails
// techniques, refermable par la croix ou un tap sur le fond. Une instance
// masquée d'ExerciseImage précharge l'image en tâche de fond pour savoir si
// elle existe (voir ExerciseImage.jsx#onAvailabilityChange) : le bouton ne
// s'affiche que si oui, comme l'ancien affichage direct ne montrait rien du
// tout en son absence.
export function ExerciseImageViewer({ name }) {
  const [available, setAvailable] = useState(false)
  const [open, setOpen] = useState(false)

  return (
    <>
      <div hidden>
        <ExerciseImage name={name} onAvailabilityChange={setAvailable} />
      </div>

      {available && (
        <button type="button" className="exercise-image-viewer__trigger" onClick={() => setOpen(true)}>
          Voir le mouvement
        </button>
      )}

      {open && (
        <div className="exercise-image-viewer__overlay" onClick={() => setOpen(false)}>
          <button
            type="button"
            className="exercise-image-viewer__close"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
            }}
            aria-label="Fermer"
          >
            ✕
          </button>
          <ExerciseImage name={name} className="exercise-image-viewer__image" />
        </div>
      )}
    </>
  )
}
