import { useState } from 'react'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { getSessionsGroupedByDate, getWeekActivity } from '../domain/history.js'
import { deleteSession, getSessionStatus, setEntryFeeling, updateSingleSet } from '../domain/sessions.js'
import { setExerciseBarWeight, setExercisePulleyLevel, setExerciseWeightMode } from '../domain/exercises.js'
import { buildSessionSummary, getTrendFromDiff } from '../domain/sessionSummary.js'
import { getMuscleIntensities, getMuscleVolumes, hasAnyIntensity } from '../domain/muscleHeatmap.js'
import { formatSet } from '../lib/formatSet.js'
import { TrendDot } from '../components/TrendDot.jsx'
import { BodyHeatmap, BodyHeatmapLegend } from '../components/BodyHeatmap.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { FeelingPicker, getFeelingLabel } from '../components/FeelingPicker.jsx'
import { SetRow } from '../components/SetRow.jsx'
import { TourStep } from '../components/TourStep.jsx'

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
  // Édition a posteriori d'une séance déjà faite (poids/reps/ressenti) : un
  // simple bool d'affichage, aucune des fonctions utilisées ci-dessous
  // (updateSingleSet, setEntryFeeling) ne touche phase/completedExerciseIds,
  // donc le statut de la séance (faite/partielle) ne bouge jamais ici.
  const [editingSessionId, setEditingSessionId] = useState(null)

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

  function handleEditWeightChange(sessionId, exerciseId, setIndex, weight) {
    setData((current) => ({
      ...current,
      sessions: updateSingleSet(current.sessions, sessionId, exerciseId, setIndex, { weight }),
    }))
  }

  function handleEditRepsChange(sessionId, exerciseId, setIndex, reps) {
    setData((current) => ({
      ...current,
      sessions: updateSingleSet(current.sessions, sessionId, exerciseId, setIndex, { reps }),
    }))
  }

  function handleEditWeightModeChange(exerciseId, weightInputMode) {
    setData((current) => ({ ...current, exercises: setExerciseWeightMode(current.exercises, exerciseId, weightInputMode) }))
  }

  function handleEditBarWeightChange(exerciseId, barWeight) {
    setData((current) => ({ ...current, exercises: setExerciseBarWeight(current.exercises, exerciseId, barWeight) }))
  }

  function handleEditPulleyLevelChange(exerciseId, pulleyLevel) {
    setData((current) => ({ ...current, exercises: setExercisePulleyLevel(current.exercises, exerciseId, pulleyLevel) }))
  }

  function handleEditFeelingChange(sessionId, exerciseId, feeling) {
    setData((current) => ({ ...current, sessions: setEntryFeeling(current.sessions, sessionId, exerciseId, feeling) }))
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
            const isEditing = editingSessionId === session.id

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
                    const entryExercise = data.exercises.find((e) => e.id === entry.exerciseId)
                    return (
                      <li key={entry.exerciseId}>
                        <span className="history-session__exercise-name">
                          <TrendDot trend={progress?.trend ?? 'neutral'} />
                          {entry.exerciseName}
                        </span>

                        {isEditing ? (
                          <>
                            {entry.sets.map((set, setIndex) => (
                              <SetRow
                                key={setIndex}
                                index={setIndex}
                                weight={set.weight}
                                reps={set.reps}
                                side={set.side}
                                exercise={entryExercise}
                                onChangeWeight={(weight) => handleEditWeightChange(session.id, entry.exerciseId, setIndex, weight)}
                                onChangeReps={(reps) => handleEditRepsChange(session.id, entry.exerciseId, setIndex, reps)}
                                onChangeWeightMode={(mode) => handleEditWeightModeChange(entry.exerciseId, mode)}
                                onChangeBarWeight={(barWeight) => handleEditBarWeightChange(entry.exerciseId, barWeight)}
                                onChangePulleyLevel={(level) => handleEditPulleyLevelChange(entry.exerciseId, level)}
                                removeDisabled
                              />
                            ))}
                            <FeelingPicker
                              feeling={entry.feeling}
                              onChange={(feeling) => handleEditFeelingChange(session.id, entry.exerciseId, feeling)}
                            />
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </li>
                    )
                  })}
                </ul>

                <button
                  type="button"
                  className="subtle-button"
                  onClick={() => setEditingSessionId(isEditing ? null : session.id)}
                >
                  {isEditing ? 'Terminé' : 'Modifier cette séance'}
                </button>

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

      <TourStep
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
