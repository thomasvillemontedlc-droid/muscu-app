import { useEffect, useState } from 'react'

// Nettoie la saisie brute d'un champ texte numérique : ne garde que les
// chiffres, retire les zéros superflus en tête (ex: "020" -> "20").
function sanitizeInteger(raw) {
  return raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
}

// Comme sanitizeInteger, mais autorise un seul point décimal (poids en kg).
function sanitizeDecimal(raw) {
  let cleaned = raw.replace(/[^\d.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
  }
  return cleaned.replace(/^0+(?=\d)/, '')
}

export function SetRow({ index, weight, reps, onChangeWeight, onChangeReps, onRemove }) {
  // Champs saisis via un buffer texte local plutôt que directement liés au
  // nombre : un <input type="number"> contrôlé par React ne se resynchronise
  // pas toujours sur mobile quand la valeur numérique calculée ne change pas
  // (ex: "020" -> 20, identique à avant), ce qui laissait le zéro affiché.
  const [weightText, setWeightText] = useState(String(weight))
  const [repsText, setRepsText] = useState(String(reps))

  useEffect(() => setWeightText(String(weight)), [weight])
  useEffect(() => setRepsText(String(reps)), [reps])

  function handleRepsChange(e) {
    const cleaned = sanitizeInteger(e.target.value)
    setRepsText(cleaned)
    if (cleaned !== '') onChangeReps(Number(cleaned))
  }

  function handleRepsBlur() {
    if (repsText === '') {
      setRepsText('0')
      onChangeReps(0)
    }
  }

  function handleWeightChange(e) {
    const cleaned = sanitizeDecimal(e.target.value)
    setWeightText(cleaned)
    if (cleaned !== '' && !cleaned.endsWith('.')) onChangeWeight(Number(cleaned))
  }

  function handleWeightBlur() {
    if (weightText === '' || weightText.endsWith('.')) {
      const num = Number(weightText) || 0
      setWeightText(String(num))
      onChangeWeight(num)
    }
  }

  return (
    <div className="set-row">
      <span className="set-row__label">#{index + 1}</span>

      <input
        className="set-row__input"
        type="text"
        inputMode="numeric"
        value={repsText}
        onChange={handleRepsChange}
        onBlur={handleRepsBlur}
        aria-label={`Répétitions série ${index + 1}`}
      />
      <span className="set-row__unit">reps</span>

      <input
        className="set-row__input"
        type="text"
        inputMode="decimal"
        value={weightText}
        onChange={handleWeightChange}
        onBlur={handleWeightBlur}
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
