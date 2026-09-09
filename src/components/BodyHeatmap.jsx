import Model from 'react-body-highlighter'
import { getMuscleLabel, MUSCLE_GROUPS } from '../domain/muscleGroups.js'

// Nos groupes musculaires -> muscles de react-body-highlighter. "deltoides"
// n'existe pas comme muscle unique côté librairie (front-deltoids et
// back-deltoids séparés) : on vise les deux pour qu'il s'allume sur les deux
// vues avec la même intensité.
const MUSCLE_TO_LIBRARY = {
  pectoraux: ['chest'],
  dorsaux: ['upper-back'],
  trapezes: ['trapezius'],
  deltoides: ['front-deltoids', 'back-deltoids'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  abdominaux: ['abs'],
  lombaires: ['lower-back'],
  quadriceps: ['quadriceps'],
  'ischio-jambiers': ['hamstring'],
  fessiers: ['gluteal'],
  mollets: ['calves'],
  adducteurs: ['adductor'],
  abducteurs: ['abductors'],
}

// La librairie n'accepte qu'un niveau discret (index dans highlightedColors),
// pas une intensité continue : on découpe 0..1 en 5 paliers.
const LEVELS = 5
const HIGHLIGHTED_COLORS = ['#14532d', '#166534', '#16a34a', '#22c55e', '#4ade80']
const BODY_COLOR = '#334155'

function toFrequency(intensity) {
  return Math.max(1, Math.min(LEVELS, Math.ceil(intensity * LEVELS)))
}

// Un "exercice" par muscle sollicité (jamais deux entrées visant le même nom
// de muscle côté librairie, qui additionnerait les fréquences) : garantit un
// niveau exact plutôt qu'un cumul imprévisible.
function buildLibraryData(intensities) {
  return MUSCLE_GROUPS.filter((id) => (intensities[id] ?? 0) > 0).map((id) => ({
    name: getMuscleLabel(id),
    muscles: MUSCLE_TO_LIBRARY[id],
    frequency: toFrequency(intensities[id]),
  }))
}

const SVG_STYLE = { width: '100%', height: 'auto' }

// Deux vues (face, dos) : chaque groupe musculaire s'allume avec une
// intensité proportionnelle à `intensities[muscleId]` (0..1, voir
// domain/muscleHeatmap.js).
export function BodyHeatmap({ intensities, className }) {
  const data = buildLibraryData(intensities)

  return (
    <div className={`body-heatmap${className ? ` ${className}` : ''}`}>
      <div className="body-heatmap__view">
        <Model type="anterior" data={data} bodyColor={BODY_COLOR} highlightedColors={HIGHLIGHTED_COLORS} svgStyle={SVG_STYLE} />
        <span className="body-heatmap__label">Face</span>
      </div>
      <div className="body-heatmap__view">
        <Model type="posterior" data={data} bodyColor={BODY_COLOR} highlightedColors={HIGHLIGHTED_COLORS} svgStyle={SVG_STYLE} />
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
