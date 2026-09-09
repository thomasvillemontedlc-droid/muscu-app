const FEELING_OPTIONS = [
  { value: 'difficile', label: '😖 Difficile' },
  { value: 'ok', label: '🙂 Bien comme ça' },
  { value: 'facile', label: '😄 Facile' },
]

// Ressenti optionnel sur un exercice terminé : trois choix rapides + un champ
// libre. Ré-appuyer sur le choix déjà sélectionné le désélectionne.
export function FeelingPicker({ feeling, onChange }) {
  const value = feeling?.value ?? null
  const note = feeling?.note ?? ''

  function handleSelect(newValue) {
    onChange({ value: newValue === value ? null : newValue, note })
  }

  function handleNoteChange(e) {
    onChange({ value, note: e.target.value })
  }

  return (
    <div className="feeling-picker">
      <div className="feeling-picker__options">
        {FEELING_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`feeling-picker__option${value === opt.value ? ' feeling-picker__option--selected' : ''}`}
            onClick={() => handleSelect(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        className="feeling-picker__note"
        placeholder="Note libre (optionnel)"
        value={note}
        onChange={handleNoteChange}
        aria-label="Note libre sur le ressenti"
      />
    </div>
  )
}

export function getFeelingLabel(value) {
  return FEELING_OPTIONS.find((opt) => opt.value === value)?.label ?? null
}
