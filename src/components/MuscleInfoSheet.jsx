import { useEffect } from 'react'
import { getExercisesForMuscle } from '../domain/muscleGroups.js'

const STATUS_LABELS = {
  recovering: 'En récupération',
  recovered: 'Récupéré',
  neglected: 'Négligé',
  never: 'Jamais sollicité',
}

function formatLastWorked(daysSince) {
  if (daysSince == null) return null
  if (daysSince === 0) return "Dernière sollicitation : aujourd'hui"
  if (daysSince === 1) return 'Dernière sollicitation : hier'
  return `Dernière sollicitation : il y a ${daysSince} jours`
}

// Fiche ouverte en touchant une zone de la carte musculaire (Progression) :
// pour chaque groupe rattaché à la zone (un seul en général, trois pour les
// abdos, biceps + brachial pour le bras), son état de récupération (voir
// domain/recovery.js) et des exercices du catalogue pour le travailler.
// `recovery` = sortie de getMuscleRecovery / getMostNeglectedMuscles ;
// `exercises` = exercices utilisés dans les séances types de l'utilisateur
// (mis en avant : il sait déjà les faire).
export function MuscleInfoSheet({ muscleIds, recovery, exercises, onClose }) {
  useEffect(() => {
    if (!muscleIds) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [muscleIds, onClose])

  if (!muscleIds) return null

  const items = muscleIds.map((id) => recovery.find((r) => r.muscleId === id)).filter(Boolean)

  return (
    <div className="muscle-sheet-overlay" onClick={onClose}>
      <div
        className="muscle-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={items.map((i) => i.label).join(', ')}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="muscle-sheet__close" onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        {items.map((item) => {
          const suggested = getExercisesForMuscle(item.muscleId, exercises)
          const lastWorked = formatLastWorked(item.daysSince)
          return (
            <section key={item.muscleId} className="muscle-sheet__muscle">
              <h2 className="muscle-sheet__title">{item.label}</h2>
              <span className={`muscle-sheet__status muscle-sheet__status--${item.status}`}>
                {STATUS_LABELS[item.status]}
              </span>
              {lastWorked && <p className="muscle-sheet__detail">{lastWorked}</p>}

              <p className="muscle-sheet__subtitle">Exercices pour le travailler</p>
              {suggested.length === 0 ? (
                <p className="muscle-sheet__detail">Aucun exercice du catalogue ne cible ce muscle.</p>
              ) : (
                <ul className="muscle-sheet__exercises">
                  {suggested.map((exercise) => (
                    <li key={exercise.name}>
                      <span>
                        {exercise.name}
                        {!exercise.isPrimary && <span className="muscle-sheet__secondary"> (secondaire)</span>}
                      </span>
                      {exercise.isInLibrary && <small>Dans tes séances</small>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
