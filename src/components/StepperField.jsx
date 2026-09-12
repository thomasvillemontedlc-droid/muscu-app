import { useState } from 'react'
import { NumberField } from './NumberField.jsx'

function roundToStep(value) {
  // Évite les artefacts de virgule flottante (0.1 + 0.2 ...) sur des pas
  // décimaux comme 2.5kg.
  return Math.round(value * 100) / 100
}

// Gros boutons +/- de part et d'autre de la valeur (usage une main pendant
// une série), qui se change en champ clavier normal le temps de taper un
// chiffre : un tap sur la valeur affichée ouvre la saisie, la perte de
// focus (ou Entrée) revient à l'affichage +/-.
export function StepperField({ value, onChange, step = 1, min = 0, decimal = false, className, disabled, 'aria-label': ariaLabel }) {
  const [editing, setEditing] = useState(false)

  function handleDecrement() {
    onChange(Math.max(min, roundToStep(value - step)))
  }

  function handleIncrement() {
    onChange(roundToStep(value + step))
  }

  if (editing) {
    return (
      <div
        className="stepper-field stepper-field--editing"
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.querySelector('input')?.blur()
        }}
      >
        <NumberField
          className={className}
          decimal={decimal}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoFocus
          aria-label={ariaLabel}
        />
      </div>
    )
  }

  return (
    <div className="stepper-field">
      <button
        type="button"
        className="stepper-field__button"
        onClick={handleDecrement}
        disabled={disabled}
        aria-label={`Diminuer${ariaLabel ? ` : ${ariaLabel}` : ''}`}
      >
        −
      </button>
      <button
        type="button"
        className={`stepper-field__value ${className ?? ''}`}
        onClick={() => setEditing(true)}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        {value}
      </button>
      <button
        type="button"
        className="stepper-field__button"
        onClick={handleIncrement}
        disabled={disabled}
        aria-label={`Augmenter${ariaLabel ? ` : ${ariaLabel}` : ''}`}
      >
        +
      </button>
    </div>
  )
}
