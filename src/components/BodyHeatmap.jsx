import { getMuscleLabel } from '../domain/muscleGroups.js'

// Opacité plancher : même un muscle très peu sollicité (intensité > 0) reste
// visible, seul un muscle non touché du tout (0) reste totalement éteint.
const MIN_OPACITY = 0.15

function opacity(intensities, muscleId) {
  const value = intensities[muscleId] ?? 0
  if (value <= 0) return 0
  return MIN_OPACITY + value * (1 - MIN_OPACITY)
}

// Silhouette commune (tête, tronc, bras, jambes) partagée par les deux vues :
// seuls les muscles mis en évidence à l'intérieur diffèrent.
function Outline() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5">
      <circle cx="50" cy="16" r="9" />
      <line x1="50" y1="25" x2="50" y2="34" />
      <path d="M32 34 L68 34 L62 90 L38 90 Z" />
      <line x1="34" y1="36" x2="20" y2="70" />
      <line x1="66" y1="36" x2="80" y2="70" />
      <line x1="42" y1="90" x2="38" y2="150" />
      <line x1="58" y1="90" x2="62" y2="150" />
      <line x1="38" y1="150" x2="38" y2="185" />
      <line x1="62" y1="150" x2="62" y2="185" />
    </g>
  )
}

function FrontMuscles({ intensities }) {
  const fill = 'var(--color-primary)'
  return (
    <g fill={fill}>
      <ellipse cx="34" cy="38" rx="6" ry="7" opacity={opacity(intensities, 'deltoides')} />
      <ellipse cx="66" cy="38" rx="6" ry="7" opacity={opacity(intensities, 'deltoides')} />
      <ellipse cx="42" cy="47" rx="8" ry="9" opacity={opacity(intensities, 'pectoraux')} />
      <ellipse cx="58" cy="47" rx="8" ry="9" opacity={opacity(intensities, 'pectoraux')} />
      <ellipse cx="27" cy="52" rx="4.5" ry="9" opacity={opacity(intensities, 'biceps')} />
      <ellipse cx="73" cy="52" rx="4.5" ry="9" opacity={opacity(intensities, 'biceps')} />
      <rect x="43" y="58" width="14" height="26" rx="4" opacity={opacity(intensities, 'abdominaux')} />
      <ellipse cx="34" cy="112" rx="6.5" ry="16" opacity={opacity(intensities, 'abducteurs')} />
      <ellipse cx="66" cy="112" rx="6.5" ry="16" opacity={opacity(intensities, 'abducteurs')} />
      <ellipse cx="41" cy="115" rx="4.5" ry="15" opacity={opacity(intensities, 'quadriceps')} />
      <ellipse cx="59" cy="115" rx="4.5" ry="15" opacity={opacity(intensities, 'quadriceps')} />
      <ellipse cx="47" cy="118" rx="3.5" ry="13" opacity={opacity(intensities, 'adducteurs')} />
      <ellipse cx="53" cy="118" rx="3.5" ry="13" opacity={opacity(intensities, 'adducteurs')} />
    </g>
  )
}

function BackMuscles({ intensities }) {
  const fill = 'var(--color-primary)'
  return (
    <g fill={fill}>
      <ellipse cx="50" cy="37" rx="15" ry="7" opacity={opacity(intensities, 'trapezes')} />
      <ellipse cx="34" cy="38" rx="6" ry="7" opacity={opacity(intensities, 'deltoides')} />
      <ellipse cx="66" cy="38" rx="6" ry="7" opacity={opacity(intensities, 'deltoides')} />
      <path d="M39 44 Q50 40 61 44 L58 68 Q50 72 42 68 Z" opacity={opacity(intensities, 'dorsaux')} />
      <ellipse cx="27" cy="52" rx="4.5" ry="9" opacity={opacity(intensities, 'triceps')} />
      <ellipse cx="73" cy="52" rx="4.5" ry="9" opacity={opacity(intensities, 'triceps')} />
      <rect x="41" y="70" width="18" height="16" rx="4" opacity={opacity(intensities, 'lombaires')} />
      <ellipse cx="42" cy="94" rx="8" ry="8" opacity={opacity(intensities, 'fessiers')} />
      <ellipse cx="58" cy="94" rx="8" ry="8" opacity={opacity(intensities, 'fessiers')} />
      <ellipse cx="41" cy="118" rx="4.5" ry="15" opacity={opacity(intensities, 'ischio-jambiers')} />
      <ellipse cx="59" cy="118" rx="4.5" ry="15" opacity={opacity(intensities, 'ischio-jambiers')} />
      <ellipse cx="38" cy="163" rx="4.5" ry="12" opacity={opacity(intensities, 'mollets')} />
      <ellipse cx="62" cy="163" rx="4.5" ry="12" opacity={opacity(intensities, 'mollets')} />
    </g>
  )
}

// Deux silhouettes (face, dos) : chaque groupe musculaire s'allume avec une
// opacité proportionnelle à `intensities[muscleId]` (0..1, voir
// domain/muscleHeatmap.js). Muscles principaux et secondaires ne sont pas
// distingués visuellement ici (l'intensité les inclut déjà, un secondaire
// pesant moins lourd dans le volume qui produit cette intensité).
export function BodyHeatmap({ intensities, className }) {
  return (
    <div className={`body-heatmap${className ? ` ${className}` : ''}`}>
      <div className="body-heatmap__view">
        <svg viewBox="0 0 100 195" aria-hidden="true">
          <Outline />
          <FrontMuscles intensities={intensities} />
        </svg>
        <span className="body-heatmap__label">Face</span>
      </div>
      <div className="body-heatmap__view">
        <svg viewBox="0 0 100 195" aria-hidden="true">
          <Outline />
          <BackMuscles intensities={intensities} />
        </svg>
        <span className="body-heatmap__label">Dos</span>
      </div>
    </div>
  )
}

// Légende texte (accessible, et utile pour repérer un muscle précis sans
// deviner sa position sur le schéma) : les muscles réellement sollicités
// (intensité > 0), du plus au moins intense.
export function BodyHeatmapLegend({ intensities }) {
  const active = Object.entries(intensities)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])

  if (active.length === 0) return null

  return (
    <ul className="body-heatmap__legend">
      {active.map(([muscleId]) => (
        <li key={muscleId}>{getMuscleLabel(muscleId)}</li>
      ))}
    </ul>
  )
}
