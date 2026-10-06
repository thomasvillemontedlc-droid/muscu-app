import { useState } from 'react'
import { getOrCreateExercise, setExerciseUnilateral } from '../../domain/exercises.js'
import { getExercisesUsedInTemplate, getLastPerformance } from '../../domain/history.js'
import {
  addExerciseEntryToSession,
  adjustRestSeconds,
  finishSessionEarly,
  getResumeSetIndex,
  pickExercise,
} from '../../domain/sessionRunner.js'
import { formatPerformanceSummary, getSetPosition } from '../../lib/formatSet.js'
import { ReplaceExerciseSheet } from '../../components/ReplaceExerciseSheet.jsx'
import { getDisplayedSetCount, setEntryFeeling, setEntryUnilateral, setSetCount } from '../../domain/sessions.js'
import { useRestTimer } from '../../hooks/useRestTimer.js'
import { RestBanner } from '../../components/RestBanner.jsx'
import { ExercisePicker } from '../../components/ExercisePicker.jsx'
import { FeelingPicker } from '../../components/FeelingPicker.jsx'
import { StepperField } from '../../components/StepperField.jsx'
import { BigButton } from '../../components/BigButton.jsx'

export function PickExerciseView({ session, data, setData }) {
  const timer = useRestTimer(session, setData)
  const [showAddExercise, setShowAddExercise] = useState(false)
  // Exercice tout juste ajouté depuis cet écran : affiche son nombre de
  // séries (choisi ici plutôt que de garder la valeur silencieusement
  // préremplie par addExerciseEntryToSession) jusqu'à ce qu'on tape "OK" ou
  // qu'on quitte l'écran.
  const [justAddedId, setJustAddedId] = useState(null)
  const otherSessions = data.sessions.filter((s) => s.id !== session.id)
  const suggestedIds = getExercisesUsedInTemplate(otherSessions, session.templateName)
  const [replacingId, setReplacingId] = useState(null)
  const replacingEntry = session.entries.find((e) => e.exerciseId === replacingId)
  // Exercice quitté en cours de route ("Tous les exercices" conserve
  // currentExerciseId) : mis en avant, et c'est aussi le prochain pour le
  // rappel de dernière performance du bandeau de repos.
  const currentEntry = session.entries.find((e) => e.exerciseId === session.currentExerciseId)
  const currentLast = currentEntry ? getLastPerformance(otherSessions, currentEntry.exerciseId) : null
  const currentLastSummary = currentLast ? formatPerformanceSummary(currentLast.sets, currentEntry.exerciseName) : null

  function getCurrentBadge(entry) {
    const pos = getSetPosition(entry.sets, getResumeSetIndex(session, entry))
    return pos.warmup ? 'En cours · échauffement' : `En cours · série ${pos.position}/${pos.total}`
  }

  function handlePick(exerciseId) {
    setData({ ...data, sessions: pickExercise(data.sessions, session.id, exerciseId) })
  }

  function handleFinish() {
    setData({ ...data, sessions: finishSessionEarly(data.sessions, session.id) })
  }

  function handleAdjustRest(deltaSeconds) {
    setData({ ...data, sessions: adjustRestSeconds(data.sessions, session.id, deltaSeconds) })
  }

  function handleFeelingChange(exerciseId, feeling) {
    setData({ ...data, sessions: setEntryFeeling(data.sessions, session.id, exerciseId, feeling) })
  }

  // Permet d'ajouter un exercice non prévu sans repasser par l'écran de
  // préparation (voir PrepView.jsx#handleAddExercise, même logique).
  function handleAddExercise(name) {
    const { exercise, exercises } = getOrCreateExercise(data.exercises, name)
    const sessions = addExerciseEntryToSession(data.sessions, session.id, exercise)
    setData({ ...data, exercises, sessions })
    setShowAddExercise(false)
    setJustAddedId(exercise.id)
  }

  function handleSetCountChange(exerciseId, count) {
    const exercise = data.exercises.find((e) => e.id === exerciseId)
    setData({
      ...data,
      sessions: setSetCount(data.sessions, session.id, exerciseId, Math.max(1, count), exercise?.unilateral),
    })
  }

  function handleUnilateralChange(exerciseId, unilateral) {
    setData((current) => ({
      ...current,
      exercises: setExerciseUnilateral(current.exercises, exerciseId, unilateral),
      sessions: setEntryUnilateral(current.sessions, session.id, exerciseId, unilateral),
    }))
  }

  return (
    <div className="page">
      <h1>Exercices</h1>
      <p className="last-performance">{session.templateName}</p>

      <RestBanner
        timer={timer}
        onAdjust={handleAdjustRest}
        nextExerciseName={currentEntry?.exerciseName}
        nextLastPerformance={currentLastSummary}
      />

      <ul className="pick-exercise-list">
        {session.entries.map((entry) => {
          const done = session.completedExerciseIds.includes(entry.exerciseId)
          const isCurrent = !done && entry === currentEntry
          const entryExercise = data.exercises.find((e) => e.id === entry.exerciseId)
          return (
            <li
              key={entry.exerciseId}
              className={isCurrent ? 'pick-exercise-list__item--current' : done ? 'pick-exercise-list__item--done' : undefined}
            >
              <div className="pick-exercise-list__row">
                {isCurrent ? (
                  <button
                    type="button"
                    className="big-button pick-exercise-list__current"
                    onClick={() => handlePick(entry.exerciseId)}
                  >
                    <span>{entry.exerciseName}</span>
                    <span className="pick-exercise-list__badge">{getCurrentBadge(entry)}</span>
                  </button>
                ) : (
                  <BigButton variant={done ? 'secondary' : 'primary'} onClick={() => handlePick(entry.exerciseId)}>
                    {done ? '✓ ' : ''}
                    {entry.exerciseName}
                  </BigButton>
                )}
                {!done && (
                  <button
                    type="button"
                    className="pick-exercise-list__replace"
                    onClick={() => setReplacingId(entry.exerciseId)}
                    aria-label={`Remplacer ${entry.exerciseName}`}
                  >
                    Remplacer
                  </button>
                )}
              </div>
              {done && (
                <FeelingPicker feeling={entry.feeling} onChange={(feeling) => handleFeelingChange(entry.exerciseId, feeling)} />
              )}
              {entry.exerciseId === justAddedId && (
                <div className="pick-exercise-list__set-count">
                  <label>
                    <span>Nombre de séries</span>
                    <StepperField
                      value={getDisplayedSetCount(entry.sets, entryExercise?.unilateral)}
                      onChange={(count) => handleSetCountChange(entry.exerciseId, count)}
                      step={1}
                      min={1}
                      aria-label="Nombre de séries"
                    />
                  </label>
                  <label className="pick-exercise-list__unilateral">
                    <input
                      type="checkbox"
                      checked={entryExercise?.unilateral ?? false}
                      onChange={(e) => handleUnilateralChange(entry.exerciseId, e.target.checked)}
                    />
                    Unilatéral
                  </label>
                  <button type="button" className="subtle-button" onClick={() => setJustAddedId(null)}>
                    OK
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {showAddExercise ? (
        <ExercisePicker exercises={data.exercises} suggestedIds={suggestedIds} onAdd={handleAddExercise} />
      ) : (
        <button type="button" className="subtle-button" onClick={() => setShowAddExercise(true)}>
          + Ajouter un exercice
        </button>
      )}

      <button type="button" className="subtle-button" onClick={handleFinish}>
        Terminer la séance
      </button>

      {replacingEntry && (
        <ReplaceExerciseSheet
          session={session}
          entry={replacingEntry}
          data={data}
          setData={setData}
          onClose={() => setReplacingId(null)}
        />
      )}
    </div>
  )
}
