import { useState } from 'react'
import { getOrCreateExercise } from '../../domain/exercises.js'
import { getExercisesUsedInTemplate } from '../../domain/history.js'
import {
  addExerciseEntryToSession,
  adjustRestSeconds,
  finishSessionEarly,
  pickExercise,
} from '../../domain/sessionRunner.js'
import { setEntryFeeling, setSetCount } from '../../domain/sessions.js'
import { useRestTimer } from '../../hooks/useRestTimer.js'
import { RestBanner } from '../../components/RestBanner.jsx'
import { ExercisePicker } from '../../components/ExercisePicker.jsx'
import { FeelingPicker } from '../../components/FeelingPicker.jsx'
import { StepperField } from '../../components/StepperField.jsx'
import { BigButton } from '../../components/BigButton.jsx'

export function PickExerciseView({ session, data, setData }) {
  const timer = useRestTimer(session)
  const [showAddExercise, setShowAddExercise] = useState(false)
  // Exercice tout juste ajouté depuis cet écran : affiche son nombre de
  // séries (choisi ici plutôt que de garder la valeur silencieusement
  // préremplie par addExerciseEntryToSession) jusqu'à ce qu'on tape "OK" ou
  // qu'on quitte l'écran.
  const [justAddedId, setJustAddedId] = useState(null)
  const otherSessions = data.sessions.filter((s) => s.id !== session.id)
  const suggestedIds = getExercisesUsedInTemplate(otherSessions, session.templateName)

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
    setData({ ...data, sessions: setSetCount(data.sessions, session.id, exerciseId, Math.max(1, count)) })
  }

  return (
    <div className="page">
      <h1>Exercices</h1>
      <p className="last-performance">{session.templateName}</p>

      <RestBanner timer={timer} onAdjust={handleAdjustRest} />

      <ul className="pick-exercise-list">
        {session.entries.map((entry) => {
          const done = session.completedExerciseIds.includes(entry.exerciseId)
          return (
            <li key={entry.exerciseId}>
              <BigButton variant={done ? 'secondary' : 'primary'} onClick={() => handlePick(entry.exerciseId)}>
                {done ? '✓ ' : ''}
                {entry.exerciseName}
              </BigButton>
              {done && (
                <FeelingPicker feeling={entry.feeling} onChange={(feeling) => handleFeelingChange(entry.exerciseId, feeling)} />
              )}
              {entry.exerciseId === justAddedId && (
                <div className="pick-exercise-list__set-count">
                  <label>
                    <span>Nombre de séries</span>
                    <StepperField
                      value={entry.sets.length}
                      onChange={(count) => handleSetCountChange(entry.exerciseId, count)}
                      step={1}
                      min={1}
                      aria-label="Nombre de séries"
                    />
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
    </div>
  )
}
