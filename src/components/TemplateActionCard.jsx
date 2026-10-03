// Carte "séance type" tactile, partagée par MuscleGapSuggestions.jsx
// (manques musculaires) et MuscleInfoSheet.jsx (fiche muscle) : toucher
// l'en-tête révèle deux actions, Lancer (startSessionFromTemplate) et
// Prochaine séance (domain/program.js#setNextTemplate). `headerExtra` est
// le contenu propre à l'appelant affiché sous le nom, toujours visible
// (muscles couverts, ou liste d'exercices) - seules les actions se
// cachent/révèlent via `isOpen`.
export function TemplateActionCard({
  template,
  headerExtra,
  isOpen,
  onToggle,
  isNext,
  inProgressSession,
  onStart,
  onSetNext,
}) {
  const isEmpty = template.exerciseIds.length === 0

  return (
    <li className={`gap-suggestion${isOpen ? ' gap-suggestion--open' : ''}`}>
      <button type="button" className="gap-suggestion__head" aria-expanded={isOpen} onClick={onToggle}>
        <span className="muscle-coverage-suggestions__name">{template.name}</span>
        {headerExtra}
        {isNext && <span className="gap-suggestion__badge">Prochaine séance</span>}
      </button>

      {isOpen && (
        <div className="gap-suggestion__actions">
          <button
            type="button"
            className="gap-suggestion__action gap-suggestion__action--primary"
            onClick={onStart}
            disabled={isEmpty || inProgressSession != null}
          >
            Lancer
          </button>
          <button type="button" className="gap-suggestion__action" onClick={onSetNext} disabled={isNext}>
            {isNext ? '✓ Prochaine séance' : 'Prochaine séance'}
          </button>
          {inProgressSession && (
            <p className="gap-suggestion__note">
              Une séance est déjà en cours ({inProgressSession.templateName}) : termine-la avant d'en lancer une
              autre.
            </p>
          )}
          {isEmpty && <p className="gap-suggestion__note">Cette séance ne contient aucun exercice.</p>}
        </div>
      )}
    </li>
  )
}
