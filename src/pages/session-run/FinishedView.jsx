import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildSessionSummary, getCompletionProgress, getSessionStats, getTrendFromDiff } from '../../domain/sessionSummary.js'
import { getMuscleIntensities, getMuscleVolumes } from '../../domain/muscleHeatmap.js'
import { getPrimaryMusclesWorked, getStretchSuggestions } from '../../domain/stretches.js'
import { formatSet } from '../../lib/formatSet.js'
import { getFeelingLabel } from '../../components/FeelingPicker.jsx'
import { TrendDot } from '../../components/TrendDot.jsx'
import { BodyHeatmap, BodyHeatmapLegend } from '../../components/BodyHeatmap.jsx'
import { BigButton } from '../../components/BigButton.jsx'
import { RoutineRunner } from '../../components/RoutineRunner.jsx'

function formatRest(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  if (seconds === 0) return `${minutes}min`
  return `${minutes}min${String(seconds).padStart(2, '0')}`
}

function formatDuration(durationMs) {
  if (durationMs == null) return null
  const totalMinutes = Math.round(durationMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}min`
  return `${hours}h${String(minutes).padStart(2, '0')}`
}

export function FinishedView({ session, data }) {
  const navigate = useNavigate()
  const [runningStretches, setRunningStretches] = useState(false)
  const summary = buildSessionSummary(data.sessions, session)
  const completionProgress = getCompletionProgress(data.sessions, session)
  const stats = getSessionStats(session)
  const intensities = getMuscleIntensities(getMuscleVolumes(session))
  const duration = formatDuration(stats.durationMs)
  const stretches = getStretchSuggestions(getPrimaryMusclesWorked(session))

  if (runningStretches) {
    return (
      <RoutineRunner
        title="Étirements"
        hint="Suggestions générales, pas un programme de récupération personnalisé."
        initialItems={stretches.map((s) => ({
          id: s.muscleId,
          muscleLabel: s.muscleLabel,
          name: s.name,
          durationSeconds: s.holdSeconds,
        }))}
        skipLabel="Passer les étirements"
        onDone={() => setRunningStretches(false)}
      />
    )
  }

  return (
    <div className="page">
      <h1>Séance terminée 🎉</h1>
      <p className="last-performance">{session.templateName}</p>

      <BodyHeatmap intensities={intensities} />
      <BodyHeatmapLegend intensities={intensities} />

      <ul className="session-stats">
        {duration && <li>Durée : {duration}</li>}
        <li>{stats.totalSets} séries</li>
        <li>{stats.totalReps} répétitions</li>
      </ul>

      {completionProgress && <p className="session-summary__completion">{completionProgress.message}</p>}

      {summary.length === 0 ? (
        <p className="empty-state">Aucun exercice complété.</p>
      ) : (
        <ul className="session-summary">
          {summary.map((item) => (
            <li
              key={item.exerciseId}
              className={`session-summary__item${item.bestProgress ? ' session-summary__item--best' : ''}`}
            >
              <div className="session-summary__header">
                <TrendDot trend={item.trend} />
                <span className="session-summary__name">{item.exerciseName}</span>
                {item.bestProgress && <span className="session-summary__best-badge">🏆 Meilleure progression</span>}
              </div>

              <ul className="session-summary__sets">
                {item.sets.map((s, i) => (
                  <li key={i}>
                    <span>{formatSet(s, item.exerciseName)}</span>
                    {s.restTakenSeconds != null && (
                      <span className="session-summary__rest">Repos {formatRest(s.restTakenSeconds)}</span>
                    )}
                  </li>
                ))}
              </ul>

              {item.progressKg != null ? (
                <p className={`session-summary__progress volume-diff--${getTrendFromDiff(item.progressKg)}`}>
                  {item.progressKg > 0 ? '+' : ''}
                  {item.progressKg}
                  {item.progressUnit}
                  {item.progressPercent != null
                    ? ` (${item.progressKg > 0 ? '+' : ''}${item.progressPercent}%)`
                    : ''}{' '}
                  vs dernière fois
                </p>
              ) : (
                <p className="session-summary__progress session-summary__progress--muted">
                  Première fois sur cet exercice
                </p>
              )}

              {item.feeling && (item.feeling.value || item.feeling.note) && (
                <p className="session-summary__feeling">
                  {getFeelingLabel(item.feeling.value)}
                  {item.feeling.note ? ` — ${item.feeling.note}` : ''}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {stretches.length > 0 && (
        <section className="stretch-suggestions">
          <h2>Étirements suggérés</h2>
          <p className="stretch-suggestions__hint">
            Suggestions générales, pas un programme de récupération personnalisé.
          </p>
          <ul>
            {stretches.map((stretch) => (
              <li key={stretch.muscleId}>
                <span className="stretch-suggestions__muscle">{stretch.muscleLabel}</span>
                <span>{stretch.name}</span>
                <span className="stretch-suggestions__hold">{stretch.holdSeconds}s</span>
              </li>
            ))}
          </ul>
          <BigButton variant="secondary" onClick={() => setRunningStretches(true)}>
            Lancer les étirements
          </BigButton>
        </section>
      )}

      <BigButton onClick={() => navigate('/progress')}>Voir ma progression</BigButton>
    </div>
  )
}
