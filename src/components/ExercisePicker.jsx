import { useState } from 'react'
import { BigButton } from './BigButton.jsx'

// Champ texte avec suggestions cliquables, triées pour faire remonter les
// exercices déjà utilisés (suggestedIds) avant le reste. Liste déroulante
// limitée à ~3 lignes visibles avec défilement (voir CSS), pas une
// <datalist> native qui ne permet pas ce contrôle.
export function ExercisePicker({ exercises, suggestedIds = [], onAdd }) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!value.trim()) return
    onAdd(value)
    setValue('')
    setOpen(false)
  }

  function handleSelect(exercise) {
    onAdd(exercise.name)
    setValue('')
    setOpen(false)
  }

  const suggestedSet = new Set(suggestedIds)
  const ordered = [
    ...exercises.filter((e) => suggestedSet.has(e.id)),
    ...exercises.filter((e) => !suggestedSet.has(e.id)),
  ]

  const query = value.trim().toLowerCase()
  const filtered = query ? ordered.filter((e) => e.name.toLowerCase().includes(query)) : ordered

  return (
    <div className="exercise-picker">
      <form className="exercise-picker__form" onSubmit={handleSubmit}>
        <input
          className="exercise-picker__input"
          type="text"
          placeholder="Nom de l'exercice"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          aria-label="Nom de l'exercice à ajouter"
        />
        <BigButton type="submit">Ajouter</BigButton>
      </form>

      {open && filtered.length > 0 && (
        <ul className="exercise-picker__suggestions">
          {filtered.map((exercise) => (
            <li key={exercise.id}>
              {/* onMouseDown (pas onClick) pour s'exécuter avant le onBlur du champ */}
              <button type="button" onMouseDown={() => handleSelect(exercise)}>
                {exercise.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
