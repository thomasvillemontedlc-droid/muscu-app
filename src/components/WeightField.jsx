import { useEffect, useState } from 'react'
import { NumberField } from './NumberField.jsx'

const DEFAULT_BAR_WEIGHT = 20

function computePerSide(total, barWeight) {
  const perSide = (total - barWeight) / 2
  return perSide > 0 ? Math.round(perSide * 10) / 10 : 0
}

function computeTotal(barWeight, perSide) {
  return Math.round((barWeight + perSide * 2) * 10) / 10
}

// Poids total (mode par défaut) ou décomposé barre + poids par côté (mode
// symétrique : barre, haltères, poulies vis-à-vis) — la donnée stockée reste
// toujours le poids TOTAL (comparée dans l'historique), la décomposition
// n'est qu'une aide de saisie. Mode et poids de barre mémorisés par exercice
// (exercise.weightInputMode / exercise.barWeight, voir domain/exercises.js).
export function WeightField({
  exercise,
  value,
  onChange,
  onModeChange,
  onBarWeightChange,
  className,
  'aria-label': ariaLabel,
}) {
  const mode = exercise?.weightInputMode ?? 'total'
  const barWeight = exercise?.barWeight ?? DEFAULT_BAR_WEIGHT
  const [perSide, setPerSide] = useState(() => computePerSide(value, barWeight))

  useEffect(() => {
    setPerSide(computePerSide(value, barWeight))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mode])

  if (mode !== 'perSide') {
    return (
      <div className="weight-field">
        <NumberField className={className} decimal value={value} onChange={onChange} aria-label={ariaLabel} />
        <button type="button" className="weight-field__mode-toggle" onClick={() => onModeChange('perSide')}>
          Saisir par côté
        </button>
      </div>
    )
  }

  function handleBarWeightChange(newBarWeight) {
    onBarWeightChange(newBarWeight)
    onChange(computeTotal(newBarWeight, perSide))
  }

  function handlePerSideChange(newPerSide) {
    setPerSide(newPerSide)
    onChange(computeTotal(barWeight, newPerSide))
  }

  return (
    <div className="weight-field weight-field--per-side">
      <div className="weight-field__row">
        <label>
          <span>Barre (kg)</span>
          <NumberField decimal value={barWeight} onChange={handleBarWeightChange} aria-label="Poids de la barre en kg" />
        </label>
        <label>
          <span>Par côté (kg)</span>
          <NumberField decimal value={perSide} onChange={handlePerSideChange} aria-label="Poids par côté en kg" />
        </label>
      </div>
      <p className="weight-field__total">Total : {computeTotal(barWeight, perSide)}kg</p>
      <button type="button" className="weight-field__mode-toggle" onClick={() => onModeChange('total')}>
        Saisir le poids total
      </button>
    </div>
  )
}
