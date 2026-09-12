import { useState } from 'react'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import {
  getBestSetHistory,
  getCompletedExercisesInPeriod,
  getPeriodStats,
  getSessionsInPeriod,
  getSessionsPerWeek,
  getWeeklyBestLoad,
} from '../domain/progress.js'
import { getCumulativeMuscleVolumes, getMuscleIntensities } from '../domain/muscleHeatmap.js'
import { getMostNeglectedMuscles } from '../domain/recovery.js'
import { BodyHeatmap, BodyHeatmapLegend } from '../components/BodyHeatmap.jsx'
import { LoadTrendChart } from '../components/LoadTrendChart.jsx'
import { MuscleRecoveryRow } from '../components/MuscleRecoveryRow.jsx'
import { WeeklyBarChart } from '../components/WeeklyBarChart.jsx'

const PERIOD_OPTIONS = [
  { value: 'week', label: 'Cette semaine' },
  { value: '4w', label: '4 dernières semaines' },
  { value: '3m', label: '3 mois' },
  { value: 'all', label: 'Tout' },
]

function formatTotalDuration(ms) {
  const totalMinutes = Math.round(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}min`
  return `${hours}h${String(minutes).padStart(2, '0')}`
}

export function ProgressPage() {
  const { data } = useAppDataContext()
  const [period, setPeriod] = useState('week')
  const [exerciseId, setExerciseId] = useState('')

  const sessionsInPeriod = getSessionsInPeriod(data.sessions, period)
  const stats = getPeriodStats(sessionsInPeriod)
  const weeks = getSessionsPerWeek(data.sessions, period)
  const exercises = getCompletedExercisesInPeriod(data.sessions, period)
  const selectedExerciseId = exercises.some((e) => e.id === exerciseId) ? exerciseId : (exercises[0]?.id ?? '')
  const bestSets = selectedExerciseId ? getBestSetHistory(data.sessions, selectedExerciseId, period) : []
  const loadTrend = selectedExerciseId ? getWeeklyBestLoad(data.sessions, selectedExerciseId, period) : null

  const intensities = getMuscleIntensities(getCumulativeMuscleVolumes(sessionsInPeriod))
  const neglected = getMostNeglectedMuscles(data.sessions)

  return (
    <div className="page">
      <h1>Progression</h1>

      <label className="prep-field">
        <span>Période</span>
        <select className="prep-field__select" value={period} onChange={(e) => setPeriod(e.target.value)}>
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <ul className="session-stats">
        <li>
          {stats.count} séance{stats.count > 1 ? 's' : ''} terminée{stats.count > 1 ? 's' : ''}
        </li>
        <li>{formatTotalDuration(stats.totalDurationMs)} au total</li>
      </ul>

      <section className="progress-section">
        <h2>Séances par semaine</h2>
        <WeeklyBarChart weeks={weeks} />
      </section>

      <section className="progress-section">
        <h2>Par exercice</h2>
        {exercises.length === 0 ? (
          <p className="empty-state">Aucun exercice complété sur cette période.</p>
        ) : (
          <>
            <label className="prep-field">
              <span>Exercice</span>
              <select
                className="prep-field__select"
                value={selectedExerciseId}
                onChange={(e) => setExerciseId(e.target.value)}
              >
                {exercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </select>
            </label>

            {loadTrend && <LoadTrendChart weeks={loadTrend.weeks} unit={loadTrend.unit} />}

            <div className="progress-table-wrap">
              <table className="progress-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Charge</th>
                    <th>Répétitions</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSets.map((row, i) => (
                    <tr key={i}>
                      <td>{new Date(row.date).toLocaleDateString('fr-FR')}</td>
                      <td>{row.unit === 'time' ? '—' : `${row.weight}kg`}</td>
                      <td>{row.unit === 'time' ? `${row.reps}s` : row.reps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="progress-section">
        <h2>Carte musculaire cumulée</h2>
        <BodyHeatmap intensities={intensities} />
        <BodyHeatmapLegend intensities={intensities} />
      </section>

      <section className="progress-section">
        <h2>Récupération</h2>
        <p className="progress-section__hint">
          Jours écoulés depuis la dernière sollicitation. Récupéré : ≥ 48h. Négligé : plus de 10 jours sans
          sollicitation. Du plus négligé au plus récent.
        </p>
        <ul className="muscle-recovery-list">
          {neglected.map((item) => (
            <MuscleRecoveryRow key={item.muscleId} item={item} />
          ))}
        </ul>
      </section>
    </div>
  )
}
