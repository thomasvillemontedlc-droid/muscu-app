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
import { DraggableList } from '../components/DraggableList.jsx'
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

  // Appui long sur le nom d'un exercice puis glisser, voir DraggableList.
  function handleReorder(fromIndex, toIndex) {
    setData({ ...data, templates: moveExerciseInTemplate(data.templates, templateId, fromIndex, toIndex) })
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

      <DraggableList
        className="exercise-list"
        items={template.exerciseIds}
        getKey={(exerciseId) => exerciseId}
        onReorder={handleReorder}
        renderItem={(exerciseId, index, { titleProps, isCollapsed }) => {
          const exercise = getExerciseById(data.exercises, exerciseId)
          return (
            <div className={`exercise-list__item${isCollapsed ? ' exercise-list__item--collapsed' : ''}`}>
              <span className="exercise-list__name" {...titleProps}>
                {exercise?.name ?? 'Exercice supprimé'}
              </span>
              {!isCollapsed && (
                <div className="exercise-list__actions">
                  <button type="button" onClick={() => handleRemoveExercise(exerciseId)} aria-label="Retirer">
                    ✕
                  </button>
                </div>
              )}
            </div>
          )
        }}
      />

      <ExercisePicker exercises={data.exercises} onAdd={handleAddExercise} />

      <BigButton onClick={() => navigate('/')}>Terminé</BigButton>
    </div>
  )
}
