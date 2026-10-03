import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { getExercisesForMuscle } from '../domain/muscleGroups.js'
import { getTemplatesForMuscle } from '../domain/muscleCoverage.js'
import { getInProgressSession, startSessionFromTemplate } from '../domain/sessions.js'
import { getNextTemplateOverrideId, setNextTemplate } from '../domain/program.js'
import { TemplateActionCard } from './TemplateActionCard.jsx'

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
// abdos, biceps + brachial pour le bras) - son état de récupération (voir
// domain/recovery.js), les séances types qui le travaillent déjà (cartes
// Lancer/Prochaine séance, voir components/TemplateActionCard.jsx, partagé
// avec MuscleGapSuggestions.jsx) et des exercices du catalogue pour le
// travailler. `recovery` = sortie de getMuscleRecovery / getMostNeglectedMuscles.
export function MuscleInfoSheet({ muscleIds, recovery, onClose }) {
  const { data, setData } = useAppDataContext()
  const navigate = useNavigate()
  const [openTemplateId, setOpenTemplateId] = useState(null)

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
  const inProgressSession = getInProgressSession(data.sessions)
  const nextTemplateId = getNextTemplateOverrideId(data.nextTemplate, data.sessions, data.templates)

  // Exercices déjà dans une séance type : mis en avant dans "Exercices pour
  // le travailler" (voir domain/muscleGroups.js#getExercisesForMuscle), le
  // catalogue complet étant semé chez tout le monde.
  const templateExerciseIds = new Set(data.templates.flatMap((t) => t.exerciseIds))
  const templateExercises = data.exercises.filter((e) => templateExerciseIds.has(e.id))

  function handleStart(template) {
    const { session, sessions } = startSessionFromTemplate(data.sessions, template, data.exercises)
    setData({ ...data, sessions })
    navigate(`/sessions/${session.id}`)
  }

  function handleSetNext(template) {
    setData({ ...data, nextTemplate: setNextTemplate(template.id) })
  }

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
          const suggestedExercises = getExercisesForMuscle(item.muscleId, templateExercises)
          const matchingTemplates = getTemplatesForMuscle(item.muscleId, data.templates, data.exercises)
          const lastWorked = formatLastWorked(item.daysSince)
          return (
            <section key={item.muscleId} className="muscle-sheet__muscle">
              <h2 className="muscle-sheet__title">{item.label}</h2>
              <span className={`muscle-sheet__status muscle-sheet__status--${item.status}`}>
                {STATUS_LABELS[item.status]}
              </span>
              {lastWorked && <p className="muscle-sheet__detail">{lastWorked}</p>}

              <p className="muscle-sheet__subtitle">Séances qui le travaillent</p>
              {matchingTemplates.length === 0 ? (
                <p className="muscle-sheet__detail">
                  Aucune de tes séances ne le travaille en principal. Ajoute un des exercices ci-dessous à une
                  séance.
                </p>
              ) : (
                <ul>
                  {matchingTemplates.map(({ template, exerciseNames }) => (
                    <TemplateActionCard
                      key={template.id}
                      template={template}
                      headerExtra={
                        <span className="muscle-coverage-suggestions__covers">{exerciseNames.join(', ')}</span>
                      }
                      isOpen={openTemplateId === template.id}
                      onToggle={() => setOpenTemplateId(openTemplateId === template.id ? null : template.id)}
                      isNext={nextTemplateId === template.id}
                      inProgressSession={inProgressSession}
                      onStart={() => handleStart(template)}
                      onSetNext={() => handleSetNext(template)}
                    />
                  ))}
                </ul>
              )}

              <p className="muscle-sheet__subtitle">Exercices pour le travailler</p>
              {suggestedExercises.length === 0 ? (
                <p className="muscle-sheet__detail">Aucun exercice du catalogue ne cible ce muscle.</p>
              ) : (
                <ul className="muscle-sheet__exercises">
                  {suggestedExercises.map((exercise) => (
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
