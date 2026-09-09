import { useState } from 'react'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { getCumulativeMuscleVolumes, getMuscleIntensities } from '../domain/muscleHeatmap.js'
import { getMostNeglectedMuscles } from '../domain/recovery.js'
import { BodyHeatmap, BodyHeatmapLegend } from '../components/BodyHeatmap.jsx'
import { MuscleRecoveryRow } from '../components/MuscleRecoveryRow.jsx'

const PERIOD_DAYS = { '7': 7, '30': 30 }

function getSessionsInPeriod(sessions, days) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return sessions.filter((s) => new Date(s.date) >= cutoff)
}

export function MuscleMapPage() {
  const { data } = useAppDataContext()
  const [period, setPeriod] = useState('7')

  const sessionsInPeriod = getSessionsInPeriod(data.sessions, PERIOD_DAYS[period])
  const volumes = getCumulativeMuscleVolumes(sessionsInPeriod)
  const intensities = getMuscleIntensities(volumes)
  const neglected = getMostNeglectedMuscles(data.sessions)

  return (
    <div className="page">
      <h1>Carte musculaire</h1>

      <label className="prep-field">
        <span>Période</span>
        <select className="prep-field__select" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
        </select>
      </label>

      <BodyHeatmap intensities={intensities} />
      <BodyHeatmapLegend intensities={intensities} />

      <section className="muscle-map-section">
        <h2>Récupération</h2>
        <p className="muscle-map-section__hint">
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
