import { updateSingleSet } from '../domain/sessions.js'
import { setExerciseBarWeight } from '../domain/exercises.js'
import { isWarmupSet } from '../domain/setKinds.js'
import { formatSet, getSetLabel } from '../lib/formatSet.js'
import { SetRow, SetRowHeader } from './SetRow.jsx'

// Toutes les séries d'un exercice pendant la séance : celles déjà validées
// (index < doneCount) modifiables une à une, celle en cours
// (currentSetIndex, null si aucune) mise en évidence, celles à venir
// atténuées. updateSingleSet ne touche que la série visée : ni la
// progression (doneSetCount, curseur) ni le repos en cours ne bougent.
// Sert sur l'écran d'exercice (correction pendant ou hors repos) et dans la
// liste des exercices (exercice déjà terminé).
// `onlyDone` : seulement les séries déjà faites (écran de correction).
export function DoneSetsEditor({ sessionId, entry, exercise, doneCount, currentSetIndex = null, onlyDone = false, setData }) {
  const exerciseId = entry.exerciseId

  function updateSet(setIndex, changes) {
    setData((current) => ({
      ...current,
      sessions: updateSingleSet(current.sessions, sessionId, exerciseId, setIndex, changes),
    }))
  }

  function updateExercise(update) {
    setData((current) => ({ ...current, exercises: update(current.exercises) }))
  }

  return (
    <div className="exercise-sets">
      <SetRowHeader exercise={exercise} />
      {entry.sets.map((set, i) => {
        if (i === currentSetIndex || i >= doneCount) {
          if (onlyDone) return null
          const isCurrent = i === currentSetIndex
          return (
            <div
              key={i}
              className={`exercise-sets__line${isCurrent ? ' exercise-sets__line--current' : ' exercise-sets__line--upcoming'}`}
            >
              <span>{getSetLabel(entry.sets, i)}</span>
              <span>{isCurrent ? 'En cours' : formatSet(set, entry.exerciseName)}</span>
            </div>
          )
        }
        return (
          <SetRow
            key={i}
            index={i}
            label={getSetLabel(entry.sets, i)}
            warmup={isWarmupSet(set)}
            weight={set.weight}
            reps={set.reps}
            side={set.side}
            exercise={exercise}
            onChangeWeight={(weight) => updateSet(i, { weight })}
            onChangeReps={(reps) => updateSet(i, { reps })}
            onChangeBarWeight={(barWeight) => updateExercise((list) => setExerciseBarWeight(list, exerciseId, barWeight))}
            onRemove={() => {}}
            removeDisabled
          />
        )
      })}
    </div>
  )
}
