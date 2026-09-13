import { useEffect, useRef, useState } from 'react'
import { NumberField } from './NumberField.jsx'

// Chrono intégré pour les exercices "au temps" (gainage, planche...) : le
// bouton alimente directement le champ en secondes pendant qu'il tourne,
// pour éviter d'avoir à mesurer à part puis retaper la durée. Minutes et
// secondes saisies séparément (mêmes classes .rest-duration-fields que le
// temps de repos dans PrepView.jsx, pour la même affordance) mais `value`/
// `onChange` restent en secondes totales côté appelant : la conversion se
// fait ici, sans rien changer pour ExerciseView.jsx ni SetRow.jsx. Les
// champs restent modifiables à la main quand le chrono est arrêté
// (correction, ou saisie d'une durée déjà connue).
export function DurationField({ value, onChange, className, disabled, 'aria-label': ariaLabel }) {
  const [running, setRunning] = useState(false)
  const startRef = useRef(0)
  const baseRef = useRef(0)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      onChange(baseRef.current + Math.floor((Date.now() - startRef.current) / 1000))
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  function handleStart() {
    baseRef.current = value
    startRef.current = Date.now()
    setRunning(true)
  }

  function handleStop() {
    setRunning(false)
  }

  function handleMinutesChange(minutes) {
    onChange(minutes * 60 + (value % 60))
  }

  function handleSecondsChange(seconds) {
    onChange(Math.floor(value / 60) * 60 + seconds)
  }

  return (
    <div className="duration-field">
      <div className="rest-duration-fields">
        <label className="rest-duration-fields__field">
          <NumberField
            className={className}
            value={Math.floor(value / 60)}
            onChange={handleMinutesChange}
            disabled={disabled || running}
            aria-label={ariaLabel ? `${ariaLabel} (minutes)` : 'Minutes'}
          />
          <span>min</span>
        </label>
        <label className="rest-duration-fields__field">
          <NumberField
            className={className}
            value={value % 60}
            onChange={handleSecondsChange}
            disabled={disabled || running}
            aria-label={ariaLabel ? `${ariaLabel} (secondes)` : 'Secondes'}
          />
          <span>s</span>
        </label>
      </div>
      {running ? (
        <button type="button" className="duration-field__toggle duration-field__toggle--active" onClick={handleStop}>
          ⏸ Arrêter le chrono
        </button>
      ) : (
        <button type="button" className="duration-field__toggle" onClick={handleStart} disabled={disabled}>
          ▶ Démarrer le chrono
        </button>
      )}
    </div>
  )
}
