import { useState } from 'react'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { getSessionsGroupedByDate, getWeekActivity } from '../domain/history.js'
import { deleteSession, getSessionStatus } from '../domain/sessions.js'
import { getEntryTrends, getTrendFromDiff, getVolumeProgress } from '../domain/sessionSummary.js'
import { getMuscleIntensities, getMuscleVolumes, hasAnyIntensity } from '../domain/muscleHeatmap.js'
import { TrendDot } from '../components/TrendDot.jsx'
import { BodyHeatmap, BodyHeatmapLegend } from '../components/BodyHeatmap.jsx'

function formatVolume(kg) {
  return `${kg.toLocaleString('fr-FR')}kg`
}

const STATUS_LABELS = {
  done: '✓ Faite',
  partial: '◐ Partielle',
  'not-done': 'Non faite',
}

const WEEKDAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
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
  const { data, setData } = useAppDataContext()
  const groups = getSessionsGroupedByDate(data.sessions)
  const week = getWeekActivity(data.sessions)
  const today = new Date()
  const [expandedHeatmaps, setExpandedHeatmaps] = useState(new Set())

  function handleDeleteSession(sessionId) {
    if (!window.confirm('Supprimer cette séance ? Cette action est définitive.')) return
    setData({ ...data, sessions: deleteSession(data.sessions, sessionId) })
  }

  function toggleHeatmap(sessionId) {
    setExpandedHeatmaps((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  return (
    <div className="page">
      <h1>Historique</h1>

      <div className="week-tracker">
        {week.map((day, index) => (
          <div key={index} className="week-tracker__day">
            <span className="week-tracker__label">{WEEKDAY_LETTERS[index]}</span>
            <span className={`week-tracker__circle week-tracker__circle--${day.status}`}>
              {day.status === 'done' && '✓'}
            </span>
            {isSameDay(day.date, today) && <span className="week-tracker__today" />}
          </div>
        ))}
      </div>

      {groups.length === 0 && <p className="empty-state">Aucune séance enregistrée pour l'instant.</p>}

      {groups.map((group) => (
        <section key={group.day} className="history-day">
          <h2 className="history-day__date">{formatDay(group.day)}</h2>

          {group.sessions.map((session) => {
            const status = getSessionStatus(session)
            const trends = getEntryTrends(data.sessions, session)
            const volumeProgress = getVolumeProgress(data.sessions, session)
            const isHeatmapExpanded = expandedHeatmaps.has(session.id)
            const intensities = getMuscleIntensities(getMuscleVolumes(session))
            const hasHeatmap = hasAnyIntensity(intensities)

            return (
              <div key={session.id} className="history-session">
                <div className="history-session__header">
                  <span className="history-session__name">{session.templateName}</span>
                  <span className={`history-session__status history-session__status--${status}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>

                <p className="history-session__volume">
                  Volume : {formatVolume(volumeProgress.volume)}
                  {volumeProgress.diff != null && (
                    <span className={`volume-diff volume-diff--${getTrendFromDiff(volumeProgress.diff)}`}>
                      {' '}
                      ({volumeProgress.diff >= 0 ? '+' : ''}
                      {formatVolume(volumeProgress.diff)}
                      {volumeProgress.percent != null
                        ? `, ${volumeProgress.diff >= 0 ? '+' : ''}${volumeProgress.percent}%`
                        : ''}
                      )
                    </span>
                  )}
                </p>

                <ul className="history-session__exercises">
                  {session.entries.map((entry) => (
                    <li key={entry.exerciseId}>
                      <span className="history-session__exercise-name">
                        <TrendDot trend={trends[entry.exerciseId]} />
                        {entry.exerciseName}
                      </span>
                      <span className="history-session__sets">
                        {entry.sets.map((s) => `${s.weight}kg×${s.reps}`).join(', ')}
                      </span>
                    </li>
                  ))}
                </ul>

                {hasHeatmap && (
                  <>
                    <button type="button" className="subtle-button" onClick={() => toggleHeatmap(session.id)}>
                      {isHeatmapExpanded ? 'Masquer la carte de chaleur' : 'Voir la carte de chaleur'}
                    </button>
                    {isHeatmapExpanded && (
                      <>
                        <BodyHeatmap intensities={intensities} />
                        <BodyHeatmapLegend intensities={intensities} />
                      </>
                    )}
                  </>
                )}

                <button
                  type="button"
                  className="subtle-button subtle-button--danger"
                  onClick={() => handleDeleteSession(session.id)}
                >
                  Supprimer cette séance
                </button>
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
