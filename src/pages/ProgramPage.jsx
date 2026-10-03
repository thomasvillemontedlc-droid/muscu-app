import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import {
  addTemplateToProgram,
  getActiveProgramIndex,
  getAlternateProgramProposal,
  getAlternationPreview,
  getWeeksUntilSwitch,
  moveTemplateInProgram,
  removeTemplateFromProgram,
} from '../domain/program.js'
import { startSessionFromTemplate } from '../domain/sessions.js'
import { getProgramMuscleCoverage } from '../domain/muscleCoverage.js'
import { getMuscleLabel } from '../domain/muscleGroups.js'
import { FREQUENCY_STRUCTURE_KEYS, TEMPLATE_STRUCTURES } from '../domain/templateModels.js'
import { markWeeklyProgramOnboardingComplete } from '../storage/onboarding.js'
import { BigButton } from '../components/BigButton.jsx'
import { NumberField } from '../components/NumberField.jsx'
import { ProgramComposer } from '../components/ProgramComposer.jsx'
import { TourStep } from '../components/TourStep.jsx'

const FREQUENCY_OPTIONS = [2, 3, 4, 5, 6, 7]
const PERIOD_OPTIONS = [1, 2, 3, 4, 6, 8]

export function ProgramPage() {
  const { data, setData } = useAppDataContext()
  const navigate = useNavigate()
  const programs = data.programs
  const program1 = programs[0]
  const program2 = programs[1]
  const hasProgram2 = program2 != null
  const [templateToAdd, setTemplateToAdd] = useState('')
  const [frequency, setFrequency] = useState(null)
  const [structureKey, setStructureKey] = useState(null)
  const [composingProgram2, setComposingProgram2] = useState(false)
  const [selectedProgramIndex, setSelectedProgramIndex] = useState(0)
  const [periodCustomOpen, setPeriodCustomOpen] = useState(false)

  // Verrouille définitivement le fait qu'un programme a déjà existé une
  // fois (voir App.jsx et storage/onboarding.js) : contrairement à
  // templateIds.length, ce drapeau ne redescend jamais, même si le
  // programme est vidé par la suite - l'écran forcé du tout premier
  // lancement ne doit plus jamais revenir après ça.
  useEffect(() => {
    if (program1.templateIds.length > 0) markWeeklyProgramOnboardingComplete()
  }, [program1.templateIds.length])

  const structureOptions = frequency ? FREQUENCY_STRUCTURE_KEYS[frequency] : []
  const activeStructure = structureKey ? TEMPLATE_STRUCTURES.find((s) => s.key === structureKey) : null
  const structureProposedItems = activeStructure
    ? activeStructure.models.map((model) => ({ key: model.name, label: model.name, source: { kind: 'model', model } }))
    : []

  // Onglet actuellement affiché (toujours 0 tant que le programme 2
  // n'existe pas) - distinct du programme ACTIF de l'alternance
  // (activeProgramIndex ci-dessous), qu'on peut juste vouloir consulter.
  const viewedProgramIndex = hasProgram2 ? selectedProgramIndex : 0
  const selectedProgram = programs[viewedProgramIndex]
  const selectedProgramTemplates = selectedProgram.templateIds
    .map((id) => data.templates.find((t) => t.id === id))
    .filter(Boolean)
  const availableTemplates = data.templates.filter((t) => !selectedProgram.templateIds.includes(t.id))
  const coverage = getProgramMuscleCoverage(selectedProgram, data.templates, data.exercises)

  const activeProgramIndex = getActiveProgramIndex(data.alternation, programs)
  const weeksUntilSwitch = getWeeksUntilSwitch(data.alternation)
  const alternationPreview = getAlternationPreview(data.alternation.periodWeeks)
  const isCustomPeriod = !PERIOD_OPTIONS.includes(data.alternation.periodWeeks)

  function persistProgramAt(index, nextProgram) {
    const nextPrograms = [...programs]
    nextPrograms[index] = nextProgram
    setData({ ...data, programs: nextPrograms })
  }

  function handleAdd(e) {
    e.preventDefault()
    if (!templateToAdd) return
    persistProgramAt(viewedProgramIndex, addTemplateToProgram(selectedProgram, templateToAdd))
    setTemplateToAdd('')
  }

  function handleRemove(templateId) {
    persistProgramAt(viewedProgramIndex, removeTemplateFromProgram(selectedProgram, templateId))
  }

  function handleMove(index, direction) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= selectedProgram.templateIds.length) return
    persistProgramAt(viewedProgramIndex, moveTemplateInProgram(selectedProgram, index, targetIndex))
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

  function handlePeriodChange(weeks) {
    const clamped = Math.min(52, Math.max(1, Math.round(weeks)))
    setData({ ...data, alternation: { ...data.alternation, periodWeeks: clamped } })
  }

  function handleDeleteProgram2() {
    const nextPrograms = [...programs]
    nextPrograms[1] = null
    setData({ ...data, programs: nextPrograms })
    setSelectedProgramIndex(0)
  }

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Mes séances
      </Link>

      <h1>Programme hebdomadaire</h1>

      {program1.templateIds.length === 0 ? (
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
            text="Choisis ton nombre de séances par semaine : l'app propose un programme adapté, et tu pourras ajouter un 2e programme qui alterne avec celui-ci."
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
            <ProgramComposer
              key={structureKey}
              targetCount={frequency}
              proposedItems={structureProposedItems}
              programIndex={0}
              onComplete={() => {
                setFrequency(null)
                setStructureKey(null)
              }}
            />
          )}
        </section>
      ) : (
        <>
          <section id="tip-program-alternation" className="progress-section program-alternation">
            <h2>{hasProgram2 ? 'Alternance des programmes' : 'Ajoute un 2e programme'}</h2>

            <div className="program-cards">
              <div className="program-card program-card--filled">
                <span className="program-card__title">Programme 1</span>
                <span className="program-card__detail">
                  {program1.templateIds.length} séance{program1.templateIds.length > 1 ? 's' : ''}
                </span>
              </div>

              {hasProgram2 ? (
                <div className="program-card program-card--filled">
                  <span className="program-card__title">Programme 2</span>
                  <span className="program-card__detail">
                    {program2.templateIds.length} séance{program2.templateIds.length > 1 ? 's' : ''}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  className="program-card program-card--add"
                  onClick={() => setComposingProgram2(true)}
                >
                  <span className="program-card__title">+ Programme 2</span>
                  <span className="program-card__detail">À composer</span>
                </button>
              )}
            </div>

            {composingProgram2 && !hasProgram2 && (
              <ProgramComposer
                key="program2"
                targetCount={program1.templateIds.length}
                proposedItems={getAlternateProgramProposal(program1, data.templates, data.exercises)}
                programIndex={1}
                onComplete={() => setComposingProgram2(false)}
              />
            )}

            <div className="alternation-period">
              <p className="progress-section__hint">Changer de programme toutes les :</p>
              <div className="alternation-period__options">
                {PERIOD_OPTIONS.map((weeks) => (
                  <button
                    key={weeks}
                    type="button"
                    className={`alternation-period__option${
                      !periodCustomOpen && data.alternation.periodWeeks === weeks
                        ? ' alternation-period__option--active'
                        : ''
                    }`}
                    onClick={() => {
                      setPeriodCustomOpen(false)
                      handlePeriodChange(weeks)
                    }}
                  >
                    {weeks} sem.
                  </button>
                ))}
                <button
                  type="button"
                  className={`alternation-period__option${
                    periodCustomOpen || isCustomPeriod ? ' alternation-period__option--active' : ''
                  }`}
                  onClick={() => setPeriodCustomOpen(true)}
                >
                  Autre
                </button>
              </div>

              {(periodCustomOpen || isCustomPeriod) && (
                <label className="alternation-period__custom">
                  <NumberField value={data.alternation.periodWeeks} onChange={handlePeriodChange} aria-label="Nombre de semaines personnalisé" />
                  <span>semaines</span>
                </label>
              )}
            </div>

            <div className="alternation-timeline">
              {alternationPreview.map((programNumber, index) => (
                <span
                  key={index}
                  className={`alternation-timeline__week alternation-timeline__week--program${programNumber}`}
                  title={`Semaine ${index + 1} : Programme ${programNumber}`}
                >
                  {programNumber}
                </span>
              ))}
            </div>
          </section>

          <TourStep
            id="program-alternation"
            selector="#tip-program-alternation"
            text="Compose un 2e programme pour alterner régulièrement entre les deux, à la fréquence de ton choix."
          />

          <section className="progress-section">
            <h2>Séances du programme</h2>

            {hasProgram2 && (
              <>
                <div className="program-tabs">
                  <button
                    type="button"
                    className={`program-tabs__tab${viewedProgramIndex === 0 ? ' program-tabs__tab--active' : ''}`}
                    onClick={() => setSelectedProgramIndex(0)}
                  >
                    Programme 1
                    {activeProgramIndex === 0 && <span className="program-tabs__badge">En cours</span>}
                  </button>
                  <button
                    type="button"
                    className={`program-tabs__tab${viewedProgramIndex === 1 ? ' program-tabs__tab--active' : ''}`}
                    onClick={() => setSelectedProgramIndex(1)}
                  >
                    Programme 2
                    {activeProgramIndex === 1 && <span className="program-tabs__badge">En cours</span>}
                  </button>
                </div>
                <p className="progress-section__hint">
                  Bascule vers le programme {activeProgramIndex === 0 ? 2 : 1} dans {weeksUntilSwitch} semaine
                  {weeksUntilSwitch > 1 ? 's' : ''}.
                </p>
              </>
            )}

            <p className="progress-section__hint">
              L'app propose la prochaine séance du programme en fonction de ce qui a déjà été fait cette semaine.
            </p>

            {selectedProgramTemplates.length === 0 ? (
              <p className="empty-state">Aucune séance dans ce programme pour l'instant.</p>
            ) : (
              <ol className="exercise-list">
                {selectedProgramTemplates.map((template, index) => (
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

            {hasProgram2 && (
              <button type="button" className="subtle-button subtle-button--danger" onClick={handleDeleteProgram2}>
                Supprimer le programme 2
              </button>
            )}
          </section>

          <section className="progress-section">
            <h2>Couverture musculaire du programme</h2>
            {selectedProgram.templateIds.length === 0 ? (
              <p className="empty-state">Ajoute des séances à ce programme pour voir sa couverture.</p>
            ) : (
              <>
                <ul className="muscle-coverage-list">
                  {coverage.covered.map((id) => (
                    <li key={id}>{getMuscleLabel(id)}</li>
                  ))}
                </ul>
                {coverage.uncovered.length > 0 && (
                  <>
                    <p className="progress-section__hint">Jamais travaillés par aucune séance de ce programme :</p>
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
        </>
      )}
    </div>
  )
}
