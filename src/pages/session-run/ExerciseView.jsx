import { useState } from 'react'
import { getLastPerformance } from '../../domain/history.js'
import { updateSet } from '../../domain/sessions.js'
import { setExerciseBarWeight, setExerciseWeightMode } from '../../domain/exercises.js'
import {
  finishCurrentExerciseEarly,
  goToExerciseList,
  goToPreviousSet,
  validateCurrentSet,
} from '../../domain/sessionRunner.js'
import { unlockAudio } from '../../lib/alarm.js'
import { vibrateSuccess } from '../../lib/haptics.js'
import { useRestTimer } from '../../hooks/useRestTimer.js'
import { RestBanner } from '../../components/RestBanner.jsx'
import { ExerciseImage } from '../../components/ExerciseImage.jsx'
import { NumberField } from '../../components/NumberField.jsx'
import { WeightField } from '../../components/WeightField.jsx'
import { Confetti } from '../../components/Confetti.jsx'
import { BigButton } from '../../components/BigButton.jsx'

// Délai pendant lequel le retour visuel (vert + coche + confettis) reste
// affiché avant de réellement avancer à la série/l'écran suivant — assez
// court pour ne pas ralentir l'enchaînement, assez long pour être perçu.
const VALIDATE_FEEDBACK_MS = 450

export function ExerciseView({ session, data, setData }) {
  const [validating, setValidating] = useState(false)
  const timer = useRestTimer(session)
  const entry = session.entries.find((e) => e.exerciseId === session.currentExerciseId)
  const set = entry.sets[session.currentSetIndex]
  const exercise = data.exercises.find((e) => e.id === entry.exerciseId)
  const otherSessions = data.sessions.filter((s) => s.id !== session.id)
  const last = getLastPerformance(otherSessions, entry.exerciseId)

  function handleRepsChange(reps) {
    setData({
      ...data,
      sessions: updateSet(data.sessions, session.id, entry.exerciseId, session.currentSetIndex, { reps }),
    })
  }

  function handleWeightChange(weight) {
    setData({
      ...data,
      sessions: updateSet(data.sessions, session.id, entry.exerciseId, session.currentSetIndex, { weight }),
    })
  }

  function handleWeightModeChange(weightInputMode) {
    setData({ ...data, exercises: setExerciseWeightMode(data.exercises, entry.exerciseId, weightInputMode) })
  }

  function handleBarWeightChange(barWeight) {
    setData({ ...data, exercises: setExerciseBarWeight(data.exercises, entry.exerciseId, barWeight) })
  }

  function handleValidate() {
    if (validating) return
    // Débloque l'audio pendant ce geste utilisateur, pour que l'alarme
    // puisse sonner plus tard sans interaction directe (voir lib/alarm.js).
    unlockAudio()
    vibrateSuccess()
    setValidating(true)
    setTimeout(() => {
      setData((current) => ({ ...current, sessions: validateCurrentSet(current.sessions, session.id) }))
      setValidating(false)
    }, VALIDATE_FEEDBACK_MS)
  }

  function handleFinishExercise() {
    setData({ ...data, sessions: finishCurrentExerciseEarly(data.sessions, session.id) })
  }

  function handlePreviousSet() {
    setData({ ...data, sessions: goToPreviousSet(data.sessions, session.id) })
  }

  function handleGoToList() {
    setData({ ...data, sessions: goToExerciseList(data.sessions, session.id) })
  }

  return (
    <div className="page">
      <div className="exercise-active__nav">
        {session.currentSetIndex > 0 && (
          <button type="button" className="back-link" onClick={handlePreviousSet}>
            ← Série précédente
          </button>
        )}
        <button type="button" className="back-link" onClick={handleGoToList}>
          ← Tous les exercices
        </button>
      </div>

      <RestBanner timer={timer} />

      <h1>{entry.exerciseName}</h1>
      <p className="session-date">
        Série {session.currentSetIndex + 1} / {entry.sets.length}
      </p>

      {last ? (
        <p className="last-performance">
          Dernière fois ({new Date(last.date).toLocaleDateString('fr-FR')}) :{' '}
          {last.sets.map((s) => `${s.weight}kg×${s.reps}`).join(', ')}
        </p>
      ) : (
        <p className="last-performance last-performance--empty">Première fois sur cet exercice</p>
      )}

      <ExerciseImage key={entry.exerciseName} name={entry.exerciseName} className="exercise-active__image" />

      <div className={`exercise-active__fields${validating ? ' exercise-active__fields--validated' : ''}`}>
        {validating && <span className="exercise-active__check">✓</span>}
        {validating && <Confetti />}

        <label className="exercise-active__field">
          <span>Répétitions</span>
          <NumberField
            className="exercise-active__input"
            value={set.reps}
            onChange={handleRepsChange}
            disabled={validating}
            aria-label="Répétitions"
          />
        </label>
        <label className="exercise-active__field">
          <span>Poids (kg)</span>
          <WeightField
            className="exercise-active__input"
            exercise={exercise}
            value={set.weight}
            onChange={handleWeightChange}
            onModeChange={handleWeightModeChange}
            onBarWeightChange={handleBarWeightChange}
            aria-label="Poids en kg"
          />
        </label>
      </div>

      <BigButton onClick={handleValidate} disabled={validating}>
        {validating ? 'Série validée ✓' : 'Valider la série'}
      </BigButton>

      {session.currentSetIndex > 0 && (
        <BigButton variant="secondary" onClick={handleFinishExercise} disabled={validating}>
          Terminer cet exercice
        </BigButton>
      )}
    </div>
  )
}
