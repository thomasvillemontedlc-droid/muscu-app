import { NumberField } from './NumberField.jsx'

export function SetRow({ index, weight, reps, onChangeWeight, onChangeReps, onRemove }) {
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

      <NumberField
        className="set-row__input"
        decimal
        value={weight}
        onChange={onChangeWeight}
        aria-label={`Poids série ${index + 1} (kg)`}
      />
      <span className="set-row__unit">kg</span>

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
