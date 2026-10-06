import { useEffect, useState } from 'react'
import { playSingleBeep, unlockAudio } from '../lib/alarm.js'
import { vibrateSuccess } from '../lib/haptics.js'
import { BigButton } from './BigButton.jsx'
import { DurationField } from './DurationField.jsx'
import { TourStep } from './TourStep.jsx'

// Un mouvement `sides: true` -> deux entrées adjacentes droit/gauche de
// même durée (même forme que celles produites par "Par côté", voir
// handleSplitSide) ; les autres restent tels quels.
function expandSides(item) {
  const { sides, ...rest } = item
  if (!sides) return [rest]
  return [
    { ...rest, id: `${rest.id}-droit`, side: 'droit' },
    { ...rest, id: `${rest.id}-gauche`, side: 'gauche' },
  ]
}

// Déroulé générique d'une petite liste de mouvements (échauffement avant
// séance, étirements en fin de séance) : liste modifiable avant de lancer
// (durée, ajout, retrait, scinder un mouvement en droit/gauche), puis
// avancement entièrement MANUEL d'un mouvement à l'autre - "Mouvement
// suivant" (goToNext), décidé par l'utilisateur, jamais automatique au bout
// du chrono (qui n'est qu'une référence affichée, voir le premier effet
// ci-dessous). skipLabel/onDone abandonnent TOUTE la routine, c'est
// différent de goToNext qui avance d'un cran. Sur le DERNIER mouvement, le
// bouton principal devient finishLabel/onFinish (ex. "Commencer la séance",
// "Voir mes progrès") s'ils sont fournis, sinon "Mouvement suivant" qui
// termine la routine (onDone).
// Un mouvement `sides: true` (fait un côté à la fois, voir
// domain/stretches.js et domain/warmup.js) est déroulé automatiquement en
// deux étapes droit puis gauche de même durée (fusionnables avant de
// lancer) ; `suggestions` accepte des noms ou des { name, sides }.
export function RoutineRunner({
  title,
  hint,
  initialItems,
  suggestions = [],
  onDone,
  skipLabel = 'Passer',
  finishLabel,
  onFinish,
  tip,
}) {
  const [items, setItems] = useState(() => initialItems.flatMap(expandSides))
  const [running, setRunning] = useState(false)
  const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [newName, setNewName] = useState('')

  // Le chrono continue sous zéro (affiché +1s, +2s...) tant qu'on ne passe pas au
  // mouvement suivant : il indique de combien on a dépassé, sans jamais
  // avancer tout seul. Pas de chrono pour un mouvement sans durée.
  const timed = running && items[index]?.durationSeconds > 0
  useEffect(() => {
    if (!timed) return
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(id)
  }, [timed, remaining])

  // Bip + vibration de repère quand le temps affiché arrive à zéro - plus
  // d'avancement automatique (voir le commentaire au-dessus du composant).
  // Une seule fois par mouvement : `remaining` ne repasse jamais par 0 en
  // descendant ensuite.
  useEffect(() => {
    if (!timed || remaining !== 0) return
    playSingleBeep()
    vibrateSuccess()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed, remaining])

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
    // Geste utilisateur : débloque l'audio pour le bip de fin de mouvement
    // (voir lib/alarm.js#unlockAudio).
    unlockAudio()
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

  function addItem(name, sides = false) {
    if (!name) return
    const item = { id: crypto.randomUUID(), muscleLabel: null, name, sides, durationSeconds: 30 }
    setItems((prev) => [...prev, ...expandSides(item)])
  }

  // Saisie libre : un mouvement connu des suggestions garde son `sides`.
  function handleAdd() {
    const name = newName.trim()
    addItem(name, normalizedSuggestions.find((s) => s.name === name)?.sides ?? false)
    setNewName('')
  }

  const normalizedSuggestions = suggestions.map((s) => (typeof s === 'string' ? { name: s, sides: false } : s))
  const addedNames = new Set(items.map((item) => item.name))
  const query = newName.trim().toLowerCase()
  const visibleSuggestions = normalizedSuggestions.filter(
    ({ name }) => !addedNames.has(name) && (query === '' || name.toLowerCase().includes(query)),
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
    const isLast = index === items.length - 1
    const overtime = current.durationSeconds > 0 && remaining < 0

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
        <p className={`routine-runner__timer${overtime ? ' routine-runner__timer--overtime' : ''}`}>
          {/* Dépassement affiché en positif : +1s, +2s... */}
          {current.durationSeconds > 0 ? (overtime ? `+${-remaining}s` : `${remaining}s`) : '—'}
        </p>
        {isLast && finishLabel && onFinish ? (
          <BigButton
            onClick={() => {
              setRunning(false)
              onFinish()
            }}
          >
            {finishLabel}
          </BigButton>
        ) : (
          <BigButton onClick={goToNext}>Mouvement suivant</BigButton>
        )}
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
          {visibleSuggestions.map(({ name, sides }) => (
            <button
              key={name}
              type="button"
              className="routine-runner__suggestion"
              onClick={() => addItem(name, sides)}
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
