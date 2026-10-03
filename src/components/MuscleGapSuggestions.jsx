import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { getInProgressSession, startSessionFromTemplate } from '../domain/sessions.js'
import { getNextTemplateOverrideId, setNextTemplate } from '../domain/program.js'

// Partie commune à "Muscles non sollicités" et "Déséquilibre sur le long
// terme" (ProgressPage.jsx) : étant donné des muscles à combler, les
// séances existantes qui les couvrent le mieux (voir
// domain/muscleCoverage.js#suggestSessionsForMissingMuscles), et ceux
// qu'aucune séance existante ne couvre.
// Toucher une suggestion ouvre deux actions : la lancer tout de suite, ou
// la mettre en "prochaine séance" (mise en avant sur l'écran Séance, voir
// domain/program.js#getNextTemplateOverrideId).
export function MuscleGapSuggestions({ suggestions, uncovered }) {
  const { data, setData } = useAppDataContext()
  const navigate = useNavigate()
  const [openId, setOpenId] = useState(null)

  const inProgressSession = getInProgressSession(data.sessions)
  const nextTemplateId = getNextTemplateOverrideId(data.nextTemplate, data.sessions, data.templates)

  function handleStart(template) {
    const { session, sessions } = startSessionFromTemplate(data.sessions, template, data.exercises)
    setData({ ...data, sessions })
    navigate(`/sessions/${session.id}`)
  }

  function handleSetNext(template) {
    setData({ ...data, nextTemplate: setNextTemplate(template.id) })
  }

  return (
    <>
      {suggestions.length > 0 && (
        <div className="muscle-coverage-suggestions">
          <p className="muscle-coverage-suggestions__title">Séances existantes qui couvrent le mieux ces manques :</p>
          <ul>
            {suggestions.map(({ template, covers }) => {
              const isOpen = openId === template.id
              const isNext = nextTemplateId === template.id
              const isEmpty = template.exerciseIds.length === 0
              return (
                <li key={template.id} className={`gap-suggestion${isOpen ? ' gap-suggestion--open' : ''}`}>
                  <button
                    type="button"
                    className="gap-suggestion__head"
                    aria-expanded={isOpen}
                    onClick={() => setOpenId(isOpen ? null : template.id)}
                  >
                    <span className="muscle-coverage-suggestions__name">{template.name}</span>
                    <span className="muscle-coverage-suggestions__covers">{covers.map((c) => c.label).join(', ')}</span>
                    {isNext && <span className="gap-suggestion__badge">Prochaine séance</span>}
                  </button>

                  {isOpen && (
                    <div className="gap-suggestion__actions">
                      <button
                        type="button"
                        className="gap-suggestion__action gap-suggestion__action--primary"
                        onClick={() => handleStart(template)}
                        disabled={isEmpty || inProgressSession != null}
                      >
                        Lancer
                      </button>
                      <button
                        type="button"
                        className="gap-suggestion__action"
                        onClick={() => handleSetNext(template)}
                        disabled={isNext}
                      >
                        {isNext ? '✓ Prochaine séance' : 'Prochaine séance'}
                      </button>
                      {inProgressSession && (
                        <p className="gap-suggestion__note">
                          Une séance est déjà en cours ({inProgressSession.templateName}) : termine-la avant d'en lancer
                          une autre.
                        </p>
                      )}
                      {isEmpty && <p className="gap-suggestion__note">Cette séance ne contient aucun exercice.</p>}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {uncovered.length > 0 && (
        <p className="progress-section__hint">
          Aucune séance existante ne couvre : {uncovered.map((c) => c.label).join(', ')}.
        </p>
      )}
    </>
  )
}
