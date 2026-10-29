// Graphique en barres minimal (divs + CSS, pas de librairie) : une barre
// par entrée fournie (jour ou semaine selon la page appelante), hauteur
// relative au maximum du jeu de barres affiché.
export function WeeklyBarChart({ bars }) {
  if (bars.length === 0) {
    return <p className="empty-state">Aucune séance sur cette période.</p>
  }

  const max = Math.max(1, ...bars.map((b) => b.count))

  return (
    <div className="weekly-bar-chart">
      {bars.map((bar) => (
        <div key={bar.key} className="weekly-bar-chart__col">
          {/* Barre vide en gris et sans chiffre : un 0 en lime se lisait
              comme une donnée. */}
          <span className="weekly-bar-chart__count">{bar.count > 0 ? bar.count : ''}</span>
          <div
            className={`weekly-bar-chart__bar${bar.count === 0 ? ' weekly-bar-chart__bar--empty' : ''}`}
            style={{ height: `${Math.max(4, (bar.count / max) * 100)}%` }}
          />
          <span className="weekly-bar-chart__label">{bar.label}</span>
        </div>
      ))}
    </div>
  )
}
