import { useNavigate } from 'react-router-dom'
import {
  buildSessionSummary,
  getCompletionProgress,
  getSessionStats,
  getTrendFromDiff,
  getVolumeProgress,
} from '../../domain/sessionSummary.js'
import { getMuscleIntensities, getMuscleVolumes, hasAnyIntensity } from '../../domain/muscleHeatmap.js'
import { getPrimaryMusclesWorked, getStretchSuggestions } from '../../domain/stretches.js'
import { TrendDot } from '../../components/TrendDot.jsx'
import { BodyHeatmap, BodyHeatmapLegend } from '../../components/BodyHeatmap.jsx'
import { BigButton } from '../../components/BigButton.jsx'

function formatRest(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  if (seconds === 0) return `${minutes}min`
  return `${minutes}min${String(seconds).padStart(2, '0')}`
}

function formatVolume(kg) {
  return `${kg.toLocaleString('fr-FR')}kg`
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
  const summary = buildSessionSummary(data.sessions, session)
  const completionProgress = getCompletionProgress(data.sessions, session)
  const volumeProgress = getVolumeProgress(data.sessions, session)
  const stats = getSessionStats(session)
  const intensities = getMuscleIntensities(getMuscleVolumes(session))
  const duration = formatDuration(stats.durationMs)
  const stretches = getStretchSuggestions(getPrimaryMusclesWorked(session))

  return (
    <div className="page">
      <h1>Séance terminée 🎉</h1>
      <p className="last-performance">{session.templateName}</p>

      {hasAnyIntensity(intensities) && (
        <>
          <BodyHeatmap intensities={intensities} />
          <BodyHeatmapLegend intensities={intensities} />
        </>
      )}

      <ul className="session-stats">
        {duration && <li>Durée : {duration}</li>}
        <li>{stats.totalSets} séries</li>
        <li>{stats.totalReps} répétitions</li>
      </ul>

      <p className="session-summary__volume">
        Volume total : {formatVolume(volumeProgress.volume)}
        {volumeProgress.diff != null && (
          <span className={`volume-diff volume-diff--${getTrendFromDiff(volumeProgress.diff)}`}>
            {' '}
            ({volumeProgress.diff >= 0 ? '+' : ''}
            {formatVolume(volumeProgress.diff)}
            {volumeProgress.percent != null ? `, ${volumeProgress.diff >= 0 ? '+' : ''}${volumeProgress.percent}%` : ''} vs
            dernière fois)
          </span>
        )}
      </p>

      {completionProgress && <p className="session-summary__completion">{completionProgress.message}</p>}

      {summary.length === 0 ? (
        <p className="empty-state">Aucun exercice complété.</p>
      ) : (
        <ul className="session-summary">
          {summary.map((item) => (
            <li key={item.exerciseId} className="session-summary__item">
              <div className="session-summary__header">
                <TrendDot trend={item.trend} />
                <span className="session-summary__name">{item.exerciseName}</span>
              </div>

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
        </section>
      )}

      <BigButton onClick={() => navigate('/history')}>Voir ma progression</BigButton>
    </div>
  )
}
