import { Link } from 'react-router-dom'
import { getOrCreateExercise } from '../../domain/exercises.js'
import { addSet, removeSet, updateSet } from '../../domain/sessions.js'
import {
  addExerciseEntryToSession,
  removeExerciseEntryFromSession,
  reorderSessionEntries,
  setRestSeconds,
  setStartingExercise,
  startSession,
} from '../../domain/sessionRunner.js'
import { ExercisePicker } from '../../components/ExercisePicker.jsx'
import { NumberField } from '../../components/NumberField.jsx'
import { SetRow } from '../../components/SetRow.jsx'
import { BigButton } from '../../components/BigButton.jsx'

export function PrepView({ session, data, setData }) {
  function handleMove(index, direction) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= session.entries.length) return
    setData({ ...data, sessions: reorderSessionEntries(data.sessions, session.id, index, targetIndex) })
  }

  function handleRemoveExercise(exerciseId) {
    setData({ ...data, sessions: removeExerciseEntryFromSession(data.sessions, session.id, exerciseId) })
  }

  function handleAddExercise(name) {
    const { exercise, exercises } = getOrCreateExercise(data.exercises, name)
    const sessions = addExerciseEntryToSession(data.sessions, session.id, exercise)
    setData({ ...data, exercises, sessions })
  }

  function handleAddSet(exerciseId) {
    const entry = session.entries.find((e) => e.exerciseId === exerciseId)
    const lastSet = entry.sets[entry.sets.length - 1] ?? { weight: 0, reps: 0 }
    setData({ ...data, sessions: addSet(data.sessions, session.id, exerciseId, lastSet) })
  }

  function handleRemoveSet(exerciseId, setIndex) {
    setData({ ...data, sessions: removeSet(data.sessions, session.id, exerciseId, setIndex) })
  }

  function handleUpdateSet(exerciseId, setIndex, changes) {
    setData({ ...data, sessions: updateSet(data.sessions, session.id, exerciseId, setIndex, changes) })
  }

  function handleStartingExerciseChange(e) {
    setData({ ...data, sessions: setStartingExercise(data.sessions, session.id, e.target.value) })
  }

  function handleRestSecondsChange(seconds) {
    setData({ ...data, sessions: setRestSeconds(data.sessions, session.id, seconds) })
  }

  function handleStart() {
    setData({ ...data, sessions: startSession(data.sessions, session.id) })
  }

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Mes séances
      </Link>

      <h1>{session.templateName}</h1>

      <ol className="prep-exercise-list">
        {session.entries.map((entry, index) => (
          <li key={entry.exerciseId} className="prep-exercise">
            <div className="prep-exercise__header">
              <span className="prep-exercise__name">{entry.exerciseName}</span>
              <div className="prep-exercise__actions">
                <button type="button" onClick={() => handleMove(index, -1)} aria-label="Monter">
                  ↑
                </button>
                <button type="button" onClick={() => handleMove(index, 1)} aria-label="Descendre">
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveExercise(entry.exerciseId)}
                  aria-label="Retirer de cette séance"
                >
                  ✕
                </button>
              </div>
            </div>

            {entry.sets.map((set, setIndex) => (
              <SetRow
                key={setIndex}
                index={setIndex}
                weight={set.weight}
                reps={set.reps}
                onChangeWeight={(weight) => handleUpdateSet(entry.exerciseId, setIndex, { weight })}
                onChangeReps={(reps) => handleUpdateSet(entry.exerciseId, setIndex, { reps })}
                onRemove={() => handleRemoveSet(entry.exerciseId, setIndex)}
              />
            ))}

            <button type="button" className="add-set-button" onClick={() => handleAddSet(entry.exerciseId)}>
              + Ajouter une série
            </button>
          </li>
        ))}
      </ol>

      <ExercisePicker exercises={data.exercises} onAdd={handleAddExercise} />

      {session.entries.length === 0 ? (
        <p className="empty-state">Ajoute au moins un exercice pour commencer.</p>
      ) : (
        <>
          <label className="prep-field">
            <span>Commencer par</span>
            <select
              className="prep-field__select"
              value={session.startingExerciseId ?? session.entries[0].exerciseId}
              onChange={handleStartingExerciseChange}
            >
              {session.entries.map((entry) => (
                <option key={entry.exerciseId} value={entry.exerciseId}>
                  {entry.exerciseName}
                </option>
              ))}
            </select>
          </label>

          <label className="prep-field">
            <span>Temps de repos (secondes)</span>
            <NumberField
              className="prep-field__input"
              value={session.restSeconds}
              onChange={handleRestSecondsChange}
              aria-label="Temps de repos en secondes"
            />
          </label>

          <BigButton onClick={handleStart}>Commencer la séance</BigButton>
        </>
      )}
    </div>
  )
}
