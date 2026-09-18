import { useState } from 'react'
import { formatClock } from '../lib/formatClock.js'
import { NumberField } from './NumberField.jsx'

const DEFAULT_CUSTOM_SECONDS = 5

// Affiche le chrono de repos en cours, si actif. N'affiche rien avant la
// toute première série de la séance (aucun repos à décompter).
// `onAdjust` (+15s/-15s, ou le montant personnalisé ci-dessous) modifie le
// temps restant sans réinitialiser le chrono (voir
// domain/sessionRunner.js#adjustRestSeconds) ; reste utilisable pendant le
// dépassement, où il peut d'ailleurs faire revenir le décompte au-dessus de
// zéro.
export function RestBanner({ timer, onAdjust }) {
  // État purement local à ce bandeau (la valeur tapée, pas le repos
  // lui-même) : pas besoin de le faire vivre dans la séance, il repart à sa
  // valeur par défaut à chaque nouveau montage du composant.
  const [customSeconds, setCustomSeconds] = useState(DEFAULT_CUSTOM_SECONDS)

  if (!timer) return null

  function handleCustomSecondsChange(value) {
    // Au moins 1s : un montant à 0 ou négatif rendrait les boutons +/-
    // personnalisés incohérents avec leur propre signe.
    setCustomSeconds(Math.max(1, Math.round(value)))
  }

  return (
    <div className={timer.isOvershoot ? 'rest-timer rest-timer--overshoot' : 'rest-timer'}>
      <div className="rest-timer__row">
        <button
          type="button"
          className="rest-timer__adjust"
          onClick={() => onAdjust(-15)}
          aria-label="Retirer 15 secondes au repos"
        >
          −15s
        </button>
        <span className="rest-timer__clock">
          {timer.isOvershoot ? `+${formatClock(timer.overshootMs)}` : formatClock(timer.remainingMs)}
        </span>
        <button
          type="button"
          className="rest-timer__adjust"
          onClick={() => onAdjust(15)}
          aria-label="Ajouter 15 secondes au repos"
        >
          +15s
        </button>
      </div>

      <div className="rest-timer__custom">
        <button
          type="button"
          className="rest-timer__custom-button"
          onClick={() => onAdjust(-customSeconds)}
          aria-label={`Retirer ${customSeconds} secondes au repos`}
        >
          −
        </button>
        <NumberField
          className="rest-timer__custom-input"
          value={customSeconds}
          onChange={handleCustomSecondsChange}
          aria-label="Nombre de secondes personnalisé"
        />
        <span className="rest-timer__custom-unit">s</span>
        <button
          type="button"
          className="rest-timer__custom-button"
          onClick={() => onAdjust(customSeconds)}
          aria-label={`Ajouter ${customSeconds} secondes au repos`}
        >
          +
        </button>
      </div>
    </div>
  )
}
