import Model from 'react-body-highlighter'
import { getMuscleLabel, MUSCLE_GROUPS } from '../domain/muscleGroups.js'

// Nos groupes musculaires -> muscles de react-body-highlighter. "deltoides"
// n'existe pas comme muscle unique côté librairie (front-deltoids et
// back-deltoids séparés) : on vise les deux pour qu'il s'allume sur les deux
// vues avec la même intensité.
// "brachial" n'a pas d'équivalent dans la librairie : rattaché visuellement
// aux biceps (le brachial est juste dessous).
const MUSCLE_TO_LIBRARY = {
  pectoraux: ['chest'],
  dorsaux: ['upper-back'],
  trapezes: ['trapezius'],
  deltoides: ['front-deltoids', 'back-deltoids'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  'avant-bras': ['forearm'],
  brachial: ['biceps'],
  // Les trois zones d'abdos partagent la même zone du schéma (la librairie
  // n'a qu'un "abs") : la zone s'allume au niveau de la plus sollicitée, et
  // la fiche muscle détaille les trois.
  'abdos-haut': ['abs'],
  'abdos-bas': ['abs'],
  'abdos-profonds': ['abs'],
  obliques: ['obliques'],
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
const HIGHLIGHTED_COLORS = ['#3f5212', '#5b7a12', '#7fae16', '#a6e22a', '#c6ff3d']
const BODY_COLOR = '#3a3f4a'

function toFrequency(intensity) {
  return Math.max(1, Math.min(LEVELS, Math.ceil(intensity * LEVELS)))
}

// Muscles de la librairie -> nos groupes (sens inverse de
// MUSCLE_TO_LIBRARY) : sert à la fiche muscle quand on touche une zone du
// schéma. Les soléaires (vue de dos) sont rattachés aux mollets.
const LIBRARY_TO_MUSCLES = (() => {
  const map = { 'left-soleus': ['mollets'], 'right-soleus': ['mollets'] }
  for (const id of MUSCLE_GROUPS) {
    for (const libraryMuscle of MUSCLE_TO_LIBRARY[id]) {
      map[libraryMuscle] = [...(map[libraryMuscle] ?? []), id]
    }
  }
  return map
})()

// Un seul "exercice" par muscle de la librairie, au niveau du plus
// sollicité de nos groupes qui y sont rattachés (biceps + brachial, les
// trois zones d'abdos) : la librairie additionnerait sinon les fréquences
// de deux entrées visant la même zone.
function buildLibraryData(intensities) {
  const byLibraryMuscle = {}
  for (const id of MUSCLE_GROUPS) {
    const value = intensities[id] ?? 0
    if (value <= 0) continue
    for (const libraryMuscle of MUSCLE_TO_LIBRARY[id]) {
      byLibraryMuscle[libraryMuscle] = Math.max(byLibraryMuscle[libraryMuscle] ?? 0, value)
    }
  }
  return Object.entries(byLibraryMuscle).map(([libraryMuscle, value]) => ({
    name: libraryMuscle,
    muscles: [libraryMuscle],
    frequency: toFrequency(value),
  }))
}

const SVG_STYLE = { width: '100%', height: 'auto' }

// Deux vues (face, dos) : chaque groupe musculaire s'allume avec une
// intensité proportionnelle à `intensities[muscleId]` (0..1, voir
// domain/muscleHeatmap.js). Si `onMuscleSelect` est fourni, toucher une
// zone renvoie nos groupes musculaires correspondants (ex. la zone abdos
// -> les trois zones d'abdos).
export function BodyHeatmap({ intensities, className, onMuscleSelect }) {
  const data = buildLibraryData(intensities)
  const handleClick = onMuscleSelect
    ? ({ muscle }) => {
        const muscleIds = LIBRARY_TO_MUSCLES[muscle]
        if (muscleIds) onMuscleSelect(muscleIds)
      }
    : undefined

  return (
    <div className={`body-heatmap${onMuscleSelect ? ' body-heatmap--interactive' : ''}${className ? ` ${className}` : ''}`}>
      <div className="body-heatmap__view">
        <Model type="anterior" data={data} bodyColor={BODY_COLOR} highlightedColors={HIGHLIGHTED_COLORS} svgStyle={SVG_STYLE} onClick={handleClick} />
        <span className="body-heatmap__label">Face</span>
      </div>
      <div className="body-heatmap__view">
        <Model type="posterior" data={data} bodyColor={BODY_COLOR} highlightedColors={HIGHLIGHTED_COLORS} svgStyle={SVG_STYLE} onClick={handleClick} />
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
