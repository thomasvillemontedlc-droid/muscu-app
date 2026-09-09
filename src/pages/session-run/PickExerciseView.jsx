import { finishSessionEarly, pickExercise } from '../../domain/sessionRunner.js'
import { setEntryFeeling } from '../../domain/sessions.js'
import { useRestTimer } from '../../hooks/useRestTimer.js'
import { RestBanner } from '../../components/RestBanner.jsx'
import { FeelingPicker } from '../../components/FeelingPicker.jsx'
import { BigButton } from '../../components/BigButton.jsx'

export function PickExerciseView({ session, data, setData }) {
  const timer = useRestTimer(session)

  function handlePick(exerciseId) {
    setData({ ...data, sessions: pickExercise(data.sessions, session.id, exerciseId) })
  }

  function handleFinish() {
    setData({ ...data, sessions: finishSessionEarly(data.sessions, session.id) })
  }

  function handleFeelingChange(exerciseId, feeling) {
    setData({ ...data, sessions: setEntryFeeling(data.sessions, session.id, exerciseId, feeling) })
  }

  return (
    <div className="page">
      <h1>Exercices</h1>
      <p className="last-performance">{session.templateName}</p>

      <RestBanner timer={timer} />

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
            </li>
          )
        })}
      </ul>

      <button type="button" className="subtle-button" onClick={handleFinish}>
        Terminer la séance
      </button>
    </div>
  )
}
