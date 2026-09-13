import { useEffect, useState } from 'react'
import { vibrateSuccess } from '../lib/haptics.js'
import { BigButton } from './BigButton.jsx'
import { DurationField } from './DurationField.jsx'

// Déroulé générique d'une petite liste de mouvements chronométrés, un par
// un (échauffement avant séance, étirements en fin de séance) : liste
// modifiable avant de lancer (durée, ajout, retrait), puis défilement
// automatique d'un mouvement à l'autre une fois le temps écoulé — ou
// manuel via "Passer ce mouvement" (goToNext), sans attendre le décompte
// ni annuler le reste de la routine (skipLabel/onDone abandonnent
// TOUTE la routine, c'est différent).
export function RoutineRunner({ title, hint, initialItems, suggestions = [], onDone, skipLabel = 'Passer' }) {
  const [items, setItems] = useState(initialItems)
  const [running, setRunning] = useState(false)
  const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (!running || remaining <= 0) return
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(id)
  }, [running, remaining])

  useEffect(() => {
    if (!running || remaining > 0) return
    vibrateSuccess()
    goToNext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, remaining])

  function goToNext() {
    setIndex((current) => {
      const next = current + 1
      if (next >= items.length) {
        setRunning(false)
        onDone()
        return current
      }
      setRemaining(items[next].durationSeconds)
      return next
    })
  }

  function handleStart() {
    if (items.length === 0) {
      onDone()
      return
    }
    setIndex(0)
    setRemaining(items[0].durationSeconds)
    setRunning(true)
  }

  function handleRemove(id) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function handleDurationChange(id, durationSeconds) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, durationSeconds } : item)))
  }

  function addItem(name) {
    if (!name) return
    setItems((prev) => [...prev, { id: crypto.randomUUID(), muscleLabel: null, name, durationSeconds: 30 }])
  }

  function handleAdd() {
    addItem(newName.trim())
    setNewName('')
  }

  const addedNames = new Set(items.map((item) => item.name))
  const query = newName.trim().toLowerCase()
  const visibleSuggestions = suggestions.filter(
    (name) => !addedNames.has(name) && (query === '' || name.toLowerCase().includes(query)),
  )

  if (running) {
    const current = items[index]
    return (
      <div className="routine-runner">
        <h1>{title}</h1>
        <p className="routine-runner__progress">
          {index + 1} / {items.length}
        </p>
        {current.muscleLabel && <p className="routine-runner__muscle">{current.muscleLabel}</p>}
        <p className="routine-runner__name">{current.name}</p>
        <p className="routine-runner__timer">{current.durationSeconds > 0 ? `${remaining}s` : '—'}</p>
        <BigButton onClick={goToNext}>Passer ce mouvement</BigButton>
        <button
          type="button"
          className="subtle-button"
          onClick={() => {
            setRunning(false)
            onDone()
          }}
        >
          {skipLabel}
        </button>
      </div>
    )
  }

  return (
    <div className="routine-runner">
      <h1>{title}</h1>
      {hint && <p className="routine-runner__hint">{hint}</p>}

      {items.length === 0 ? (
        <p className="empty-state">Liste vide.</p>
      ) : (
        <ul className="routine-runner__list">
          {items.map((item) => (
            <li key={item.id} className="routine-runner__item">
              <div className="routine-runner__item-header">
                <div className="routine-runner__item-info">
                  {item.muscleLabel && <span className="routine-runner__item-muscle">{item.muscleLabel}</span>}
                  <span className="routine-runner__item-name">{item.name}</span>
                </div>
                <button
                  type="button"
                  className="routine-runner__item-remove"
                  onClick={() => handleRemove(item.id)}
                  aria-label={`Retirer ${item.name}`}
                >
                  ✕
                </button>
              </div>
              <DurationField
                className="routine-runner__item-duration"
                value={item.durationSeconds}
                onChange={(value) => handleDurationChange(item.id, value)}
                aria-label={`Durée ${item.name}`}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="routine-runner__add">
        <input
          className="routine-runner__add-input"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ajouter un mouvement"
          aria-label="Nom du mouvement à ajouter"
        />
        <button type="button" className="routine-runner__add-button" onClick={handleAdd}>
          Ajouter
        </button>
      </div>

      {visibleSuggestions.length > 0 && (
        <div className="routine-runner__suggestions">
          {visibleSuggestions.map((name) => (
            <button
              key={name}
              type="button"
              className="routine-runner__suggestion"
              onClick={() => addItem(name)}
            >
              + {name}
            </button>
          ))}
        </div>
      )}

      <BigButton onClick={handleStart} disabled={items.length === 0}>
        Lancer
      </BigButton>
      <button type="button" className="subtle-button" onClick={onDone}>
        {skipLabel}
      </button>
    </div>
  )
}
