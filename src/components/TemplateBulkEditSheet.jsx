import { useEffect, useState } from 'react'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { findExerciseByName, getExerciseById, getOrCreateExercise } from '../domain/exercises.js'
import {
  addExerciseToTemplates,
  removeExerciseFromTemplates,
  replaceExerciseInTemplates,
  setDefaultSetsInTemplates,
} from '../domain/templates.js'
import { ExercisePicker } from './ExercisePicker.jsx'
import { StepperField } from './StepperField.jsx'
import { BigButton } from './BigButton.jsx'

const ACTIONS = [
  { key: 'add', label: 'Ajouter un exercice' },
  { key: 'remove', label: 'Retirer un exercice' },
  { key: 'replace', label: 'Remplacer un exercice' },
  { key: 'sets', label: 'Séries et répétitions' },
]

function plural(count, word) {
  return `${count} ${word}${count > 1 ? 's' : ''}`
}

// Panneau "Modifier" de la sélection multiple (TemplatesListPage.jsx), même
// présentation que la fiche muscle (.muscle-sheet). Chaque action se fait
// en deux temps : on choisit, un résumé en une phrase dit ce qui va
// changer, puis "Valider" applique (logique dans domain/templates.js).
// onDone(message) : appelé après validation, avec le message de
// confirmation à afficher.
export function TemplateBulkEditSheet({ templateIds, onClose, onDone }) {
  const { data, setData } = useAppDataContext()
  const [action, setAction] = useState(null)
  // Nom choisi dans l'ExercisePicker (ajout, ou nouvel exercice d'un
  // remplacement) : l'exercice n'est créé dans la bibliothèque qu'à la
  // validation, s'il n'existe pas encore.
  const [pickedName, setPickedName] = useState(null)
  // Exercice existant choisi dans la liste (retrait, ou ancien exercice
  // d'un remplacement).
  const [chosenId, setChosenId] = useState(null)
  const [setCount, setSetCount] = useState(3)
  const [reps, setReps] = useState(10)
  const [setsTarget, setSetsTarget] = useState('all')

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const selected = data.templates.filter((t) => templateIds.includes(t.id))
  const total = selected.length

  // Exercices présents dans au moins une séance sélectionnée, dans l'ordre
  // de première apparition, avec le nombre de séances qui les contiennent.
  const presentExercises = []
  for (const template of selected) {
    for (const exerciseId of template.exerciseIds) {
      const item = presentExercises.find((p) => p.id === exerciseId)
      if (item) item.count++
      else {
        presentExercises.push({
          id: exerciseId,
          name: getExerciseById(data.exercises, exerciseId)?.name ?? 'Exercice supprimé',
          count: 1,
        })
      }
    }
  }
  const exerciseName = (id) => presentExercises.find((p) => p.id === id)?.name

  function chooseAction(key) {
    setAction(key)
    setPickedName(null)
    setChosenId(null)
    setSetsTarget('all')
  }

  // Résumé + validation possible ou non, selon l'action et les choix.
  function getSummary() {
    if (action === 'add' && pickedName) {
      const existing = findExerciseByName(data.exercises, pickedName)
      const name = existing?.name ?? pickedName.trim()
      const already = existing ? selected.filter((t) => t.exerciseIds.includes(existing.id)).length : 0
      if (already === total) return { text: `${name} est déjà dans toutes les séances sélectionnées.`, valid: false }
      return {
        text: `${name} sera ajouté à ${plural(total - already, 'séance')}${already > 0 ? ` (déjà présent dans ${already})` : ''}.`,
        valid: true,
      }
    }
    if (action === 'remove' && chosenId) {
      const count = presentExercises.find((p) => p.id === chosenId)?.count ?? 0
      return { text: `${exerciseName(chosenId)} sera retiré de ${plural(count, 'séance')}.`, valid: true }
    }
    if (action === 'replace' && chosenId && pickedName) {
      const existing = findExerciseByName(data.exercises, pickedName)
      const newName = existing?.name ?? pickedName.trim()
      if (existing?.id === chosenId) return { text: 'Choisis un exercice différent.', valid: false }
      const withOld = selected.filter((t) => t.exerciseIds.includes(chosenId))
      const both = existing ? withOld.filter((t) => t.exerciseIds.includes(existing.id)).length : 0
      return {
        text:
          `${exerciseName(chosenId)} sera remplacé par ${newName} dans ${plural(withOld.length, 'séance')}` +
          (both > 0 ? ` (déjà présent dans ${both} : ${exerciseName(chosenId)} y sera juste retiré).` : '.'),
        valid: true,
      }
    }
    if (action === 'sets') {
      const scheme = `${setCount} × ${reps}`
      if (setsTarget === 'all') {
        const exerciseCount = selected.reduce((sum, t) => sum + t.exerciseIds.length, 0)
        if (exerciseCount === 0) return { text: 'Aucun exercice dans les séances sélectionnées.', valid: false }
        return {
          text: `${scheme} pour tous les exercices de ${plural(total, 'séance')} (${plural(exerciseCount, 'exercice')}).`,
          valid: true,
        }
      }
      const count = presentExercises.find((p) => p.id === setsTarget)?.count ?? 0
      return { text: `${exerciseName(setsTarget)} : ${scheme} dans ${plural(count, 'séance')}.`, valid: true }
    }
    return null
  }

  function handleValidate() {
    const ids = selected.map((t) => t.id)
    let { templates, exercises } = data
    let message

    if (action === 'add') {
      const { exercise, exercises: nextExercises } = getOrCreateExercise(exercises, pickedName)
      exercises = nextExercises
      templates = addExerciseToTemplates(templates, ids, exercise.id)
      message = `${exercise.name} ajouté.`
    } else if (action === 'remove') {
      templates = removeExerciseFromTemplates(templates, ids, chosenId)
      message = `${exerciseName(chosenId)} retiré.`
    } else if (action === 'replace') {
      const { exercise, exercises: nextExercises } = getOrCreateExercise(exercises, pickedName)
      exercises = nextExercises
      templates = replaceExerciseInTemplates(templates, ids, chosenId, exercise.id)
      message = `${exerciseName(chosenId)} remplacé par ${exercise.name}.`
    } else if (action === 'sets') {
      templates = setDefaultSetsInTemplates(templates, ids, setsTarget === 'all' ? null : setsTarget, setCount, reps)
      message = `Séries et répétitions mises à jour (${setCount} × ${reps}).`
    }

    setData({ ...data, templates, exercises })
    onDone(message)
  }

  const summary = getSummary()

  function renderExerciseChoice(onChoose) {
    if (presentExercises.length === 0) {
      return <p className="muscle-sheet__detail">Aucun exercice dans les séances sélectionnées.</p>
    }
    return (
      <ul className="bulk-edit__exercises">
        {presentExercises.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              className={`bulk-edit__exercise ${chosenId === p.id ? 'bulk-edit__exercise--selected' : ''}`}
              onClick={() => onChoose(p.id)}
            >
              <span>{p.name}</span>
              <small>
                dans {p.count}/{total}
              </small>
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="muscle-sheet-overlay" onClick={onClose}>
      <div
        className="muscle-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Modifier ${plural(total, 'séance')}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="muscle-sheet__close" onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        <h2 className="muscle-sheet__title">Modifier {plural(total, 'séance')}</h2>

        {action == null ? (
          <div className="bulk-edit__actions">
            {ACTIONS.map((a) => (
              <BigButton key={a.key} variant="secondary" onClick={() => chooseAction(a.key)}>
                {a.label}
              </BigButton>
            ))}
          </div>
        ) : (
          <>
            <button type="button" className="bulk-edit__back" onClick={() => chooseAction(null)}>
              ← {ACTIONS.find((a) => a.key === action).label}
            </button>

            {action === 'add' && (
              <>
                <p className="muscle-sheet__subtitle">Exercice à ajouter</p>
                <ExercisePicker exercises={data.exercises} onAdd={setPickedName} />
              </>
            )}

            {action === 'remove' && (
              <>
                <p className="muscle-sheet__subtitle">Exercice à retirer</p>
                {renderExerciseChoice(setChosenId)}
              </>
            )}

            {action === 'replace' && (
              <>
                <p className="muscle-sheet__subtitle">Exercice à remplacer</p>
                {renderExerciseChoice((id) => {
                  setChosenId(id)
                  setPickedName(null)
                })}
                {chosenId && (
                  <>
                    <p className="muscle-sheet__subtitle">Remplacer par</p>
                    <ExercisePicker exercises={data.exercises} onAdd={setPickedName} />
                  </>
                )}
              </>
            )}

            {action === 'sets' && (
              <div className="bulk-edit__sets">
                <label className="bulk-edit__field">
                  <span>Séries</span>
                  <StepperField value={setCount} onChange={(v) => setSetCount(Math.max(1, v))} min={1} aria-label="Séries" />
                </label>
                <label className="bulk-edit__field">
                  <span>Répétitions</span>
                  <StepperField value={reps} onChange={(v) => setReps(Math.max(1, v))} min={1} aria-label="Répétitions" />
                </label>
                <label className="bulk-edit__field">
                  <span>Appliquer à</span>
                  <select value={setsTarget} onChange={(e) => setSetsTarget(e.target.value)}>
                    <option value="all">Tous les exercices</option>
                    {presentExercises.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (dans {p.count}/{total})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {summary && (
              <div className="bulk-edit__summary">
                <p>{summary.text}</p>
                <BigButton onClick={handleValidate} disabled={!summary.valid}>
                  Valider
                </BigButton>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
