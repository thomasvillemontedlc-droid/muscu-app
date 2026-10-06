import { useEffect, useState } from 'react'
import { findExerciseByName, getOrCreateExercise } from '../domain/exercises.js'
import { getSameMuscleExerciseIds, replaceExerciseInSession } from '../domain/sessionRunner.js'
import { replaceExerciseInTemplates } from '../domain/templates.js'
import { ExercisePicker } from './ExercisePicker.jsx'

// Remplacer un exercice en pleine séance (écran d'exercice et liste
// "Exercices"), même présentation que la fiche muscle (.muscle-sheet).
// Les exercices au même muscle principal sont proposés en tête du
// sélecteur ; voir domain/sessionRunner.js#replaceExerciseInSession pour ce
// que deviennent les séries. "Remplacer aussi dans la séance type" applique
// le même échange au template d'origine (décoché par défaut).
export function ReplaceExerciseSheet({ session, entry, data, setData, onClose }) {
  const [alsoTemplate, setAlsoTemplate] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const template = data.templates.find((t) => t.id === session.templateId)
  const templateHasExercise = template?.exerciseIds.includes(entry.exerciseId) ?? false
  const inSessionIds = new Set(session.entries.map((e) => e.exerciseId))
  const candidates = data.exercises.filter((e) => !inSessionIds.has(e.id))
  const suggestedIds = getSameMuscleExerciseIds(candidates, entry.exerciseName)

  function handleReplace(name) {
    const existing = findExerciseByName(data.exercises, name)
    if (existing && inSessionIds.has(existing.id)) {
      setError(`${existing.name} est déjà dans cette séance.`)
      return
    }
    const { exercise, exercises } = getOrCreateExercise(data.exercises, name)
    const sessions = replaceExerciseInSession(data.sessions, session.id, entry.exerciseId, exercise)
    const templates =
      alsoTemplate && templateHasExercise
        ? replaceExerciseInTemplates(data.templates, [template.id], entry.exerciseId, exercise.id)
        : data.templates
    setData({ ...data, exercises, sessions, templates })
    onClose()
  }

  return (
    <div className="muscle-sheet-overlay" onClick={onClose}>
      <div
        className="muscle-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Remplacer ${entry.exerciseName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="muscle-sheet__close" onClick={onClose} aria-label="Fermer">
          ✕
        </button>
        <h2 className="muscle-sheet__title">Remplacer</h2>
        <p className="muscle-sheet__detail">{entry.exerciseName}</p>
        <p className="muscle-sheet__detail replace-exercise__hint">
          Les séries déjà validées sont conservées ; les suivantes reprennent ta dernière performance sur le nouvel
          exercice.
        </p>

        <p className="muscle-sheet__subtitle">Nouvel exercice</p>
        <ExercisePicker exercises={candidates} suggestedIds={suggestedIds} onAdd={handleReplace} />
        {error && <p className="replace-exercise__error">{error}</p>}

        {templateHasExercise && (
          <label className="replace-exercise__template">
            <input type="checkbox" checked={alsoTemplate} onChange={(e) => setAlsoTemplate(e.target.checked)} />
            Remplacer aussi dans la séance type « {template.name} »
          </label>
        )}
      </div>
    </div>
  )
}
