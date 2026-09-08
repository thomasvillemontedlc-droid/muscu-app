import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { createTemplate, deleteTemplate } from '../domain/templates.js'
import { startSessionFromTemplate } from '../domain/sessions.js'
import { BigButton } from '../components/BigButton.jsx'

export function TemplatesListPage() {
  const { data, setData } = useAppDataContext()
  const [newName, setNewName] = useState('')
  const navigate = useNavigate()

  function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    const { template, templates } = createTemplate(data.templates, newName)
    setData({ ...data, templates })
    setNewName('')
    navigate(`/templates/${template.id}`)
  }

  function handleDelete(templateId) {
    if (!window.confirm('Supprimer cette séance type ?')) return
    setData({ ...data, templates: deleteTemplate(data.templates, templateId) })
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
        {data.templates.map((template) => (
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
              <BigButton variant="danger" onClick={() => handleDelete(template.id)}>
                Supprimer
              </BigButton>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
