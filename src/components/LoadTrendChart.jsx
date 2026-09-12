function formatWeekLabel(weekStart) {
  return weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatValue(value, unit) {
  if (value == null) return '—'
  return unit === 'time' ? `${value}s` : `${value}kg`
}

// Graphique en barres (divs + CSS, même principe que WeeklyBarChart) de la
// meilleure charge (ou durée) par semaine pour l'exercice sélectionné, sous
// le sélecteur d'exercice de l'onglet Progression. Une semaine sans séance
// reste une colonne vide plutôt qu'une barre à zéro : une charge nulle
// laisserait croire à une contre-performance là où il n'y a simplement pas
// eu de séance.
export function LoadTrendChart({ weeks, unit }) {
  const values = weeks.map((w) => w.value).filter((v) => v != null)

  if (values.length === 0) {
    return <p className="empty-state">Pas encore assez de données sur cette période.</p>
  }

  const max = Math.max(...values)

  return (
    <div className="load-trend-chart">
      {weeks.map((week) => (
        <div key={week.weekStart.getTime()} className="load-trend-chart__col">
          <span className="load-trend-chart__value">{formatValue(week.value, unit)}</span>
          {week.value != null && (
            <div
              className="load-trend-chart__bar"
              style={{ height: `${Math.max(4, (week.value / max) * 100)}%` }}
            />
          )}
          <span className="load-trend-chart__label">{formatWeekLabel(week.weekStart)}</span>
        </div>
      ))}
    </div>
  )
}
