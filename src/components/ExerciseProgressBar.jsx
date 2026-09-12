// Repère "Exercice X sur Y" + barre segmentée (un segment par exercice de
// la séance), pour situer d'un coup d'œil où on en est sans avoir à ouvrir
// la liste complète des exercices.
export function ExerciseProgressBar({ session }) {
  const total = session.entries.length
  const currentIndex = session.entries.findIndex((e) => e.exerciseId === session.currentExerciseId)

  return (
    <div className="exercise-progress">
      <p className="exercise-progress__label">
        Exercice {currentIndex + 1} sur {total}
      </p>
      <div className="exercise-progress__bar">
        {session.entries.map((entry, i) => {
          const state = session.completedExerciseIds.includes(entry.exerciseId)
            ? 'done'
            : i === currentIndex
              ? 'current'
              : 'pending'
          return <span key={entry.exerciseId} className={`exercise-progress__segment exercise-progress__segment--${state}`} />
        })}
      </div>
    </div>
  )
}
