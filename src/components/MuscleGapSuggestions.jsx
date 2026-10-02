// Partie commune à "Muscles non sollicités" et "Déséquilibre sur le long
// terme" (ProgressPage.jsx) : étant donné des muscles à combler, les
// séances existantes qui les couvrent le mieux (voir
// domain/muscleCoverage.js#suggestSessionsForMissingMuscles), et ceux
// qu'aucune séance existante ne couvre.
export function MuscleGapSuggestions({ suggestions, uncovered }) {
  return (
    <>
      {suggestions.length > 0 && (
        <div className="muscle-coverage-suggestions">
          <p className="progress-section__hint">Séances existantes qui couvrent le mieux ces manques :</p>
          <ul>
            {suggestions.map(({ template, covers }) => (
              <li key={template.id}>
                <span className="muscle-coverage-suggestions__name">{template.name}</span>
                <span className="muscle-coverage-suggestions__covers">{covers.map((c) => c.label).join(', ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {uncovered.length > 0 && (
        <p className="progress-section__hint">
          Aucune séance existante ne couvre : {uncovered.map((c) => c.label).join(', ')}.
        </p>
      )}
    </>
  )
}
