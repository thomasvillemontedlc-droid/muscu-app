import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import {
  addTemplateToProgram,
  getWeeksSinceBlockStart,
  isRotationDue,
  moveTemplateInProgram,
  removeTemplateFromProgram,
} from '../domain/program.js'
import { startSessionFromTemplate } from '../domain/sessions.js'
import { getProgramMuscleCoverage } from '../domain/muscleCoverage.js'
import { getMuscleLabel } from '../domain/muscleGroups.js'
import { applyRotationProposal, proposeRotation } from '../domain/rotation.js'
import { createTemplate } from '../domain/templates.js'
import { createTemplateFromModel, FREQUENCY_STRUCTURE_KEYS, TEMPLATE_STRUCTURES } from '../domain/templateModels.js'
import { markWeeklyProgramOnboardingComplete } from '../storage/onboarding.js'
import { BigButton } from '../components/BigButton.jsx'
import { TourStep } from '../components/TourStep.jsx'

const FREQUENCY_OPTIONS = [2, 3, 4, 5, 6, 7]

export function ProgramPage() {
  const { data, setData } = useAppDataContext()
  const navigate = useNavigate()
  const program = data.weeklyProgram
  const rotationWeeks = data.settings.rotationWeeks
  const [templateToAdd, setTemplateToAdd] = useState('')
  const [proposal, setProposal] = useState(null)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [frequency, setFrequency] = useState(null)
  const [structureKey, setStructureKey] = useState(null)
  const [checkedModelNames, setCheckedModelNames] = useState(new Set())
  // Séances libres déjà ajoutées à la composition en cours : { templateId }
  // pour une séance existante, { newName } pour une à créer. Un tableau (pas
  // un Set) car l'ordre d'ajout est celui dans lequel elles seront créées/
  // ajoutées au programme (voir handleBuildProgramFromModels).
  const [freeSessions, setFreeSessions] = useState([])
  const [freeSessionPanelOpen, setFreeSessionPanelOpen] = useState(false)
  const [freeSessionChoice, setFreeSessionChoice] = useState('')
  const [freeSessionNewName, setFreeSessionNewName] = useState('')

  // Verrouille définitivement le fait qu'un programme a déjà existé une
  // fois (voir App.jsx et storage/onboarding.js) : contrairement à
  // templateIds.length, ce drapeau ne redescend jamais, même si le
  // programme est vidé par la suite - l'écran forcé du tout premier
  // lancement ne doit plus jamais revenir après ça.
  useEffect(() => {
    if (program.templateIds.length > 0) markWeeklyProgramOnboardingComplete()
  }, [program.templateIds.length])

  const structureOptions = frequency ? FREQUENCY_STRUCTURE_KEYS[frequency] : []
  const activeStructure = structureKey ? TEMPLATE_STRUCTURES.find((s) => s.key === structureKey) : null
  // N = la fréquence choisie : on compose exactement jusqu'à N séances,
  // modèles proposés et séances libres mélangés (voir X ci-dessous).
  const targetCount = frequency ?? 0

  // Cochés par défaut : les N premiers modèles de la structure (s'il y en a
  // moins que N, ils sont tous cochés - le reste de la place va aux séances
  // libres). Réinitialise aussi les séances libres : on recompose de zéro à
  // chaque changement de fréquence ou de structure.
  useEffect(() => {
    const models = activeStructure?.models ?? []
    setCheckedModelNames(new Set(models.slice(0, targetCount).map((m) => m.name)))
    setFreeSessions([])
    setFreeSessionPanelOpen(false)
    setFreeSessionChoice('')
    setFreeSessionNewName('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureKey, frequency])

  // X = ce qui est déjà choisi (modèles cochés + séances libres ajoutées),
  // jamais plus de N (les cases décochées se désactivent avant, voir le
  // rendu de la checklist).
  const chosenCount = checkedModelNames.size + freeSessions.length
  const remainingSlots = targetCount - chosenCount

  // Vrai dès qu'une vraie séance est choisie (existante) ou qu'un nom a été
  // tapé (nouvelle) - condition du bouton "Valider cette séance".
  const freeSessionCanValidate =
    freeSessionChoice !== '' && (freeSessionChoice !== '__new__' || freeSessionNewName.trim() !== '')

  // Options du <select> "+ Séance libre" : tout le catalogue, sans doublon
  // de nom (plusieurs séances types peuvent partager un nom, ex. deux
  // "Modèle Push A" créées séparément - une seule suffit à proposer ici).
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

  function handleStart(template) {
    const { session, sessions } = startSessionFromTemplate(data.sessions, template, data.exercises)
    setData({ ...data, sessions })
    navigate(`/sessions/${session.id}`)
  }

  function handleSelectFrequency(freq) {
    setFrequency(freq)
    const keys = FREQUENCY_STRUCTURE_KEYS[freq]
    // Une seule structure adaptée à cette fréquence (2, 4, 5) : la
    // sélectionner directement plutôt que de faire choisir l'utilisateur
    // entre des options qui n'existent pas.
    setStructureKey(keys.length === 1 ? keys[0] : null)
  }

  // Ignore le clic plutôt que de dépasser N : cocher un modèle en plus
  // quand X a déjà atteint N n'aurait pas de sens (la case est de toute
  // façon désactivée dans ce cas, voir le rendu de la checklist - ce garde
  // reste une sécurité).
  function toggleModelChecked(name) {
    setCheckedModelNames((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        if (chosenCount >= targetCount) return prev
        next.add(name)
      }
      return next
    })
  }

  // Touche la ligne "+ Séance libre" : ouvre/ferme son panneau de choix.
  function handleFreeSessionRowToggle() {
    setFreeSessionPanelOpen((open) => !open)
  }

  function handleFreeSessionSelectChange(e) {
    setFreeSessionChoice(e.target.value)
    if (e.target.value !== '__new__') setFreeSessionNewName('')
  }

  // Ajoute la séance libre en cours de choix à la liste, puis referme le
  // panneau - une nouvelle ligne "+ Séance libre" réapparaît toute seule
  // s'il reste de la place (voir targetCount/chosenCount au rendu).
  function handleValidateFreeSession() {
    if (!freeSessionCanValidate) return
    const entry = freeSessionChoice === '__new__' ? { newName: freeSessionNewName.trim() } : { templateId: freeSessionChoice }
    setFreeSessions((prev) => [...prev, entry])
    setFreeSessionChoice('')
    setFreeSessionNewName('')
    setFreeSessionPanelOpen(false)
  }

  function handleRemoveFreeSession(index) {
    setFreeSessions((prev) => prev.filter((_, i) => i !== index))
  }

  // Crée (toujours en nouveau, comme depuis l'accueil) un template pour
  // chaque modèle coché, puis chaque séance libre dans l'ordre où elle a
  // été ajoutée (existante -> ajoutée telle quelle, nouvelle -> créée
  // d'abord) - même mécanique que "Modèles de séances" sur l'accueil, sans
  // navigation : on reste sur cet écran tant qu'on construit le programme.
  function handleBuildProgramFromModels() {
    if (!activeStructure) return
    const modelsToAdd = activeStructure.models.filter((m) => checkedModelNames.has(m.name))
    if (modelsToAdd.length === 0 && freeSessions.length === 0) return

    let templates = data.templates
    let exercises = data.exercises
    let nextProgram = program

    for (const model of modelsToAdd) {
      const result = createTemplateFromModel(templates, exercises, model)
      templates = result.templates
      exercises = result.exercises
      nextProgram = addTemplateToProgram(nextProgram, result.template.id)
    }

    for (const entry of freeSessions) {
      if (entry.templateId) {
        nextProgram = addTemplateToProgram(nextProgram, entry.templateId)
      } else {
        const result = createTemplate(templates, entry.newName)
        templates = result.templates
        nextProgram = addTemplateToProgram(nextProgram, result.template.id)
      }
    }

    setData({ ...data, templates, exercises, weeklyProgram: nextProgram })
    // Déclenche le useEffect [structureKey, frequency] qui remet à zéro
    // checkedModelNames/freeSessions - pas besoin de le refaire ici.
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

          <TourStep
            id="program-frequency"
            selector=".frequency-picker"
            text="Choisis ton nombre de séances par semaine : l'app propose un programme adapté et une rotation régulière des exercices."
          />

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
              <p className="session-checklist__counter">
                {chosenCount} / {targetCount} séance{targetCount > 1 ? 's' : ''} choisie{chosenCount > 1 ? 's' : ''}
              </p>

              <ul className="session-checklist">
                {activeStructure.models.map((model) => {
                  const checked = checkedModelNames.has(model.name)
                  const capped = !checked && chosenCount >= targetCount
                  return (
                    <li key={model.name}>
                      <label className="session-checklist__row">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={capped}
                          onChange={() => toggleModelChecked(model.name)}
                        />
                        <span>{model.name}</span>
                        <span className="session-checklist__tag">Proposée</span>
                      </label>
                    </li>
                  )
                })}

                {freeSessions.map((entry, index) => {
                  const name = entry.templateId
                    ? (data.templates.find((t) => t.id === entry.templateId)?.name ?? '')
                    : entry.newName
                  return (
                    <li key={index}>
                      <div className="session-checklist__row">
                        <span>{name}</span>
                        <span className="session-checklist__tag session-checklist__tag--free">Libre</span>
                        <button
                          type="button"
                          className="session-checklist__remove"
                          onClick={() => handleRemoveFreeSession(index)}
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
                    <div
                      className="session-checklist__row session-checklist__row--add"
                      onClick={handleFreeSessionRowToggle}
                    >
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
              <BigButton onClick={handleBuildProgramFromModels} disabled={chosenCount === 0}>
                Ajouter ces {chosenCount} séance{chosenCount > 1 ? 's' : ''} au programme
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
                  <button
                    type="button"
                    className="exercise-list__start"
                    onClick={() => handleStart(template)}
                    disabled={template.exerciseIds.length === 0}
                  >
                    Lancer
                  </button>
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

        {program.templateIds.length > 0 && availableTemplates.length > 0 && (
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

            {!proposal &&
              (rotationDue ? (
                <BigButton variant="secondary" onClick={handleGenerateProposal}>
                  Proposer la rotation
                </BigButton>
              ) : (
                <>
                  <p className="progress-section__hint">
                    Rotation disponible dans {rotationWeeks - weeksElapsed} semaine
                    {rotationWeeks - weeksElapsed > 1 ? 's' : ''}.
                  </p>
                  <button type="button" className="subtle-button" onClick={handleGenerateProposal}>
                    Proposer la rotation maintenant (avant la date prévue)
                  </button>
                </>
              ))}

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

      <TourStep
        id="program-rotation"
        selector="#tip-program-rotation"
        text="Réglable dans Réglages : tous les combien de semaines changer d'exercices. Au moment venu, choisis une variante par séance ou garde-la telle quelle."
      />
    </div>
  )
}
