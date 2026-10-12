import { useState } from 'react'
import { ExercisePicker } from './ExercisePicker.jsx'

function getReason(suggestion) {
  if (suggestion.status === 'never') return `${suggestion.label} jamais travaillé`
  const days = `${suggestion.daysSince} jour${suggestion.daysSince > 1 ? 's' : ''}`
  if (suggestion.status === 'neglected') return `${suggestion.label} négligé depuis ${days}`
  return `${suggestion.label} pas travaillé depuis ${days}`
}

// Carte discrète "Compléter ta séance", affichée sur le dernier exercice
// non terminé (voir domain/completeSession.js#suggestExerciseToComplete) :
// un exercice proposé, ajouté en un toucher, ou un autre au choix.
export function CompleteSessionCard({ suggestion, exercises, suggestedIds, onAdd, onDismiss }) {
  const [picking, setPicking] = useState(false)

  return (
    <div className="complete-session">
      <div className="complete-session__header">
        <p className="complete-session__reason">Compléter ta séance · {getReason(suggestion)}</p>
        <button type="button" className="complete-session__dismiss" onClick={onDismiss} aria-label="Masquer la suggestion">
          ✕
        </button>
      </div>
      <div className="complete-session__row">
        <span className="complete-session__name">{suggestion.exerciseName}</span>
        <button type="button" className="complete-session__add" onClick={() => onAdd(suggestion.exerciseName)}>
          Ajouter
        </button>
      </div>
      {picking ? (
        <ExercisePicker exercises={exercises} suggestedIds={suggestedIds} onAdd={onAdd} />
      ) : (
        <button type="button" className="back-link complete-session__other" onClick={() => setPicking(true)}>
          Autre exercice…
        </button>
      )}
    </div>
  )
}
