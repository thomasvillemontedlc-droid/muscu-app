import { useEffect } from 'react'
import { playAlarmBeep } from '../lib/alarm.js'
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
    if (isOvershoot && overshootMs < 400) playAlarmBeep()
    // Ne doit se déclencher qu'au passage à zéro, pas à chaque tick tant que
    // isOvershoot reste vrai (dépendance volontairement limitée).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOvershoot])

  useEffect(() => {
    if (!active) return
    requestWakeLock()
    return () => releaseWakeLock()
  }, [active])

  return active ? { remainingMs, isOvershoot, overshootMs } : null
}
