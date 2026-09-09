import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { createTemplate, deleteTemplate, sortTemplatesForToday } from '../domain/templates.js'
import { startSessionFromTemplate } from '../domain/sessions.js'
import { BigButton } from '../components/BigButton.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'

export function TemplatesListPage() {
  const { data, setData } = useAppDataContext()
  const [newName, setNewName] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const navigate = useNavigate()

  function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    const { template, templates } = createTemplate(data.templates, newName)
    setData({ ...data, templates })
    setNewName('')
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

      <form className="template-create" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Nom de la séance (ex: Push day)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          aria-label="Nom de la nouvelle séance type"
        />
        <BigButton type="submit">Créer</BigButton>
      </form>

      {data.templates.length === 0 && <p className="empty-state">Aucune séance type pour l'instant.</p>}

      <ul className="template-list">
        {sortTemplatesForToday(data.templates, data.sessions).map((template) => (
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
              <BigButton variant="danger" onClick={() => setPendingDeleteId(template.id)}>
                Supprimer
              </BigButton>
            </div>
          </li>
        ))}
      </ul>

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
