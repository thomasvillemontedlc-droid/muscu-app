import { useState } from 'react'
import { getChargeSuggestion } from '../../domain/chargeSuggestion.js'
import { getLastPerformance } from '../../domain/history.js'
import { getExerciseUnit } from '../../domain/muscleGroups.js'
import { markChargeSuggestionResolved, updateSet } from '../../domain/sessions.js'
import { setExerciseBarWeight, setExerciseWeightMode, setExerciseWeightStep } from '../../domain/exercises.js'
import {
  adjustRestSeconds,
  finishCurrentExerciseEarly,
  goToExerciseList,
  goToPreviousSet,
  skipRest,
  validateCurrentSet,
} from '../../domain/sessionRunner.js'
import { unlockAudio } from '../../lib/alarm.js'
import { vibrateSuccess } from '../../lib/haptics.js'
import { useRestTimer } from '../../hooks/useRestTimer.js'
import { RestBanner } from '../../components/RestBanner.jsx'
import { DurationField } from '../../components/DurationField.jsx'
import { ExerciseImage } from '../../components/ExerciseImage.jsx'
import { ExerciseImageViewer } from '../../components/ExerciseImageViewer.jsx'
import { ExerciseProgressBar } from '../../components/ExerciseProgressBar.jsx'
import { SetComparisonTable } from '../../components/SetComparisonTable.jsx'
import { StepperField } from '../../components/StepperField.jsx'
import { WeightField } from '../../components/WeightField.jsx'
import { Confetti } from '../../components/Confetti.jsx'
import { BigButton } from '../../components/BigButton.jsx'
import { TourStep } from '../../components/TourStep.jsx'

// Délai pendant lequel le retour visuel (vert + coche + confettis) reste
// affiché avant de réellement avancer à la série/l'écran suivant — assez
// court pour ne pas ralentir l'enchaînement, assez long pour être perçu.
const VALIDATE_FEEDBACK_MS = 450

