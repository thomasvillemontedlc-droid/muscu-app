import { getLastPerformance } from '../../domain/history.js'
import { updateSet } from '../../domain/sessions.js'
import { finishCurrentExerciseEarly, validateCurrentSet } from '../../domain/sessionRunner.js'
import { unlockAudio } from '../../lib/alarm.js'
import { getExerciseIllustration } from '../../illustrations/registry.js'
import { GenericIllustration } from '../../illustrations/Generic.jsx'
import { NumberField } from '../../components/NumberField.jsx'
import { BigButton } from '../../components/BigButton.jsx'

export function ExerciseView({ session, data, setData }) {
  const entry = session.entries.find((e) => e.exerciseId === session.currentExerciseId)
  const set = entry.sets[session.currentSetIndex]
  const otherSessions = data.sessions.filter((s) => s.id !== session.id)
  const last = getLastPerformance(otherSessions, entry.exerciseId)
  const Illustration = getExerciseIllustration(entry.exerciseName) ?? GenericIllustration

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

  function handleValidate() {
    // Débloque l'audio pendant ce geste utilisateur, pour que l'alarme
    // puisse sonner plus tard sans interaction directe (voir lib/alarm.js).
    unlockAudio()
    setData({ ...data, sessions: validateCurrentSet(data.sessions, session.id) })
  }

  function handleFinishExercise() {
    setData({ ...data, sessions: finishCurrentExerciseEarly(data.sessions, session.id) })
  }

  return (
    <div className="page">
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

      <Illustration className="exercise-active__illustration" />

      <div className="exercise-active__fields">
        <label className="exercise-active__field">
          <span>Répétitions</span>
          <NumberField
            className="exercise-active__input"
            value={set.reps}
            onChange={handleRepsChange}
            aria-label="Répétitions"
          />
        </label>
        <label className="exercise-active__field">
          <span>Poids (kg)</span>
          <NumberField
            className="exercise-active__input"
            decimal
            value={set.weight}
            onChange={handleWeightChange}
            aria-label="Poids en kg"
          />
        </label>
      </div>

      <BigButton onClick={handleValidate}>Valider la série</BigButton>

      {session.currentSetIndex > 0 && (
        <BigButton variant="secondary" onClick={handleFinishExercise}>
          Terminer cet exercice
        </BigButton>
      )}
    </div>
  )
}
