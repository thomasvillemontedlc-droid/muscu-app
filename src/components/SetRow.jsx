import { getExerciseUnit } from '../domain/muscleGroups.js'
import { formatDecimal, roundToHalf } from '../lib/formatNumber.js'
import { DurationField } from './DurationField.jsx'
import { NumberField } from './NumberField.jsx'
import { WeightField } from './WeightField.jsx'

// Répétitions et poids toujours sur la même ligne, chacun sous son propre
// libellé (comme dans l'écran de séance guidée) : garantit un haut de champ
// aligné entre les deux même quand le poids passe en mode "par côté" (qui
// ajoute du contenu sous le champ, mais jamais au-dessus). `label` :
// lib/formatSet.js#getSetLabel ("Échauffement" ou "Série #n", qui compte
// les séries de travail seulement) ; à défaut, numérotation par index.
// Répétitions par demi (7,5) : saisie décimale arrondie au 0,5.
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
  onChangeWeightMode,
  onChangeBarWeight,
  onChangePulleyHeight,
  onChangePulleyNotch,
  onChangeGripWidth,
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
      <div className="set-row__header">
        <span className="set-row__label">{displayLabel}</span>
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

      <div className="set-row__fields">
        <label className="set-row__field">
          <span>{isTimeBased ? 'Durée' : 'Répétitions'}</span>
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
        </label>
        <label className="set-row__field">
          {/* Voir ExerciseView.jsx : en mode "par côté", WeightField affiche
              déjà ses propres libellés (Barre / Par côté), donc ce
              "Poids (kg)" en plus décalerait le champ vers le bas par
              rapport à Répétitions. */}
          {(exercise?.weightInputMode ?? 'total') !== 'perSide' && <span>Poids (kg)</span>}
          <WeightField
            className="set-row__input"
            exercise={exercise}
            value={weight}
            onChange={onChangeWeight}
            onModeChange={onChangeWeightMode}
            onBarWeightChange={onChangeBarWeight}
            onPulleyHeightChange={onChangePulleyHeight}
            onPulleyNotchChange={onChangePulleyNotch}
            onGripWidthChange={onChangeGripWidth}
            aria-label={`Poids ${displayLabel} (kg)`}
          />
        </label>
      </div>
    </div>
  )
}
