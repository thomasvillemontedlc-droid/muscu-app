// Vibration courte de confirmation (Vibration API). Ne fait rien si non
// supportée (Safari iOS notamment) : pas de vérification préalable côté
// appelant nécessaire.
export function vibrateSuccess() {
  navigator.vibrate?.(40)
}

// Vibration de fin de repos, en complément du son (lib/alarm.js#playAlarmBeep)
// : a plus de chances d'être perçue que le son seul si le volume est bas ou
// coupé. Motif calqué sur les 3 bips de l'alarme (150ms de bip, 100ms de
// pause) pour rester cohérent avec ce qu'on entend.
export function vibrateAlarm() {
  navigator.vibrate?.([150, 100, 150, 100, 150])
}
