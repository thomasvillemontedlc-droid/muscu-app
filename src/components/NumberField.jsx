import { useEffect, useState } from 'react'
import { sanitizeDecimal, sanitizeInteger } from '../lib/numberInput.js'

// Champ numérique contrôlé via un buffer texte local plutôt que lié
// directement au nombre : un <input type="number"> contrôlé par React ne se
// resynchronise pas toujours sur mobile quand la valeur numérique calculée
// ne change pas (ex: "020" -> 20, identique à avant), ce qui laisse le zéro
// affiché. Voir aussi domain/sessionRunner.js pour le contexte d'usage.
// `normalize` (optionnel) transforme le nombre saisi avant onChange (ex.
// arrondi au 0,5 pour les demi-répétitions) ; le texte tapé n'est remplacé
// par la valeur normalisée qu'à la sortie du champ, pour ne pas sauter sous
// les doigts pendant la frappe. `format` (optionnel) : affichage du nombre
// hors frappe (ex. virgule française).
export function NumberField({ value, onChange, decimal = false, normalize, format = String, className, ...props }) {
  const sanitize = decimal ? sanitizeDecimal : sanitizeInteger
  const apply = normalize ?? ((n) => n)
  const [text, setText] = useState(format(value))

  // Ne resynchronise le texte que sur un changement EXTERNE de la valeur :
  // si le texte en cours de frappe donne déjà cette valeur une fois
  // normalisé, on le laisse tel quel.
  useEffect(() => {
    setText((current) => {
      const typed = sanitize(current)
      return typed !== '' && apply(Number(typed)) === value ? current : format(value)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function handleChange(e) {
    const cleaned = sanitize(e.target.value)
    setText(cleaned)
    if (cleaned !== '' && !cleaned.endsWith('.')) onChange(apply(Number(cleaned)))
  }

  function handleBlur() {
    const num = apply(Number(sanitize(text)) || 0)
    setText(format(num))
    if (num !== value) onChange(num)
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
