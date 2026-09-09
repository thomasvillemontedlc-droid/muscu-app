const LABELS = {
  up: 'Progression',
  neutral: 'Stable',
  down: 'En baisse',
}

// Pastille de couleur (vert/gris/orange) indiquant la tendance d'un
// exercice par rapport à la fois précédente, sans avoir à comparer les
// chiffres soi-même.
export function TrendDot({ trend }) {
  return <span className={`trend-dot trend-dot--${trend}`} role="img" aria-label={LABELS[trend]} title={LABELS[trend]} />
}
