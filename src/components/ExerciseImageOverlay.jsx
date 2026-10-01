import { ExerciseImage } from './ExerciseImage.jsx'

// Image en plein écran, refermable par la croix ou un tap sur le fond.
// Extrait d'ExerciseImageViewer.jsx pour être réutilisé partout où une
// image/vignette est affichée en petit (sélecteur, écran de repos...), en
// plus du bouton "Voir le mouvement" qui reste propre à l'exercice actif.
export function ExerciseImageOverlay({ name, onClose }) {
  return (
    <div className="exercise-image-viewer__overlay" onClick={onClose}>
      <button
        type="button"
        className="exercise-image-viewer__close"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Fermer"
      >
        ✕
      </button>
      <ExerciseImage name={name} className="exercise-image-viewer__image" />
    </div>
  )
}
