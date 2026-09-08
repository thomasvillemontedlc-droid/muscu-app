import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import {
  addExerciseToTemplate,
  getTemplateById,
  moveExerciseInTemplate,
  removeExerciseFromTemplate,
  updateTemplate,
} from '../domain/templates.js'
import { getExerciseById, getOrCreateExercise } from '../domain/exercises.js'
import { ExercisePicker } from '../components/ExercisePicker.jsx'
import { BigButton } from '../components/BigButton.jsx'

export function TemplateEditPage() {
  const { templateId } = useParams()
  const { data, setData } = useAppDataContext()
  const navigate = useNavigate()

  const template = getTemplateById(data.templates, templateId)

  if (!template) {
    return (
      <div className="page">
        <p>Séance introuvable.</p>
        <Link to="/">Retour</Link>
      </div>
    )
  }

  function handleRename(e) {
    setData({ ...data, templates: updateTemplate(data.templates, templateId, { name: e.target.value }) })
  }

  function handleAddExercise(name) {
    const { exercise, exercises } = getOrCreateExercise(data.exercises, name)
    const templates = addExerciseToTemplate(data.templates, templateId, exercise.id)
    setData({ ...data, exercises, templates })
  }

  function handleRemoveExercise(exerciseId) {
    setData({ ...data, templates: removeExerciseFromTemplate(data.templates, templateId, exerciseId) })
  }

  function handleMove(index, direction) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= template.exerciseIds.length) return
    setData({ ...data, templates: moveExerciseInTemplate(data.templates, templateId, index, targetIndex) })
  }

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Mes séances
      </Link>

      <input
        className="template-edit__name"
        type="text"
        value={template.name}
        onChange={handleRename}
        aria-label="Nom de la séance"
      />

      <ol className="exercise-list">
        {template.exerciseIds.map((exerciseId, index) => {
          const exercise = getExerciseById(data.exercises, exerciseId)
          return (
            <li key={exerciseId} className="exercise-list__item">
              <span className="exercise-list__name">{exercise?.name ?? 'Exercice supprimé'}</span>
              <div className="exercise-list__actions">
                <button type="button" onClick={() => handleMove(index, -1)} aria-label="Monter">
                  ↑
                </button>
                <button type="button" onClick={() => handleMove(index, 1)} aria-label="Descendre">
                  ↓
                </button>
                <button type="button" onClick={() => handleRemoveExercise(exerciseId)} aria-label="Retirer">
                  ✕
                </button>
              </div>
            </li>
          )
        })}
      </ol>

      <ExercisePicker exercises={data.exercises} onAdd={handleAddExercise} />

      <BigButton onClick={() => navigate('/')}>Terminé</BigButton>
    </div>
  )
}
