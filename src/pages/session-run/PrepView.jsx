import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getOrCreateExercise, setExerciseBarWeight, setExerciseWeightMode } from '../../domain/exercises.js'
import { getExercisesUsedInTemplate } from '../../domain/history.js'
import { addSet, removeSet, updateSet } from '../../domain/sessions.js'
import {
  addExerciseEntryToSession,
  removeExerciseEntryFromSession,
  reorderSessionEntries,
  setRestSeconds,
  startSession,
} from '../../domain/sessionRunner.js'
import { getPlannedMusclesWorked, getWarmupMoveSuggestions, getWarmupSuggestions } from '../../domain/warmup.js'
import { DraggableList } from '../../components/DraggableList.jsx'
import { ExercisePicker } from '../../components/ExercisePicker.jsx'
import { NumberField } from '../../components/NumberField.jsx'
import { RoutineRunner } from '../../components/RoutineRunner.jsx'
import { SetRow } from '../../components/SetRow.jsx'
import { BigButton } from '../../components/BigButton.jsx'

export function PrepView({ session, data, setData }) {
  const [showWarmup, setShowWarmup] = useState(false)
  const otherSessions = data.sessions.filter((s) => s.id !== session.id)
  const suggestedIds = getExercisesUsedInTemplate(otherSessions, session.templateName)

  function handleReorder(fromIndex, toIndex) {
    setData({ ...data, sessions: reorderSessionEntries(data.sessions, session.id, fromIndex, toIndex) })
  }

  function handleMove(index, direction) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= session.entries.length) return
    handleReorder(index, targetIndex)
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

  // Forme fonctionnelle : WeightField peut appeler onBarWeightChange puis
  // onChange dans le même geste (mode "par côté"), donc deux setData
  // synchrones coup sur coup. Avec un objet littéral, le second écraserait
  // le premier (les deux partent du même `data` figé) ; la forme
  // fonctionnelle applique chaque mise à jour sur le résultat de la
  // précédente.
  function handleUpdateSet(exerciseId, setIndex, changes) {
    setData((current) => ({ ...current, sessions: updateSet(current.sessions, session.id, exerciseId, setIndex, changes) }))
  }

  function handleWeightModeChange(exerciseId, weightInputMode) {
    setData((current) => ({ ...current, exercises: setExerciseWeightMode(current.exercises, exerciseId, weightInputMode) }))
  }

  function handleBarWeightChange(exerciseId, barWeight) {
    setData((current) => ({ ...current, exercises: setExerciseBarWeight(current.exercises, exerciseId, barWeight) }))
  }

  function handleStartingExerciseChange(e) {
    const exerciseId = e.target.value
    const fromIndex = session.entries.findIndex((entry) => entry.exerciseId === exerciseId)
    if (fromIndex <= 0) return

    setData({ ...data, sessions: reorderSessionEntries(data.sessions, session.id, fromIndex, 0) })
  }

  function handleRestMinutesChange(minutes) {
    setData({
      ...data,
      sessions: setRestSeconds(data.sessions, session.id, minutes * 60 + (session.restSeconds % 60)),
    })
  }

  function handleRestSecondsChange(seconds) {
    setData({
      ...data,
      sessions: setRestSeconds(data.sessions, session.id, Math.floor(session.restSeconds / 60) * 60 + seconds),
    })
  }

  function handleStart() {
    setData({ ...data, sessions: startSession(data.sessions, session.id) })
  }

  // L'échauffement est un aller simple avant la séance : ni lancé ni passé
  // ne modifient la phase de la séance elle-même (toujours 'prep' jusqu'à
  // handleStart), c'est un simple écran intercalaire côté état local.
  if (showWarmup) {
    return (
      <RoutineRunner
        title="Échauffement"
        hint="Suggestions générales, pas un échauffement personnalisé."
        initialItems={getWarmupSuggestions(getPlannedMusclesWorked(session))}
        suggestions={getWarmupMoveSuggestions(getPlannedMusclesWorked(session))}
        skipLabel="Passer l'échauffement"
        onDone={handleStart}
      />
    )
  }

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Mes séances
      </Link>

      <h1>{session.templateName}</h1>

      <DraggableList
        className="prep-exercise-list"
        items={session.entries}
        getKey={(entry) => entry.exerciseId}
        onReorder={handleReorder}
        renderItem={(entry, index, dragHandleProps) => (
          <div className="prep-exercise">
            <div className="prep-exercise__header">
              <button type="button" className="prep-exercise__handle" aria-label="Réordonner (appui long)" {...dragHandleProps}>
                ⠿
              </button>
              <span className="prep-exercise__name">{entry.exerciseName}</span>
              <button type="button" className="prep-exercise__remove" onClick={() => handleMove(index, -1)} aria-label="Monter">
                ↑
              </button>
              <button type="button" className="prep-exercise__remove" onClick={() => handleMove(index, 1)} aria-label="Descendre">
                ↓
              </button>
              <button
                type="button"
                className="prep-exercise__remove"
                onClick={() => handleRemoveExercise(entry.exerciseId)}
                aria-label="Retirer de cette séance"
              >
                ✕
              </button>
            </div>

            {entry.sets.map((set, setIndex) => (
              <SetRow
                // Voir ExerciseView.jsx : SessionRunPage ne remonte jamais
                // entre deux séances (pas de key sur session.id), donc un
                // key uniquement basé sur setIndex laisserait le chrono
                // d'un champ Durée (DurationField, exercices "au temps")
                // partager son état entre deux séances différentes.
                key={`${session.id}-${entry.exerciseId}-${setIndex}`}
                index={setIndex}
                weight={set.weight}
                reps={set.reps}
                exercise={data.exercises.find((e) => e.id === entry.exerciseId)}
                onChangeWeight={(weight) => handleUpdateSet(entry.exerciseId, setIndex, { weight })}
                onChangeReps={(reps) => handleUpdateSet(entry.exerciseId, setIndex, { reps })}
                onChangeWeightMode={(mode) => handleWeightModeChange(entry.exerciseId, mode)}
                onChangeBarWeight={(barWeight) => handleBarWeightChange(entry.exerciseId, barWeight)}
                onRemove={() => handleRemoveSet(entry.exerciseId, setIndex)}
              />
            ))}

            <button type="button" className="add-set-button" onClick={() => handleAddSet(entry.exerciseId)}>
              + Ajouter une série
            </button>
          </div>
        )}
      />

      <ExercisePicker exercises={data.exercises} suggestedIds={suggestedIds} onAdd={handleAddExercise} />

      {session.entries.length === 0 ? (
        <p className="empty-state">Ajoute au moins un exercice pour commencer.</p>
      ) : (
        <>
          <label className="prep-field">
            <span>Commencer par</span>
            <select
              className="prep-field__select"
              value={session.entries[0].exerciseId}
              onChange={handleStartingExerciseChange}
            >
              {session.entries.map((entry) => (
                <option key={entry.exerciseId} value={entry.exerciseId}>
                  {entry.exerciseName}
                </option>
              ))}
            </select>
          </label>

          <div className="prep-field">
            <span>Temps de repos</span>
            <div className="rest-duration-fields">
              <label className="rest-duration-fields__field">
                <NumberField
                  value={Math.floor(session.restSeconds / 60)}
                  onChange={handleRestMinutesChange}
                  aria-label="Minutes de repos"
                />
                <span>min</span>
              </label>
              <label className="rest-duration-fields__field">
                <NumberField
                  value={session.restSeconds % 60}
                  onChange={handleRestSecondsChange}
                  aria-label="Secondes de repos"
                />
                <span>s</span>
              </label>
            </div>
          </div>

          <BigButton onClick={() => setShowWarmup(true)}>Commencer la séance</BigButton>
        </>
      )}
    </div>
  )
}
