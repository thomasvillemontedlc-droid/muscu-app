import { finishSessionEarly, pickNextExercise } from '../../domain/sessionRunner.js'
import { BigButton } from '../../components/BigButton.jsx'

export function PickExerciseView({ session, data, setData }) {
  const remaining = session.entries.filter((e) => !session.completedExerciseIds.includes(e.exerciseId))

  function handlePick(exerciseId) {
    setData({ ...data, sessions: pickNextExercise(data.sessions, session.id, exerciseId) })
  }

  function handleFinish() {
    setData({ ...data, sessions: finishSessionEarly(data.sessions, session.id) })
  }

  return (
    <div className="page">
      <h1>Exercice suivant</h1>
      <p className="last-performance">{session.templateName}</p>

      <ul className="pick-exercise-list">
        {remaining.map((entry) => (
          <li key={entry.exerciseId}>
            <BigButton onClick={() => handlePick(entry.exerciseId)}>{entry.exerciseName}</BigButton>
          </li>
        ))}
      </ul>

      <button type="button" className="subtle-button" onClick={handleFinish}>
        Terminer la séance
      </button>
    </div>
  )
}