export function ExerciseView({ session, data, setData }) {
  const [validating, setValidating] = useState(false)
  const timer = useRestTimer(session)
  const entry = session.entries.find((e) => e.exerciseId === session.currentExerciseId)
  const set = entry.sets[session.currentSetIndex]
  const exercise = data.exercises.find((e) => e.id === entry.exerciseId)
  const isTimeBased = getExerciseUnit(entry.exerciseName) === 'time'
  const otherSessions = data.sessions.filter((s) => s.id !== session.id)
  const last = getLastPerformance(otherSessions, entry.exerciseId)
  // Seulement à l'arrivée sur la toute première série de l'exercice (pas à
  // chaque série), et pas pour un exercice au temps (pas de "charge" à
  // proposer pour un gainage). entry.chargeSuggestionResolved évite de la
  // reproposer si on navigue entre exercices sans avoir répondu.
  const chargeSuggestion =
    !isTimeBased && session.currentSetIndex === 0 && !entry.chargeSuggestionResolved
      ? getChargeSuggestion(otherSessions, entry.exerciseId, exercise)
      : null

  function handleRepsChange(reps) {
    setData({
      ...data,
      sessions: updateSet(data.sessions, session.id, entry.exerciseId, session.currentSetIndex, { reps }),
    })
  }

  function handleWeightChange(weight) {
    // Forme fonctionnelle : WeightField peut appeler onBarWeightChange puis
    // onChange dans le même geste (mode "par côté"), donc deux setData
    // synchrones coup sur coup. Avec un objet littéral, le second écraserait
    // le premier (les deux partent du même `data` figé) ; la forme
    // fonctionnelle applique chaque mise à jour sur le résultat de la
    // précédente.
    setData((current) => ({
      ...current,
      sessions: updateSet(current.sessions, session.id, entry.exerciseId, session.currentSetIndex, { weight }),
    }))
  }

  function handleWeightModeChange(weightInputMode) {
    setData((current) => ({
      ...current,
      exercises: setExerciseWeightMode(current.exercises, entry.exerciseId, weightInputMode),
    }))
  }

  function handleBarWeightChange(barWeight) {
    setData((current) => ({
      ...current,
      exercises: setExerciseBarWeight(current.exercises, entry.exerciseId, barWeight),
    }))
  }

  function handleStepChange(weightStep) {
    setData((current) => ({
      ...current,
      exercises: setExerciseWeightStep(current.exercises, entry.exerciseId, weightStep),
    }))
  }

  function handleValidate() {
    if (validating) return
    // Débloque l'audio pendant ce geste utilisateur, pour que l'alarme
    // puisse sonner plus tard sans interaction directe (voir lib/alarm.js).
    unlockAudio()
    vibrateSuccess()
    setValidating(true)
    setTimeout(() => {
      setData((current) => ({ ...current, sessions: validateCurrentSet(current.sessions, session.id) }))
      setValidating(false)
    }, VALIDATE_FEEDBACK_MS)
  }

  function handleFinishExercise() {
    setData({ ...data, sessions: finishCurrentExerciseEarly(data.sessions, session.id) })
  }

  function handlePreviousSet() {
    setData({ ...data, sessions: goToPreviousSet(data.sessions, session.id) })
  }

  function handleGoToList() {
    setData({ ...data, sessions: goToExerciseList(data.sessions, session.id) })
  }

  function handleSkipRest() {
    setData({ ...data, sessions: skipRest(data.sessions, session.id) })
  }

  function handleAdjustRest(deltaSeconds) {
    setData({ ...data, sessions: adjustRestSeconds(data.sessions, session.id, deltaSeconds) })
  }

  function handleAcceptChargeSuggestion() {
    setData((current) => {
      const sessions = updateSet(current.sessions, session.id, entry.exerciseId, 0, {
        weight: chargeSuggestion.newWeight,
      })
      return { ...current, sessions: markChargeSuggestionResolved(sessions, session.id, entry.exerciseId) }
    })
  }

  function handleDeclineChargeSuggestion() {
    setData((current) => ({
      ...current,
      sessions: markChargeSuggestionResolved(current.sessions, session.id, entry.exerciseId),
    }))
  }

  const navButtons = (
    <div className="exercise-active__nav">
      {session.currentSetIndex > 0 && (
        <button type="button" className="back-link" onClick={handlePreviousSet}>
          ← Série précédente
        </button>
      )}
      <button id="tip-exercise-flow" type="button" className="back-link" onClick={handleGoToList}>
        ← Tous les exercices
      </button>
    </div>
  )

  // Pendant le repos (décompte encore en cours, pas le dépassement une fois
  // à zéro), le chrono doit rester l'élément dominant de l'écran EN TAILLE
  // (police, voir CSS) : on masque le reste de l'écran actif (tableau,
  // saisie) plutôt que de le faire cohabiter. L'image du prochain exercice
  // est volontairement grande et non recadrée (contrairement à
  // ExerciseThumbnail utilisée dans le sélecteur) : elle prend l'espace
  // disponible autour du chrono, quitte à rendre l'écran plus grand que la
  // fenêtre (défilement), mais ne réduit jamais la taille du chrono
  // lui-même. Dès le dépassement, l'écran normal revient pour permettre
  // d'enchaîner sur la série suivante.
  if (timer && !timer.isOvershoot) {
    return (
      <div className="page rest-page">
        {navButtons}
        <ExerciseProgressBar session={session} />
        <div className="rest-page__next">
          <ExerciseImage key={entry.exerciseName} name={entry.exerciseName} className="rest-page__next-image" />
          <p className="rest-page__next-label">Prochain exercice</p>
          <h2 className="rest-page__next-name">{entry.exerciseName}</h2>
        </div>
        <RestBanner timer={timer} onAdjust={handleAdjustRest} />
        <TourStep
          id="rest-adjust"
          selector=".rest-timer"
          text="Ajuste le repos en direct avec +15s/-15s. Une alarme sonne à la fin."
        />
        <p className="rest-page__set-detail">
          Série {session.currentSetIndex + 1} / {entry.sets.length}
        </p>
        <button type="button" className="rest-page__skip" onClick={handleSkipRest}>
          Passer le repos
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      {navButtons}
      <TourStep
        id="exercise-flow"
        selector="#tip-exercise-flow"
        text="Chaque série validée enchaîne automatiquement sur la suivante. Reviens à la liste à tout moment ici."
      />

      <ExerciseProgressBar session={session} />

      <RestBanner timer={timer} onAdjust={handleAdjustRest} />

      <h1>{entry.exerciseName}</h1>
      <p className="session-date">
        Série {session.currentSetIndex + 1} / {entry.sets.length}
      </p>

      {chargeSuggestion && (
        <div className="charge-suggestion">
          <p className="charge-suggestion__text">
            La dernière fois, tu as réussi toutes tes séries avec un ressenti{' '}
            {chargeSuggestion.feelingValue === 'facile' ? 'facile' : 'bien comme ça'}. Passer à{' '}
            {chargeSuggestion.newWeight}kg ?
          </p>
          <div className="charge-suggestion__actions">
            <BigButton onClick={handleAcceptChargeSuggestion}>Passer à {chargeSuggestion.newWeight}kg</BigButton>
            <BigButton variant="secondary" onClick={handleDeclineChargeSuggestion}>
              Garder {chargeSuggestion.currentWeight}kg
            </BigButton>
          </div>
        </div>
      )}

      {!last && <p className="last-performance last-performance--empty">Première fois sur cet exercice</p>}

      <SetComparisonTable entry={entry} last={last} currentSetIndex={session.currentSetIndex} />

      <ExerciseImageViewer key={entry.exerciseName} name={entry.exerciseName} />

      <div className={`exercise-active__fields${validating ? ' exercise-active__fields--validated' : ''}`}>
        {validating && <span className="exercise-active__check">✓</span>}
        {validating && <Confetti />}

        <label className="exercise-active__field">
          <span>{isTimeBased ? 'Durée' : 'Répétitions'}</span>
          {isTimeBased ? (
            <DurationField
              // ExerciseView ne démonte jamais entre deux séries, deux
              // exercices, ni même deux séances (SessionRunPage ne key
              // pas sur session.id, voir son commentaire sur la
              // persistance du chrono de repos) : sans cette key, le
              // chrono au temps (running/refs internes, voir
              // DurationField.jsx) resterait un état React local
              // partagé entre tout ça, au lieu de repartir à zéro à
              // chaque nouvelle série.
              key={`${session.id}-${entry.exerciseId}-${session.currentSetIndex}`}
              className="exercise-active__input"
              value={set.reps}
              onChange={handleRepsChange}
              disabled={validating}
              aria-label="Durée"
            />
          ) : (
            <StepperField
              className="exercise-active__input"
              value={set.reps}
              onChange={handleRepsChange}
              step={1}
              disabled={validating}
              aria-label="Répétitions"
            />
          )}
        </label>
        <label className="exercise-active__field">
          {/* En mode "par côté", WeightField affiche déjà ses propres
              libellés (Barre / Par côté) : garder ce "Poids (kg)" en plus
              ajouterait une ligne de texte que le champ Répétitions n'a
              pas, décalant les deux champs verticalement l'un par rapport
              à l'autre. */}
          {(exercise?.weightInputMode ?? 'total') !== 'perSide' && <span>Poids (kg)</span>}
          <WeightField
            className="exercise-active__input"
            exercise={exercise}
            value={set.weight}
            onChange={handleWeightChange}
            onModeChange={handleWeightModeChange}
            onBarWeightChange={handleBarWeightChange}
            onStepChange={handleStepChange}
            stepper
            aria-label="Poids en kg"
          />
        </label>
      </div>

      <TourStep
        id="exercise-input"
        selector=".weight-field__mode-toggle"
        text={'Poids et répétitions se règlent avec les boutons +/-. "Saisir par côté" pour un haltère par bras.'}
      />

      <BigButton onClick={handleValidate} disabled={validating}>
        {validating ? 'Série validée ✓' : 'Valider la série'}
      </BigButton>

      {session.currentSetIndex > 0 && (
        <BigButton variant="secondary" onClick={handleFinishExercise} disabled={validating}>
          Terminer cet exercice
        </BigButton>
      )}
    </div>
  )
}
