import { useEffect, useState } from 'react'
import { vibrateSuccess } from '../lib/haptics.js'
import { BigButton } from './BigButton.jsx'
import { DurationField } from './DurationField.jsx'
import { TourStep } from './TourStep.jsx'

// Déroulé générique d'une petite liste de mouvements (échauffement avant
// séance, étirements en fin de séance) : liste modifiable avant de lancer
// (durée, ajout, retrait, scinder un mouvement en droit/gauche), puis
// avancement entièrement MANUEL d'un mouvement à l'autre - "Mouvement
// suivant" (goToNext), décidé par l'utilisateur, jamais automatique au bout
// du chrono (qui n'est qu'une référence affichée, voir le premier effet
// ci-dessous). skipLabel/onDone abandonnent TOUTE la routine, c'est
// différent de goToNext qui avance d'un cran.
export function RoutineRunner({ title, hint, initialItems, suggestions = [], onDone, skipLabel = 'Passer', tip }) {
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

  // Juste une vibration de repère quand le temps affiché est écoulé - plus
  // d'avancement automatique (voir le commentaire au-dessus du composant).
  // Ne se déclenche qu'une fois par mouvement (dépend de `remaining`, qui ne
  // redescend pas sous 0 une fois arrivé là, voir l'effet précédent).
  useEffect(() => {
    if (!running || remaining !== 0) return
    if (items[index]?.durationSeconds > 0) vibrateSuccess()
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

  // Scinde un mouvement en deux entrées adjacentes droit/gauche (durée
  // indépendamment ajustable ensuite), comme une série unilatérale - voir
  // domain/exercises.js#setExerciseUnilateral pour le même principe côté
  // séries d'exercice.
  function handleSplitSide(id) {
    setItems((prev) =>
      prev.flatMap((item) =>
        item.id === id
          ? [
              { ...item, id: crypto.randomUUID(), side: 'droit' },
              { ...item, id: crypto.randomUUID(), side: 'gauche' },
            ]
          : [item],
      ),
    )
  }

  // Fusionne la paire droit/gauche en un seul mouvement, en gardant les
  // valeurs du côté droit (celles du gauche sont perdues) - appelable depuis
  // l'une ou l'autre moitié de la paire.
  function handleMergeSide(id) {
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.id === id)
      if (idx === -1) return prev
      const pairStart = prev[idx].side === 'gauche' ? idx - 1 : idx
      if (pairStart < 0) return prev

      const { side: _side, ...merged } = prev[pairStart]
      const next = [...prev]
      next.splice(pairStart, 2, merged)
      return next
    })
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
    // Une paire droit/gauche compte pour UN mouvement aux yeux de
    // l'utilisateur (même principe que domain/sessions.js#setEntryUnilateral
    // pour les séries) : le gauche qui suit immédiatement un droit ne
    // ré-incrémente pas le numéro affiché.
    let logicalNumber = 0
    const logicalNumbers = items.map((item, i) => {
      const isSecondOfPair = item.side === 'gauche' && items[i - 1]?.side === 'droit'
      if (!isSecondOfPair) logicalNumber++
      return logicalNumber
    })
    const sideLabel = current.side === 'droit' ? 'Côté droit' : current.side === 'gauche' ? 'Côté gauche' : null

    return (
      <div className="routine-runner">
        <h1>{title}</h1>
        <p className="routine-runner__progress">
          {logicalNumbers[index]} / {logicalNumber}
        </p>
        {current.muscleLabel && <p className="routine-runner__muscle">{current.muscleLabel}</p>}
        <p className="routine-runner__name">
          {current.name}
          {sideLabel && <span className="routine-runner__side"> · {sideLabel}</span>}
        </p>
        <p className="routine-runner__timer">{current.durationSeconds > 0 ? `${remaining}s` : '—'}</p>
        <BigButton onClick={goToNext}>Mouvement suivant</BigButton>
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
                  <span className="routine-runner__item-name">
                    {item.name}
                    {item.side && (
                      <span className="routine-runner__item-side">{item.side === 'droit' ? ' (D)' : ' (G)'}</span>
                    )}
                  </span>
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
              {item.side ? (
                <button type="button" className="routine-runner__item-side-toggle" onClick={() => handleMergeSide(item.id)}>
                  Fusionner droit/gauche
                </button>
              ) : (
                <button type="button" className="routine-runner__item-side-toggle" onClick={() => handleSplitSide(item.id)}>
                  Par côté (droit/gauche)
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div id={tip ? `tip-${tip.id}` : undefined} className="routine-runner__add">
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

      {tip && <TourStep id={tip.id} selector={`#tip-${tip.id}`} text={tip.text} />}

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
