import { getExerciseUnit } from '../domain/muscleGroups.js'
import { getSetPosition } from '../lib/formatSet.js'

function formatSetValue(set, unit) {
  if (!set) return '—'
  return unit === 'time' ? `${set.reps}s` : `${set.weight}kg × ${set.reps}`
}

// Une ligne par série prévue pour l'exercice en cours, comparant la
// performance de la dernière fois à celle d'aujourd'hui. La série en cours
// est mise en évidence.
export function SetComparisonTable({ entry, last, currentSetIndex }) {
  const unit = getExerciseUnit(entry.exerciseName)

  return (
    <table className="set-comparison">
      <thead>
        <tr>
          <th>Série</th>
          <th>Dernière fois</th>
          <th>Aujourd'hui</th>
        </tr>
      </thead>
      <tbody>
        {entry.sets.map((set, i) => {
          const pos = getSetPosition(entry.sets, i)
          return (
            <tr key={i} className={i === currentSetIndex ? 'set-comparison__row--current' : undefined}>
              <td>
                {pos.position}
                {pos.sideLabel ? ` (${pos.sideLabel === 'Côté droit' ? 'D' : 'G'})` : ''}
              </td>
              <td>{formatSetValue(last?.sets[i], unit)}</td>
              <td>{formatSetValue(set, unit)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
