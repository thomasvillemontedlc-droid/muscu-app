function formatWeekLabel(weekStart) {
  return weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// Graphique en barres minimal (divs + CSS, pas de librairie) : une barre par
// semaine, hauteur relative au maximum de la période affichée.
export function WeeklyBarChart({ weeks }) {
  if (weeks.length === 0) {
    return <p className="empty-state">Aucune séance sur cette période.</p>
  }

  const max = Math.max(1, ...weeks.map((w) => w.count))

  return (
    <div className="weekly-bar-chart">
      {weeks.map((week) => (
        <div key={week.weekStart.getTime()} className="weekly-bar-chart__col">
          <span className="weekly-bar-chart__count">{week.count}</span>
          <div
            className="weekly-bar-chart__bar"
            style={{ height: `${Math.max(4, (week.count / max) * 100)}%` }}
          />
          <span className="weekly-bar-chart__label">{formatWeekLabel(week.weekStart)}</span>
        </div>
      ))}
    </div>
  )
}
