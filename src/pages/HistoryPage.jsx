import { useState } from 'react'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { getSessionsGroupedByDate, getWeekActivity } from '../domain/history.js'
import { deleteSession, getSessionStatus } from '../domain/sessions.js'
import { buildSessionSummary, getTrendFromDiff } from '../domain/sessionSummary.js'
import { getMuscleIntensities, getMuscleVolumes, hasAnyIntensity } from '../domain/muscleHeatmap.js'
import { formatSet } from '../lib/formatSet.js'
import { TrendDot } from '../components/TrendDot.jsx'
import { BodyHeatmap, BodyHeatmapLegend } from '../components/BodyHeatmap.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { getFeelingLabel } from '../components/FeelingPicker.jsx'
import { OnboardingTip } from '../components/OnboardingTip.jsx'

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
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  function confirmDeleteSession() {
    setData({ ...data, sessions: deleteSession(data.sessions, pendingDeleteId) })
    setPendingDeleteId(null)
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
            const summaryByExerciseId = new Map(
              buildSessionSummary(data.sessions, session).map((item) => [item.exerciseId, item]),
            )
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

                <ul className="history-session__exercises">
                  {session.entries.map((entry) => {
                    const progress = summaryByExerciseId.get(entry.exerciseId)
                    return (
                      <li key={entry.exerciseId}>
                        <span className="history-session__exercise-name">
                          <TrendDot trend={progress?.trend ?? 'neutral'} />
                          {entry.exerciseName}
                        </span>
                        <span className="history-session__sets">
                          {entry.sets.map((s) => formatSet(s, entry.exerciseName)).join(', ')}
                        </span>
                        {progress && progress.progressKg != null && (
                          <span className={`history-session__progress volume-diff--${getTrendFromDiff(progress.progressKg)}`}>
                            {progress.progressKg > 0 ? '+' : ''}
                            {progress.progressKg}
                            {progress.progressUnit}
                            {progress.progressPercent != null
                              ? ` (${progress.progressKg > 0 ? '+' : ''}${progress.progressPercent}%)`
                              : ''}{' '}
                            vs dernière fois
                          </span>
                        )}
                        {entry.feeling && (entry.feeling.value || entry.feeling.note) && (
                          <span className="history-session__feeling">
                            {getFeelingLabel(entry.feeling.value)}
                            {entry.feeling.note ? ` — ${entry.feeling.note}` : ''}
                          </span>
                        )}
                      </li>
                    )
                  })}
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
                  onClick={() => setPendingDeleteId(session.id)}
                >
                  Supprimer cette séance
                </button>
              </div>
            )
          })}
        </section>
      ))}

      <OnboardingTip
        id="history-status"
        selector=".history-session__status"
        text="Chaque séance garde un statut : faite, partielle ou non faite."
      />

      <ConfirmDialog
        open={pendingDeleteId != null}
        title="Supprimer cette séance ?"
        message="Cette action est définitive."
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDeleteSession}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
