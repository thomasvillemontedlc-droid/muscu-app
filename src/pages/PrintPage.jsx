import { useLocation, useNavigate } from 'react-router-dom'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { buildSessionSummary, getSessionStats } from '../domain/sessionSummary.js'
import { formatSet } from '../lib/formatSet.js'
import { getFeelingLabel } from '../components/FeelingPicker.jsx'
import { BigButton } from '../components/BigButton.jsx'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// Vue dédiée à l'impression / export PDF : mise en page claire indépendante
// du thème sombre de l'app (voir styles/global.css .print-page), pas de
// navigation basse ni d'interactions superflues. Le "PDF" s'obtient via la
// boîte de dialogue d'impression du navigateur (destination "Enregistrer en
// PDF"), plutôt qu'une librairie de génération dédiée — même mécanisme pour
// les deux besoins, sans dépendance supplémentaire.
export function PrintPage() {
  const { data } = useAppDataContext()
  const location = useLocation()
  const navigate = useNavigate()
  const sessionIds = location.state?.sessionIds ?? null

  const sessions = sessionIds ? data.sessions.filter((s) => sessionIds.includes(s.id)) : []
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="print-page">
      <div className="print-page__toolbar">
        <button type="button" className="back-link" onClick={() => navigate(-1)}>
          ← Retour
        </button>
        <BigButton onClick={() => window.print()}>Imprimer / Exporter en PDF</BigButton>
      </div>

      {sorted.length === 0 ? (
        <p>Aucune séance à afficher. Reviens depuis Réglages en ayant choisi une sélection.</p>
      ) : (
        sorted.map((session) => {
          const stats = getSessionStats(session)
          const summary = buildSessionSummary(data.sessions, session)
          const summaryByExerciseId = new Map(summary.map((item) => [item.exerciseId, item]))
          const completedIds = session.completedExerciseIds ?? session.entries.map((e) => e.exerciseId)

          return (
            <section key={session.id} className="print-session">
              <h2>{session.templateName}</h2>
              <p className="print-session__meta">
                {formatDate(session.date)} — {stats.totalSets} séries, {stats.totalReps} répétitions
              </p>

              <ul className="print-session__exercises">
                {session.entries
                  .filter((entry) => completedIds.includes(entry.exerciseId))
                  .map((entry) => {
                    const progress = summaryByExerciseId.get(entry.exerciseId)
                    return (
                      <li key={entry.exerciseId}>
                        <strong>{entry.exerciseName}</strong>
                        <span>{entry.sets.map((s) => formatSet(s, entry.exerciseName)).join(', ')}</span>
                        {progress && progress.progressKg != null && (
                          <span>
                            {' '}
                            ({progress.progressKg > 0 ? '+' : ''}
                            {progress.progressKg}
                            {progress.progressUnit}
                            {progress.progressPercent != null
                              ? `, ${progress.progressKg > 0 ? '+' : ''}${progress.progressPercent}%`
                              : ''}{' '}
                            vs dernière fois)
                          </span>
                        )}
                        {entry.feeling && (entry.feeling.value || entry.feeling.note) && (
                          <em>
                            {' '}
                            — {getFeelingLabel(entry.feeling.value)}
                            {entry.feeling.note ? ` : ${entry.feeling.note}` : ''}
                          </em>
                        )}
                      </li>
                    )
                  })}
              </ul>
            </section>
          )
        })
      )}
    </div>
  )
}
