import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { getSessionsGroupedByDate } from '../domain/history.js'
import { getSessionStatus } from '../domain/sessions.js'

const STATUS_LABELS = {
  done: '✓ Faite',
  partial: '◐ Partielle',
  'not-done': 'Non faite',
}

// Construit une date locale à partir d'un "YYYY-MM-DD" sans passer par le
// parsing ISO natif de Date(), qui interprète ces chaînes en UTC et peut
// donc afficher le jour d'avant selon le fuseau horaire de l'utilisateur.
function formatDay(isoDay) {
  const [year, month, day] = isoDay.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function HistoryPage() {
  const { data } = useAppDataContext()
  const groups = getSessionsGroupedByDate(data.sessions)

  return (
    <div className="page">
      <h1>Historique</h1>

      {groups.length === 0 && <p className="empty-state">Aucune séance enregistrée pour l'instant.</p>}

      {groups.map((group) => (
        <section key={group.day} className="history-day">
          <h2 className="history-day__date">{formatDay(group.day)}</h2>

          {group.sessions.map((session) => {
            const status = getSessionStatus(session)
            return (
              <div key={session.id} className="history-session">
                <div className="history-session__header">
                  <span className="history-session__name">{session.templateName}</span>
                  <span className={`history-session__status history-session__status--${status}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>

                <ul className="history-session__exercises">
                  {session.entries.map((entry) => (
                    <li key={entry.exerciseId}>
                      <span className="history-session__exercise-name">{entry.exerciseName}</span>
                      <span className="history-session__sets">
                        {entry.sets.map((s) => `${s.weight}kg×${s.reps}`).join(', ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
