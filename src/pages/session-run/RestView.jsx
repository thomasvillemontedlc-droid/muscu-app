import { useEffect } from 'react'
import { updateSet } from '../../domain/sessions.js'
import { confirmRestReview } from '../../domain/sessionRunner.js'
import { playAlarmBeep } from '../../lib/alarm.js'
import { releaseWakeLock, requestWakeLock } from '../../lib/wakeLock.js'
import { useNow } from '../../hooks/useNow.js'
import { NumberField } from '../../components/NumberField.jsx'
import { BigButton } from '../../components/BigButton.jsx'

function formatClock(ms) {
  const totalSeconds = Math.ceil(Math.abs(ms) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function RestView({ session, data, setData }) {
  const now = useNow(250)
  const entry = session.entries.find((e) => e.exerciseId === session.currentExerciseId)
  const set = entry.sets[session.currentSetIndex]

  const remainingMs = session.restUntil - now
  const isOvershoot = remainingMs <= 0
  const overshootMs = isOvershoot ? -remainingMs : 0

  useEffect(() => {
    requestWakeLock()
    return () => releaseWakeLock()
  }, [])

  useEffect(() => {
    if (isOvershoot && overshootMs < 400) playAlarmBeep()
    // Ne doit se déclencher qu'au passage à zéro, pas à chaque tick tant que
    // isOvershoot reste vrai (dépendance volontairement limitée).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOvershoot])

  function handleRepsChange(reps) {
    setData({
      ...data,
      sessions: updateSet(data.sessions, session.id, entry.exerciseId, session.currentSetIndex, { reps }),
    })
  }

  function handleWeightChange(weight) {
    setData({
      ...data,
      sessions: updateSet(data.sessions, session.id, entry.exerciseId, session.currentSetIndex, { weight }),
    })
  }

  function handleContinue() {
    setData({ ...data, sessions: confirmRestReview(data.sessions, session.id) })
  }

  return (
    <div className="page">
      <h1>Repos</h1>

      <div className={isOvershoot ? 'rest-timer rest-timer--overshoot' : 'rest-timer'}>
        <span className="rest-timer__clock">
          {isOvershoot ? `+${formatClock(overshootMs)}` : formatClock(remainingMs)}
        </span>
      </div>

      <section className="exercise-block">
        <h2>{entry.exerciseName}</h2>
        <p className="last-performance">Série {session.currentSetIndex + 1} tout juste faite — corrige si besoin :</p>

        <div className="exercise-active__fields">
          <label className="exercise-active__field">
            <span>Répétitions</span>
            <NumberField
              className="exercise-active__input"
              value={set.reps}
              onChange={handleRepsChange}
              aria-label="Répétitions"
            />
          </label>
          <label className="exercise-active__field">
            <span>Poids (kg)</span>
            <NumberField
              className="exercise-active__input"
              decimal
              value={set.weight}
              onChange={handleWeightChange}
              aria-label="Poids en kg"
            />
          </label>
        </div>
      </section>

      <BigButton onClick={handleContinue}>{isOvershoot ? 'Continuer' : 'Passer le repos'}</BigButton>
    </div>
  )
}
