// Vibration courte de confirmation (Vibration API). Ne fait rien si non
// supportée (Safari iOS notamment) : pas de vérification préalable côté
// appelant nécessaire.
export function vibrateSuccess() {
  navigator.vibrate?.(40)
}
