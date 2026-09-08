import { useNavigate } from 'react-router-dom'
import { buildSessionSummary, getCompletionProgress } from '../../domain/sessionSummary.js'
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
  const completionProgress = getCompletionProgress(data.sessions, session)

  return (
    <div className="page">
      <h1>Séance terminée 🎉</h1>
      <p className="last-performance">{session.templateName}</p>

      {completionProgress && <p className="session-summary__completion">{completionProgress.message}</p>}

      {summary.length === 0 ? (
        <p className="empty-state">Aucun exercice complété.</p>
      ) : (
        <ul className="session-summary">
          {summary.map((item) => (
            <li key={item.exerciseId} className="session-summary__item">
              <span className="session-summary__name">{item.exerciseName}</span>

              <ul className="session-summary__sets">
                {item.sets.map((s, i) => (
                  <li key={i}>
                    <span>
                      {s.weight}kg×{s.reps}
                    </span>
                    {s.restTakenSeconds != null && (
                      <span className="session-summary__rest">Repos {formatRest(s.restTakenSeconds)}</span>
                    )}
                  </li>
                ))}
              </ul>

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

      <BigButton onClick={() => navigate('/history')}>Voir ma progression</BigButton>
    </div>
  )
}
