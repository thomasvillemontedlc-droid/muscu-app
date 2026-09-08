import { Link, useParams } from 'react-router-dom'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { addSet, getSessionById, markSessionDone, removeSet, updateSet } from '../domain/sessions.js'
import { getLastPerformance } from '../domain/history.js'
import { SetRow } from '../components/SetRow.jsx'
import { BigButton } from '../components/BigButton.jsx'

export function SessionRunPage() {
  const { sessionId } = useParams()
  const { data, setData } = useAppDataContext()

  const session = getSessionById(data.sessions, sessionId)

  if (!session) {
    return (
      <div className="page">
        <p>Séance introuvable.</p>
        <Link to="/">Retour</Link>
      </div>
    )
  }

  // Exclut la séance en cours pour toujours afficher la vraie séance précédente,
  // même si celle-ci a été pré-remplie avec les mêmes valeurs.
  const otherSessions = data.sessions.filter((s) => s.id !== sessionId)

  function handleAddSet(exerciseId) {
    const entry = session.entries.find((e) => e.exerciseId === exerciseId)
    const lastSet = entry.sets[entry.sets.length - 1] ?? { weight: 0, reps: 0 }
    setData({ ...data, sessions: addSet(data.sessions, sessionId, exerciseId, lastSet) })
  }

  function handleRemoveSet(exerciseId, setIndex) {
    setData({ ...data, sessions: removeSet(data.sessions, sessionId, exerciseId, setIndex) })
  }

  function handleUpdateSet(exerciseId, setIndex, changes) {
    setData({ ...data, sessions: updateSet(data.sessions, sessionId, exerciseId, setIndex, changes) })
  }

  function handleToggleDone() {
    setData({ ...data, sessions: markSessionDone(data.sessions, sessionId, !session.done) })
  }

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Mes séances
      </Link>

      <h1>{session.templateName}</h1>
      <p className="session-date">{new Date(session.date).toLocaleDateString('fr-FR')}</p>

      {session.entries.map((entry) => {
        const last = getLastPerformance(otherSessions, entry.exerciseId)
        return (
          <section key={entry.exerciseId} className="exercise-block">
            <h2>{entry.exerciseName}</h2>

            {last ? (
              <p className="last-performance">
                Dernière fois ({new Date(last.date).toLocaleDateString('fr-FR')}) :{' '}
                {last.sets.map((s) => `${s.weight}kg×${s.reps}`).join(', ')}
              </p>
            ) : (
              <p className="last-performance last-performance--empty">Première fois sur cet exercice</p>
            )}

            {entry.sets.map((set, index) => (
              <SetRow
                key={index}
                index={index}
                weight={set.weight}
                reps={set.reps}
                onChangeWeight={(weight) => handleUpdateSet(entry.exerciseId, index, { weight })}
                onChangeReps={(reps) => handleUpdateSet(entry.exerciseId, index, { reps })}
                onRemove={() => handleRemoveSet(entry.exerciseId, index)}
              />
            ))}

            <button type="button" className="add-set-button" onClick={() => handleAddSet(entry.exerciseId)}>
              + Ajouter une série
            </button>
          </section>
        )
      })}

      <BigButton variant={session.done ? 'secondary' : 'primary'} onClick={handleToggleDone}>
        {session.done ? '✓ Séance faite — annuler' : 'Marquer comme faite'}
      </BigButton>
    </div>
  )
}
