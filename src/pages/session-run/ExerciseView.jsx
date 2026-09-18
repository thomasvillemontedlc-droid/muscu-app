import { useState } from 'react'
import { getChargeSuggestion } from '../../domain/chargeSuggestion.js'
import { getExercisesUsedInTemplate, getLastPerformance } from '../../domain/history.js'
import { getExerciseUnit } from '../../domain/muscleGroups.js'
import { addSet, markChargeSuggestionResolved, removeSet, updateSet, updateSingleSet } from '../../domain/sessions.js'
import {
  getOrCreateExercise,
  setExerciseBarWeight,
  setExerciseWeightMode,
  setExerciseWeightStep,
} from '../../domain/exercises.js'
import {
  addExerciseEntryToSession,
  adjustRestSeconds,
  finishCurrentExerciseEarly,
  goToExerciseList,
  goToPreviousSet,
  removeExerciseEntryFromSession,
  reorderSessionEntries,
  skipRest,
  validateCurrentSet,
} from '../../domain/sessionRunner.js'
import { unlockAudio } from '../../lib/alarm.js'
import { vibrateSuccess } from '../../lib/haptics.js'
import { useRestTimer } from '../../hooks/useRestTimer.js'
import { RestBanner } from '../../components/RestBanner.jsx'
import { MiniRestTimer } from '../../components/MiniRestTimer.jsx'
import { DraggableList } from '../../components/DraggableList.jsx'
import { ExercisePicker } from '../../components/ExercisePicker.jsx'
import { SetRow } from '../../components/SetRow.jsx'
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
  // Modifier la séance pendant le repos (voir handleReorderEdit et
  // consorts) : un simple bool local, pas une phase de la séance — le
  // chrono (useRestTimer ci-dessous) continue de tourner exactement
  // pareil pendant que ce bool est vrai, rien d'autre ne change tant
  // qu'on ne touche pas explicitement à la liste d'exercices.
  const [editingSession, setEditingSession] = useState(false)
  const timer = useRestTimer(session)
  const entry = session.entries.find((e) => e.exerciseId === session.currentExerciseId)
  const set = entry.sets[session.currentSetIndex]
  const exercise = data.exercises.find((e) => e.id === entry.exerciseId)
  const isTimeBased = getExerciseUnit(entry.exerciseName) === 'time'
  const otherSessions = data.sessions.filter((s) => s.id !== session.id)
  const last = getLastPerformance(otherSessions, entry.exerciseId)
  const suggestedIds = getExercisesUsedInTemplate(otherSessions, session.templateName)
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

  function handleReorderEntries(fromIndex, toIndex) {
    setData({ ...data, sessions: reorderSessionEntries(data.sessions, session.id, fromIndex, toIndex) })
  }

  function handleMoveEntry(index, direction) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= session.entries.length) return
    handleReorderEntries(index, targetIndex)
  }

  // L'exercice en cours (celui dont on attend la prochaine série) ne peut
  // pas être retiré ici : le retirer laisserait currentExerciseId pointer
  // sur rien, et il n'y a pas d'écran vers lequel retomber proprement dans
  // ce cas. Le réordonner reste possible (currentExerciseId ne dépend pas
  // de la position dans le tableau).
  function handleRemoveEntry(exerciseId) {
    if (exerciseId === session.currentExerciseId) return
    setData({ ...data, sessions: removeExerciseEntryFromSession(data.sessions, session.id, exerciseId) })
  }

  function handleAddExerciseEntry(name) {
    const { exercise: added, exercises } = getOrCreateExercise(data.exercises, name)
    const sessions = addExerciseEntryToSession(data.sessions, session.id, added)
    setData({ ...data, exercises, sessions })
  }

  // Édition d'une série précise depuis l'écran de modification (n'importe
  // quel exercice, n'importe quelle série) : updateSingleSet (contrairement
  // à updateSet utilisé par le déroulé guidé) ne touche que cette série,
  // pour ne jamais écraser des séries déjà faites avec des valeurs
  // différentes.
  function handleEditSetWeightChange(exerciseId, setIndex, weight) {
    setData((current) => ({
      ...current,
      sessions: updateSingleSet(current.sessions, session.id, exerciseId, setIndex, { weight }),
    }))
  }

  function handleEditSetRepsChange(exerciseId, setIndex, reps) {
    setData((current) => ({
      ...current,
      sessions: updateSingleSet(current.sessions, session.id, exerciseId, setIndex, { reps }),
    }))
  }

  function handleEditWeightModeChange(exerciseId, weightInputMode) {
    setData((current) => ({
      ...current,
      exercises: setExerciseWeightMode(current.exercises, exerciseId, weightInputMode),
    }))
  }

  function handleEditBarWeightChange(exerciseId, barWeight) {
    setData((current) => ({
      ...current,
      exercises: setExerciseBarWeight(current.exercises, exerciseId, barWeight),
    }))
  }

  function handleAddSetToEntry(exerciseId) {
    const targetEntry = session.entries.find((e) => e.exerciseId === exerciseId)
    const lastSet = targetEntry.sets[targetEntry.sets.length - 1] ?? { weight: 0, reps: 0 }
    setData({ ...data, sessions: addSet(data.sessions, session.id, exerciseId, lastSet) })
  }

  // Retirer une série de l'exercice en cours décalerait les index des
  // séries suivantes sans que currentSetIndex ne bouge en face : la série
  // qu'on croit être en train de faire ne serait plus la bonne au retour.
  // Ajouter une série (toujours en fin de liste) ne pose pas ce problème.
  function handleRemoveSetFromEntry(exerciseId, setIndex) {
    if (exerciseId === session.currentExerciseId) return
    setData({ ...data, sessions: removeSet(data.sessions, session.id, exerciseId, setIndex) })
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

  // Modification de la séance pendant le repos : même écran/mêmes actions
  // que celui de préparation (réordonner, ajouter, retirer un exercice,
  // éditer poids/répétitions de n'importe quelle série), mais le chrono
  // continue de tourner en vrai (même hook useRestTimer, juste affiché en
  // mini format dans un coin) : ni la phase ni currentExerciseId/
  // currentSetIndex ne bougent tant qu'on ne valide pas de série, donc rien
  // de la série en cours ne se perd en repassant par cet écran. Retirer un
  // exercice ou une série de l'EXERCICE EN COURS reste bloqué (voir
  // handleRemoveEntry/handleRemoveSetFromEntry) : ça décalerait les index
  // sans que currentExerciseId/currentSetIndex ne suivent. Vérifié AVANT le
  // rest-page ci-dessous : sinon, tant que le repos est actif, ce dernier
  // reprendrait toujours la main et cet écran ne serait jamais atteignable.
  if (editingSession) {
    return (
      <div className="page">
        <MiniRestTimer timer={timer} />
        <h1>Modifier ma séance</h1>

        <DraggableList
          className="prep-exercise-list"
          items={session.entries}
          getKey={(sessionEntry) => sessionEntry.exerciseId}
          onReorder={handleReorderEntries}
          renderItem={(sessionEntry, index, dragHandleProps) => {
            const isCurrentExercise = sessionEntry.exerciseId === session.currentExerciseId
            const entryExercise = data.exercises.find((e) => e.id === sessionEntry.exerciseId)
            return (
              <div className="prep-exercise">
                <div className="prep-exercise__header">
                  <button type="button" className="prep-exercise__handle" aria-label="Réordonner (appui long)" {...dragHandleProps}>
                    ⠿
                  </button>
                  <span className="prep-exercise__name">{sessionEntry.exerciseName}</span>
                  <button type="button" className="prep-exercise__remove" onClick={() => handleMoveEntry(index, -1)} aria-label="Monter">
                    ↑
                  </button>
                  <button type="button" className="prep-exercise__remove" onClick={() => handleMoveEntry(index, 1)} aria-label="Descendre">
                    ↓
                  </button>
                  <button
                    type="button"
                    className="prep-exercise__remove"
                    onClick={() => handleRemoveEntry(sessionEntry.exerciseId)}
                    disabled={isCurrentExercise}
                    aria-label="Retirer de cette séance"
                    title={isCurrentExercise ? "Exercice en cours, ne peut pas être retiré maintenant" : undefined}
                  >
                    ✕
                  </button>
                </div>

                {sessionEntry.sets.map((set, setIndex) => (
                  <SetRow
                    key={setIndex}
                    index={setIndex}
                    weight={set.weight}
                    reps={set.reps}
                    exercise={entryExercise}
                    onChangeWeight={(weight) => handleEditSetWeightChange(sessionEntry.exerciseId, setIndex, weight)}
                    onChangeReps={(reps) => handleEditSetRepsChange(sessionEntry.exerciseId, setIndex, reps)}
                    onChangeWeightMode={(mode) => handleEditWeightModeChange(sessionEntry.exerciseId, mode)}
                    onChangeBarWeight={(barWeight) => handleEditBarWeightChange(sessionEntry.exerciseId, barWeight)}
                    onRemove={() => handleRemoveSetFromEntry(sessionEntry.exerciseId, setIndex)}
                    removeDisabled={isCurrentExercise}
                  />
                ))}

                <button type="button" className="add-set-button" onClick={() => handleAddSetToEntry(sessionEntry.exerciseId)}>
                  + Ajouter une série
                </button>
              </div>
            )
          }}
        />

        <ExercisePicker exercises={data.exercises} suggestedIds={suggestedIds} onAdd={handleAddExerciseEntry} />

        <BigButton onClick={() => setEditingSession(false)}>
          {timer && !timer.isOvershoot ? 'Revenir au repos' : "Continuer sur l'exercice suivant"}
        </BigButton>
      </div>
    )
  }

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
          text="Ajuste le repos en direct avec +15s/-15s, ou un temps personnalisé juste en dessous. Une alarme sonne à la fin."
        />
        <p className="rest-page__set-detail">
          Série {session.currentSetIndex + 1} / {entry.sets.length}
        </p>
        <button type="button" className="rest-page__skip" onClick={handleSkipRest}>
          Passer le repos
        </button>
        <button type="button" className="rest-page__skip" onClick={() => setEditingSession(true)}>
          Modifier ma séance
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
