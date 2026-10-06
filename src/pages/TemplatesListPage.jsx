import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { createTemplate, deleteTemplate, deleteTemplates, sortTemplatesForToday } from '../domain/templates.js'
import { createTemplateFromModel, TEMPLATE_STRUCTURES } from '../domain/templateModels.js'
import { getActiveProgramIndex, getNextProgramTemplateId, getNextTemplateOverrideId } from '../domain/program.js'
import { getInProgressSession, startSessionFromTemplate } from '../domain/sessions.js'
import { BigButton } from '../components/BigButton.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { TourStep } from '../components/TourStep.jsx'
import { TemplateBulkEditSheet } from '../components/TemplateBulkEditSheet.jsx'

export function TemplatesListPage() {
  const { data, setData } = useAppDataContext()
  const [newName, setNewName] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  // Sélection multiple (bouton "Sélectionner") : supprimer ou modifier
  // plusieurs séances types d'un coup, voir TemplateBulkEditSheet.jsx.
  const [selecting, setSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [notice, setNotice] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 2500)
    return () => clearTimeout(timer)
  }, [notice])

  const inProgressSession = getInProgressSession(data.sessions)

  // Ce qui est mis en avant en haut de l'écran quand aucune séance n'est en
  // cours : la prochaine séance du programme hebdomadaire si un programme
  // est configuré, sinon l'habitude du jour de la semaine (voir
  // domain/templates.js#sortTemplatesForToday) — les deux répondent à la
  // même question ("quoi faire aujourd'hui"), le programme explicite prime
  // simplement sur l'habitude déduite.
  const sortedTemplates = sortTemplatesForToday(data.templates, data.sessions)
  const nextProgramTemplateId = getNextProgramTemplateId(data.alternation, data.programs, data.sessions)
  const nextProgramTemplate = nextProgramTemplateId
    ? data.templates.find((t) => t.id === nextProgramTemplateId)
    : null
  // Un choix manuel ("Prochaine séance" depuis Progression) passe avant le
  // programme et l'habitude, le temps qu'il soit lancé.
  const overrideTemplateId = getNextTemplateOverrideId(data.nextTemplate, data.sessions, data.templates)
  const overrideTemplate = overrideTemplateId ? data.templates.find((t) => t.id === overrideTemplateId) : null
  const featuredTemplate = overrideTemplate ?? nextProgramTemplate ?? sortedTemplates[0]
  const isFeaturedFromProgram = featuredTemplate != null && featuredTemplate === nextProgramTemplate
  // L'alternance n'est "active" qu'une fois les deux programmes composés -
  // avant ça, pas besoin de préciser lequel (il n'y en a qu'un).
  const hasAlternation = data.programs[1] != null
  const activeProgramIndex = hasAlternation ? getActiveProgramIndex(data.alternation, data.programs) : null
  const featuredLabel = overrideTemplate
    ? 'Prochaine séance choisie'
    : isFeaturedFromProgram
      ? hasAlternation
        ? `Prochaine séance · Programme ${activeProgramIndex + 1}`
        : 'Prochaine séance du programme'
      : "Suggéré pour aujourd'hui"

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

  // Ids encore existants (une séance supprimée ailleurs sort d'elle-même
  // de la sélection).
  const selected = selectedIds.filter((id) => data.templates.some((t) => t.id === id))
  const allSelected = data.templates.length > 0 && selected.length === data.templates.length
  const programTemplateIds = new Set(data.programs.flatMap((p) => p?.templateIds ?? []))
  const selectedInProgram = selected.filter((id) => programTemplateIds.has(id)).length
  const selectedLabel = `${selected.length} séance${selected.length > 1 ? 's' : ''}`

  function toggleSelecting() {
    setSelecting(!selecting)
    setSelectedIds([])
  }

  function toggleSelected(templateId) {
    setSelectedIds(
      selected.includes(templateId) ? selected.filter((id) => id !== templateId) : [...selected, templateId],
    )
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : data.templates.map((t) => t.id))
  }

  function handleBulkDelete() {
    setData(deleteTemplates(data, selected))
    setNotice(`${selectedLabel} supprimée${selected.length > 1 ? 's' : ''}.`)
    setSelectedIds([])
    setConfirmBulkDelete(false)
  }

  function handleBulkEditDone(message) {
    setBulkEditOpen(false)
    setSelectedIds([])
    setNotice(message)
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
              {featuredLabel}
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

      <Link to="/program" className="back-link home-link">
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
          <div className="template-list-header__row">
            <h2>Mes séances enregistrées</h2>
            <button type="button" className="template-list-header__select" onClick={toggleSelecting}>
              {selecting ? 'Annuler' : 'Sélectionner'}
            </button>
          </div>
          <p className="template-list-header__hint">Déjà prêtes : lancez-les directement.</p>
          {selecting && (
            <label className="template-list__select-all">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              Tout sélectionner
            </label>
          )}
        </div>
      )}

      <ul className={`template-list ${selecting ? 'template-list--selecting' : ''}`}>
        {sortedTemplates.map((template) =>
          selecting ? (
            <li
              key={template.id}
              className={`template-list__item ${selected.includes(template.id) ? 'template-list__item--selected' : ''}`}
            >
              <label className="template-list__select">
                <input
                  type="checkbox"
                  checked={selected.includes(template.id)}
                  onChange={() => toggleSelected(template.id)}
                />
                <span>
                  <span className="template-list__name">{template.name}</span>
                  <span className="template-list__count">{template.exerciseIds.length} exercice(s)</span>
                </span>
              </label>
            </li>
          ) : (
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
          ),
        )}
      </ul>

      {selecting && (
        <div className="bulk-bar">
          <span className="bulk-bar__count">
            {selectedLabel} sélectionnée{selected.length > 1 ? 's' : ''}
          </span>
          <div className="bulk-bar__actions">
            <BigButton variant="secondary" disabled={selected.length === 0} onClick={() => setBulkEditOpen(true)}>
              Modifier
            </BigButton>
            <BigButton variant="danger" disabled={selected.length === 0} onClick={() => setConfirmBulkDelete(true)}>
              Supprimer
            </BigButton>
          </div>
        </div>
      )}

      {notice && (
        <p className={`bulk-notice ${selecting ? 'bulk-notice--above-bar' : ''}`} role="status">
          {notice}
        </p>
      )}

      {bulkEditOpen && (
        <TemplateBulkEditSheet
          templateIds={selected}
          onClose={() => setBulkEditOpen(false)}
          onDone={handleBulkEditDone}
        />
      )}

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

      <ConfirmDialog
        open={confirmBulkDelete}
        title={selected.length > 1 ? `Supprimer ${selected.length} séances ?` : 'Supprimer cette séance ?'}
        message={
          'Ton historique est conservé.' +
          (selectedInProgram > 0
            ? ` ${selectedInProgram} ${selectedInProgram > 1 ? 'sont' : 'est'} dans ton programme et en ${selectedInProgram > 1 ? 'seront retirées' : 'sera retirée'}.`
            : '')
        }
        confirmLabel="Supprimer"
        danger
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />
    </div>
  )
}
