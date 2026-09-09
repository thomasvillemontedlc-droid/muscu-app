import { NumberField } from './NumberField.jsx'
import { WeightField } from './WeightField.jsx'

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
  return (
    <div className="set-row">
      <span className="set-row__label">#{index + 1}</span>

      <NumberField
        className="set-row__input"
        value={reps}
        onChange={onChangeReps}
        aria-label={`Répétitions série ${index + 1}`}
      />
      <span className="set-row__unit">reps</span>

      <WeightField
        exercise={exercise}
        value={weight}
        onChange={onChangeWeight}
        onModeChange={onChangeWeightMode}
        onBarWeightChange={onChangeBarWeight}
        aria-label={`Poids série ${index + 1} (kg)`}
      />

      <button
        type="button"
        className="set-row__remove"
        onClick={onRemove}
        aria-label={`Supprimer la série ${index + 1}`}
      >
        ✕
      </button>
    </div>
  )
}
