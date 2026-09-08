import { Link, useParams } from 'react-router-dom'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { getExerciseHistory } from '../domain/history.js'

export function HistoryPage() {
  const { exerciseId } = useParams()
  const { data } = useAppDataContext()

  if (!exerciseId) {
    return (
      <div className="page">
        <h1>Historique</h1>
        {data.exercises.length === 0 && (
          <p className="empty-state">Aucun exercice enregistré pour l'instant.</p>
        )}
        <ul className="exercise-history-list">
          {data.exercises.map((exercise) => (
            <li key={exercise.id}>
              <Link to={`/history/${exercise.id}`} className="exercise-history-list__link">
                {exercise.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const exercise = data.exercises.find((e) => e.id === exerciseId)
  const history = getExerciseHistory(data.sessions, exerciseId)

  return (
    <div className="page">
      <Link to="/history" className="back-link">
        ← Historique
      </Link>
      <h1>{exercise?.name ?? 'Exercice supprimé'}</h1>

      {history.length === 0 && <p className="empty-state">Aucune séance enregistrée pour cet exercice.</p>}

      <ul className="history-entries">
        {history.map((entry) => (
          <li key={entry.sessionId} className="history-entry">
            <span className="history-entry__date">
              {new Date(entry.date).toLocaleDateString('fr-FR')} {entry.done ? '✓' : '(non terminée)'}
            </span>
            <span className="history-entry__sets">
              {entry.sets.map((s) => `${s.weight}kg×${s.reps}`).join(', ')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
