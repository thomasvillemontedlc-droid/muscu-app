import { useEffect } from 'react'
import { playAlarmBeep, resumeAudioIfNeeded } from '../lib/alarm.js'
import { flashScreen } from '../lib/flash.js'
import { vibrateAlarm } from '../lib/haptics.js'
import { releaseWakeLock, requestWakeLock } from '../lib/wakeLock.js'
import { useNow } from './useNow.js'

// Le repos peut être affiché sur plusieurs écrans successifs (exercice
// suivant, choix de l'exercice suivant...) puisqu'il continue de courir
// jusqu'à la prochaine série validée. Ce hook centralise l'affichage,
// l'alarme et le verrou d'écran pour que chaque écran n'ait qu'à l'appeler.
export function useRestTimer(session) {
  const now = useNow(250)
  const active = session.restStartedAt != null

  const restUntil = active ? session.restStartedAt + session.restSeconds * 1000 : null
  const remainingMs = active ? restUntil - now : null
  const isOvershoot = active && remainingMs <= 0
  const overshootMs = isOvershoot ? -remainingMs : 0

  useEffect(() => {
    if (isOvershoot && overshootMs < 400) {
      playAlarmBeep()
      // Le son seul n'est pas fiable si le volume est bas ou coupé (voir
      // lib/haptics.js#vibrateAlarm et lib/flash.js#flashScreen).
      vibrateAlarm()
      flashScreen()
    }
    // Ne doit se déclencher qu'au passage à zéro, pas à chaque tick tant que
    // isOvershoot reste vrai (dépendance volontairement limitée).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOvershoot])

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

  return active ? { remainingMs, isOvershoot, overshootMs } : null
}
