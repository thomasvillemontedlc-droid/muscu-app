import { useEffect, useRef, useState } from 'react'
import { NumberField } from './NumberField.jsx'

// Chrono intégré pour les exercices "au temps" (gainage, planche...) : le
// bouton alimente directement le champ en secondes pendant qu'il tourne,
// pour éviter d'avoir à mesurer à part puis retaper la durée. Le champ
// reste modifiable à la main quand le chrono est arrêté (correction, ou
// saisie d'une durée déjà connue).
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

  return (
    <div className="duration-field">
      <div className="duration-field__input-row">
        <NumberField
          className={className}
          value={value}
          onChange={onChange}
          disabled={disabled || running}
          aria-label={ariaLabel}
        />
        <span className="duration-field__unit">s</span>
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
