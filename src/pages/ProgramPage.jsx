import { useState } from 'react'
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
import { BigButton } from '../components/BigButton.jsx'
import { OnboardingTip } from '../components/OnboardingTip.jsx'

export function ProgramPage() {
  const { data, setData } = useAppDataContext()
  const program = data.weeklyProgram
  const rotationWeeks = data.settings.rotationWeeks
  const [templateToAdd, setTemplateToAdd] = useState('')
  const [proposal, setProposal] = useState(null)

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

  function handleMove(index, direction) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= program.templateIds.length) return
    persistProgram(moveTemplateInProgram(program, index, targetIndex))
  }

  function handleGenerateProposal() {
    setProposal(proposeRotation(program, data.templates, data.exercises))
  }

  function handleEditProposedName(templateIndex, exerciseIndex, name) {
    setProposal((prev) =>
      prev.map((item, i) =>
        i === templateIndex
          ? { ...item, proposedNames: item.proposedNames.map((n, j) => (j === exerciseIndex ? name : n)) }
          : item,
      ),
    )
  }

  function handleAcceptProposal() {
    let templates = data.templates
    let exercises = data.exercises

    for (const item of proposal) {
      const result = applyRotationProposal(templates, exercises, item.templateId, item.proposedNames)
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
  }

  function handleDeclineProposal() {
    persistProgram({ ...program, blockStartDate: new Date().toISOString() })
    setProposal(null)
  }

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Mes séances
      </Link>

      <h1>Programme hebdomadaire</h1>

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
                  Mêmes groupes musculaires, nouveaux exercices — modifie ce qui ne te convient pas avant d'accepter.
                </p>
                {proposal.map((item, templateIndex) => (
                  <div key={item.templateId} className="rotation-proposal__template">
                    <h3>{item.templateName}</h3>
                    <ul className="rotation-proposal__list">
                      {item.proposedNames.map((name, exerciseIndex) => (
                        <li key={exerciseIndex} className="rotation-proposal__row">
                          <span className="rotation-proposal__old">{item.currentNames[exerciseIndex]}</span>
                          <span aria-hidden="true">→</span>
                          <input
                            type="text"
                            className="rotation-proposal__input"
                            value={name}
                            onChange={(e) => handleEditProposedName(templateIndex, exerciseIndex, e.target.value)}
                            aria-label={`Remplacement proposé pour ${item.currentNames[exerciseIndex]}`}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <BigButton onClick={handleAcceptProposal}>Accepter la rotation</BigButton>
                <BigButton variant="secondary" onClick={handleDeclineProposal}>
                  Refuser et garder les séances actuelles
                </BigButton>
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
