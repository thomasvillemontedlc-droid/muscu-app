import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import {
  addTemplateToProgram,
  getWeeksSinceBlockStart,
  isRotationDue,
  moveTemplateInProgram,
  removeTemplateFromProgram,
} from '../domain/program.js'
import { getProgramMuscleCoverage } from '../domain/muscleCoverage.js'
import { getMuscleLabel } from '../domain/muscleGroups.js'
import { applyRotationProposal, proposeRotation } from '../domain/rotation.js'
import { createTemplateFromModel, FREQUENCY_STRUCTURE_KEYS, TEMPLATE_STRUCTURES } from '../domain/templateModels.js'
import { BigButton } from '../components/BigButton.jsx'
import { OnboardingTip } from '../components/OnboardingTip.jsx'

const FREQUENCY_OPTIONS = [2, 3, 4, 5, 6]

export function ProgramPage() {
  const { data, setData } = useAppDataContext()
  const program = data.weeklyProgram
  const rotationWeeks = data.settings.rotationWeeks
  const [templateToAdd, setTemplateToAdd] = useState('')
  const [proposal, setProposal] = useState(null)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [frequency, setFrequency] = useState(null)
  const [structureKey, setStructureKey] = useState(null)
  const [checkedModelNames, setCheckedModelNames] = useState(new Set())

  const structureOptions = frequency ? FREQUENCY_STRUCTURE_KEYS[frequency] : []
  const activeStructure = structureKey ? TEMPLATE_STRUCTURES.find((s) => s.key === structureKey) : null

  // Toutes les séances de la structure cochées par défaut : à 2, 4 ou 5
  // séances/semaine ça correspond exactement au nombre voulu (une structure
  // dédiée à cette fréquence), à 3 ou 6 la structure choisie (A ou B) en a 6
  // au total et l'utilisateur décoche celles qu'il ne veut pas.
  useEffect(() => {
    setCheckedModelNames(new Set(activeStructure?.models.map((m) => m.name) ?? []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureKey])

  const availableTemplates = data.templates.filter((t) => !program.templateIds.includes(t.id))
  const programTemplates = program.templateIds
    .map((id) => data.templates.find((t) => t.id === id))
    .filter(Boolean)
  const coverage = getProgramMuscleCoverage(program, data.templates, data.exercises)
  const weeksElapsed = getWeeksSinceBlockStart(program)
  const rotationDue = isRotationDue(program, rotationWeeks)

  function persistProgram(nextProgram) {
    setData({ ...data, weeklyProgram: nextProgram })
  }

  function handleAdd(e) {
    e.preventDefault()
    if (!templateToAdd) return
    persistProgram(addTemplateToProgram(program, templateToAdd))
    setTemplateToAdd('')
  }

  function handleRemove(templateId) {
    persistProgram(removeTemplateFromProgram(program, templateId))
  }

  function handleSelectFrequency(freq) {
    setFrequency(freq)
    const keys = FREQUENCY_STRUCTURE_KEYS[freq]
    // Une seule structure adaptée à cette fréquence (2, 4, 5) : la
    // sélectionner directement plutôt que de faire choisir l'utilisateur
    // entre des options qui n'existent pas.
    setStructureKey(keys.length === 1 ? keys[0] : null)
  }

  function toggleModelChecked(name) {
    setCheckedModelNames((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  // Crée (toujours en nouveau, comme depuis l'accueil) un template pour
  // chaque modèle coché puis l'ajoute au programme dans l'ordre
  // d'affichage — même mécanique que "Modèles de séances" sur l'accueil,
  // juste enchaînée directement sur le programme au lieu de s'arrêter à la
  // création de la séance type.
  function handleBuildProgramFromModels() {
    if (!activeStructure) return
    const modelsToAdd = activeStructure.models.filter((m) => checkedModelNames.has(m.name))
    if (modelsToAdd.length === 0) return

    let templates = data.templates
    let exercises = data.exercises
    let nextProgram = program

    for (const model of modelsToAdd) {
      const result = createTemplateFromModel(templates, exercises, model)
      templates = result.templates
      exercises = result.exercises
      nextProgram = addTemplateToProgram(nextProgram, result.template.id)
    }

    setData({ ...data, templates, exercises, weeklyProgram: nextProgram })
    setFrequency(null)
    setStructureKey(null)
  }

  function handleMove(index, direction) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= program.templateIds.length) return
    persistProgram(moveTemplateInProgram(program, index, targetIndex))
  }

  function handleGenerateProposal() {
    const nextProposal = proposeRotation(program, data.templates, data.exercises)
    setProposal(nextProposal)
    // Rien de coché par défaut : sans choix explicite, "Valider mes choix"
    // ne change donc aucune séance (voir handleApplyRotationChoices).
    setSelectedOptions(Object.fromEntries(nextProposal.map((item) => [item.templateId, 'keep'])))
  }

  function handleSelectOption(templateId, value) {
    setSelectedOptions((prev) => ({ ...prev, [templateId]: value }))
  }

  // Applique uniquement les séances pour lesquelles une variante a été
  // choisie ; celles laissées sur "Garder la version actuelle" ne sont pas
  // touchées. Redémarre le bloc de rotation dans tous les cas, y compris si
  // rien n'a été changé — sinon la proposition reviendrait aussitôt.
  function handleApplyRotationChoices() {
    let templates = data.templates
    let exercises = data.exercises

    for (const item of proposal) {
      const selected = selectedOptions[item.templateId]
      if (selected === 'keep' || selected == null) continue
      const result = applyRotationProposal(templates, exercises, item.templateId, item.options[selected].exerciseNames)
      templates = result.templates
      exercises = result.exercises
    }

    setData({
      ...data,
      templates,
      exercises,
      weeklyProgram: { ...program, blockStartDate: new Date().toISOString() },
    })
    setProposal(null)
    setSelectedOptions({})
  }

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Mes séances
      </Link>

      <h1>Programme hebdomadaire</h1>

      {program.templateIds.length === 0 && (
        <section className="progress-section">
          <h2>Combien de séances par semaine ?</h2>
          <p className="progress-section__hint">
            Propose un point de départ adapté, à modifier ensuite comme n'importe quel programme.
          </p>

          <div className="frequency-picker">
            {FREQUENCY_OPTIONS.map((freq) => (
              <button
                key={freq}
                type="button"
                className={`frequency-picker__option${frequency === freq ? ' frequency-picker__option--active' : ''}`}
                onClick={() => handleSelectFrequency(freq)}
              >
                {freq}
              </button>
            ))}
          </div>

          {frequency && structureOptions.length > 1 && (
            <div className="structure-picker">
              {structureOptions.map((key) => {
                const structure = TEMPLATE_STRUCTURES.find((s) => s.key === key)
                return (
                  <BigButton
                    key={key}
                    variant={structureKey === key ? 'primary' : 'secondary'}
                    onClick={() => setStructureKey(key)}
                  >
                    {structure.label}
                  </BigButton>
                )
              })}
            </div>
          )}

          {activeStructure && (
            <div className="structure-model-checklist">
              <p className="progress-section__hint">{activeStructure.label}</p>
              <ul className="session-checklist">
                {activeStructure.models.map((model) => (
                  <li key={model.name}>
                    <label className="session-checklist__row">
                      <input
                        type="checkbox"
                        checked={checkedModelNames.has(model.name)}
                        onChange={() => toggleModelChecked(model.name)}
                      />
                      <span>{model.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <BigButton onClick={handleBuildProgramFromModels} disabled={checkedModelNames.size === 0}>
                Ajouter ces séances au programme
              </BigButton>
            </div>
          )}
        </section>
      )}

      <section className="progress-section">
        <h2>Séances du programme, dans l'ordre</h2>
        <p className="progress-section__hint">
          L'app propose la prochaine séance du programme en fonction de ce qui a déjà été fait cette semaine.
        </p>

        {programTemplates.length === 0 ? (
          <p className="empty-state">Aucune séance dans le programme pour l'instant.</p>
        ) : (
          <ol className="exercise-list">
            {programTemplates.map((template, index) => (
              <li key={template.id} className="exercise-list__item">
                <span className="exercise-list__name">{template.name}</span>
                <div className="exercise-list__actions">
                  <button type="button" onClick={() => handleMove(index, -1)} aria-label="Monter">
                    ↑
                  </button>
                  <button type="button" onClick={() => handleMove(index, 1)} aria-label="Descendre">
                    ↓
                  </button>
                  <button type="button" onClick={() => handleRemove(template.id)} aria-label="Retirer du programme">
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}

        {availableTemplates.length > 0 && (
          <form className="template-create" onSubmit={handleAdd}>
            <select
              className="prep-field__select"
              value={templateToAdd}
              onChange={(e) => setTemplateToAdd(e.target.value)}
              aria-label="Séance à ajouter au programme"
            >
              <option value="">Choisir une séance…</option>
              {availableTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <BigButton type="submit">Ajouter</BigButton>
          </form>
        )}
      </section>

      <section className="progress-section">
        <h2>Couverture musculaire du programme</h2>
        {program.templateIds.length === 0 ? (
          <p className="empty-state">Ajoute des séances au programme pour voir sa couverture.</p>
        ) : (
          <>
            <ul className="muscle-coverage-list">
              {coverage.covered.map((id) => (
                <li key={id}>{getMuscleLabel(id)}</li>
              ))}
            </ul>
            {coverage.uncovered.length > 0 && (
              <>
                <p className="progress-section__hint">Jamais travaillés par aucune séance du programme :</p>
                <ul className="muscle-coverage-list muscle-coverage-list--missing">
                  {coverage.uncovered.map((id) => (
                    <li key={id}>{getMuscleLabel(id)}</li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>

      <section id="tip-program-rotation" className="progress-section">
        <h2>Rotation des exercices</h2>
        {program.templateIds.length === 0 ? (
          <p className="empty-state">Ajoute des séances au programme pour activer la rotation.</p>
        ) : (
          <>
            <p className="progress-section__hint">
              Bloc en cours depuis {weeksElapsed} semaine{weeksElapsed > 1 ? 's' : ''} (rotation tous les{' '}
              {rotationWeeks} semaines, réglable dans Réglages).
            </p>

            {!proposal && (
              <BigButton variant="secondary" onClick={handleGenerateProposal}>
                {rotationDue ? 'Proposer la rotation' : 'Proposer la rotation maintenant (avant la date prévue)'}
              </BigButton>
            )}

            {proposal && (
              <div className="rotation-proposal">
                <p className="progress-section__hint">
                  Choisis une variante par séance, ou garde-la telle quelle — rien n'est modifié tant que tu n'as
                  pas validé.
                </p>
                {proposal.map((item) => (
                  <div key={item.templateId} className="rotation-proposal__template">
                    <h3>{item.templateName}</h3>
                    <p className="rotation-proposal__current">Actuellement : {item.currentNames.join(', ')}</p>

                    <div className="rotation-proposal__options" role="radiogroup" aria-label={`Variante pour ${item.templateName}`}>
                      <label className="rotation-proposal__option">
                        <input
                          type="radio"
                          name={`rotation-${item.templateId}`}
                          checked={(selectedOptions[item.templateId] ?? 'keep') === 'keep'}
                          onChange={() => handleSelectOption(item.templateId, 'keep')}
                        />
                        <span className="rotation-proposal__option-name">Garder la version actuelle</span>
                      </label>

                      {item.options.map((option, index) => (
                        <label key={option.label} className="rotation-proposal__option">
                          <input
                            type="radio"
                            name={`rotation-${item.templateId}`}
                            checked={selectedOptions[item.templateId] === index}
                            onChange={() => handleSelectOption(item.templateId, index)}
                          />
                          <span className="rotation-proposal__option-content">
                            <span className="rotation-proposal__option-name">{option.label}</span>
                            <span className="rotation-proposal__option-preview">{option.exerciseNames.join(', ')}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <BigButton onClick={handleApplyRotationChoices}>Valider mes choix</BigButton>
              </div>
            )}
          </>
        )}
      </section>

      <OnboardingTip
        id="program-rotation"
        selector="#tip-program-rotation"
        text="Planifie tes séances de la semaine ; l'app propose ensuite une rotation d'exercices tous les X semaines."
      />
    </div>
  )
}
