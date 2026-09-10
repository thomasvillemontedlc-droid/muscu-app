import { useState } from 'react'
import { getExerciseMuscles, getMuscleLabel, MUSCLE_GROUPS } from '../domain/muscleGroups.js'
import { BigButton } from './BigButton.jsx'

// Champ texte avec suggestions cliquables, triées pour faire remonter les
// exercices déjà utilisés (suggestedIds) avant le reste. Liste déroulante
// limitée à ~3 lignes visibles avec défilement (voir CSS), pas une
// <datalist> native qui ne permet pas ce contrôle. Un filtre par muscle
// (optionnel) se combine avec la recherche par nom : quand il est actif, il
// prime sur le tri "déjà utilisé" et trie principal avant secondaire.
export function ExercisePicker({ exercises, suggestedIds = [], onAdd }) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [muscleFilter, setMuscleFilter] = useState('')

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

  function handleMuscleFilterChange(e) {
    setMuscleFilter(e.target.value)
    setOpen(true)
  }

  const suggestedSet = new Set(suggestedIds)
  let ordered = [
    ...exercises.filter((e) => suggestedSet.has(e.id)),
    ...exercises.filter((e) => !suggestedSet.has(e.id)),
  ]

  if (muscleFilter) {
    ordered = ordered
      .filter((e) => {
        const { primary, secondary } = getExerciseMuscles(e.name)
        return primary.includes(muscleFilter) || secondary.includes(muscleFilter)
      })
      .sort((a, b) => {
        const aPrimary = getExerciseMuscles(a.name).primary.includes(muscleFilter) ? 0 : 1
        const bPrimary = getExerciseMuscles(b.name).primary.includes(muscleFilter) ? 0 : 1
        return aPrimary - bPrimary
      })
  }

  const query = value.trim().toLowerCase()
  const filtered = query ? ordered.filter((e) => e.name.toLowerCase().includes(query)) : ordered

  return (
    <div className="exercise-picker">
      <label className="exercise-picker__muscle-filter">
        <span>Filtrer par muscle</span>
        <select value={muscleFilter} onChange={handleMuscleFilterChange}>
          <option value="">Tous les muscles</option>
          {MUSCLE_GROUPS.map((id) => (
            <option key={id} value={id}>
              {getMuscleLabel(id)}
            </option>
          ))}
        </select>
      </label>

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

      {open &&
        (filtered.length > 0 ? (
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
        ) : (
          muscleFilter && <p className="exercise-picker__empty">Aucun exercice pour ce muscle.</p>
        ))}
    </div>
  )
}
