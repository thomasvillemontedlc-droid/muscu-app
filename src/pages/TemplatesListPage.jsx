import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { createTemplate, deleteTemplate, sortTemplatesForToday } from '../domain/templates.js'
import { createTemplateFromModel, TEMPLATE_STRUCTURES } from '../domain/templateModels.js'
import { getNextProgramTemplateId } from '../domain/program.js'
import { getInProgressSession, startSessionFromTemplate } from '../domain/sessions.js'
import { BigButton } from '../components/BigButton.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { TourStep } from '../components/TourStep.jsx'

export function TemplatesListPage() {
  const { data, setData } = useAppDataContext()
  const [newName, setNewName] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const navigate = useNavigate()

  const inProgressSession = getInProgressSession(data.sessions)

  // Ce qui est mis en avant en haut de l'écran quand aucune séance n'est en
  // cours : la prochaine séance du programme hebdomadaire si un programme
  // est configuré, sinon l'habitude du jour de la semaine (voir
  // domain/templates.js#sortTemplatesForToday) — les deux répondent à la
  // même question ("quoi faire aujourd'hui"), le programme explicite prime
  // simplement sur l'habitude déduite.
  const sortedTemplates = sortTemplatesForToday(data.templates, data.sessions)
  const nextProgramTemplateId = getNextProgramTemplateId(data.weeklyProgram, data.sessions)
  const nextProgramTemplate = nextProgramTemplateId
    ? data.templates.find((t) => t.id === nextProgramTemplateId)
    : null
  const featuredTemplate = nextProgramTemplate ?? sortedTemplates[0]
  const isFeaturedFromProgram = featuredTemplate != null && featuredTemplate === nextProgramTemplate

  function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    const { template, templates } = createTemplate(data.templates, newName)
    setData({ ...data, templates })
    setNewName('')
    navigate(`/templates/${template.id}`)
  }

  // Un modèle ne fait que préremplir exercices et séries/répétitions par
  // défaut (voir domain/templateModels.js) : la séance type qui en résulte
  // est ensuite identique à une créée à la main, modifiable et renommable.
  function handleCreateFromModel(model) {
    const { template, templates, exercises } = createTemplateFromModel(data.templates, data.exercises, model)
    setData({ ...data, templates, exercises })
    navigate(`/templates/${template.id}`)
  }

  function confirmDelete() {
    setData({ ...data, templates: deleteTemplate(data.templates, pendingDeleteId) })
    setPendingDeleteId(null)
  }

  function handleStart(template) {
    const { session, sessions } = startSessionFromTemplate(data.sessions, template, data.exercises)
    setData({ ...data, sessions })
    navigate(`/sessions/${session.id}`)
  }

  return (
    <div className="page">
      <h1>Mes séances</h1>

      {inProgressSession ? (
        <section className="featured-session">
          <p className="featured-session__label">Séance en cours</p>
          <p className="featured-session__name">{inProgressSession.templateName}</p>
          <p className="featured-session__detail">
            {inProgressSession.completedExerciseIds.length} / {inProgressSession.entries.length} exercice(s) terminé(s)
          </p>
          <BigButton onClick={() => navigate(`/sessions/${inProgressSession.id}`)}>Reprendre ma séance</BigButton>
        </section>
      ) : (
        featuredTemplate && (
          <section className="featured-session">
            <p className="featured-session__label">
              {isFeaturedFromProgram ? 'Prochaine séance du programme' : "Suggéré pour aujourd'hui"}
            </p>
            <p className="featured-session__name">{featuredTemplate.name}</p>
            <ul className="featured-session__exercises">
              {featuredTemplate.exerciseIds.map((exerciseId) => {
                const exercise = data.exercises.find((e) => e.id === exerciseId)
                return <li key={exerciseId}>{exercise?.name ?? 'Exercice supprimé'}</li>
              })}
            </ul>
            <BigButton
              onClick={() => handleStart(featuredTemplate)}
              disabled={featuredTemplate.exerciseIds.length === 0}
            >
              Commencer {featuredTemplate.name}
            </BigButton>
          </section>
        )
      )}

      <Link to="/program" className="back-link">
        Programme hebdomadaire →
      </Link>

      <details id="tip-home-create" className="template-create-toggle">
        <summary>Créer une nouvelle séance</summary>

        <div className="template-create-panel">
          <p className="template-create-panel__label">Nouvelle séance — ces actions créent une séance type</p>

          <form className="template-create" onSubmit={handleCreate}>
            <input
              type="text"
              placeholder="Nom de la séance (ex: Push day)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              aria-label="Nom de la nouvelle séance type"
            />
            <BigButton type="submit">Séance personnalisée</BigButton>
          </form>

          <section className="template-model-picker">
            <p className="template-model-picker__hint">Modèles de séances</p>
            {TEMPLATE_STRUCTURES.map((structure) => (
              <details key={structure.key} className="template-model-group">
                <summary>{structure.label}</summary>
                <div className="template-model-group__buttons">
                  {structure.models.map((model) => (
                    <button
                      key={model.name}
                      type="button"
                      className="template-model-button"
                      onClick={() => handleCreateFromModel(model)}
                    >
                      <span className="template-model-button__name">{model.name}</span>
                      {model.subtitle && (
                        <span className="template-model-button__subtitle">{model.subtitle}</span>
                      )}
                    </button>
                  ))}
                </div>
              </details>
            ))}
          </section>
        </div>
      </details>

      {data.templates.length === 0 && <p className="empty-state">Aucune séance type pour l'instant.</p>}

      {data.templates.length > 0 && (
        <div className="template-list-header">
          <h2>Mes séances enregistrées</h2>
          <p className="template-list-header__hint">Déjà prêtes : lancez-les directement.</p>
        </div>
      )}

      <ul className="template-list">
        {sortedTemplates.map((template) => (
          <li key={template.id} className="template-list__item">
            <span className="template-list__name">{template.name}</span>
            <span className="template-list__count">{template.exerciseIds.length} exercice(s)</span>
            <div className="template-list__actions">
              <BigButton
                onClick={() => handleStart(template)}
                disabled={template.exerciseIds.length === 0}
              >
                Lancer
              </BigButton>
              <BigButton variant="secondary" onClick={() => navigate(`/templates/${template.id}`)}>
                Modifier
              </BigButton>
              <details className="template-list__menu">
                <summary className="template-list__menu-trigger" aria-label="Plus d'options">
                  ⋯
                </summary>
                <button
                  type="button"
                  className="subtle-button subtle-button--danger"
                  onClick={() => setPendingDeleteId(template.id)}
                >
                  Supprimer cette séance type
                </button>
              </details>
            </div>
          </li>
        ))}
      </ul>

      <TourStep
        id="create-first-session"
        selector="#tip-home-create"
        text="Crée ta première séance ici : personnalisée, ou depuis un modèle prêt à l'emploi."
      />
      <TourStep
        id="create-second-session"
        selector="#tip-home-create"
        text="Crée une deuxième séance, pour avoir de quoi alterner d'une fois sur l'autre."
      />

      <ConfirmDialog
        open={pendingDeleteId != null}
        title="Supprimer cette séance type ?"
        message="Cette action est définitive."
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
