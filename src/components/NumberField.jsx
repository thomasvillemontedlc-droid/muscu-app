import { useEffect, useState } from 'react'
import { sanitizeDecimal, sanitizeInteger } from '../lib/numberInput.js'

// Champ numérique contrôlé via un buffer texte local plutôt que lié
// directement au nombre : un <input type="number"> contrôlé par React ne se
// resynchronise pas toujours sur mobile quand la valeur numérique calculée
// ne change pas (ex: "020" -> 20, identique à avant), ce qui laisse le zéro
// affiché. Voir aussi domain/sessionRunner.js pour le contexte d'usage.
export function NumberField({ value, onChange, decimal = false, className, ...props }) {
  const sanitize = decimal ? sanitizeDecimal : sanitizeInteger
  const [text, setText] = useState(String(value))

  useEffect(() => setText(String(value)), [value])

  function handleChange(e) {
    const cleaned = sanitize(e.target.value)
    setText(cleaned)
    if (cleaned !== '' && !cleaned.endsWith('.')) onChange(Number(cleaned))
  }

  function handleBlur() {
    if (text === '' || text.endsWith('.')) {
      const num = Number(text) || 0
      setText(String(num))
      onChange(num)
    }
  }

  return (
    <input
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      className={className}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
    />
  )
}
