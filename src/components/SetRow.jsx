export function SetRow({ index, weight, reps, onChangeWeight, onChangeReps, onRemove }) {
  return (
    <div className="set-row">
      <span className="set-row__label">#{index + 1}</span>

      <input
        className="set-row__input"
        type="number"
        inputMode="decimal"
        step="0.5"
        min="0"
        value={weight}
        onChange={(e) => onChangeWeight(Number(e.target.value))}
        aria-label={`Poids série ${index + 1} (kg)`}
      />
      <span className="set-row__unit">kg</span>

      <input
        className="set-row__input"
        type="number"
        inputMode="numeric"
        step="1"
        min="0"
        value={reps}
        onChange={(e) => onChangeReps(Number(e.target.value))}
        aria-label={`Répétitions série ${index + 1}`}
      />
      <span className="set-row__unit">reps</span>

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
