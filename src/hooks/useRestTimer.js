import { useEffect, useState } from 'react'
import { markRestAlarmPlayed } from '../domain/sessionRunner.js'
import { playAlarmBeep, playCountdownBeep, resumeAudioIfNeeded } from '../lib/alarm.js'
import { flashScreen } from '../lib/flash.js'
import { vibrateAlarm } from '../lib/haptics.js'
import { releaseWakeLock, requestWakeLock } from '../lib/wakeLock.js'
import { useNow } from './useNow.js'

// Au-delà de ce dépassement au retour dans l'app, le repos est considéré
// abandonné (séance laissée en plan, rouverte bien plus tard) : l'alarme
// est marquée comme jouée sans sonner, plutôt que de surprendre.
const MAX_LATE_ALARM_MS = 10 * 60 * 1000

// Écart entre la fin prévue et le moment où l'alarme a réellement sonné
// au-delà duquel on considère que le repos s'est terminé app en
// arrière-plan (affiche alors "Repos terminé depuis ...").
const LATE_ALARM_THRESHOLD_MS = 2000

// Garde-fous au niveau du module, pas de l'instance du hook : plusieurs
// écrans montent/démontent useRestTimer pendant un même repos (exercice,
// liste...), et StrictMode rejoue les effets en développement. Chaque bip
// de décompte et l'alarme ne doivent partir qu'une fois, quel que soit le
// nombre de rendus (useNow re-rend toutes les 250 ms). La clé inclut
// restSeconds : un +15s qui refait passer au-dessus de zéro réarme tout.
let lastCountdownKey = null
let lastAlarmKey = null

function usePageVisible() {
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible')
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return visible
}

// Le repos peut être affiché sur plusieurs écrans successifs (exercice
// suivant, choix de l'exercice suivant...) puisqu'il continue de courir
// jusqu'à la prochaine série validée. Ce hook centralise l'affichage, le
// décompte sonore des 3 dernières secondes, l'alarme et le verrou d'écran
// pour que chaque écran n'ait qu'à l'appeler. `setData` sert à mémoriser
// sur la séance que l'alarme a sonné (session.restAlarmPlayedAt), pour ne
// jamais la rejouer.
export function useRestTimer(session, setData) {
  const now = useNow(250)
  const visible = usePageVisible()
  const active = session.restStartedAt != null

  const restUntil = active ? session.restStartedAt + session.restSeconds * 1000 : null
  const remainingMs = active ? restUntil - now : null
  const isOvershoot = active && remainingMs <= 0
  const overshootMs = isOvershoot ? -remainingMs : 0
  // 3, 2 ou 1 pendant les 3 dernières secondes, null sinon.
  const countdownSecond = active && remainingMs > 0 && remainingMs <= 3000 ? Math.ceil(remainingMs / 1000) : null
  const alarmPending = isOvershoot && session.restAlarmPlayedAt == null
  const endedWhileAway =
    isOvershoot &&
    session.restAlarmPlayedAt != null &&
    session.restAlarmPlayedAt - restUntil > LATE_ALARM_THRESHOLD_MS

  // Bip de décompte, une fois par seconde (3, 2, 1). Seulement app visible :
  // en arrière-plan le son ne part de toute façon pas de façon fiable.
  useEffect(() => {
    if (countdownSecond == null || !visible) return
    const key = `${session.restStartedAt}:${session.restSeconds}:${countdownSecond}`
    if (key === lastCountdownKey) return
    lastCountdownKey = key
    playCountdownBeep(countdownSecond)
  }, [countdownSecond, visible, session.restStartedAt, session.restSeconds])

  // Alarme de fin : dès le passage à zéro app visible, ou au RETOUR dans
  // l'app si le repos s'est terminé en arrière-plan (visible repasse à
  // true). Mémorisée sur la séance pour ne jamais sonner deux fois.
  useEffect(() => {
    if (!alarmPending || !visible) return
    const key = `${session.restStartedAt}:${session.restSeconds}`
    if (key === lastAlarmKey) return
    lastAlarmKey = key

    if (overshootMs <= MAX_LATE_ALARM_MS) {
      playAlarmBeep()
      // Le son seul n'est pas fiable si le volume est bas ou coupé (voir
      // lib/haptics.js#vibrateAlarm et lib/flash.js#flashScreen).
      vibrateAlarm()
      flashScreen()
    }
    setData?.((current) => ({ ...current, sessions: markRestAlarmPlayed(current.sessions, session.id) }))
    // overshootMs volontairement hors dépendances : lu au moment du
    // déclenchement, il change à chaque tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarmPending, visible, session.restStartedAt, session.restSeconds, session.id])

  useEffect(() => {
    if (!active) return
    requestWakeLock()

    // Le navigateur relâche le Wake Lock de lui-même dès que l'onglet passe
    // en arrière-plan (changement d'appli, interruption système...) : on le
    // redemande automatiquement dès que l'app redevient visible, sans
    // attendre une action de l'utilisateur. Ne peut rien, en revanche,
    // contre un verrouillage MANUEL de l'écran par l'utilisateur (voir
    // l'avertissement affiché sur l'écran de repos) - limite de l'API web,
    // pas de cette implémentation.
    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') return
      requestWakeLock()
      // Voir lib/alarm.js#resumeAudioIfNeeded : même limite côté audio,
      // le contexte se suspend tout seul en arrière-plan et ne reprend pas
      // de lui-même au retour.
      resumeAudioIfNeeded()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      releaseWakeLock()
    }
  }, [active])

  return active ? { remainingMs, isOvershoot, overshootMs, countdownSecond, endedWhileAway } : null
}
