import { useState } from 'react'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { addTemplateToProgram } from '../domain/program.js'
import { createTemplate } from '../domain/templates.js'
import { createTemplateFromModel } from '../domain/templateModels.js'
import { BigButton } from './BigButton.jsx'

// Crée (ou retrouve) la séance désignée par `source` et renvoie son id, en
// plus des catalogues éventuellement complétés au passage. Trois formes :
// {kind:'existing', templateId} réutilise une séance déjà existante telle
// quelle ; {kind:'new', name} crée une séance vide (comme "Créer une
// nouvelle séance" depuis Mes séances) ; {kind:'model', model} crée une
// séance depuis un modèle prédéfini (domain/templateModels.js), avec ses
// séries/répétitions par défaut.
function buildFromSource(source, templates, exercises) {
  if (source.kind === 'existing') return { templateId: source.templateId, templates, exercises }
  if (source.kind === 'new') {
    const result = createTemplate(templates, source.name)
    return { templateId: result.template.id, templates: result.templates, exercises }
  }
  const result = createTemplateFromModel(templates, exercises, source.model)
  return { templateId: result.template.id, templates: result.templates, exercises: result.exercises }
}

// Compose jusqu'à `targetCount` séances pour le programme `programIndex` (0
// ou 1), en mélangeant des séances PROPOSÉES (cochées par défaut, jusqu'aux
// `targetCount` premières - ex. les modèles d'une structure, ou les
// variantes du programme 1) et des séances LIBRES ajoutées à la main
// (existantes ou toutes neuves), jusqu'à atteindre exactement ce compte.
// Réutilisé pour le programme 1 (onboarding) et le programme 2 (voir
// ProgramPage.jsx) - le parent doit passer une `key` qui change avec
// `proposedItems`/`targetCount` (ex. la structure choisie) pour que ce
// composant reparte à zéro plutôt que de garder un état d'une composition
// précédente.
export function ProgramComposer({ targetCount, proposedItems, programIndex, onComplete }) {
  const { data, setData } = useAppDataContext()
  const [checkedKeys, setCheckedKeys] = useState(
    () => new Set(proposedItems.slice(0, targetCount).map((item) => item.key)),
  )
  const [freeEntries, setFreeEntries] = useState([])
  const [freeSessionPanelOpen, setFreeSessionPanelOpen] = useState(false)
  const [freeSessionChoice, setFreeSessionChoice] = useState('')
  const [freeSessionNewName, setFreeSessionNewName] = useState('')

  const chosenCount = checkedKeys.size + freeEntries.length
  const remainingSlots = targetCount - chosenCount

  const freeSessionCanValidate =
    freeSessionChoice !== '' && (freeSessionChoice !== '__new__' || freeSessionNewName.trim() !== '')

  // Options du <select> "+ Séance libre" : tout le catalogue, sans doublon
  // de nom (plusieurs séances types peuvent partager un nom - une seule
  // suffit à proposer ici).
  const freeSessionTemplateOptions = (() => {
    const seenNames = new Set()
    const options = []
    for (const t of data.templates) {
      if (seenNames.has(t.name)) continue
      seenNames.add(t.name)
      options.push(t)
    }
    return options
  })()

  function toggleProposedChecked(key) {
    setCheckedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        if (chosenCount >= targetCount) return prev
        next.add(key)
      }
      return next
    })
  }

  function handleFreeSessionRowToggle() {
    setFreeSessionPanelOpen((open) => !open)
  }

  function handleFreeSessionSelectChange(e) {
    setFreeSessionChoice(e.target.value)
    if (e.target.value !== '__new__') setFreeSessionNewName('')
  }

  function handleValidateFreeSession() {
    if (!freeSessionCanValidate) return
    const source =
      freeSessionChoice === '__new__'
        ? { kind: 'new', name: freeSessionNewName.trim() }
        : { kind: 'existing', templateId: freeSessionChoice }
    setFreeEntries((prev) => [...prev, { source }])
    setFreeSessionChoice('')
    setFreeSessionNewName('')
    setFreeSessionPanelOpen(false)
  }

  function handleRemoveFreeEntry(index) {
    setFreeEntries((prev) => prev.filter((_, i) => i !== index))
  }

  // Démarre l'alternance (voir domain/program.js#getWeeksUntilSwitch) la
  // toute première fois que le programme 2 reçoit une séance - jamais
  // retouchée ensuite, un programme déjà en cours d'alternance ne doit pas
  // voir son compte à rebours repartir de zéro à chaque ajout de séance.
  function handleBuildProgram() {
    if (chosenCount === 0) return

    let templates = data.templates
    let exercises = data.exercises
    let program = data.programs[programIndex] ?? { templateIds: [] }

    const checkedProposed = proposedItems.filter((item) => checkedKeys.has(item.key))
    for (const item of checkedProposed) {
      const result = buildFromSource(item.source, templates, exercises)
      templates = result.templates
      exercises = result.exercises
      program = addTemplateToProgram(program, result.templateId)
    }
    for (const entry of freeEntries) {
      const result = buildFromSource(entry.source, templates, exercises)
      templates = result.templates
      exercises = result.exercises
      program = addTemplateToProgram(program, result.templateId)
    }

    const startsAlternation = programIndex === 1 && !data.programs[1]
    const nextPrograms = [...data.programs]
    nextPrograms[programIndex] = program

    setData({
      ...data,
      templates,
      exercises,
      programs: nextPrograms,
      alternation: startsAlternation
        ? { ...data.alternation, startDate: new Date().toISOString() }
        : data.alternation,
    })

    onComplete()
  }

  return (
    <div className="program-composer">
      <p className="session-checklist__counter">
        {chosenCount} / {targetCount} séance{targetCount > 1 ? 's' : ''} choisie{targetCount > 1 ? 's' : ''}
      </p>

      <ul className="session-checklist">
        {proposedItems.map((item) => {
          const checked = checkedKeys.has(item.key)
          const capped = !checked && chosenCount >= targetCount
          return (
            <li key={item.key}>
              <label className="session-checklist__row">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={capped}
                  onChange={() => toggleProposedChecked(item.key)}
                />
                <span>{item.label}</span>
                <span className="session-checklist__tag">Proposée</span>
              </label>
            </li>
          )
        })}

        {freeEntries.map((entry, index) => {
          const name =
            entry.source.kind === 'existing'
              ? (data.templates.find((t) => t.id === entry.source.templateId)?.name ?? '')
              : entry.source.name
          return (
            <li key={index}>
              <div className="session-checklist__row">
                <span>{name}</span>
                <span className="session-checklist__tag session-checklist__tag--free">Libre</span>
                <button
                  type="button"
                  className="session-checklist__remove"
                  onClick={() => handleRemoveFreeEntry(index)}
                  aria-label={`Retirer ${name}`}
                >
                  ✕
                </button>
              </div>
            </li>
          )
        })}

        {remainingSlots > 0 ? (
          <li>
            <div className="session-checklist__row session-checklist__row--add" onClick={handleFreeSessionRowToggle}>
              <span>+ Séance libre</span>
              <span className="session-checklist__tag">
                {remainingSlots} place{remainingSlots > 1 ? 's' : ''}
              </span>
            </div>

            {freeSessionPanelOpen && (
              <div className="free-session-panel" onClick={(e) => e.stopPropagation()}>
                <select
                  className="prep-field__select"
                  value={freeSessionChoice}
                  onChange={handleFreeSessionSelectChange}
                  aria-label="Choisir la séance libre"
                >
                  <option value="">Choisir une séance…</option>
                  {freeSessionTemplateOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                  <option value="__new__">+ Créer une nouvelle séance</option>
                </select>

                {freeSessionChoice === '__new__' && (
                  <input
                    type="text"
                    className="free-session-panel__input"
                    placeholder="Nom de la séance"
                    value={freeSessionNewName}
                    onChange={(e) => setFreeSessionNewName(e.target.value)}
                    aria-label="Nom de la nouvelle séance libre"
                  />
                )}

                <BigButton onClick={handleValidateFreeSession} disabled={!freeSessionCanValidate}>
                  Valider cette séance
                </BigButton>
              </div>
            )}
          </li>
        ) : (
          <li className="session-checklist__complete">
            Programme complet. Décoche une séance proposée pour la remplacer par une séance libre.
          </li>
        )}
      </ul>

      <BigButton onClick={handleBuildProgram} disabled={chosenCount === 0}>
        Ajouter {chosenCount > 1 ? 'ces' : 'cette'} {chosenCount} séance{chosenCount > 1 ? 's' : ''} au programme
      </BigButton>
    </div>
  )
}
