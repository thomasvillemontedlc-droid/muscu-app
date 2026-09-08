import { useNavigate } from 'react-router-dom'
import { buildSessionSummary } from '../../domain/sessionSummary.js'
import { BigButton } from '../../components/BigButton.jsx'

function formatRest(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  if (seconds === 0) return `${minutes}min`
  return `${minutes}min${String(seconds).padStart(2, '0')}`
}

export function FinishedView({ session, data }) {
  const navigate = useNavigate()
  const summary = buildSessionSummary(data.sessions, session)
  const restLabel = formatRest(session.restSeconds)

  return (
    <div className="page">
      <h1>Séance terminée 🎉</h1>
      <p className="last-performance">{session.templateName}</p>

      {summary.length === 0 ? (
        <p className="empty-state">Aucun exercice complété.</p>
      ) : (
        <ul className="session-summary">
          {summary.map((item) => (
            <li key={item.exerciseId} className="session-summary__item">
              <div className="session-summary__header">
                <span className="session-summary__name">{item.exerciseName}</span>
                <span className="session-summary__rest">Repos {restLabel}</span>
              </div>
              <p className="session-summary__sets">{item.sets.map((s) => `${s.weight}kg×${s.reps}`).join(', ')}</p>
              {item.progressKg != null && (
                <p className="session-summary__progress">
                  Bravo, tu as augmenté ta charge de {item.progressKg}kg
                  {item.progressPercent != null ? ` (+${item.progressPercent}%)` : ''} sur {item.exerciseName}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <BigButton onClick={() => navigate('/')}>Retour aux séances</BigButton>
    </div>
  )
}
