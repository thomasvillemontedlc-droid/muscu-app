import { getExerciseUnit } from '../domain/muscleGroups.js'
import { getWorkSets } from '../domain/setKinds.js'
import { formatDecimal } from '../lib/formatNumber.js'
import { formatWeight, getSetPosition } from '../lib/formatSet.js'

function formatSetValue(set, unit, exerciseName) {
  if (!set) return '—'
  return unit === 'time' ? `${set.reps}s` : `${formatWeight(set.weight, exerciseName)} × ${formatDecimal(set.reps)}`
}

// Une ligne par série prévue pour l'exercice en cours, comparant la
// performance de la dernière fois à celle d'aujourd'hui. La série en cours
// est mise en évidence. Une série d'échauffement n'a pas d'équivalent "la
// dernière fois" (last.sets ne contient que des séries de travail, voir
// domain/history.js#getLastPerformance) : la comparaison se fait par rang
// parmi les séries de travail.
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
          const workIndex = getWorkSets(entry.sets.slice(0, i)).length
          const rowClass = [
            i === currentSetIndex && 'set-comparison__row--current',
            pos.warmup && 'set-comparison__row--warmup',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <tr key={i} className={rowClass || undefined}>
              <td>
                {pos.warmup ? 'Échauff.' : pos.position}
                {pos.sideLabel ? ` (${pos.sideLabel === 'Côté droit' ? 'D' : 'G'})` : ''}
              </td>
              <td>{pos.warmup ? '—' : formatSetValue(last?.sets[workIndex], unit, entry.exerciseName)}</td>
              <td>{formatSetValue(set, unit, entry.exerciseName)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
