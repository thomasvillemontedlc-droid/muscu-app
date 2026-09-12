import { getExerciseUnit } from '../domain/muscleGroups.js'
import { DurationField } from './DurationField.jsx'
import { NumberField } from './NumberField.jsx'
import { WeightField } from './WeightField.jsx'

// Répétitions et poids toujours sur la même ligne, chacun sous son propre
// libellé (comme dans l'écran de séance guidée) : garantit un haut de champ
// aligné entre les deux même quand le poids passe en mode "par côté" (qui
// ajoute du contenu sous le champ, mais jamais au-dessus).
export function SetRow({
  index,
  weight,
  reps,
  exercise,
  onChangeWeight,
  onChangeReps,
  onChangeWeightMode,
  onChangeBarWeight,
  onRemove,
}) {
  const isTimeBased = getExerciseUnit(exercise?.name) === 'time'

  return (
    <div className="set-row">
      <div className="set-row__header">
        <span className="set-row__label">Série #{index + 1}</span>
        <button
          type="button"
          className="set-row__remove"
          onClick={onRemove}
          aria-label={`Supprimer la série ${index + 1}`}
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
              aria-label={`Durée série ${index + 1} en secondes`}
            />
          ) : (
            <NumberField
              className="set-row__input"
              value={reps}
              onChange={onChangeReps}
              aria-label={`Répétitions série ${index + 1}`}
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
            aria-label={`Poids série ${index + 1} (kg)`}
          />
        </label>
      </div>
    </div>
  )
}
