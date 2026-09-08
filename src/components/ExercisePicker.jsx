import { useState } from 'react'
import { BigButton } from './BigButton.jsx'

// Champ texte avec autocomplétion (datalist) sur les exercices déjà connus,
// pour éviter de recréer "développé couché" sous un nom légèrement différent
// à chaque fois (ce qui casserait l'historique par exercice).
export function ExercisePicker({ exercises, onAdd }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!value.trim()) return
    onAdd(value)
    setValue('')
  }

  return (
    <form className="exercise-picker" onSubmit={handleSubmit}>
      <input
        className="exercise-picker__input"
        type="text"
        list="known-exercises"
        placeholder="Nom de l'exercice"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Nom de l'exercice à ajouter"
      />
      <datalist id="known-exercises">
        {exercises.map((exercise) => (
          <option key={exercise.id} value={exercise.name} />
        ))}
      </datalist>
      <BigButton type="submit">Ajouter</BigButton>
    </form>
  )
}
