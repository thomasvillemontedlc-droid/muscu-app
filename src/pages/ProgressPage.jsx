import { useState } from 'react'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { getPeriodStats, getSessionsInPeriod, getSessionsPerWeek } from '../domain/progress.js'
import { getCumulativeMuscleVolumes, getMuscleIntensities } from '../domain/muscleHeatmap.js'
import { getMuscleCoverage, suggestSessionsForMissingMuscles } from '../domain/muscleCoverage.js'
import { getMuscleLabel } from '../domain/muscleGroups.js'
import { getMostNeglectedMuscles } from '../domain/recovery.js'
import { BodyHeatmap, BodyHeatmapLegend } from '../components/BodyHeatmap.jsx'
import { MuscleRecoveryRow } from '../components/MuscleRecoveryRow.jsx'
import { WeeklyBarChart } from '../components/WeeklyBarChart.jsx'
import { TourStep } from '../components/TourStep.jsx'

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

  const sessionsInPeriod = getSessionsInPeriod(data.sessions, period)
  const stats = getPeriodStats(sessionsInPeriod)
  const weeks = getSessionsPerWeek(data.sessions, period)

  const coverage = getMuscleCoverage(sessionsInPeriod)
  const { suggestions, uncovered } = suggestSessionsForMissingMuscles(data.templates, data.exercises, coverage.missing)

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
        <h2>Groupes musculaires travaillés</h2>
        {coverage.worked.length === 0 ? (
          <p className="empty-state">Aucun muscle travaillé sur cette période.</p>
        ) : (
          <ul className="muscle-coverage-list">
            {coverage.worked.map((id) => (
              <li key={id}>{getMuscleLabel(id)}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="progress-section">
        <h2>Muscles non sollicités</h2>
        {coverage.missing.length === 0 ? (
          <p className="empty-state">Tous les groupes musculaires ont été travaillés sur cette période.</p>
        ) : (
          <>
            <ul className="muscle-coverage-list muscle-coverage-list--missing">
              {coverage.missing.map((id) => (
                <li key={id}>{getMuscleLabel(id)}</li>
              ))}
            </ul>

            {suggestions.length > 0 && (
              <div className="muscle-coverage-suggestions">
                <p className="progress-section__hint">Séances existantes qui couvrent le mieux ces manques :</p>
                <ul>
                  {suggestions.map(({ template, covers }) => (
                    <li key={template.id}>
                      <span className="muscle-coverage-suggestions__name">{template.name}</span>
                      <span className="muscle-coverage-suggestions__covers">
                        {covers.map((c) => c.label).join(', ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {uncovered.length > 0 && (
              <p className="progress-section__hint">
                Aucune séance existante ne couvre : {uncovered.map((c) => c.label).join(', ')}.
              </p>
            )}
          </>
        )}
      </section>

      <section id="tip-progress-heatmap" className="progress-section">
        <h2>Carte musculaire cumulée</h2>
        <BodyHeatmap intensities={intensities} />
        <BodyHeatmapLegend intensities={intensities} />
      </section>

      <TourStep
        id="progress-heatmap"
        selector="#tip-progress-heatmap"
        text="Tendances par exercice et carte musculaire cumulée des zones travaillées."
      />

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
