import { getExerciseUnit } from '../domain/muscleGroups.js'
import { formatDecimal, roundToHalf } from '../lib/formatNumber.js'
import { DurationField } from './DurationField.jsx'
import { NumberField } from './NumberField.jsx'
import { WeightField } from './WeightField.jsx'

// Une série sur une seule ligne : libellé | reps | kg | ✕ (en-têtes de
// colonnes une fois pour toute la liste, voir SetRowHeader). Les réglages
// qui valent pour tout l'exercice (saisie par côté, cran, prise) ne sont
// plus répétés sur chaque série : voir ExerciseSettings (WeightField.jsx).
// `label` : lib/formatSet.js#getSetLabel ("Échauffement" ou "Série #n", qui
// compte les séries de travail seulement) ; à défaut, numérotation par
// index. Répétitions par demi (7,5) : saisie décimale arrondie au 0,5.
export function SetRow({
  index,
  label,
  warmup = false,
  weight,
  reps,
  side,
  exercise,
  onChangeWeight,
  onChangeReps,
  onChangeBarWeight,
  onRemove,
  removeDisabled = false,
}) {
  const isTimeBased = getExerciseUnit(exercise?.name) === 'time'
  // Numérotation par paire pour une série unilatérale (droit+gauche =
  // UNE série aux yeux de l'utilisateur), voir domain/sessions.js et
  // lib/formatSet.js#getSetPosition pour la même logique ailleurs.
  const displayLabel =
    label ?? (side ? `Série #${Math.floor(index / 2) + 1} (${side === 'droit' ? 'D' : 'G'})` : `Série #${index + 1}`)

  return (
    <div className={`set-row${warmup ? ' set-row--warmup' : ''}`}>
      <span className="set-row__label">{displayLabel.replace('Série #', 'S')}</span>
      <div className="set-row__field">
        {isTimeBased ? (
          <DurationField
            className="set-row__input"
            value={reps}
            onChange={onChangeReps}
            aria-label={`Durée ${displayLabel}`}
          />
        ) : (
          <NumberField
            className="set-row__input"
            decimal
            normalize={roundToHalf}
            format={formatDecimal}
            value={reps}
            onChange={onChangeReps}
            aria-label={`Répétitions ${displayLabel}`}
          />
        )}
      </div>
      <div className="set-row__field">
        <WeightField
          className="set-row__input"
          exercise={exercise}
          value={weight}
          onChange={onChangeWeight}
          onBarWeightChange={onChangeBarWeight}
          aria-label={`Poids ${displayLabel} (kg)`}
        />
      </div>
      <button
        type="button"
        className="set-row__remove"
        onClick={onRemove}
        disabled={removeDisabled}
        aria-label={`Supprimer : ${displayLabel}`}
        title={removeDisabled ? 'Série en cours, ne peut pas être retirée maintenant' : undefined}
      >
        ✕
      </button>
    </div>
  )
}

// En-têtes de colonnes, une fois au-dessus d'une liste de SetRow.
export function SetRowHeader({ exercise }) {
  const isTimeBased = getExerciseUnit(exercise?.name) === 'time'
  const perSide = (exercise?.weightInputMode ?? 'total') === 'perSide'
  return (
    <div className="set-row set-row--header" aria-hidden="true">
      <span>Série</span>
      <span>{isTimeBased ? 'Durée' : 'Reps'}</span>
      <span>{perSide ? 'Kg par côté' : 'Kg'}</span>
      <span />
    </div>
  )
}
